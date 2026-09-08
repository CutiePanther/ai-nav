---
title: 什么是 RLHF？训练流程是怎样的？
category: 大模型
difficulty: 高级
answer: RLHF 通过"训练奖励模型 + 强化学习优化"让模型对齐人类偏好，分三步：收集偏好数据、训练奖励模型、PPO 优化策略，目标是更安全、更有帮助、更符合价值观。
refs:
  - label: InstructGPT 论文
    url: https://arxiv.org/abs/2203.02155
  - label: RLHF 详解
    url: https://huggingface.co/blog/rlhf
tags: ["RLHF", "对齐"]
---

## 为什么需要 RLHF

基座模型只学"下一个 token"，不天然懂得"什么是有帮助、无害、符合人类价值观的回答"。RLHF 用人类反馈信号引导模型对齐偏好。

## 三步流程

1. **收集偏好数据**：对同一 prompt，让人类对多个模型回答排序（好/差）；
2. **训练奖励模型（RM）**：用偏好对训练一个能对回答打分的模型；
3. **强化学习优化**：用 PPO 等算法，以 RM 的分数为奖励，优化 LLM 策略。

## 目标与难点

- **目标**：让模型输出更安全、更有帮助、更符合人类价值观；
- **难点**：RM 的过拟合与奖励黑客（hacking）、PPO 训练不稳定、成本高。

## 面试加分点

- RLHF 是 InstructGPT / ChatGPT 对齐的关键技术；
- 相关替代：**DPO** 绕过显式 RM 与 RL，用偏好对直接优化，更简单稳定；
- 奖励模型的偏差会直接传导给最终模型。
