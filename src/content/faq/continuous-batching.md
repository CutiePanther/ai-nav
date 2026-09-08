---
title: Continuous Batching 的原理是什么？为什么能提升吞吐？
category: AI八股文
difficulty: 进阶
answer: 传统静态批处理要等整批请求全部生成完才释放，导致算力浪费；Continuous Batching 允许新请求随时插入、已完成请求随时退出，让 GPU 始终满负荷，吞吐大幅提升。
refs:
  - label: Continuous Batching 讲解
    url: https://www.anyscale.com/blog/continuous-batching-llm-inference
  - label: vLLM 论文
    url: https://arxiv.org/abs/2309.06180
tags: ["Continuous Batching", "推理优化", "vLLM"]
---

## 传统批处理的浪费

静态批处理（static batching）把一批请求打包一起推理，要等**整批里最慢的那个请求**生成完才一起返回、释放资源。问题在于：

- 不同请求长度差异大，短的早就生成完了，却要等长的；
- 生成过程中无法插入新请求，GPU 有空档。

## Continuous Batching 的做法

- 以「迭代」为单位调度，而不是以「整批」为单位；
- 每轮迭代里，已经生成完的请求**立即退出**，新到达的请求**立即加入**；
- GPU 始终在跑一个「动态变化」的 batch，没有空档，吞吐量可提升数倍到数十倍。

## 与 PagedAttention 的关系

vLLM 是 Continuous Batching 的代表实现，它配合 PagedAttention（把 KV Cache 按「页」管理、消除碎片）一起，让动态调度成为可能。

## 面试加分点 / 追问方向

- 区分「吞吐（throughput）」与「延迟（latency）」：Continuous Batching 主要优化吞吐；
- 为什么这种调度在 LLM 上特别重要（因为自回归生成长度不可预测）。
