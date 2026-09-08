---
title: Transformer 的注意力机制为什么是 O(n²) 复杂度？
category: 大模型
difficulty: 进阶
answer: 自注意力中每个位置都要与所有位置计算相似度，得到 n×n 的注意力矩阵，时间与空间复杂度均为 O(n²)，是长序列处理的瓶颈。
refs:
  - label: 图解 Transformer
    url: https://jalammar.github.io/illustrated-transformer/
  - label: FlashAttention 论文
    url: https://arxiv.org/abs/2205.14135
tags: ["Transformer", "注意力"]
---

## 复杂度来源

自注意力的计算流程：

1. 每个 token 生成 Q、K、V；
2. **Q 与所有 K 点积**，得到 n×n 的注意力分数矩阵；
3. softmax 后与 V 加权求和。

第 2 步让每个位置都要和**全部 n 个位置**交互，矩阵规模 n×n，故时间与空间复杂度都是 **O(n²)**。

## 为什么是瓶颈

- 序列长度 n 增大时，显存与算力平方级增长；
- 长文档、长视频、长代码场景下尤其严重。

## 优化方向

- **稀疏注意力**：只让每个 token 关注部分位置（滑窗、局部 + 全局）；
- **线性注意力**：改造核函数把复杂度降到 O(n)；
- **FlashAttention**：IO 优化，不降复杂度但大幅提速、省显存；
- **KV Cache**：推理时复用历史，避免重复计算。

## 面试加分点

- 复杂度是"理论的"，FlashAttention 这类优化能在**不改变 O(n²)** 的前提下大幅提升实际速度；
- 面试常追问"为什么不能直接上 O(n) 注意力"——线性注意力的表达力通常弱于标准 softmax 注意力。
