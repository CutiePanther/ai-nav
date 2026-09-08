---
title: 推理的 Prefill 和 Decode 是什么？Chunked Prefill 解决什么问题？
category: AI八股文
difficulty: 高级
answer: Prefill 阶段一次性前向整个 prompt、填充 KV Cache（计算密集、单次规模大）；Decode 阶段逐 token 自回归生成（访存密集、每步仅 1 个 token）。两者算力特征相反、难以混批；Chunked Prefill 把长 prefill 切成块并与 decode 请求同批，提升 GPU 利用率与吞吐。
refs:
  - label: vLLM 性能与调优文档
    url: https://docs.vllm.ai/en/v0.6.3/models/performance.html
tags: ["推理", "Prefill", "Decode", "调度"]
---

## 核心概念

一次生成请求分两阶段：**Prefill（预填充）** 把整个输入 prompt 并行前向一次，算出所有位置的 K/V 写入 KV Cache，并输出第一个 token；**Decode（解码）** 之后每步只输入上一个 token，借助已缓存的 KV 逐个自回归生成。前者是计算密集型（compute-bound）大矩阵乘，后者是访存密集型（memory-bound）小步循环，资源利用模式相斥。

## 关键要点 / 原理

- **特征反差**：单次 Prefill 计算量大、能充分用足张量核；Decode 每步只有 1 个 token、带宽主导、GPU 利用率低，两者在单批次里互相「欠饱和」。
- **混批难点**：把「长 Prefill」与「一批 Decode」合到同一 batch 时，变长 prompt 会拖慢整批、拉高其它请求延迟，因此通常让 prefill 独占调度。
- **Chunked Prefill**：把大 prompt 切成多个块，调度器优先起 decode（先填满 decode 批），再用 `max_num_batched_tokens` 预算分批处理 prefill 块，让「计算密集」与「访存密集」请求进同一批互相补满算力。
- **权衡**：`max_num_batched_tokens` 越小 → ITL（token 间延迟）更稳定、prefill 打断 decode 更少；越大 → TTFT（首 token 延迟）更快、整体吞吐更高；vLLM 建议吞吐场景设 >2048。
- **工程现状**：vLLM V1 已默认开启 chunked prefill；更进一步的「prefill / decode 分离（Disagg）」把两阶段拆到独立资源池，进一步解耦。

## 追问方向

- 为什么 decode 是「访存受限」、prefill 是「算力受限」？用 roofline（屋顶线模型）怎么解释两者。
- Chunked Prefill 与 preemption（KV 不足时的抢占/换出重算）如何协同？
- **面试加分点**：能结合 vLLM「先 decode 再填 prefill 预算」的调度策略，讲清 TTFT / ITL / 吞吐之间的三角权衡。