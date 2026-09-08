---
title: 大模型推理服务如何治理 GPU 显存（KV Cache）？
category: 工程系统
difficulty: 高级
answer: 推理显存主要被模型权重与 KV Cache 占用，长上下文/高并发下 KV Cache 成为主要变量；通过 PagedAttention、限制 max-model-len 与 batch tokens、量化、前缀缓存与 eviction 策略治理。
refs:
  - label: vLLM 文档
    url: https://docs.vllm.ai/
  - label: NVIDIA 推理优化
    url: https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/
tags: ["显存管理", "KV Cache", "vLLM", "GPU"]
---

## 核心概念

推理阶段显存消耗集中在两块：**模型权重**（常驻，规模决定）与 **KV Cache**（随上下文长度和并发数动态变化）。高并发/长上下文场景下，KV Cache 往往成为显存的主要消耗变量，也最需要治理。

## 关键要点 / 原理

1. **单体 per-token 估算**：每 token KV ≈ 2 × hidden_size × dtype 字节，如 Qwen-14B 约 20KB/token，2K 上下文约 40MB，可据模型初算能并行容纳多少 session；
2. **PagedAttention**：把 KV Cache 切成固定大小分页，消除静态预留碎片，支持更大 batch；
3. **资源上限**：合理设置 `--max-model-len`（限制单请求最大上下文）、`--max-num-batched-tokens`（限制 batch 总 token），避免少量超长文本拖垮整机；
4. **利用率参数**：`gpu-memory-utilization` 预留权重与激活空间，显存隔离多模型实例避免互相抢占 OOM；
5. **缓存与淘汰**：前缀缓存（Prefix Cache）命中复用提升利用率，配 TTL/eviction 清理长期占用的 KV page；
6. **量化**：INT8/INT4 降低权重与缓存带宽，摊薄显存压力。

## 延伸 / 追问方向

- 为什么 decode 阶段是显存/带宽受限而非计算受限；
- 显存申请如何随并发请求动态调度（preemption/swapping）；
- Streaming 长连接为何会长期占住 KV，如何回收；
- 单卡能跑多少并发取决于什么（每 request 长度分布、batch、dtype）。

## 面试加分点

- 能给出 per-token KV 占用公式并根据模型规模现场口算并发上限，说服力极强。