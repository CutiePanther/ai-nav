---
title: GQA 和 MQA 是什么？为什么能减少 KV Cache？
category: AI八股文
difficulty: 进阶
answer: 标准多头注意力每个头都有一份独立的 K、V；MQA 让所有头共享一份 K、V，GQA 折中成让若干个头共享一份。共享后 KV Cache 显著缩小，显存和带宽都降低。
refs:
  - label: GQA 论文
    url: https://arxiv.org/abs/2305.13245
  - label: MQA 论文
    url: https://arxiv.org/abs/1911.02150
tags: ["GQA", "MQA", "KV Cache"]
---

## 三种注意力结构

- **MHA（多头注意力）**：每个头有独立的 Q、K、V，表达力最强，但 KV Cache 最大；
- **MQA（多查询注意力）**：所有头共享同一份 K、V（每个头仍用自己的 Q），KV Cache 缩小 h 倍；
- **GQA（分组查询注意力）**：折中——把 h 个头分成 g 组，组内共享 K、V。g=h 退化为 MHA，g=1 退化为 MQA。

## 为什么能减少 KV Cache

推理时 KV Cache 的大小 ∝ 层数 × 序列长度 × (K、V 的份数 × 维度)。MHA 每个头一份，MQA 全局一份，GQA 每组一份。共享后 KV Cache 直接缩小，减少显存占用和访存带宽，推理吞吐提升。

## 代价

- 共享 K、V 会略微损失表达力（MQA 效果下降最明显，GQA 几乎无损）；
- 所以现代模型（LLaMA 3、Qwen 等）普遍用 GQA，在效果与效率间取平衡。

## 面试加分点 / 追问方向

- 能说清 MHA → MQA → GQA 的演进逻辑（都是围绕 KV Cache 做优化）；
- KV Cache 显存如何估算（后面有专门的题）。
