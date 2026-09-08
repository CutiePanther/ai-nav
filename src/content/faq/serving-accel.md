---
title: 大模型服务化时如何做推理加速？
category: 工程系统
difficulty: 高级
answer: 从模型层（量化、蒸馏、剪枝）与系统层（KV Cache、PagedAttention、Continuous Batching、投机采样、多卡并行、FlashAttention）两方面做加速。
refs:
  - label: vLLM 文档
    url: https://docs.vllm.ai
  - label: FlashAttention 论文
    url: https://arxiv.org/abs/2205.14135
tags: ["推理加速", "服务化"]
---

## 模型层优化

- **量化**：INT8 / INT4 降显存、加速；
- **蒸馏**：用大模型教小模型，缩小模型；
- **剪枝**：移除冗余参数。

## 系统层优化

- **KV Cache**：复用注意力状态；
- **PagedAttention**：显存分页，消除浪费；
- **Continuous Batching**：动态调度提升吞吐；
- **投机采样**：小模型起草、大模型验证；
- **多卡并行**：张量并行 / 流水线并行；
- **FlashAttention**：IO 优化提速省显存；
- **推理引擎**：vLLM、SGLang 等。

## 面试加分点

- 加速是"模型 + 系统"两条腿，单靠其一收益有限；
- 首字延迟（TTFT）与吞吐往往需要权衡。
