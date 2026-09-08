---
title: 梯度下降：BGD、SGD、Mini-batch 有何区别？
category: 机器学习
difficulty: 入门
answer: BGD 用全量数据算梯度、稳定但慢；SGD 每次随机一个样本、快但震荡；Mini-batch 折中，用小批量平衡速度与稳定性，是实际训练的默认选择。
refs:
  - label: 深度学习花书
    url: https://www.deeplearningbook.org/
  - label: 吴恩达机器学习
    url: https://www.coursera.org/learn/machine-learning
tags: ["梯度下降", "SGD", "优化"]
---

## 三种变体

| 方法 | 每次更新用多少数据 | 特点 |
| --- | --- | --- |
| BGD | 全量样本 | 稳定但慢，内存压力大 |
| SGD | 1 个样本 | 快但震荡大、方差高 |
| Mini-batch | 一小批（如 32~256） | 折中，最常用 |

## 详细对比

- **BGD（批量梯度下降）**：梯度准确，稳定收敛，但每步都要算全量数据，慢且可能内存不够；
- **SGD（随机梯度下降）**：每次随机抽一个样本，更新快，但梯度噪声大、震荡明显，可能不收敛到最优；
- **Mini-batch SGD**：取一小批算平均梯度，兼顾速度与稳定性，还能利用 GPU 并行，是实际训练的默认选择。

## 面试加分点

- Mini-batch 大小是超参数：太小噪声大，太大趋向 BGD；
- 配合动量、自适应学习率（Adam）可进一步稳定训练；
- 学习率过大 → 发散，过小 → 收敛慢。
