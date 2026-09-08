---
title: 模型推理时，批处理（Batching）和缓存如何优化性能？
category: 工程系统
difficulty: 进阶
answer: 批处理分静态与 Continuous Batching，后者动态调度让 GPU 满载、吞吐提升数倍；缓存含 KV Cache、Prefix Caching 与结果缓存，分别复用注意力状态与高频答案。
refs:
  - label: Continuous Batching 详解
    url: https://www.anyscale.com/blog/continuous-batching-llm-inference
  - label: NVIDIA 推理优化指南
    url: https://developer.nvidia.com/blog/optimizing-inference-for-transformers/
tags: ["批处理", "缓存", "推理优化"]
---

## 批处理优化

GPU 擅长并行，单条请求往往喂不饱算力：

- **静态批处理**：把若干请求凑成固定 batch 一起推理，但短请求需等长请求（padding），利用率低；
- **Continuous Batching**：请求到达即加入、完成即退出，动态调度让 GPU 始终满载，吞吐可比静态提升数倍，是现代引擎标准做法。

## 缓存优化

- **KV Cache**：复用已算的注意力 K/V 状态；
- **Prefix Caching**：共享相同前缀（system prompt、few-shot）的 KV，避免重复计算；
- **结果缓存**：对高频重复问题做语义相似度命中，直接返回缓存答案，兼顾降本与降延迟。

## 面试加分点

- Continuous Batching 的核心是"不等待最慢的请求"；
- 结果缓存需注意一致性，通常配 TTL 与命中阈值。
