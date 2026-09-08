---
title: LSTM 如何解决 RNN 的长期依赖问题？
category: 深度学习
difficulty: 进阶
answer: LSTM 用遗忘门、输入门、输出门三个门控和细胞状态，让信息沿"高速公路"近乎无损传递，梯度可直接回传，从而缓解 RNN 的梯度消失与长期依赖问题。
refs:
  - label: LSTM 论文
    url: https://arxiv.org/abs/1409.0479
  - label: 理解 LSTM（colah 博客）
    url: https://colah.github.io/posts/2015-08-Understanding-LSTMs/
tags: ["LSTM", "RNN", "长期依赖"]
---

## RNN 的问题

普通 RNN 在长序列上训练时，反向传播的梯度随时间步连乘，导致梯度消失（遗忘早期信息）或爆炸（无法训练），难以捕捉长期依赖。

## LSTM 的门控机制

LSTM 引入三个门和一条细胞状态（Cell State）：

- **遗忘门**：决定丢弃哪些旧信息；
- **输入门**：决定写入哪些新信息；
- **输出门**：决定输出多少；
- **细胞状态**：像"高速公路"，信息可近乎无损跨多步传递。

## 为什么有效

细胞状态让梯度能直接沿这条路径回传，缓解梯度消失。核心是让网络学会"记住该记的、忘掉该忘的"，而非像 RNN 那样每步整体覆盖。

## 面试加分点

- GRU 是 LSTM 的简化版（少一个门），参数更少；
- 现代大模型多用 Transformer 取代 LSTM，但门控思想仍被借鉴（如 GLU）。
