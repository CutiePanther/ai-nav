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
  /** 设为 'true' 可显式关闭向量检索（上游不提供 /embeddings 时），退化为 BM25-only */
  EMBEDDING_DISABLED?: string;
  /** DeepSeek 系：'disabled' 关闭思考模式。默认不传该参数，保持对其他网关的兼容 */
  THINKING?: string;
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
  // 显式关闭向量检索。上游不提供 /embeddings 时（如 DeepSeek）用它，
  // 否则每次提问都会发一次注定 404 的请求，还会白读 14MB 向量数据。
  if (env.EMBEDDING_DISABLED === 'true') return null;
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

// 从 chunk 正文生成一句话简介（去掉 markdown/代码，截取前 110 字），供来源卡片预览
function makeExcerpt(text: string, max = 110): string {
  const clean = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_|~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';
  return clean.length > max ? clean.slice(0, max).trimEnd() + '…' : clean;
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

  const apiKey = env.OPENAI_API_KEY;
  const baseURL = env.OPENAI_BASE_URL;
  const enc = new TextEncoder();

  // 「检索 → 生成」整体放进流里。
  // 若检索放在流外同步执行，等流建立时它已经跑完，「正在检索」会一闪而过甚至看不到；
  // 放进流内才能真正呈现 tool start → tool end 的时序。
  const down = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) => {
        try { controller.enqueue(enc.encode(sse(event, data))); } catch { /* 客户端已断开 */ }
      };

      try {
        // ---------- 1. 检索：tool start → tool end ----------
        const rStart = Date.now();
        send('tool', JSON.stringify({ name: '站内知识库', state: 'start' }));
        const hits = await retrieveHybrid(env, embedEnv(env), question, topK);
        const rms = Date.now() - rStart;
        send('tool', JSON.stringify({ name: '站内知识库', state: 'end', hits: hits.length, ms: rms }));

        const sources = hits.map((h) => ({
          title: h.chunk.title,
          category: h.chunk.category,
          url: h.chunk.url,
          excerpt: makeExcerpt(h.chunk.text),
        }));
        send('sources', JSON.stringify({ sources }));

        // ---------- 2. 未配置 LLM → 骨架回显 ----------
        if (!apiKey || !baseURL) {
          log('chat_skeleton', { ip, qlen: question.length, hits: hits.length, rms, ms: Date.now() - started });
          const text = hits.length
            ? `骨架已就绪（未配置 LLM）。检索命中 ${hits.length} 条：${hits.map((h) => h.chunk.title).join('；')}。在 Worker 配置 OPENAI_API_KEY / OPENAI_BASE_URL 后将返回完整回答。`
            : 'AI 服务骨架已就绪。配置 OPENAI_API_KEY 与 OPENAI_BASE_URL 后将接入真实 RAG 生成。';
          send('delta', JSON.stringify({ choices: [{ delta: { content: text } }] }));
          send('done', '[DONE]');
          return;
        }

        // ---------- 3. 组装上下文并调用上游 ----------
        const context = buildContextFromHits(hits, chunkLen);
        const system = context ? `${BASE_RULES}\n\n<context>\n${context}\n</context>` : BASE_RULES;
        const messages: ChatMsg[] = [
          { role: 'system', content: system },
          ...history,
          { role: 'user', content: question },
        ];

        // DeepSeek V4 系默认开启思考模式（effort=high）：响应更慢、思考 token 也计费，
        // 且思考模式下 temperature 会被静默忽略。默认不传该参数，避免其他兼容网关不识别而报错。
        const reqBody: Record<string, unknown> = {
          model: env.MODEL || 'deepseek-flash',
          messages,
          stream: true,
          max_tokens: 800,
          temperature: 0.3,
        };
        if (env.THINKING === 'disabled') reqBody.thinking = { type: 'disabled' };

        log('chat_start', { ip, qlen: question.length, hits: hits.length, turns: history.length, topK, rms, ms: Date.now() - started });

        const upstreamRes = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(reqBody),
        }).catch((e: unknown) => e as Error);

        if (upstreamRes instanceof Error || !upstreamRes.ok || !upstreamRes.body) {
          const status = upstreamRes instanceof Error ? 502 : upstreamRes.status;
          // 上游错误体往往带关键信息，只记 status 无法区分「欠费」还是「限流」。
          // 例：智谱在余额不足时会返回 429 + error.code 1113，和并发超限 1301 是两回事。
          let upstreamDetail = '';
          if (!(upstreamRes instanceof Error)) {
            try { upstreamDetail = (await upstreamRes.text()).slice(0, 300); } catch { /* 读取失败忽略 */ }
          }
          log('chat_upstream_error', { ip, status, detail: upstreamDetail, ms: Date.now() - started, qlen: question.length });
          send('error', `LLM error: ${status}${upstreamDetail ? ' | ' + upstreamDetail : ''}`);
          return;
        }

        // ---------- 4. 透传上游：思考内容走 thinking，正文走 delta ----------
        const reader = upstreamRes.body.getReader();
        const decoder = new TextDecoder();
        let sseBuf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuf += decoder.decode(value, { stream: true });
          const lines = sseBuf.split('\n');
          sseBuf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            if (payload === '[DONE]') { send('done', '[DONE]'); continue; }

            let handled = false;
            try {
              const delta = JSON.parse(payload).choices?.[0]?.delta;
              if (delta) {
                // 思考模式开启时上游会持续推 reasoning_content，转成 thinking 事件给前端折叠展示
                if (delta.reasoning_content) {
                  send('thinking', JSON.stringify({ d: delta.reasoning_content }));
                  handled = true;
                }
                if (delta.content) {
                  send('delta', payload);
                  handled = true;
                }
              }
            } catch { /* 非 JSON 行照常转发 */ }
            // 既非思考也非正文的 delta（如 tool_calls）保持原样透传
            if (!handled) send('delta', payload);
          }
        }
      } catch (err) {
        send('error', err instanceof Error ? err.message : String(err));
      } finally {
        log('chat_done', { ip, ms: Date.now() - started });
        // reader 定义在 try 块内，此处不再引用；controller.close() 会终止下游流
        try { controller.close(); } catch { /* ignore */ }
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