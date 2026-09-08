---
title: GPTQ、AWQ、GGUF 三种量化方法有什么区别？
category: AI八股文
difficulty: 进阶
answer: GPTQ 是后训练量化（用校准数据逐层优化），AWQ 是激活感知量化（保护重要权重通道），GGUF 是 llama.cpp 的模型格式（CPU/Mac 友好）。三者针对不同部署场景。
refs:
  - label: GPTQ 论文
    url: https://arxiv.org/abs/2210.17323
  - label: AWQ 论文
    url: https://arxiv.org/abs/2306.00978
  - label: llama.cpp 仓库
    url: https://github.com/ggml-org/llama.cpp
tags: ["量化", "GPTQ", "AWQ", "GGUF"]
---

## 三种方法对比

| 方法 | 原理 | 特点 | 适用场景 |
| --- | --- | --- | --- |
| GPTQ | 后训练量化，用校准数据逐层最小化量化误差 | 无需训练，4bit 效果好，GPU 推理快 | GPU 推理 |
| AWQ | 激活感知，识别并保护对输出影响大的权重通道 | 保精度更好，4bit 效果优于 GPTQ | 精度敏感场景 |
| GGUF | llama.cpp 的量化格式，支持 k-quant 等混合精度 | CPU/Mac 友好，可本地跑 | CPU / Apple Silicon |

## 关键区别

- **GPTQ**：对每一层，用少量校准数据解一个「最小化量化误差」的优化问题，逐层量化权重。它是「数据驱动」的后训练量化，推理时反量化开销小。
- **AWQ**：观察到不是所有权重都同等重要——少数「显著通道」对输出影响大。AWQ 通过统计激活分布找出这些通道并给它们更高精度（或缩放保护），用更少的精度损失达到更好效果。
- **GGUF**：更偏「工程格式」而非「算法」。它把模型权重 + 分词器 + 元数据打包，支持从 2bit 到 8bit 的多种量化等级（如 Q4_K_M、Q5_K_S），主要配合 llama.cpp 在 CPU/Mac 上高效运行。

## 面试加分点 / 追问方向

- 「量化」与「格式」的区别：GPTQ/AWQ 是量化算法，GGUF 是存储格式；
- 常见位宽选择经验：4bit（Q4_K_M）通常是速度/质量的最佳平衡点；
- 量化 vs 剪枝 vs 蒸馏：三种模型压缩手段的原理差异。
