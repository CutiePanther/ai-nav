---
title: KV Cache 是什么？为什么能加速推理？
category: 大模型
difficulty: 进阶
answer: KV Cache 缓存已算过的 Key/Value 向量，自回归生成时只算新 token 的 K/V 并追加，把每步注意力复杂度从 O(n²) 降到 O(n)，是推理引擎的核心机制。
refs:
  - label: vLLM PagedAttention 博客
    url: https://blog.vllm.ai/2023/06/20/vllm.html
  - label: HuggingFace KV Cache 讲解
    url: https://huggingface.co/blog/optimize-llm
tags: ["KV Cache", "推理优化", "显存"]
---

## 核心思想

自回归生成时，每预测一个 token 都要对整段历史做注意力计算。若不缓存，已算过的 K、V 会被重复计算，代价随序列长度**平方级增长**。

KV Cache 把每个已生成位置的 Key、Value 向量缓存起来，下一步只算新 token 的 K/V 并追加到缓存，历史部分直接复用。

## 收益与代价

- **收益**：每步注意力复杂度从 O(n²) 降到 O(n)，大幅加速；
- **代价**：显存随序列长度线性增长，成为长上下文推理的主要瓶颈。

## 衍生的优化方向

- **PagedAttention**：把 KV Cache 分页存储，消除显存碎片；
- **量化 KV**：对 K/V 做 INT8/INT4 量化降显存；
- **Prefix Caching**：共享相同前缀（system prompt、few-shot）的 KV；
- **多头共享 / 滑动窗口**：进一步压缩 KV 规模。

## 面试加分点

- KV Cache 几乎被所有推理引擎（vLLM、TensorRT-LLM、SGLang）采用；
- 判断显存是否够用的核心公式：KV 显存 ∝ 层数 × 头数 × 头维度 × 序列长度 × 精度。
