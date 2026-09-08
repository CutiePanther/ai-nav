---
title: 什么是感受野？如何逐层计算 CNN 的感受野？
category: 深度学习
difficulty: 进阶
answer: 感受野是特征图上某点能看到的输入图像区域大小。直觉上从后往前一层层反推，每层 r_out = (r_in-1)×stride + k；网络越深或核越大、stride 越大，感受野越大。
refs:
  - label: A Guide to Receptive Field Arithmetic
    url: https://distill.pub/2019/computing-receptive-fields/
  - label: CS231n 卷积网络笔记
    url: https://cs231n.github.io/convolutional-networks/
tags: ["感受野", "CNN", "卷积"]
---

## 核心概念

感受野（Receptive Field, RF）指**输出特征图上某一点对应的输入区域大小**。即该点的特征是由输入多大区域计算而来的。感受野之外的输入像素不会影响该点的输出。

## 逐层计算公式

从网络的**最后一层向前**逐层推出原始图像上的感受野：

- 记上一层感受野为 `r_in`，本层卷积核 `k`，步长 `stride`，则本层感受野：
  ```
  r_out = (r_in - 1) × stride + k
  ```

示例推导（感受野随层数增长并不线性，是累加关系）：

1. 第 1 层 3×3 卷积（stride=1）：RF = 3；
2. 第 2 层 3×3 卷积（stride=1）：RF = (3-1)×1 + 3 = 5；
3. 第 3 层 3×3 卷积（stride=2）：RF = (5-1)×2 + 3 = 11。

## 关键要点

- **堆叠小卷积核可以近似大卷积核**：两层 3×3 ≈ 一层 5×5，三层 3×3 ≈ 7×7，且参数更少、非线性更强；
- **stride=2（或池化）会显著放大感受野**，同时降分辨率；
- 目标检测中设计 anchor 需与感受野匹配，anchor 过大会显著影响检测性能；
- 密集预测（分割）需要确保输出像素感受到足够大区域，避免忽略上下文。

## 延伸 / 追问方向

- 计算过程给出具体卷积网络各层 RF，体会「非简单相加」；
- 空洞卷积（Dilated Conv）如何在不降分辨率前提下增大感受野；
- 感受野「有效感受野」（Effective Receptive Field）集中于中心的分布性质。

## 面试加分点

- 不仅能记住公式，能现场对 VGG/ResNet 快速心算感受野；
- 说清有效感受野呈高斯状中心集中，提升对归一化因子和深层堆叠必要性的理解。