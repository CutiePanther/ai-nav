---
title: 有哪些降低注意力复杂度的方法？线性注意力是什么？
category: AI八股文
difficulty: 高级
answer: 标准自注意力是 O(n²)。优化方向有稀疏注意力（局部窗口、全局 token）和线性注意力（用核技巧把 softmax 换成可分离形式，降到 O(n)），还有 FlashAttention 这类不改复杂度的工程优化。
refs:
  - label: Longformer 论文
    url: https://arxiv.org/abs/2004.05150
  - label: 线性注意力综述
    url: https://arxiv.org/abs/2006.16236
tags: ["线性注意力", "稀疏注意力", "复杂度"]
---

## 为什么是 O(n²)

每个 token 都要和所有 token 算注意力，注意力矩阵是 n×n，计算和显存都随序列长度平方增长，长序列下不可承受。

## 两类降复杂度思路

1. **稀疏注意力（Sparse）**：限制每个 token 只和一部分 token 交互
   - 滑动窗口（每个 token 只看附近 k 个）；
   - 全局 token（少数 token 能看全局，如 Longformer、BigBird）；
   - 复杂度降到 O(n·k)。

2. **线性注意力（Linear）**：换掉 softmax 的核形式
   - softmax 里的 e^(q·k) 可以近似成 φ(q)·φ(k) 的可分离形式；
   - 先算 Σ φ(k)·v，再和 φ(q) 相乘，利用矩阵结合律把 O(n²) 降到 O(n)；
   - 代表：Linear Transformer、RWKV。

## 补充：工程优化

FlashAttention 不降低复杂度，但通过 IO 优化把实际速度/显存提上去，常和上面的算法改进一起用。

## 面试加分点 / 追问方向

- 说清「降低复杂度」和「IO 优化」是两条正交路线；
- 稀疏注意力的「丢失全局信息」风险与补法（全局 token、层次化）。
