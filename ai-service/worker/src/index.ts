// Cloudflare Worker：AI 学习助手 RAG 问答（/api/chat SSE）
// 移植自 ai-service（Hono/Node），改为边缘函数：BM25 + 向量 RRF + OpenAI 兼容 LLM 流式。
// 数据索引存于 Workers KV（见 README 部署说明）。
import { retrieveHybrid, type KVEnv, type Hit } from './lib/retrieve';
import { type EmbedEnv } from './lib/embed';

export interface Env extends KVEnv {
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  MODEL?: string;
  EMBEDDING_BASE_URL?: string;
  EMBEDDING_API_KEY?: string;
  EMBEDDING_MODEL?: string;
  EMBEDDING_QUERY_PREFIX?: string;
  ALLOWED_ORIGIN?: string;
  RATE_LIMIT_PER_MIN?: string;
  /** 检索 topK（默认 5）；上下文每来源截取字符数（默认 900）；携带的历史会话轮数上限（默认 6） */
  TOP_K?: string;
  CONTEXT_CHUNK_LEN?: string;
  MAX_TURNS?: string;
}

// 结构化观测日志：输出为单行 JSON，便于 Cloudflare 后台按字段筛选/排查
function log(event: string, fields: Record<string, unknown> = {}) {
  try {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ts: Date.now(), ev: event, ...fields }));
  } catch { /* 日志失败不影响业务 */ }
}

interface ChatMsg { role: 'user' | 'assistant'; content: string }

function embedEnv(env: Env): EmbedEnv | null {
  const base = env.EMBEDDING_BASE_URL || env.OPENAI_BASE_URL || '';
  const key = env.EMBEDDING_API_KEY || env.OPENAI_API_KEY || '';
  if (!base || !key) return null;
  return { base, key, model: env.EMBEDDING_MODEL || 'qwen3-embedding-4b', prefix: env.EMBEDDING_QUERY_PREFIX || '' };
}

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.get('Origin') || '';
  const okOrigin =
    origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': okOrigin ? origin : '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// 简单的进程内滑动窗口限流（按 IP，分钟桶）——边缘单瓦片够用，不够可换 CF Rate Limiting 绑定
const buckets = new Map<string, { start: number; count: number }>();
function rateLimited(req: Request, env: Env): boolean {
  const limit = Number(env.RATE_LIMIT_PER_MIN || 10);
  const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For')?.split(',')[0] || 'unknown';
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.start > 60_000) {
    buckets.set(ip, { start: now, count: 1 });
    return false;
  }
  b.count++;
  return b.count > limit;
}

const BASE_RULES = [
  '你是 ai-dev-nav 的 AI 学习助手，只回答 AI/机器学习/大模型/工程相关的问题。',
  '规则：',
  '1. 只能使用 <context> 中提供的站内内容作答，禁止引入外部知识。',
  '2. 每个事实性结论后必须用 [ref:N] 标注来源编号（N 对应 context 中的编号），格式示例：「LoRA 通过低秩矩阵近似权重更新 [ref:1]」。禁止使用 [1] 这种裸编号。',
  '3. context 中没有的内容，直接回答「站内暂无这块内容」，不要编造。',
  '4. 回答用中文，结构化（分点/小标题），控制在 400 字内，除非用户要求展开。',
  '5. 用户问题若与 AI 学习无关，礼貌拒绝并引导回站内栏目。',
].join('\n');

function buildContextFromHits(hits: Hit[], chunkLen = 900): string {
  if (hits.length === 0) return '';
  return hits
    .map((h, i) => `[${i + 1}] 标题：${h.chunk.title} 分类：${h.chunk.category}\n正文：${h.chunk.text.slice(0, chunkLen)}`)
    .join('\n\n');
}

function sse(event: string, data: string): string {
  return `event:${event}\ndata:${data}\n\n`;
}

async function handleChat(req: Request, env: Env): Promise<Response> {
  const started = Date.now();
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';

  if (rateLimited(req, env)) {
    log('rate_limited', { ip });
    return new Response(JSON.stringify({ error: '请求过于频繁，请稍后再试' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(req, env) },
    });
  }

  const body = (await req.json().catch(() => ({}))) as { question?: unknown; history?: unknown };
  const question = String(body.question ?? '').trim();
  if (!question) {
    return new Response(JSON.stringify({ error: 'question is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(req, env) },
    });
  }
  if (question.length > 500) {
    return new Response(JSON.stringify({ error: 'question too long (max 500)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(req, env) },
    });
  }

  // 多轮历史：仅接受 user/assistant，角色与长度双重校验，取最近 N 轮
  const maxTurns = Number(env.MAX_TURNS || 6);
  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const history: ChatMsg[] = [];
  for (const m of rawHistory) {
    if (history.length >= maxTurns * 2) break;
    if (typeof m !== 'object' || m === null) continue;
    const role = (m as ChatMsg).role;
    const content = String((m as ChatMsg).content ?? '').trim();
    if ((role === 'user' || role === 'assistant') && content) {
      history.push({ role, content: content.slice(0, 2000) });
    }
  }

  const topK = Number(env.TOP_K || 5);
  const chunkLen = Number(env.CONTEXT_CHUNK_LEN || 900);

  const hdrs = { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', ...corsHeaders(req, env) };

  // 未配置 LLM → 回显骨架（检索命中情况），不清空索引能力
  const apiKey = env.OPENAI_API_KEY;
  const baseURL = env.OPENAI_BASE_URL;
  if (!apiKey || !baseURL) {
    const hits = await retrieveHybrid(env, embedEnv(env), question, topK);
    log('chat_skeleton', { ip, qlen: question.length, hits: hits.length, ms: Date.now() - started });
    const text = hits.length
      ? `骨架已就绪（未配置 LLM）。检索命中 ${hits.length} 条：${hits.map((h) => h.chunk.title).join('；')}。在 Worker 配置 OPENAI_API_KEY / OPENAI_BASE_URL 后将返回完整回答。`
      : 'AI 服务骨架已就绪。配置 OPENAI_API_KEY 与 OPENAI_BASE_URL 后将接入真实 RAG 生成。';
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(enc.encode(sse('delta', JSON.stringify({ choices: [{ delta: { content: text } }] }))));
        controller.enqueue(enc.encode(sse('done', '[DONE]')));
        controller.close();
      },
    });
    return new Response(stream, { headers: hdrs });
  }

  const hits = await retrieveHybrid(env, embedEnv(env), question, topK);
  const context = buildContextFromHits(hits, chunkLen);
  const system = context ? `${BASE_RULES}\n\n<context>\n${context}\n</context>` : BASE_RULES;
  const sources = hits.map((h) => ({ title: h.chunk.title, category: h.chunk.category, url: h.chunk.url }));

  const messages: ChatMsg[] = [
    { role: 'system', content: system },
    ...history,
    { role: 'user', content: question },
  ];

  const upstreamRes = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: env.MODEL || 'deepseek-chat',
      messages,
      stream: true,
      max_tokens: 800,
      temperature: 0.3,
    }),
  }).catch((e: unknown) => e as Error);

  if (upstreamRes instanceof Error || !upstreamRes.ok || !upstreamRes.body) {
    const status = upstreamRes instanceof Error ? 502 : upstreamRes.status;
    log('chat_upstream_error', { ip, status, ms: Date.now() - started, qlen: question.length });
    const text = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(text.encode(sse('error', `LLM error: ${status}`)));
        controller.close();
      },
    });
    return new Response(stream, { headers: hdrs, status: 200 });
  }

  log('chat_start', { ip, qlen: question.length, hits: hits.length, turns: history.length, topK, ms: Date.now() - started });

  // 透传上游 SSE 并转为 chat 前端协议事件（sources → delta → done）
  const enc = new TextEncoder();
  const reader = upstreamRes.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let sentSources = false;

  const down = new ReadableStream({
    async start(controller) {
      try {
        // 先发引用来源，前端渲染引用卡片
        controller.enqueue(enc.encode(sse('sources', JSON.stringify({ sources }))));
        sentSources = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            if (payload === '[DONE]') {
              controller.enqueue(enc.encode(sse('done', '[DONE]')));
              continue;
            }
            try {
              const obj = JSON.parse(payload);
              const delta = obj.choices?.[0]?.delta;
              if (delta && !delta.content && delta.reasoning_content) continue;
            } catch { /* 非 JSON 行照常转发 */ }
            controller.enqueue(enc.encode(sse('delta', payload)));
          }
        }
      } catch (err) {
        controller.enqueue(enc.encode(sse('error', err instanceof Error ? err.message : String(err))));
      } finally {
        log('chat_done', { ip, ms: Date.now() - started });
        try { reader.releaseLock(); } catch { /* ignore */ }
        controller.close();
      }
    },
  });

  return new Response(down, { headers: hdrs });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const started = Date.now();
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (req.method === 'GET' && url.pathname.endsWith('/health')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    }

    if (req.method === 'POST' && url.pathname.endsWith('/api/chat')) {
      return handleChat(req, env);
    }

    log('request', { ip, method: req.method, path: url.pathname, status: 404, ms: Date.now() - started });
    return new Response('Not found', { status: 404, headers: cors });
  },
};