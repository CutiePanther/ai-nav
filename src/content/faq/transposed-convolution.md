---
title: 转置卷积（反卷积）的思想与应用？与真正的反卷积有何区别？
category: 深度学习
difficulty: 进阶
answer: 转置卷积是卷积的「参数共享的逆向传递」（梯度回传过程），用于上采样恢复空间尺寸，而非数学意义上的卷积逆运算，故更准确叫「转置卷积」而不是「反卷积」。
refs:
  - label: Deconvolution and Checkerboard Artifacts
    url: https://distill.pub/2016/deconv-checkerboard/
  - label: Fully Convolutional Networks（FCN）
    url: https://arxiv.org/abs/1411.4038
tags: ["转置卷积", "反卷积", "上采样"]
---

## 核心概念

把标准卷积写成矩阵形式：输入向量 `x` 与稀疏矩阵 `C` 相乘得 `y = Cx`。转置卷积就是使用 `C^T` 对特征做「上采样式」运算 `x' = C^T y`，从而把低分辨率特征图**放大**到目标尺寸。它**不是**卷积数学上的逆（不能精确还原原始像素值），只是让尺寸恢复。

## 实现方式（如何变大）

以 stride=2 转置卷积为例：

1. 在输入像素之间插入 `(stride-1)` 个 0，实现间隔补零；
2. 对扩展后的特征图做一次标准卷积（通常核 3×3/4×4、stride=1）；
3. 输出尺寸约放大为输入的 stride 倍。

输出尺寸（忽略边界细节）常用：`W_out = (W_in - 1) × stride + kernel - 2 × padding`。

## 关键要点

- **用于上采样/解码**：语义分割（FCN、U-Net）、生成模型 GAN 的生成器都靠它把特征图还原到原图分辨率；
- **可学习**：相比双线性插值等固定上采样，转置卷积是参数可学的，能学习到更好的放大模式；
- **缺陷——棋盘格伪影（Checkerboard Artifacts）**：当 stride 不能整除 kernel 时，叠加上采样核不均匀，易产生棋盘状纹理，可用上采样+卷积或像素重组（Pixel Shuffle）缓解。

## 延伸 / 追问方向

- 转置卷积与上采样（Upsampling）+卷积的组合对比；
- 卷积 stride>1 与转置卷积 stride>1 在尺寸上互为「逆过程」的逻辑；
- PixelShuffle（子像素卷积）如何缓解棋盘格伪影且计算更高效。

## 面试加分点

- 能写出矩阵形式的 `C` 与 `C^T` 关系，说明为何叫「转置」；
- 主动指出转置卷积不是严格逆运算并举例说明尺寸无法逐像素还原。