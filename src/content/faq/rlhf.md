---
title: 什么是 RLHF？训练流程是怎样的？
category: 大模型
difficulty: 高级
answer: RLHF（基于人类反馈的强化学习）通过三步让模型对齐人类偏好：1）收集人类对模型输出的偏好数据训练奖励模型；2）用奖励模型对 LLM 输出打分；3）用 PPO 等 RL 算法优化策略。其目标是让模型生成更安全、更有帮助、更符合人类价值观的回答。
refs:
  - label: InstructGPT 论文
    url: https://arxiv.org/abs/2203.02155
tags: ["RLHF", "对齐"]
---
