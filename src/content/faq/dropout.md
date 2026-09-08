---
title: Dropout 为什么能防止过拟合？
category: 深度学习
difficulty: 入门
answer: Dropout 训练时以概率 p 随机丢弃神经元，打破神经元间共适应，等价于训练大量子网络的隐式集成，推理时用全网络近似平均，从而防过拟合。
refs:
  - label: Dropout 论文
    url: https://arxiv.org/abs/1207.0580
  - label: Dropout 详解
    url: https://www.cs.toronto.edu/~hinton/absps/JMLRdropout.pdf
tags: ["Dropout", "过拟合", "正则化"]
---

## 核心机制

训练时，每个神经元以概率 p 被随机"丢弃"（置 0），每次前向都形成一个不同的"子网络"。

## 防过拟合的原理

1. **打破共适应**：强制每个神经元独立学习更鲁棒的特征，而非依赖特定搭档；
2. **隐式集成**：等价于训练了大量子网络，推理时用全网络（权重按 p 缩放）近似这些子网络的平均，相当于模型集成。

## 使用要点

- **只在训练阶段启用**，推理阶段关闭；
- 通常放在全连接层，丢弃率 0.5 常见；
- 现代网络（有 BN 的 CNN 或 Transformer）使用较谨慎，常用 DropPath 等替代。

## 面试加分点

- 推理时为什么要缩放权重？——保持激活值的期望一致（乘以 1-p 或除以 p）；
- Dropout 与 BN 的相互作用：两者都影响统计量，叠加使用需注意顺序。
