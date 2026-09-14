// Embedding 抽象层：OpenAI 兼容 /v1/embeddings（与 ai-service/src/lib/embed.ts 同源，改为 env 注入）
export interface EmbedEnv {
  base: string;
  key: string;
  model: string;
  prefix: string;
}

function normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const len = Math.sqrt(sum) || 1;
  return v.map((x) => x / len);
}

async function postEmbeddings(env: EmbedEnv, input: string | string[]): Promise<number[][] | null> {
  try {
    const res = await fetch(`${env.base}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.key}` },
      body: JSON.stringify({ model: env.model, input }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { data?: { embedding?: number[] }[] };
    const arr = j.data ?? [];
    if (!arr.length) return null;
    return arr.map((d) => (d.embedding ? normalize(d.embedding) : null)) as number[][];
  } catch {
    return null;
  }
}

/** 向量化一批文本；失败返回 null，调用方降级 BM25-only */
export async function embedTexts(env: EmbedEnv, texts: string[], isQuery = false): Promise<number[][] | null> {
  if (!env.base || !env.key || texts.length === 0) return null;
  const inputs = texts.map((t) => (isQuery && env.prefix ? env.prefix + t : t));
  return postEmbeddings(env, inputs);
}