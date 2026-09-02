---
title: 过拟合与欠拟合如何判断与缓解？
category: 机器学习
difficulty: 入门
answer: 训练集误差低而验证集误差高为过拟合（方差大），可通过正则化、增加数据、Dropout、早停缓解；训练集与验证集误差都高为欠拟合（偏差大），可增加模型容量、特征、训练轮次。判断依据主要是训练/验证误差曲线的偏差-方差分解。
refs:
  - label: 吴恩达机器学习
    url: https://www.coursera.org/learn/machine-learning
tags: ["过拟合", "欠拟合"]
---
