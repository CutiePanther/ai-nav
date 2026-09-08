---
title: RMSNorm 与 LayerNorm 有什么区别？
category: AI八股文
difficulty: 进阶
answer: LayerNorm 是「减均值 + 除标准差 + 缩放平移」；RMSNorm 只「除以均方根」、不做中心化，去掉了减均值和部分可学习参数，计算更快，被 LLaMA 等模型采用。
refs:
  - label: RMSNorm 论文
    url: https://arxiv.org/abs/1910.07467
tags: ["RMSNorm", "LayerNorm", "归一化"]
---

## LayerNorm 的公式

对向量 x：

```
y = (x - μ) / √(σ² + ε) · γ + β
```

其中 μ 是均值、σ² 是方差、γ 和 β 是可学习的缩放与平移参数。

## RMSNorm 的公式

RMSNorm 只保留「均方根归一化」，去掉减均值：

```
y = x / RMS(x) · γ
其中 RMS(x) = √(mean(x²) + ε)
```

## 区别与影响

- **计算量更小**：省掉了求均值、减均值这一步；
- **参数更少**：省掉了 β（平移项），只保留缩放 γ；
- **效果不降**：论文论证在深层网络里「缩放不变性」比「中心化」更关键，去掉减均值几乎不损失效果；
- 因此现代 LLM（LLaMA、Qwen 等）普遍用 RMSNorm + Pre-Norm 结构。

## 面试加分点 / 追问方向

- 能说清 LayerNorm 的两个作用（稳定训练 + 缓解内部协变量偏移）；
- 与 BatchNorm 的区别（归一化维度不同，BatchNorm 沿 batch 维度、LayerNorm 沿特征维度）。
