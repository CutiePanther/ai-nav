---
title: BatchNorm 训练与推理时有何差异？为什么？
category: 深度学习
difficulty: 进阶
answer: 训练时用当前 mini-batch 的均值/方差做归一化并更新全局统计量，需要回传梯度；推理时用训练期累积的全局均值/方差固定归一化，不做归一化、无梯度，通常还并入偏置/缩放而非折叠。
refs:
  - label: Batch Normalization 原论文
    url: https://arxiv.org/abs/1502.03167
  - label: 何恺明 Identity Mapping（BN 位置讨论）
    url: https://arxiv.org/abs/1603.05027
tags: ["BatchNorm", "归一化", "训练与推理"]
---

## 核心概念

BatchNorm 在训练时把每个特征通道在**当前 mini-batch** 上归一化到零均值单位方差，再用可学习的缩放 γ、平移 β 恢复表达能力。它缓解内部协变量偏移、允许更大学习率并替代部分对初始化的敏感。

## 训练阶段

- 对每个通道，用**当批样本**的均值、方差做归一化 `(x-μ_B)/√(σ_B²+ε)`；
- 归一化统计量参与反向传播，因此**有梯度**；
- 同时用滑动平均更新**全局统计量**：`μ_run = α·μ_run + (1-α)·μ_B`；
- BatchNorm 依赖 mini-batch，**batch size 过小时会不稳定**（估计噪声大）。

## 推理（inference/eval）阶段

- 不再用当批统计量，而是用训练期累积的**全局均值 μ_run、全局方差**；
- 归一化参数固定，**不参与梯度**，网络退化为确定的线性变换；
- 实践中常把 BN 的缩放/平移与后续（或前层）卷积权重**融合（folding）**，推理时零额外开销。

## 关键要点

- 训练与推理的统计量来源不同：批统计量 vs 全局统计量；
- drop `training=True/False` 切换即二者行为差异的落点；
- 在 batch size 很小或序列长度变化的场景（NLP、Transformer）常改用 LayerNorm/RMSNorm。

## 延伸 / 追问方向

- batch size 从 32→2 时 BN 为什么效果变差；
- 训练/推理统计量不匹配（如全局均值漂移）导致的问题；
- BN 与 LayerNorm、InstanceNorm 的归一化维度和使用场景差异。

## 面试加分点

- 能准确说出训练用批统计量、推理用全局统计量这一核心差异；
- 提到 BN folding 降低推理延迟的工程细节。