---
title: PagedAttention 为什么能大幅提升推理吞吐？
category: 工程系统
difficulty: 高级
answer: PagedAttention 把 KV Cache 切成固定大小 block 按需分配、非连续存储，通过页表映射，几乎消除显存浪费并支持前缀共享，显著提升并发与吞吐。
refs:
  - label: vLLM PagedAttention 博客
    url: https://blog.vllm.ai/2023/06/20/vllm.html
  - label: vLLM 论文
    url: https://arxiv.org/abs/2309.06180
tags: ["PagedAttention", "vLLM", "吞吐"]
---

## 传统 KV Cache 的问题

传统做法为每个请求**预分配连续显存**，且按最大长度预留，导致：

- 大量显存浪费；
- 动态长度下碎片化严重；
- 限制了并发 batch 大小。

## PagedAttention 的思路

借鉴操作系统"分页/虚拟内存"思想：

1. 把 KV Cache 切成固定大小 block（页）；
2. 按需分配、非连续存储；
3. 通过页表映射定位。

## 收益

- **显存利用率大幅提升**，几乎消除浪费；
- **显存共享**：相同前缀（system prompt、few-shot）共享同一份 KV；
- **支持更大并发**，吞吐提升数倍。

## 面试加分点

- PagedAttention 是 vLLM 的核心技术，已成主流推理引擎标配；
- 本质是把"连续大块分配"改成"小页按需分配"。
