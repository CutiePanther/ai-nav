---
title: RAG 系统中向量召回不准确怎么办？
category: 工程系统
difficulty: 进阶
answer: 从检索链路各环节优化：1）分块策略（语义分块、重叠窗口）；2）嵌入模型选型与微调；3）混合检索（向量 + BM25 关键词）；4）重排序（reranker，如 bge-reranker）；5）查询改写与多路召回融合。通常「混合检索 + 重排」能显著提升召回质量。
refs:
  - label: RAG 最佳实践
    url: https://www.pinecone.io/learn/retrieval-augmented-generation/
tags: ["RAG", "召回"]
---
