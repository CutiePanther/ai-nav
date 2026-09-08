---
title: 为什么纯向量检索不够？混合检索（Hybrid Search）如何设计？
category: 工程系统
difficulty: 进阶
answer: 向量检索擅长同义改写与语义相关，但对精确匹配、专有名词、编号弱；混合检索同时跑向量召回与 BM25 子词/关键词召回，再用加权或 RRF 融合取长补短。
refs:
  - label: Milvus 文档
    url: https://milvus.io/docs/
  - label: Elasticsearch kNN 检索
    url: https://www.elastic.co/guide/en/elasticsearch/reference/current/knn-search.html
tags: ["混合检索", "BM25", "多路召回", "召回策略"]
---

## 核心概念

单一路径检索有各自盲区：**向量检索**对语义近义、表达改写效果好，但遇到「2024 年 Q3 的销售额是多少」这类精确条件、ID、型号、代码片段时召回弱；**BM25 / 关键词检索**擅长精确匹配与专业术语，但抓不住同义改写。**混合检索（稀疏+稠密）**把两者结合，提高召回率与鲁棒性。

## 关键要点 / 原理

1. **两路召回**：同一查询同时执行向量召回与 BM25/稀疏检索，各取 Top-K；
2. **融合策略**：加权和（WeightedSum）、RRF（Reciprocal Rank Fusion，按倒排位置换算分数）、或用学习排序模型融合多路信号；
3. **实现载体**：用支持混合检索的库（Milvus、Elasticsearch dense_vector + BM25、Qdrant 等）；
4. **权衡**：召回率提升的同时可能引入噪声，融合后通常再接 **Rerank** 精排兜底；
5. **适用**：文档含编号/型号/术语的企业知识库、代码检索、长文本 RAG。

## 延伸 / 追问方向

- WeightedSum 与 RRF 各自的优劣与适用场景；
- 哪些场景其实只用纯向量或纯关键词就够；
- 融合之后为什么通常还要再接 Rerank；
- 如何用 Recall@K 量化混合检索相对单路召回的提升。

## 面试加分点

- 能举例说明「语义相关却措辞完全不同」与「需精确命中」两类查询的分野；
- 会说清 RRF 只需排名无需分数、对尺度不敏感的优势。