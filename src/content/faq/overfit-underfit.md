---
title: 过拟合与欠拟合如何判断与缓解？
category: 机器学习
difficulty: 入门
answer: 训练误差低、验证误差高为过拟合（方差大），用正则化、增数据、Dropout、早停缓解；两者都高为欠拟合（偏差大），用增容量、加特征、多训练缓解。
refs:
  - label: 吴恩达机器学习
    url: https://www.coursera.org/learn/machine-learning
  - label: 过拟合与欠拟合
    url: https://developers.google.com/machine-learning/crash-course/generalization/peril-of-overfitting
tags: ["过拟合", "欠拟合"]
---

## 判断依据

观察训练误差与验证误差曲线：

- **过拟合**：训练误差低、验证误差高（泛化差，方差大）；
- **欠拟合**：训练误差与验证误差都高（学习不足，偏差大）。

## 缓解手段

**过拟合（高方差）：**

- 增加训练数据 / 数据增强；
- 正则化（L1/L2）、Dropout；
- 早停（Early Stopping）；
- 简化模型、集成（Bagging）。

**欠拟合（高偏差）：**

- 增加模型容量（更深的网络、更多参数）；
- 增加特征、特征工程；
- 减少正则化；
- 增加训练轮次。

## 面试加分点

- 本质是偏差-方差权衡；
- 判断时要看"验证集"而非只看训练集。
