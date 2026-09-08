---
title: BatchNorm 和 LayerNorm 有什么区别？分别用在哪？
category: 深度学习
difficulty: 进阶
answer: BatchNorm 沿 batch 维度归一化，依赖大 batch、训练推理行为不同，适合 CNN；LayerNorm 沿特征维度归一化，与 batch 无关、训练推理一致，Transformer 采用它。
refs:
  - label: BatchNorm 论文
    url: https://arxiv.org/abs/1502.03167
  - label: LayerNorm 论文
    url: https://arxiv.org/abs/1607.06450
tags: ["BatchNorm", "LayerNorm", "归一化"]
---

## 归一化的维度差异

| 维度 | BatchNorm | LayerNorm |
| --- | --- | --- |
| 归一化轴 | batch 维度 | 特征维度 |
| 依赖 batch | 是 | 否 |
| 训练/推理 | 行为不同（推理用移动平均） | 一致 |
| 适用 | CNN、大批量、定长 | 小 batch、变长序列 |

## 详细说明

- **BatchNorm**：对每个特征，在一个 batch 内所有样本上求均值方差。依赖足够大的 batch，训练/推理行为不同；
- **LayerNorm**：对单个样本的所有特征求均值方差，与 batch 大小无关，训练推理一致。

## 为什么 Transformer 用 LayerNorm

- 不依赖 batch 大小，适合小 batch 场景；
- 能处理变长序列，利于自回归推理；
- 与残差连接配合稳定深层网络。

## 面试加分点

- 归一化层本质是稳定分布、加速收敛；
- 追问点：为什么 BN 不适合 RNN/Transformer？（序列长度变化 + 推理时无法用 batch 统计量）。
