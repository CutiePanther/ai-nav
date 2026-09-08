---
title: 权重初始化为什么重要？Xavier 和 He 初始化有什么区别？
category: 深度学习
difficulty: 进阶
answer: 初始化不当会导致梯度消失/爆炸。Xavier 让输入输出方差一致（适合 tanh/sigmoid），He 进一步除以 √2（考虑 ReLU 一半神经元失活），更适合 ReLU 系激活。
refs:
  - label: Xavier 论文
    url: http://proceedings.mlr.press/v9/glorot10a/glorot10a.pdf
  - label: He 初始化论文
    url: https://arxiv.org/abs/1502.01852
tags: ["权重初始化", "Xavier", "He"]
---

## 为什么重要

如果初始权重太小，信号逐层衰减到 0（梯度消失）；太大则逐层放大（梯度爆炸）。好的初始化要让信号在前向和反向传播中都保持「方差稳定」。

## Xavier（Glorot）初始化

- 目标：保持每层输入和输出的方差一致；
- 适合激活函数近似线性的情况（如 tanh、sigmoid 的中间段）；
- 方差 = 2/(n_in + n_out)。

## He（Kaiming）初始化

- 针对 **ReLU 激活**：ReLU 会把负半轴「归零」，大约一半神经元失活，方差会减半；
- 所以 He 初始化的方差再乘 2，即 2/n_in；
- 配 ReLU/LeakyReLU 效果更好。

## 面试加分点 / 追问方向

- 说清「方差稳定性」是贯穿初始化、归一化、残差连接的一条主线；
- 现代网络里 BatchNorm/LayerNorm 在一定程度上降低了对初始化的敏感度，但初始化仍重要。
