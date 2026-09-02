---
title: Transformer 的注意力机制为什么是 O(n²) 复杂度？
category: 大模型
difficulty: 进阶
answer: 自注意力中每个位置都要与所有位置计算相似度，得到 n×n 的注意力矩阵，故时间与空间复杂度均为 O(n²)。这也是长序列处理的瓶颈，催生了稀疏注意力、FlashAttention（IO 优化）、线性注意力、KV Cache 等优化方向。
refs:
  - label: 图解 Transformer
    url: https://jalammar.github.io/illustrated-transformer/
tags: ["Transformer", "注意力"]
---
