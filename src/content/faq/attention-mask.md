---
title: Attention Mask 是怎么实现的？为什么屏蔽位用 -inf 而不是 0？
category: AI八股文
difficulty: 高级
answer: 注意力得分 Q·Kᵀ 在 softmax 之前，对要屏蔽的位置加上一个 -inf（或小的负大数），使 exp 后软权重趋近 0，实现「不允许看」；causal（因果）mask 与 padding mask 以加法掩码叠加到得分上，无需额外分支。
refs:
  - label: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
  - label: HuggingFace Mask 术语表
    url: https://huggingface.co/docs/transformers/en/glossary#attention-masks
tags: ["Attention", "Mask", "掩码"]
---

## 核心概念

掩码用一张与注意力得分同形状的布尔/数值矩阵，把不被允许 attend 的位置的权重清零。实现上在得分矩阵 `Q·Kᵀ` 上做**加法掩码**：屏蔽处加 `-inf`（或 `-1e9`/`-65504` 这类负大数）再 softmax，因为 `exp(-inf)=0`，被屏蔽位置的注意力权重严格为 0，后续也不会聚合到其 V 上。

## 关键要点 / 原理

- **为什么用 -inf 而非 0**：softmax 会对整行做归一化。若把得分直接乘 0，被屏蔽项仍占一个「接近 0 尺度」的权重，会稀释其它 token 的归一化结果；`-inf` 使该项严格退化为 0 且不影响其余权重分配。
- **Causal（因果）mask**：下三角矩阵，第 `i` 个 query 只能 attend 到位置 `≤ i` 的 key，配合自回归「只看上文」。
- **Padding mask**：变长 batch 中把填充 token（pad）屏蔽，使其既不被 attend、也不贡献统计量。
- **组合方式**：`final_mask = causal & padding`，布尔相乘后转成一数值 mask 叠加到 `Q·Kᵀ` 上，单一矩阵一次搞定。
- **实现细节**：FlashAttention 的在线 softmax 不能预先铺满真 `-inf`，需在 kernel 内按 tile 动态 mask；多数框架用有限负大数（如 `-65504`）替代无穷避免 NaN/INF→0 边界问题。

## 追问方向

- Decode 阶段加增量掩码：Query 只有一行时，如何在 KV Cache 之上只对新增 key 做掩码？
- FlashAttention / MHA 为什么要求「在线」处理掩码而不是先构造完整 -inf 矩阵？
- **面试加分点**：能讲清「加性掩码（加法 -inf）vs 乘性布尔掩码」在 softmax 数值稳定性上的本质差异，以及二者为何只在 softmax 前等价。