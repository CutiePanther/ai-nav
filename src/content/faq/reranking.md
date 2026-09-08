---
title: RAG 中为什么需要重排序 Rerank？原理与实现怎么做？
category: 工程系统
difficulty: 进阶
answer: 向量检索用 Bi-Encoder 做粗召回快速捞回大量候选，Rerank 再用 Cross-Encoder 对候选逐对精排、取高精度 Top-N 送给 LLM，兼顾召回速度与排序精度。
refs:
  - label: FlagEmbedding（BGE Reranker）
    url: https://github.com/FlagOpen/FlagEmbedding
  - label: Cohere Rerank 文档
    url: https://docs.cohere.com/docs/rerank-overview
tags: ["Rerank", "重排序", "RAG", "Cross-Encoder"]
---

## 核心概念

RAG 的向量召回通常用 **Bi-Encoder（双塔）**：Query 和文档各自独立编码成向量再求相似度，速度快、支持 ANN，但两者**缺乏深层交互**，精度有限。Rerank 引入 **Cross-Encoder**：把 Query 与候选文档拼接后共同编码打分，交互充分、精度高，但因要对每一对做前向计算而速度慢，只能处理小批量。

## 关键要点 / 原理

1. **两阶段检索**：粗召回用 Bi-Encoder 捞 Top-50~100 → 精排用 Cross-Encoder 取 Top-3~10 拼进 Prompt；
2. **为何有效**：向量相似度是粗粒度排序，Rerank 用细粒度语义匹配纠正排序偏差，显著提升生成准确度；
3. **常用模型**：bge-reranker（本地/私有化首选）、Cohere Rerank API（商业、效果极佳）；
4. **多样性控制**：MMR（最大边际相关性）在「相关性」与「多样性」间权衡，公式 λ·sim(q,d) − (1−λ)·max_sim(d,已选集)；
5. **成本**：Rerank 只作用在小批候选上，延迟与成本可控，绝不对整库执行。

## 延伸 / 追问方向

- 为什么不直接用 Cross-Encoder 对全库重排？
- Top-K（召回）与 Top-N（精排）一般如何设？
- MMR 的 λ 参数调大调小分别代表什么倾向；
- 如何端到端评估 Rerank 到底带来多少收益（答案准确率 vs 检索耗时）。

## 面试加分点

- 能说清 Bi-Encoder 与 Cross-Encoder 的本质差异（独立编码 vs 拼接交互）；
- 用「先海里捞针、再拿放大镜精挑」类比召回与重排的分工。