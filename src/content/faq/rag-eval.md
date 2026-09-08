---
title: RAG 系统上线后如何评估与持续优化效果？
category: 工程系统
difficulty: 高级
answer: RAG 评估分检索质量（召回、MRR、Hit Rate）与生成质量（忠实度、相关性），可用 Ragas、LLM-as-a-Judge + 人工抽检，核心是先建评测集形成闭环再逐层调优。
refs:
  - label: Ragas 评估框架
    url: https://docs.ragas.io/
  - label: RAG 优化指南
    url: https://www.pinecone.io/learn/rag/
tags: ["RAG", "评估", "召回"]
---

## 两层评估

| 层 | 指标 | 考察 |
| --- | --- | --- |
| 检索质量 | 召回率、MRR、Hit Rate | 是否命中相关文档 |
| 生成质量 | 忠实度、相关性 | 答案是否忠于内容、有无幻觉 |

## 评估手段

- **Ragas、TruLens** 等框架；
- **LLM-as-a-Judge** 自动评测 + 人工抽检结合。

## 持续优化闭环

- **检索侧**：调 chunk 大小与切分策略、混合检索 + Rerank、优化 embedding；
- **生成侧**：优化 prompt、约束引用、防幻觉；
- **数据侧**：补充高质量文档、建立评测集回归。

## 面试加分点

- 核心是**先建评测集形成闭环**，再逐层调优，而非盲目堆参数；
- 忠实度（faithfulness）是 RAG 场景最重要的指标。
