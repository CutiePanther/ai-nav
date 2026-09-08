// 检索回归测试：验证「BM25 + 向量 RRF 混合检索」对典型查询的召回
// 用法：cd ai-service && npx tsx scripts/test-retrieve.ts
// 需先跑 npm run build:index 生成 index.json + vectors.json

import { loadEnvFile } from 'node:process';
try { loadEnvFile(); } catch { /* ignore */ }
import { retrieve, retrieveHybrid } from '../src/lib/retrieve';

const cases = [
  '注意力机制',
  '什么是 RAG',
  'GQA 和 MQA 的区别',
  'LoRA 微调原理',
  '怎么学大模型',
  '向量数据库选型',
  'Transformer 结构',
  '强化学习 RLHF',
  '过拟合怎么办',
  '学习路线 从零开始',
  '多模态模型怎么训练',
  'prompt 工程技巧',
];

for (const q of cases) {
  const hits = await retrieveHybrid(q, 3);
  console.log(`\nQ: ${q}`);
  if (hits.length === 0) {
    console.log('  → 无结果');
    continue;
  }
  hits.forEach((h, i) => {
    console.log(`  ${i + 1}. [${h.chunk.category}] ${h.chunk.title}  (rrf=${h.score.toFixed(4)})`);
  });
}

// 对照：纯 BM25（用于观察向量化带来的排序变化）
console.log('\n\n===== 对照：纯 BM25 =====');
for (const q of ['什么是 RAG', '怎么学大模型', '过拟合怎么办']) {
  const hits = retrieve(q, 3);
  console.log(`\nQ: ${q}`);
  hits.forEach((h, i) => {
    console.log(`  ${i + 1}. [${h.chunk.category}] ${h.chunk.title}  (bm25=${h.score.toFixed(3)})`);
  });
}
