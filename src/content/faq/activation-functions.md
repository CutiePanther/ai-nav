---
title: 常见激活函数（Sigmoid/Tanh/ReLU）各有什么优缺点？
category: 深度学习
difficulty: 入门
answer: Sigmoid 输出 (0,1) 适合概率但易梯度消失；Tanh 零中心但仍有饱和问题；ReLU 缓解梯度消失、计算快但会"神经元死亡"，衍生出 Leaky ReLU、GELU 等变体。
refs:
  - label: CS231n 激活函数笔记
    url: https://cs231n.github.io/neural-networks-1/
  - label: GELU 论文
    url: https://arxiv.org/abs/1606.08415
tags: ["激活函数", "ReLU", "Sigmoid"]
---

## 三种经典激活函数

| 激活函数 | 输出范围 | 优点 | 缺点 |
| --- | --- | --- | --- |
| Sigmoid | (0,1) | 适合做概率 | 梯度消失、非零中心、指数运算慢 |
| Tanh | (-1,1) | 零中心 | 饱和区仍梯度消失 |
| ReLU | [0,∞) | 正区梯度恒为 1，快 | 负区死亡、非零中心 |

## 详细说明

- **Sigmoid**：两侧导数趋近 0，深层网络易梯度消失；输出非零中心导致梯度更新呈"之字形"；
- **Tanh**：比 Sigmoid 好（零中心），但饱和区问题仍在；
- **ReLU**（max(0,x)）：正区间梯度恒为 1，缓解梯度消失，计算快，成为默认选择；但负区间梯度为 0，导致"神经元死亡"（Dead ReLU）。

## 变体

- **Leaky ReLU**：负区间给微小斜率，缓解死亡；
- **GELU**：平滑近似，Transformer 常用；
- **Swish / SiLU**：平滑且非单调，现代模型常用。

## 面试加分点

- 实践口诀：隐藏层默认 ReLU/GELU，输出层按任务选（二分类 Sigmoid、多分类 Softmax）。
