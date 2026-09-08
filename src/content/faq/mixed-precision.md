---
title: 混合精度训练（FP16/BF16）的原理与作用？
category: AI八股文
difficulty: 进阶
answer: 前向与反向用低精度（FP16/BF16）加速计算，权重以 FP32 主副本保存，配合损失缩放（loss scaling）防止梯度下溢。BF16 表示范围与 FP32 相同，无需缩放。
refs:
  - label: NVIDIA 混合精度训练指南
    url: https://developer.nvidia.com/automatic-mixed-precision
  - label: BF16 说明
    url: https://en.wikipedia.org/wiki/Bfloat16_floating-point_format
tags: ["混合精度", "FP16", "BF16"]
---

## 什么是混合精度

- 计算用低精度（FP16 或 BF16）以利用 GPU 的 Tensor Core 加速；
- 但权重用 FP32 保存一份「主副本」，避免精度丢失累积；
- 每次迭代：FP32 权重 → 转 FP16 前向/反向 → 梯度转回 FP32 更新主副本。

这样兼顾了速度和精度。

## FP16 的问题与 loss scaling

FP16 的表示范围小（最大约 65504），梯度值又往往很小：

- 小梯度在 FP16 下会**下溢变成 0**，导致权重不更新；
- 解决：在反向传播前把 loss 乘以一个大系数（如 2^k）「放大」，梯度也跟着放大，避开下溢区；更新权重前再除以同样的系数「缩回」。

## BF16 的优势

BF16 用 8 位指数（和 FP32 一样）、7 位尾数：

- **表示范围与 FP32 相同**，不会像 FP16 那样溢出/下溢；
- 因此**不需要 loss scaling**，训练更简单；
- 代价是精度（尾数）略低于 FP16，但实践中对训练影响很小。A100/H100 之后的硬件普遍支持 BF16。

## 面试加分点 / 追问方向

- FP16 与 BF16 的位布局差异（指数位 vs 尾数位）；
- 为什么是「混合」精度而不是「全低」精度（主副本的作用）。
