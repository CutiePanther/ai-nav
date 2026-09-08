---
title: 什么是交叉熵损失？为什么分类任务常用它？
category: 机器学习
difficulty: 入门
answer: 交叉熵衡量两个概率分布之间的差异，分类中度量预测分布与真实标签（one-hot）的差距，配合 softmax 梯度合理、收敛快，是分类任务标准损失。
refs:
  - label: 交叉熵详解
    url: https://www.youtube.com/watch?v=6ArSys5qHAU
  - label: 损失函数概览
    url: https://developers.google.com/machine-learning/crash-course/descending-into-ml/training-and-loss
tags: ["损失函数", "分类"]
---

## 定义

交叉熵衡量两个概率分布 p（真实）与 q（预测）之间的差异：

```text
H(p, q) = -Σ p(x) · log q(x)
```

分类任务中，p 是 one-hot 的真实标签，q 是模型 softmax 后的预测分布。

## 为什么分类常用交叉熵而非 MSE

1. **梯度更合理**：交叉熵配合 softmax 时，梯度正比于 `预测值 - 真实值`，预测错得越离谱，梯度越大；
2. **收敛更快**：MSE 配合 softmax 在输出饱和时梯度趋近 0，容易陷入"学习停滞"；
3. **天然适配概率解释**：分类输出本质是概率分布。

## 面试加分点

- 交叉熵 + softmax 是"标配"组合；
- 二分类特例：BCE（二元交叉熵）；
- 会追问"为什么 MSE 不行"——关键是 softmax 饱和区的梯度消失问题。
