---
title: QLoRA 相比 LoRA 做了哪些关键优化？
category: AI八股文
difficulty: 进阶
answer: QLoRA 把底模权重以 4-bit NF4 量化并冻结，只训练旁路的低秩矩阵，从而单消费级显卡即可微调 7B~70B；其关键三点是 NF4 量化 + 双重量化（对量化常数二次压缩） + 分页优化器（防 OOM），反传时把 4-bit 去量化回 BF16 算梯度。
refs:
  - label: QLoRA 论文
    url: https://arxiv.org/abs/2305.14314
  - label: HuggingFace 4-bit bitsandbytes 指南
    url: https://huggingface.co/blog/4bit-transformers-bitsandbytes
tags: ["QLoRA", "微调", "NF4", "量化"]
---

## 核心概念

QLoRA（Quantized LoRA）在 LoRA「冻结底模、只练低秩 A·B」之上，进一步把底模权重压成 **4-bit NF4** 存储。训练只更新低秩小矩阵，大幅压缩底模占用，从而在低成本显存（如 4090/24G）上微调 7B~70B 大模型，同时尽量保住精度。

## 关键要点 / 原理

- **NF4（NormalFloat4）量化**：专为近似正态分布设计的 4-bit 数据格式，比均匀 int4 在同位数下保留更多精度；权重按块（block）用 absmax 归一化后再映射到量化等级。
- **双重量化（Double Quantization）**：把每个块的缩放/偏移常数做二次 8-bit 量化，平均每参数再省约 0.4 bit 的常数存储。
- **分页优化器（Paged Optimizers）**：训练中 Adam 优化器状态瞬时峰值导致 OOM 时，把页表调度到 CPU 侧显存/内存，类似虚拟内存按需换入换出，避免空闲显存被碎片浪费。
- **反传精度**：前向用 4-bit 底模计算、反传时把存储位**去量化到 BF16** 参与梯度，既省显存又保证梯度数值稳定。
- **效果结论**：QLoRA 可在保持 16-bit 微调绝大部分效果的前提下显著降显存，是低成本微调与内存受限场景的标准方案。

## 追问方向

- NF4 与普通 INT4 的分布假设有何差异？为什么按块量化（absmax block）更稳？
- QLoRA 训练时显存大头分别由哪些组成（权重/激活/优化器/KV Cache）？
- **面试加分点**：能对比「GPTQ/AWQ 这类训练后量化只用于推理」与「QLoRA 训练时量化可继续微调」的场景差异。