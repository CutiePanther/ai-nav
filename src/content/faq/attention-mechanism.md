---
title: 注意力机制（Attention）解决了什么问题？
category: 深度学习
difficulty: 进阶
answer: 注意力让模型动态关注输入中与当前最相关的部分并加权聚合，解决了 RNN 长距离依赖弱、无法并行与 CNN 感受野受限两大痛点，是 Transformer 的基石。
refs:
  - label: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
  - label: 注意力机制可视化
    url: https://jalammar.github.io/illustrated-transformer/
tags: ["注意力", "Transformer", "Self-Attention"]
---

## 解决的两大痛点

- **RNN 的问题**：串行处理导致长距离依赖弱、无法并行训练；
- **CNN 的问题**：感受野受限，需堆很多层才能建模长程关系。

## 核心机制

注意力通过 **Q（查询）· K（键）· V（值）** 三组向量：

1. Q 与 K 算相似度（点积）；
2. softmax 归一化得到权重；
3. 用权重对 V 加权求和。

一步即可建模任意两个位置的关系，且可并行计算。

## 衍生形式

- **Self-Attention**：序列内部相互关注；
- **多头注意力**：多子空间并行捕捉不同关系；
- **Cross-Attention**：跨序列关注（如编码器-解码器）。

## 面试加分点

- 注意力是"全局"的，一步看到所有位置，这是它优于 RNN/CNN 的根本原因；
- 代价是 O(n²) 复杂度，长序列需稀疏/线性注意力等优化。
