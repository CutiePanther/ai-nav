---
title: RoPE 的长度外推怎么做？NTK、YaRN 是什么？
category: AI八股文
difficulty: 高级
answer: 模型训练时只见过一定长度，推理遇到更长序列时 RoPE 频率失配导致性能骤降。外推通过缩放频率/位置（NTK-aware、YaRN 等）让模型适应更长上下文，无需重新训练。
refs:
  - label: NTK-aware 缩放
    url: https://www.reddit.com/r/LocalLLaMA/comments/14lz7j5/ntkaware_scaled_rope_allows_llama_models_to_have/
  - label: YaRN 论文
    url: https://arxiv.org/abs/2309.00071
tags: ["RoPE", "长度外推", "NTK", "YaRN"]
---

## 问题

RoPE 用「位置 m × 频率 θ」旋转 q、k。模型训练时见过的最长位置决定了 θ 的分布。推理时若序列超过训练长度，新位置对应的旋转角是「训练外」的，注意力会失效，输出质量骤降。

## 常见外推方法

| 方法 | 思路 | 特点 |
| --- | --- | --- |
| 位置插值 | 把长序列的位置线性「压缩」回训练长度范围 | 简单，但会损失高频分辨 |
| NTK-aware | 缩放 θ 的基数，让高频（低维）基本不变、低频（高维）扩展 | 效果好，流行 |
| YaRN | 在 NTK 基础上修正温度 + 插值，兼顾长文与短文的困惑度 | 更精细 |
| ReRoPE / 窗口化 | 局部做精细旋转、远处做粗略旋转 | 更复杂 |

## 直观理解

把「外推」类比成「超出训练范围的函数外插」——直接硬外推会失配，所以要「缩放/插值」让模型平滑地覆盖新长度。NTK-aware 的关键洞见是：低频维度负责长距离依赖、最需要扩展；高频维度负责局部细节、应保持不动。

## 面试加分点 / 追问方向

- 能说清「插值 vs 外推」的本质区别（缩放位置 vs 缩放频率）；
- 结合「大海捞针（Needle in a Haystack）」测试理解长文能力并非越长越好。
