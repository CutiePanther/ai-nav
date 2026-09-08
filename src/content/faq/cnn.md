---
title: 卷积神经网络（CNN）的核心思想是什么？
category: 深度学习
difficulty: 入门
answer: CNN 用局部连接、权值共享、下采样三大特性处理图像，大幅减少参数、捕捉平移不变特征，典型结构为卷积→激活→池化堆叠后接全连接分类。
refs:
  - label: CS231n 卷积网络笔记
    url: https://cs231n.github.io/convolutional-networks/
  - label: ImageNet 分类（AlexNet）
    url: https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html
tags: ["CNN", "卷积", "池化"]
---

## 三大核心特性

1. **局部连接**：每个神经元只连输入的一个局部区域（感受野），而非全连接，大幅减少参数；
2. **权值共享**：同一卷积核在整张图上滑动，学习平移不变的局部特征（边缘、纹理）；
3. **下采样/池化**：Max/Average Pooling 降低空间尺寸、增大感受野、增强平移不变性。

## 典型结构

```text
卷积层（提特征）→ 激活（非线性）→ 池化（降采样）→ 堆叠 ... → 全连接（分类）
```

## 代表模型

- LeNet（早期手写识别）；
- AlexNet（ImageNet 深度学习里程碑）；
- VGG（规整堆叠）；
- ResNet（残差连接，把网络做深）。

## 面试加分点

- 感受野、步长、padding 的换算关系；
- 1×1 卷积的作用（通道变换、降参、增加非线性）；
- CNN 的平移不变性来自"权值共享 + 池化"。
