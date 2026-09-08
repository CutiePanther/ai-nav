---
title: 梯度裁剪（Gradient Clipping）的作用是什么？
category: AI八股文
difficulty: 入门
answer: 训练中梯度可能异常大（尤其 RNN），导致参数更新过猛、训练震荡甚至发散。梯度裁剪把梯度的范数限制在阈值内，保证训练稳定。
refs:
  - label: 梯度裁剪讲解
    url: https://pytorch.org/docs/stable/generated/torch.nn.utils.clip_grad_norm_.html
tags: ["梯度裁剪", "训练稳定性"]
---

## 为什么需要

- RNN 反向传播是连乘，容易梯度爆炸（尤其早期没 gate 的 RNN）；
- 学习率设置不当、数据异常等也可能让梯度瞬间变得很大；
- 过大的梯度会让参数「跳飞」，损失剧烈震荡甚至变成 NaN。

## 两种常见方式

1. **按范数裁剪（clip by norm）**：如果梯度范数 ‖g‖ 超过阈值 C，就整体等比缩小到 C：

```
if ‖g‖ > C: g = g · (C / ‖g‖)
```

2. **按值裁剪（clip by value）**：把每个梯度分量直接截断到 [-C, C] 区间。

实践中「按范数裁剪」更常用。

## 面试加分点 / 追问方向

- 梯度裁剪治的是「爆炸」，而「消失」要靠残差连接、合适的激活函数等；
- 与梯度累积、warmup 等训练稳定性技巧的区别。
