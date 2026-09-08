import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { retrieve, retrieveHybrid, type Hit } from '../lib/retrieve';

const BASE_RULES = [
  '你是 ai-dev-nav 的 AI 学习助手，只回答 AI/机器学习/大模型/工程相关的问题。',
  '规则：',
  '1. 只能使用 <context> 中提供的站内内容作答，禁止引入外部知识。',
  '2. 每个事实性结论后必须用 [ref:N] 标注来源编号（N 对应 context 中的编号），格式示例：「LoRA 通过低秩矩阵近似权重更新 [ref:1]」。禁止使用 [1] 这种裸编号。',
  '3. context 中没有的内容，直接回答「站内暂无这块内容」，不要编造。',
  '4. 回答用中文，结构化（分点/小标题），控制在 400 字内，除非用户要求展开。',
  '5. 用户问题若与 AI 学习无关，礼貌拒绝并引导回站内栏目。',
].join('\n');

function buildContextFromHits(hits: Hit[]): string {
  if (hits.length === 0) return '';
  const blocks = hits.map(
    (h, i) =>
      `[${i + 1}] 标题：${h.chunk.title} 分类：${h.chunk.category}\n正文：${h.chunk.text.slice(0, 900)}`,
  );
  return blocks.join('\n\n');
}

export const chat = new Hono();

chat.post('/chat', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const question = String(body.question ?? '').trim();

  if (!question) return c.json({ error: 'question is required' }, 400);
  if (question.length > 500) return c.json({ error: 'question too long (max 500)' }, 400);

  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.MODEL || 'deepseek-chat';

  // P0 占位：未配置 key 时流式回显
  if (!apiKey || !baseURL) {
    const hits = retrieve(question);
    return streamSSE(c, async (stream) => {
      const msg = hits.length
        ? `骨架已就绪（未配置 API Key）。检索命中 ${hits.length} 条：${hits
            .map((h) => h.chunk.title)
            .join('；')}。填入 OPENAI_API_KEY 后将返回完整回答。`
        : 'AI 服务骨架已就绪。配置 OPENAI_API_KEY 与 OPENAI_BASE_URL 后，将接入真实 RAG 生成。';
      for (const ch of msg) {
        await stream.writeSSE({ event: 'delta', data: ch });
        await stream.sleep(12);
      }
      await stream.writeSSE({ event: 'done', data: '[DONE]' });
    });
  }

  // 混合检索（BM25 + 向量 RRF）
  const hits = await retrieveHybrid(question, 5);
  const context = buildContextFromHits(hits);
  const system = context ? `${BASE_RULES}\n\n<context>\n${context}\n</context>` : BASE_RULES;

  // 引用来源列表（供前端渲染可点击跳转的引用卡片）
  const sources = hits.map((h) => ({
    title: h.chunk.title,
    category: h.chunk.category,
    url: h.chunk.url,
  }));

  return streamSSE(c, async (stream) => {
    // 先发引用来源，前端据此渲染引用卡片
    await stream.writeSSE({ event: 'sources', data: JSON.stringify({ sources }) });

    try {
      const url = `${baseURL}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: question },
          ],
          stream: true,
          max_tokens: 800,
          temperature: 0.3,
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        console.error('[chat] LLM 返回非 200：', res.status, errText.slice(0, 300));
        await stream.writeSSE({ event: 'error', data: `LLM error: ${res.status}` });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
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
            await stream.writeSSE({ event: 'done', data: '[DONE]' });
            continue;
          }
          // 过滤纯推理 chunk（思考模型先发 reasoning_content，再发 content 正文）
          try {
            const obj = JSON.parse(payload);
            const delta = obj.choices?.[0]?.delta;
            if (delta && !delta.content && delta.reasoning_content) continue;
          } catch {
            /* 非 JSON 的 data 行照常转发 */
          }
          await stream.writeSSE({ event: 'delta', data: payload });
        }
      }
    } catch (err) {
      const e = err as Error;
      console.error('[chat] fetch 失败：', e?.message, '| cause:', (e as any)?.cause?.message ?? (e as any)?.cause ?? '');
      await stream.writeSSE({ event: 'error', data: e?.message ?? String(err) });
    }
  });
});
