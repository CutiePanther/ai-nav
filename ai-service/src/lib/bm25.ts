// BM25 检索：基于预构建索引（倒排表 + 文档频率）
// 参数 k1=1.5, b=0.75（标准值）

export interface Chunk {
  id: string;
  type: 'faq' | 'roadmap-stage' | 'guide';
  title: string;
  category: string;
  difficulty?: string;
  text: string;
  url: string;
  textLen: number;
}

interface TermEntry {
  c: number; // chunk 数组下标
  tf: number; // term frequency
}

export interface Index {
  version: number;
  builtAt: number;
  totalDocs: number;
  avgLen: number;
  chunks: Chunk[];
  inverted: Record<string, TermEntry[]>;
}

const K1 = 1.5;
const B = 0.75;

function idf(df: number, N: number): number {
  return Math.log((N - df + 0.5) / (df + 0.5) + 1);
}

export function bm25Search(index: Index, queryTerms: string[], topK = 10): { chunk: Chunk; score: number }[] {
  const N = index.totalDocs;
  const scores = new Map<number, number>();

  for (const term of queryTerms) {
    const postings = index.inverted[term];
    if (!postings) continue;
    const idfVal = idf(postings.length, N);
    for (const { c, tf } of postings) {
      const chunk = index.chunks[c];
      const lenNorm = 1 - B + (B * chunk.textLen) / index.avgLen;
      const score = (idfVal * tf * (K1 + 1)) / (tf + K1 * lenNorm);
      scores.set(c, (scores.get(c) ?? 0) + score);
    }
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([c, score]) => ({ chunk: index.chunks[c], score }));
}
