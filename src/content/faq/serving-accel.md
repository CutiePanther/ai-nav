---
title: 大模型服务化时如何做推理加速？
category: 工程系统
difficulty: 高级
answer: 从模型与系统两个层面：模型层用量化（INT8/INT4）、蒸馏、剪枝；系统层用 KV Cache、PagedAttention、批处理调度（continuous batching）、投机采样、张量并行/流水线并行、FlashAttention IO 优化，以及 vLLM/SGLang 等推理引擎。
refs:
  - label: vLLM 文档
    url: https://docs.vllm.ai
tags: ["推理加速", "服务化"]
---
