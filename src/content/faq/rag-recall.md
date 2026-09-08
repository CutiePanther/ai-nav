---
title: RAG 系统中向量召回不准确怎么办？
category: 工程系统
difficulty: 进阶
answer: 从分块策略、嵌入模型、混合检索、重排序、查询改写五方面优化，通常"混合检索 + 重排"能显著提升召回质量。
refs:
  - label: RAG 最佳实践
    url: https://www.pinecone.io/learn/retrieval-augmented-generation/
  - label: 混合检索与重排
    url: https://weaviate.io/blog/hybrid-search
tags: ["RAG", "召回"]
---

## 优化方向

1. **分块策略**：语义分块、重叠窗口，避免切碎语义；
2. **嵌入模型**：选型、针对领域微调；
3. **混合检索**：向量检索 + BM25 关键词检索，互补召回；
4. **重排序**：reranker（如 bge-reranker）对召回结果精排；
5. **查询改写**：改写用户 query、多路召回融合。

## 推荐组合

通常 **"混合检索 + 重排"** 能显著提升召回质量：先粗召回多路候选，再用精排模型挑最相关的 top-k。

## 面试加分点

- 召回问题要先定位是哪一层：切分不合理、embedding 不匹配、还是检索方式单一；
- Rerank 是"性价比最高"的召回提升手段之一。
