import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { retrieveHybrid, type Hit } from '../lib/retrieve';

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
  const model = process.env.MODEL || 'deepseek-flash';

  // 「检索 → 生成」整体放进流里：若检索在流外同步跑完，等流建立时它已结束，
  // 「正在检索」会一闪而过甚至看不到。放进流内才能呈现 tool start → tool end 的真实时序。
  return streamSSE(c, async (stream) => {
    try {
      // ---------- 1. 检索：tool start → tool end ----------
      const rStart = Date.now();
      await stream.writeSSE({
        event: 'tool',
        data: JSON.stringify({ name: '站内知识库', state: 'start' }),
      });
      const hits = await retrieveHybrid(question, 5);
      const rms = Date.now() - rStart;
      await stream.writeSSE({
        event: 'tool',
        data: JSON.stringify({ name: '站内知识库', state: 'end', hits: hits.length, ms: rms }),
      });

      // 引用来源（供前端渲染可点击跳转的引用卡片）
      const sources = hits.map((h) => ({
        title: h.chunk.title,
        category: h.chunk.category,
        url: h.chunk.url,
      }));
      await stream.writeSSE({ event: 'sources', data: JSON.stringify({ sources }) });

      // ---------- 2. 未配置 key → 骨架回显 ----------
      if (!apiKey || !baseURL) {
        const msg = hits.length
          ? `骨架已就绪（未配置 API Key）。检索命中 ${hits.length} 条：${hits
              .map((h) => h.chunk.title)
              .join('；')}。填入 OPENAI_API_KEY 后将返回完整回答。`
          : 'AI 服务骨架已就绪。配置 OPENAI_API_KEY 与 OPENAI_BASE_URL 后，将接入真实 RAG 生成。';
        for (const ch of msg) {
          // 统一成与真实上游一致的 delta 结构：原先直接发单字符，前端 JSON.parse 会失败而静默不显示
          await stream.writeSSE({
            event: 'delta',
            data: JSON.stringify({ choices: [{ delta: { content: ch } }] }),
          });
          await stream.sleep(12);
        }
        await stream.writeSSE({ event: 'done', data: '[DONE]' });
        return;
      }

      // ---------- 3. 组装上下文并调用上游 ----------
      const context = buildContextFromHits(hits);
      const system = context ? `${BASE_RULES}\n\n<context>\n${context}\n</context>` : BASE_RULES;

      const res = await fetch(`${baseURL}/chat/completions`, {
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
        await stream.writeSSE({
          event: 'error',
          data: `LLM error: ${res.status}${errText ? ' | ' + errText.slice(0, 200) : ''}`,
        });
        return;
      }

      // ---------- 4. 透传上游：思考内容走 thinking，正文走 delta ----------
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
          // 过滤纯推理 chunk，但要把它转成 thinking 事件留给前端展示，不能直接丢弃
          let handled = false;
          try {
            const delta = JSON.parse(payload).choices?.[0]?.delta;
            if (delta) {
              if (delta.reasoning_content) {
                await stream.writeSSE({
                  event: 'thinking',
                  data: JSON.stringify({ d: delta.reasoning_content }),
                });
                handled = true;
              }
              if (delta.content) {
                await stream.writeSSE({ event: 'delta', data: payload });
                handled = true;
              }
            }
          } catch {
            /* 非 JSON 的 data 行照常转发 */
          }
          if (!handled) await stream.writeSSE({ event: 'delta', data: payload });
        }
      }
    } catch (err) {
      const e = err as Error;
      console.error('[chat] fetch 失败：', e?.message, '| cause:', (e as any)?.cause?.message ?? (e as any)?.cause ?? '');
      await stream.writeSSE({ event: 'error', data: e?.message ?? String(err) });
    }
  });
});
