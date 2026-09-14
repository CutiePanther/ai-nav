---
title: 什么是模型量化（Quantization）？为什么能省显存又可能掉精度？
category: 工程系统
difficulty: 进阶
answer: 量化是把模型权重（及激活）从高精度（FP16/BF16）压缩到低精度（INT8/INT4）以减小体积、降低显存与带宽占用的技术。代价是表示精度下降，可能带来轻微质量损失；可通过按块量化、混合精度与校准等手段缓解。
refs:
  - label: Hugging Face 量化教程
    url: https://huggingface.co/docs/transformers/en/quantization
  - label: llama.cpp GGUF 量化说明
    url: https://github.com/ggerganov/llama.cpp
  - label: LLM.int8()（BitsAndBytes）论文
    url: https://arxiv.org/abs/2208.07339
tags: ["量化", "推理优化", "部署"]
---

## 什么是量化

模型参数默认以 **FP16/BF16**（2 字节）存储。量化把这些值映射到更低的位宽，常见：

| 精度 | 位宽 | 相对 FP16 体积 |
| --- | --- | --- |
| FP16 / BF16 | 16 bit | 1× |
| INT8 | 8 bit | 0.5× |
| INT4 | 4 bit | 0.25× |

点积仍是高精度计算，但权重以低精度存取，从而压缩模型体积、降低显存占用与访存带宽。

## 为什么能"省显存 + 可能掉精度"

- **省显存**：权重变小，可放进更小显存（如 7B 模型 INT4 约可塞进 6~8 GB 显存），也让更多层驻留显存而非显存/内存换入换出；
- **省带宽**：权重加载量变小，利于吞吐（尤其在手机、边缘设备与 CPU 推理）；
- **掉精度**：位宽降低等于把每个数做了一次精度有限的近似，极端情况下约化分布、出现异常值，导致生成质量或数值稳定性下降。

## 主流方案

- **权重量化（weight-only）**：只量化权重不量化激活，如 GPTQ、AWQ；
- **全程量化（weight+activation）**：同时量化到 INT8，如 LLM.int8()、动态量化；
- **按块/按层量化**：对梯度或激活明显不同的块用不同范围（calibration / scale + zero-point），缓解精度损失；
- **TensorRT-LLM / ONNX Runtime 的 INT4/INT8**：面向生产部署的工程化量化管线。

## 面试加分点

- 区分 **PTQ（训练后量化）vs QAT（量化感知训练）**：前者直接剪精度更省事但降质风险高，后者在训练时模拟量化、质量更好但成本高；
- 提一句"精度换算"难的是**异常值（outliers）**，`LLM.int8()` 就是对异常特征列保留高精度的混合方案；
- 实际落地时通常先做 **perplexity 或下游任务评估**，确认量化后质量可接受再上生产。

## 关联

与**蒸馏（Distillation，模型尺寸变小）**、**剪枝**同属"模型压缩"家族，面试常一起考察。