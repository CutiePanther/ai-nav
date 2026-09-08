---
title: Pre-Norm 与 Post-Norm 有什么区别？
category: AI八股文
difficulty: 高级
answer: 区别在于 LayerNorm 放在残差连接之前还是之后。Pre-Norm（先 Norm 再进子层）训练更稳定、可去掉 warmup；Post-Norm（子层输出后再 Norm）理论上表达力略强但训练不稳定。
refs:
  - label: On Layer Normalization in the Transformer
    url: https://arxiv.org/abs/2002.04745
  - label: 图解 Transformer
    url: https://jalammar.github.io/illustrated-transformer/
tags: ["LayerNorm", "Pre-Norm", "训练稳定性"]
---

## 两种结构

以注意力子层为例：

- **Post-Norm**（原版 Transformer）：`x + Attention(Norm(x))` —— 先算注意力再加回残差，最后才归一化，即输出 = Norm(x + SubLayer(x))；
- **Pre-Norm**（GPT/LLaMA 主流）：`x + Attention(Norm(x))` —— 先归一化再进子层，输出 = x + SubLayer(Norm(x))。

关键差异：Norm 的位置。Post-Norm 是「子层后归一化」，Pre-Norm 是「子层前归一化」。

## 为什么 Pre-Norm 更稳定

- 在 Post-Norm 中，残差路径上的梯度会随层数累积放大，深层训练容易梯度爆炸，需要 warmup 和较小的学习率；
- Pre-Norm 让残差连接「畅通无阻」，梯度能稳定回传，训练更稳、对学习率不敏感，甚至可以去掉 warmup。

## 为什么有人还研究 Post-Norm

- 有论文指出 Post-Norm 在同等条件下可能有**略好的最终效果**（因为归一化更充分）；
- 于是出现了 DeepNorm 等改进，试图在 Post-Norm 基础上通过调整残差缩放来兼顾稳定性与效果。

## 面试加分点 / 追问方向

- 能说清「残差连接 + 归一化」各自解决什么问题（梯度流动 vs 层内稳定）；
- 现代 LLM 普遍用 Pre-Norm + RMSNorm（LayerNorm 的简化版，去掉减均值）。
