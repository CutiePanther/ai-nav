---
title: SFT、RLHF、DPO 分别是什么？有何区别？
category: 大模型
difficulty: 进阶
answer: SFT 用指令-回答对做有监督微调打基础，RLHF 训练奖励模型后用强化学习对齐偏好，DPO 绕过 RM 与 RL 直接用偏好对优化，更简单稳定。
refs:
  - label: InstructGPT（RLHF）论文
    url: https://arxiv.org/abs/2203.02155
  - label: DPO 论文
    url: https://arxiv.org/abs/2305.18290
tags: ["SFT", "RLHF", "DPO", "对齐"]
---

## 三者的定位

| 方法 | 训练信号 | 特点 |
| --- | --- | --- |
| SFT | 指令-回答对 | 最基础，让模型学会遵循指令 |
| RLHF | 人类偏好 + 强化学习 | 效果强，但复杂、不稳定、贵 |
| DPO | 偏好对 | 简单稳定，效果接近 RLHF |

## 详细对比

- **SFT（监督微调）**：用高质量"指令-回答"对做有监督训练，是绝大多数对齐的起点；
- **RLHF**：在 SFT 上先训练奖励模型，再用 PPO 优化策略，让输出更符合人类价值观；
- **DPO**：直接偏好优化，用"好答案 vs 差答案"做分类式优化，绕过显式 RM 和强化学习。

## 面试加分点

- 工程上 SFT 是必选项，RLHF / DPO 视对齐需求与资源决定；
- DPO 的隐含假设是 RM 可由策略函数隐式表达，因此更稳定；
- 三者常组合使用：SFT → DPO/RLHF 是常见对齐链路。
