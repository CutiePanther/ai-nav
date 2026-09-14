// 检索入口：从 Workers KV 加载索引 + 混合检索（BM25 + 向量）+ RRF 融合
// 索引由主站 scripts/build-index.mjs 生成；部署时用 scripts/upload-kv.mjs 写入 KV。
import { bm25Search, type Index } from './bm25';
import { tokenize } from './segment';
import { embedTexts, type EmbedEnv } from './embed';

export interface Hit {
  chunk: import('./bm25').Chunk;
  score: number;
}

const TYPE_BOOST: Record<string, number> = { faq: 1.15, 'roadmap-stage': 0.85 };
const RRF_K = 60;

// 模块级缓存：worker isolate 内热缓存，避免每请求读 KV（各 isolate 独立，可接受）
const cache = { index: null as Index | null, vectors: null as number[][] | null };

async function loadIndex(env: KVEnv): Promise<Index | null> {
  if (cache.index) return cache.index;
  try {
    if (!env.AI_DOCS) return null;
    const raw = await env.AI_DOCS.get('index.json');
    if (!raw) return null;
    cache.index = JSON.parse(raw) as Index;
    return cache.index;
  } catch {
    return null;
  }
}

async function loadVectors(env: KVEnv): Promise<number[][] | null> {
  if (cache.vectors) return cache.vectors;
  try {
    if (!env.AI_DOCS) return null;
    const raw = await env.AI_DOCS.get('vectors.json');
    if (!raw) return null;
    cache.vectors = JSON.parse(raw) as number[][];
    return cache.vectors;
  } catch {
    return null;
  }
}

export interface KVEnv {
  AI_DOCS?: { get(key: string, type?: 'text' | 'json'): Promise<string | null | unknown> };
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function rank(hits: { chunk: import('./bm25').Chunk; score: number }[], topK: number): Hit[] {
  return hits
    .map((h) => ({ chunk: h.chunk, score: h.score * (TYPE_BOOST[h.chunk.type] ?? 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function rrfFuse(
  bm25Hits: { chunk: import('./bm25').Chunk; score: number }[],
  vecHits: { c: number; score: number }[],
  index: Index,
  topK: number,
): Hit[] {
  const rrf = new Map<number, number>();
  bm25Hits.forEach((h, rank) => {
    const c = index.chunks.indexOf(h.chunk);
    rrf.set(c, (rrf.get(c) ?? 0) + 1 / (RRF_K + rank + 1));
  });
  vecHits.forEach((h, rank) => {
    rrf.set(h.c, (rrf.get(h.c) ?? 0) + 1 / (RRF_K + rank + 1));
  });
  return Array.from(rrf.entries())
    .map(([c, score]) => ({ c, score: score * (TYPE_BOOST[index.chunks[c].type] ?? 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ c, score }) => ({ chunk: index.chunks[c], score }));
}

export async function retrieveHybrid(env: KVEnv, embEnv: EmbedEnv | null, query: string, topK = 5): Promise<Hit[]> {
  const index = await loadIndex(env);
  if (!index) return [];

  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const bm25Hits = bm25Search(index, terms, 10);

  const vectors = await loadVectors(env);
  if (!vectors || vectors.length !== index.chunks.length || !embEnv) {
    return rank(bm25Hits, topK);
  }

  const qv = await embedTexts(embEnv, [query], true);
  if (!qv) return rank(bm25Hits, topK);

  const scored = vectors
    .map((v, c) => ({ c, score: cosine(qv[0], v) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return rrfFuse(bm25Hits, scored, index, topK);
}