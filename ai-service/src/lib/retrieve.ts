// 检索入口：加载索引 + 混合检索（BM25 + 向量）+ RRF 融合
// 索引文件 ai-service/data/index.json，向量 data/vectors.json，均由 scripts/build-index.ts 生成

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bm25Search, type Index } from './bm25';
import { tokenize } from './segment';
import { embedTexts } from './embed';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = path.resolve(__dirname, '../../data/index.json');
const VEC_PATH = path.resolve(__dirname, '../../data/vectors.json');

let cache: { mtime: number; index: Index | null } = { mtime: 0, index: null };
let vecCache: { loaded: boolean; vectors: number[][] | null } = { loaded: false, vectors: null };

function loadIndex(): Index | null {
  try {
    if (!existsSync(INDEX_PATH)) return null;
    if (cache.index) return cache.index;
    const raw = readFileSync(INDEX_PATH, 'utf-8');
    cache.index = JSON.parse(raw) as Index;
    return cache.index;
  } catch {
    return null;
  }
}

function loadVectors(): number[][] | null {
  try {
    if (!existsSync(VEC_PATH)) return null;
    if (vecCache.loaded) return vecCache.vectors;
    const raw = readFileSync(VEC_PATH, 'utf-8');
    vecCache.vectors = JSON.parse(raw) as number[][];
    vecCache.loaded = true;
    return vecCache.vectors;
  } catch {
    return null;
  }
}

// 余弦相似度（向量已 L2 归一化，点积即余弦）
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export interface Hit {
  chunk: import('./bm25').Chunk;
  score: number;
}

// 类型权重：问答场景下，faq 知识点优先于 roadmap 阶段（后者文本长、BM25 易虚高）
const TYPE_BOOST: Record<string, number> = {
  faq: 1.15,
  guide: 1.05,
  'roadmap-stage': 0.85,
};

function rank(hits: { chunk: import('./bm25').Chunk; score: number }[], topK: number): Hit[] {
  return hits
    .map((h) => ({ chunk: h.chunk, score: h.score * (TYPE_BOOST[h.chunk.type] ?? 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// RRF 融合：score = Σ 1/(k + rank)，k=60
const RRF_K = 60;
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

export function retrieve(query: string, topK = 5): Hit[] {
  const index = loadIndex();
  if (!index) return [];

  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const bm25Hits = bm25Search(index, terms, 10);
  return rank(bm25Hits, topK);
}

// 混合检索：BM25 + 向量 RRF 融合；向量后端未就绪时自动降级 BM25-only
export async function retrieveHybrid(query: string, topK = 5): Promise<Hit[]> {
  const index = loadIndex();
  if (!index) return [];

  const terms = tokenize(query);
  const bm25Hits = bm25Search(index, terms, 10);

  // 无向量数据 → BM25-only
  const vectors = loadVectors();
  if (!vectors || vectors.length !== index.chunks.length) {
    return rank(bm25Hits, topK);
  }

  // 查询向量化（query 端加 instruction 前缀）
  const qv = await embedTexts([query], true);
  if (!qv) return rank(bm25Hits, topK);

  // 维度校验：换了 embedding 模型却没重建索引时，维度不一致会让 cosine 算出 NaN，
  // 排序静默错乱且不报错。显式拦住并降级 BM25。
  const docDim = vectors[0]?.length ?? 0;
  if (!docDim || qv[0].length !== docDim) {
    console.warn(
      `[retrieve] 向量维度不匹配（query ${qv[0].length} vs doc ${docDim}），已降级 BM25-only。` +
        `换 embedding 模型后需重新构建索引。`,
    );
    return rank(bm25Hits, topK);
  }

  // 向量相似度 Top-10
  const scored = vectors
    .map((v, c) => ({ c, score: cosine(qv[0], v) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return rrfFuse(bm25Hits, scored, index, topK);
}
