---
title: 大模型推理如何做量化？
category: 工程系统
difficulty: 高级
answer: 量化把 FP16/FP32 权重与激活映射到低比特（INT8/INT4）降低显存与加速，常见 GPTQ、AWQ、GGUF 等，核心权衡是精度损失 vs 资源节省。
refs:
  - label: llama.cpp
    url: https://github.com/ggml-org/llama.cpp
  - label: GPTQ 论文
    url: https://arxiv.org/abs/2210.17323
tags: ["量化", "推理"]
---

## 核心思想

把 FP16/FP32 的权重与激活映射到低比特（INT8 / INT4），用更少的位表示数值：

- **降显存**：权重体积缩小 2~8 倍；
- **加速**：低精度计算更快，且可在消费级硬件/CPU 上跑。

## 常见方法

| 方法 | 特点 |
| --- | --- |
| GPTQ | 逐层量化 + 权重校正，INT3/INT4 |
| AWQ | 激活感知，保留关键权重 |
| GGUF | 配合 llama.cpp，CPU/边缘部署 |

## 关键权衡

**精度损失 vs 资源节省**：通常需 PTQ（训练后量化）校准或少量数据，INT8 损失小，INT4 需谨慎评估。

## 面试加分点

- 量化分 QAT（量化感知训练）与 PTQ（训练后量化）；
- 会追问"为什么量化能加速"——低精度 GEMM + 显存带宽降低。
