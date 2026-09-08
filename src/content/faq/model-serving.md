---
title: 大模型推理服务如何架构？关键优化手段有哪些？
category: 工程系统
difficulty: 高级
answer: 推理服务分接入层、推理引擎层、GPU 集群，关键优化含 KV Cache/PagedAttention、Continuous Batching、量化、Prefix Caching、投机采样与多卡并行。
refs:
  - label: vLLM 文档
    url: https://docs.vllm.ai/
  - label: Continuous Batching 讲解
    url: https://www.anyscale.com/blog/continuous-batching-llm-inference
tags: ["推理优化", "vLLM", "batching"]
---

## 分层架构

```text
接入层（鉴权、限流、路由）→ 推理引擎层（vLLM / TensorRT-LLM / SGLang）→ 模型 + GPU 集群
```

## 关键优化手段

1. **KV Cache 与 PagedAttention**：复用注意力状态、显存分页；
2. **Continuous Batching**：动态合并请求，提高 GPU 利用率；
3. **模型量化**：FP16 / INT8 / INT4 降显存提速度；
4. **Prefix Caching**：复用相同 system prompt 的 KV；
5. **投机采样**：小模型起草、大模型验证；
6. **多卡并行**：张量并行/流水线并行服务超大模型。

## 核心指标

- **吞吐（throughput）**、**首字延迟（TTFT）**、**单 token 延迟（TPOT）**。

## 面试加分点

- 引擎选型：vLLM（PagedAttention）、SGLang（RadixAttention）、TensorRT-LLM（NVIDIA 生态）。
