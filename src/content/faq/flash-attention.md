---
title: FlashAttention 的原理是什么？
category: AI八股文
difficulty: 高级
answer: FlashAttention 通过分块（tiling）和重计算（recompute）减少对 HBM 的读写次数，把注意力计算挪到更快的 SRAM 里完成，在不改变计算结果的前提下把显存占用从 O(n²) 降到 O(n)。
refs:
  - label: FlashAttention 论文
    url: https://arxiv.org/abs/2205.14135
  - label: FlashAttention 仓库
    url: https://github.com/Dao-AILab/flash-attention
tags: ["FlashAttention", "注意力优化", "IO"]
---

## 问题背景

标准自注意力的瓶颈不在「算」而在「读写」：

- 注意力矩阵是 n×n（O(n²) 显存）；
- GPU 的 HBM（高带宽显存）读写慢，SRAM（片上缓存）快但容量小；
- 标准实现要把 Q、K、V 和中间注意力矩阵反复在 HBM 和 SRAM 之间搬运，IO 成了瓶颈。

## 两个核心技巧

1. **分块（Tiling）**：把 Q、K、V 切成小块，一块一块地装进 SRAM 计算，避免把完整的 n×n 注意力矩阵写到 HBM；
2. **重计算（Recompute）**：反向传播时不再保存前向的中间注意力矩阵，而是在需要时用 SRAM 里的数据重新算一遍——用「多算一点」换「少读写很多」。

两者结合，显存占用从 O(n²) 降到 O(n)，同时因为大幅减少 HBM 访问，速度也显著提升。

## 关键点

- FlashAttention **不减少计算量（FLOPs）**，它优化的是 IO（memory access）；
- 结果是**精确的**（exact），不是近似算法——分块 softmax 通过 online-softmax 技巧保证和标准结果一致；
- 后续有 FlashAttention-2（进一步优化并行）和 FlashAttention-3（利用 Hopper 架构特性）。

## 面试加分点 / 追问方向

- 能区分「计算优化」和「IO 优化」两类不同的优化思路；
- 相关概念：PagedAttention（管理 KV Cache 显存碎片）、GQA（减少 KV Cache 大小）。
