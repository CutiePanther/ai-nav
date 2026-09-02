---
title: 什么是交叉熵损失？为什么分类任务常用它？
category: 机器学习
difficulty: 入门
answer: 交叉熵衡量两个概率分布之间的差异，分类任务中用于度量预测分布与真实标签（one-hot）的差距。相比 MSE，交叉熵配合 softmax 输出时梯度更合理、收敛更快，且天然适配概率解释，是分类任务的标准损失函数。
refs:
  - label: 交叉熵详解
    url: https://www.youtube.com/watch?v=6ArSys5qHAU
tags: ["损失函数", "分类"]
---
