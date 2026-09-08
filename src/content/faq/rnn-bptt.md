---
title: RNN 的梯度是如何随时间传播的？为什么容易梯度消失/爆炸？
category: 深度学习
difficulty: 进阶
answer: RNN 用随时间反向传播（Backpropagation Through Time, BPTT）把计算图按时间步展开后反向求梯；梯度在时间步间反复乘隐层权矩阵 Wᵀ，导致范数呈指数增长或衰减——W 谱半径大于 1 易爆炸，小于 1 易消失。
refs:
  - label: On the Difficulty of Training Recurrent Neural Networks
    url: https://arxiv.org/abs/1211.5063
  - label: Long Short-Term Memory 论文
    url: https://arxiv.org/abs/1308.0850
tags: ["RNN", "反向传播", "梯度消失", "BPTT"]
---

## 核心概念

RNN 在时间上共享同一套权重 `W`，训练时把序列**按时间步展开**成一个深层网络，再用链式求导依次回传——这种算法称为 **BPTT（Backpropagation Through Time）**。

## 梯度传播的关键机制

- 展开后等效于一个层数 = 序列长度的前馈网络，每两步之间梯度要乘隐层状态对上一状态的导数，即 `∂hₜ/∂hₜ₋₁ ≈ Wᵀ · Dₜ`（Dₜ 为激活导数对角阵）；
- 连乘多个时间步后，梯度范数近似被 `|λ_max(W)|` 的 T 次幂放大/衰减；
- **梯度爆炸**：谱半径 |λ_max| > 1，梯度指数增长 → 训练发散；
- **梯度消失**：|λ_max| < 1，梯度指数衰减 → 远距离依赖学不到。

## 关键要点

- 梯度裁剪（gradient clipping）主要缓解「爆炸」；
- 门控机制（LSTM/GRU）通过记忆单元与遗忘门让梯度「直通」，缓解「消失」，是捕获长依赖的关键；
- 残差连接、合理的激活（tanh）、权重初始化也能改善长序列梯度流。

## 延伸 / 追问方向

- 推导相邻时间步梯度连乘的具体表达式；
- 为什么 LSTM/GRU 能缓解消失而普通 RNN 不行；
- BPTT 与普通反向传播在图结构上的差异、截断 BPTT（Truncated BPTT）为何能省算力。

## 面试加分点

- 点出梯度连乘中 `Wᵀ` 与激活导数的耦合作用，而非仅归因于激活函数；
- 提到底层原因后能自然过渡到 LSTM 门控、梯度裁剪等对解决方案。