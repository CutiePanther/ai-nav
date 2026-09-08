// Embedding 抽象层：走 OpenAI 兼容的 /v1/embeddings 接口（内网网关）
// - 批量调用（每批 32），带自动重试；批量失败降级为逐条
// - L2 归一化（归一化后点积 = 余弦相似度）
// - 失败返回 null，调用方降级为 BM25-only，不影响主链路
//
// 环境变量：
//   EMBEDDING_BASE_URL  默认回退 OPENAI_BASE_URL
//   EMBEDDING_API_KEY   默认回退 OPENAI_API_KEY
//   EMBEDDING_MODEL     默认 qwen3-embedding-4b
//   EMBEDDING_QUERY_PREFIX  可选 query 端 instruction（qwen3 embedding 可不加）
//
// 注意：env 在函数内惰性读取（而非模块顶层），以规避 ESM import 提升导致
//       顶层常量在 loadEnvFile() 之前求值、读不到 .env 的问题。

const BATCH_SIZE = 32;
const RETRIES = 2; // 失败重试次数（网关偶发路由抖动）

function cfg() {
  return {
    base: process.env.EMBEDDING_BASE_URL || process.env.OPENAI_BASE_URL || '',
    key: process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY || '',
    model: process.env.EMBEDDING_MODEL || 'qwen3-embedding-4b',
    prefix: process.env.EMBEDDING_QUERY_PREFIX || '',
  };
}

function normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const len = Math.sqrt(sum) || 1;
  return v.map((x) => x / len);
}

async function postEmbeddings(input: string | string[]): Promise<number[][] | null> {
  const { base, key, model } = cfg();
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(`${base}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model, input }),
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const j = (await res.json()) as { data?: { embedding?: number[] }[] };
      const arr = j.data ?? [];
      if (arr.length === 0) {
        lastErr = new Error('empty data');
        continue;
      }
      return arr.map((d) => (d.embedding ? normalize(d.embedding) : null)) as number[][];
    } catch (err) {
      lastErr = err;
    }
  }
  console.error('[embed] 请求失败：', (lastErr as Error)?.message ?? lastErr);
  return null;
}

export async function embedTexts(texts: string[], isQuery = false): Promise<number[][] | null> {
  const { base, key, prefix } = cfg();
  if (!base || !key || texts.length === 0) return null;

  const inputs = texts.map((t) => (isQuery && prefix ? prefix + t : t));
  const out: number[][] = [];

  try {
    for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
      const batch = inputs.slice(i, i + BATCH_SIZE);
      const vecs = await postEmbeddings(batch);

      if (vecs) {
        out.push(...vecs);
      } else {
        // 批量失败 → 逐条降级
        for (const t of batch) {
          const one = await postEmbeddings(t);
          if (!one || one.length === 0) return null;
          out.push(one[0]);
        }
      }
    }
    return out;
  } catch (err) {
    console.error('[embed] 向量化失败：', (err as Error)?.message ?? err);
    return null;
  }
}

export function isEmbedReady(): boolean {
  const { base, key } = cfg();
  return Boolean(base && key);
}
