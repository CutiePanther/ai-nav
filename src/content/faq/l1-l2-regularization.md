---
title: L1 和 L2 正则化有什么区别？
category: 机器学习
difficulty: 入门
answer: L1 加权重绝对值和、产生稀疏解、天然做特征选择；L2 加权重平方和、让权重整体趋近 0 但很少为 0、产生平滑解，对异常值更稳健。
refs:
  - label: L1/L2 正则化图解
    url: https://developers.google.com/machine-learning/crash-course/regularization-for-simplicity/l2-regularization
  - label: Elastic Net 论文
    url: https://web.stanford.edu/~hastie/Papers/elasticnet.pdf
tags: ["正则化", "L1", "L2", "稀疏"]
---

## 定义

两者都在损失函数上加惩罚项防止过拟合：

- **L1**：λ·‖w‖₁（权重绝对值和）
- **L2**：λ·‖w‖₂²（权重平方和）

## 关键区别

| 维度 | L1 | L2 |
| --- | --- | --- |
| 惩罚项 | 绝对值和 | 平方和 |
| 解的性质 | 稀疏（权重精确为 0） | 平滑（权重趋 0 但不为 0） |
| 几何约束域 | 菱形（顶点在坐标轴） | 圆 |
| 对异常值 | 较敏感 | 更稳健 |
| 用途 | 特征选择 | 通用防过拟合 |

## 原理说明

- L1 在原点不可导、梯度为常数，倾向于把不重要的权重**精确压缩到 0**，产生稀疏解；
- L2 让权重整体趋近 0，但很少精确为 0。

## 面试加分点

- 二者可组合成 **Elastic Net**；
- 会追问"L1 为什么稀疏"——从几何（菱形顶点在轴）或梯度（常数梯度）角度解释。
