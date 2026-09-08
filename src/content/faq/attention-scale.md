---
title: Self-Attention 为什么要除以 √d_k？
category: AI八股文
difficulty: 进阶
answer: 防止点积随 d_k 增大而方差膨胀、导致 softmax 进入梯度饱和区（分布趋近 one-hot），除以 √d_k 把方差拉回 1，训练更稳定。
refs:
  - label: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
  - label: 图解 Transformer
    url: https://jalammar.github.io/illustrated-transformer/
tags: ["Transformer", "Attention", "softmax"]
---

## 核心公式

Scaled Dot-Product Attention 的计算：

```
Attention(Q, K, V) = softmax(QK^T / √d_k) V
```

这里 √d_k 就是那个关键的缩放因子，d_k 是每个注意力头的维度（即 Key 向量的维度）。

## 为什么要缩放（数学推导）

假设 Q、K 的每个分量都是独立同分布、均值为 0、方差为 1 的随机变量，那么点积 q·k = Σ(q_i · k_i)：

- 点积的**方差 = d_k**（因为各项独立，方差相加）；
- d_k 越大，点积的绝对值越大，分布越分散。

如果不缩放，直接 `softmax(QK^T)`：

- 大值经过 softmax 后，概率分布会**极端集中在少数位置**（接近 one-hot）；
- softmax 落在梯度饱和区，梯度趋近于 0，模型学不动。

除以 √d_k 后，方差从 d_k 回到 1，softmax 的输入落在「梯度敏感区」，训练更稳定。

## 与 temperature 的关系

缩放的本质是调节 softmax 的「温度」：

- 缩放因子等价于固定温度 1/√d_k，让分布不要太尖锐；
- 采样时的 temperature 参数也是同一套原理——温度越高分布越平滑，越低越集中（贪婪）。

## 面试加分点 / 追问方向

- **数值稳定性**：softmax 实现里还会再减去最大值（`softmax(x - max(x))`）防止指数溢出，和这里除以 √d_k 是两个不同层面的问题，面试时别混为一谈；
- **Pre-Norm vs Post-Norm**：面试官常接着问 LayerNorm 放哪的问题，本质也是「梯度稳定性」；
- **多头注意力的 d_k**：每个头的 d_k = d_model / h，所以头越多 d_k 越小，单个头的点积方差也越小。
