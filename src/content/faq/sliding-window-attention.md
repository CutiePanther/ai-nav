---
title: 滑动窗口注意力（SWA）为什么能线性处理长序列？
category: AI八股文
difficulty: 进阶
answer: 滑动窗口注意力让每个 query 只 attend 前 W 个 token，把注意力复杂度从 O(n²) 降到 O(n·W)，配合滚动 KV 缓存把缓存固定到窗口大小；通过多层堆叠仍可获得约 L×W 的历史感知范围。
refs:
  - label: Mistral 7B 论文
    url: https://arxiv.org/abs/2310.06825
  - label: Longformer 论文
    url: https://arxiv.org/abs/2004.05150
tags: ["滑动窗口", "长上下文", "Mistral"]
---

## 核心概念

标准自注意力的得分矩阵是「每行看全前文」的稠密下三角；SWA 只保留最近 W 个位置的**带状**掩码，让每个 token 最多 attend 前 W 个 token。由于 W 固定，单层算力与缓存都随序列长度线性增长，从而高效支撑长上下文。

## 关键要点 / 原理

- **复杂度**：单层注意力由 O(n²·d) 降为 O(n·W·d)；KV 缓存从「完整历史」变为「最多 W」，显存有固定上界。
- **滚动缓存（Rolling Buffer Cache）**：Mistral 用固定 W 大小的环形缓冲，位置 `i` 的 KV 存到 `i mod W`，超出窗口的旧值被覆盖，缓存不再随 n 增长。
- **深层感知**：信息每层向前传播 W，堆叠 L 层后理论感受野约 `L·W`（Mistral：32 层×4096≈131K），所以窗口外的先验并非完全丢弃，而是经多层逐步传递。
- **长距离取舍**：单层内对窗口外 token 无法直接存取/精确检索，跨层传递有衰减；现代长上下文模型常改用「全注意力 + FlashAttention + RoPE 外推」而非纯 SWA。
- **实现**：靠专用核（FlashAttention / xFormers 改造）把带状 mask 变成固定带内计算，才能拿到墙钟加速。

## 追问方向

- 「滚出窗口的 token 还能影响结果吗、怎么影响」——通过逐层传播、最大约 L·W 的感受野。
- SWA 与「截断策略」在流式/长文档推理场景的适用性差异。
- **面试加分点**：能比较经典稀疏注意力家族——Longformer 的「窗口+全局 token」、BigBird 的「窗口+全局+随机」与纯 SWA 的取舍。