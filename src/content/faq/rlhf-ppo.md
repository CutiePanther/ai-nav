---
title: RLHF 中为什么用 PPO？它比普通策略梯度稳在哪？
category: AI八股文
difficulty: 高级
answer: 普通策略梯度每更新一步都要重新采样、方差大、样本利用率低；PPO 用重要性采样复用旧数据并引入 clip 裁剪，限制每步更新幅度，训练更稳定、样本更高效。
refs:
  - label: InstructGPT 论文
    url: https://arxiv.org/abs/2203.02155
  - label: PPO 论文
    url: https://arxiv.org/abs/1707.06347
tags: ["PPO", "RLHF", "强化学习"]
---

## 为什么不能用朴素策略梯度

朴素的 Policy Gradient（如 REINFORCE）：

- 每更新一次策略就要重新采样一批轨迹，**样本利用率极低**；
- 梯度估计方差极大，训练不稳定，尤其在大模型上几乎不可用。

## PPO 的两个关键改进

1. **重要性采样（Importance Sampling）**：用旧策略 π_old 采样的数据，多次更新新策略 π_θ，通过概率比 π_θ/π_old 修正分布偏移，样本复用率高；
2. **Clip 裁剪**：把概率比限制在 [1-ε, 1+ε] 内（ε 常为 0.2），防止单次更新步子迈太大：

```
L_clip = -min(r·A, clip(r, 1-ε, 1+ε)·A)
```

其中 r 是概率比、A 是优势函数。min 的作用：好的动作（A>0）不要提得太多，坏的动作（A<0）不要降得太狠。

## 面试加分点 / 追问方向

- 能说清 clip 是「限制新旧策略差异」，保证更新在信任域内；
- RLHF 里还要加 KL 惩罚防止模型跑偏，这是 PPO 之外的对齐约束；
- 为什么工业界也在用 DPO/GRPO 替代 PPO（更简单、更稳）。
