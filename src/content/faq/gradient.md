---
title: 梯度消失与梯度爆炸怎么解决？
category: 深度学习
difficulty: 进阶
answer: 深层网络反向传播时梯度连乘导致指数级衰减（消失）或放大（爆炸）。解决：合理的权重初始化（He/Xavier）、BatchNorm/LayerNorm 归一化、残差连接、梯度裁剪、使用 ReLU 系激活函数、更优的优化器（Adam）。
refs:
  - label: 深度学习花书
    url: https://www.deeplearningbook.org/
tags: ["梯度", "训练"]
---
