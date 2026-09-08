---
title: softmax 数值不稳定怎么解决？
category: AI八股文
difficulty: 入门
answer: softmax 里有指数运算，输入值很大时 e^x 会溢出（变成 inf）。实现时先减去输入的最大值（softmax(x - max(x))），结果不变但数值稳定。
refs:
  - label: softmax 数值稳定性
    url: https://pytorch.org/docs/stable/generated/torch.nn.functional.softmax.html
tags: ["softmax", "数值稳定性"]
---

## 问题

softmax 定义：

```
softmax(x)_i = e^(x_i) / Σ e^(x_j)
```

如果某个 x_i 很大（比如 1000），e^1000 会超出浮点表示范围，变成 inf，导致除法得到 nan。

## 解法：减去最大值

利用 softmax 的平移不变性：

```
softmax(x)_i = softmax(x - c)_i
```

对任意常数 c 都成立。所以实现时令 c = max(x)，先减掉最大值再算指数，e 的指数变成 ≤ 0，最大值 e^0 = 1，绝不会溢出。

## 与 attention 缩放的关系

- 除以 √d_k 是「控制方差、避免梯度饱和」，属于训练稳定性；
- 减去最大值是「防止指数溢出」，属于数值实现；
- 两者不同层面，面试常一起问，别混淆。

## 面试加分点 / 追问方向

- 上溢（溢出到 inf）与下溢（趋近 0）两个方向的讨论；
- log-softmax 的实现同样有稳定性优化（log-sum-exp 技巧）。
