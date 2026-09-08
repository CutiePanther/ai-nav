---
title: DPO 的原理是什么？为什么不需要奖励模型？
category: AI八股文
difficulty: 进阶
answer: DPO 发现 RLHF 中的奖励函数可隐式表示为「策略模型与参考模型的对数概率差」，于是直接用偏好对（chosen/rejected）优化策略，省去单独训练奖励模型和 PPO 两个环节。
refs:
  - label: DPO 论文
    url: https://arxiv.org/abs/2305.18290
  - label: DPO 图解
    url: https://huggingface.co/blog/pref-tuning
tags: ["DPO", "RLHF", "对齐"]
---

## 从 RLHF 到 DPO

传统 RLHF 三阶段：SFT → 训练奖励模型（RM）→ 用 PPO 优化策略。DPO 的核心洞见是：**RM 这一环可以被跳过**。

DPO 从 RLHF 的优化目标出发，经过数学推导发现，最优奖励函数可以写成：

```
r(x,y) = β · log( π_θ(y|x) / π_ref(y|x) )
```

即奖励函数隐式地由「当前策略 π_θ 与参考策略 π_ref（通常是 SFT 后的模型）的对数概率之比」决定。于是 DPO 的损失函数直接是：

```
L_DPO = -log σ( β·( log(π_θ(y_w|x)/π_ref(y_w|x)) - log(π_θ(y_l|x)/π_ref(y_l|x)) ) )
```

其中 y_w 是偏好回答（chosen），y_l 是不偏好回答（rejected），β 控制偏离参考模型的程度。

## 直观理解

DPO 就是在说：**让当前模型相对参考模型，更倾向于生成 chosen、更少生成 rejected**。它不需要显式训练 RM，也不需要 PPO，只需要成对的偏好数据，用类似分类的损失直接优化。

## DPO 的局限（什么时候不如 RLHF）

- 偏好数据质量不高时，DPO 直接优化概率差容易被噪声 pair 带偏；
- 当奖励可自动验证（数学、代码）时，RLHF 能给每条回复独立打分，DPO 依赖成对比较会浪费绝对分数信息；
- β 是全局固定的超参，而 RM 能对不同输入给不同量级的奖励，更灵活。

## 面试加分点 / 追问方向

- 说清 DPO 相比 RLHF 省了什么（RM 训练 + PPO 强化学习的两套不稳定组件）；
- 实际项目常「先 DPO 稳偏好，再在可验证任务上做 RL（如 GRPO）」；
- chosen/rejected 最好来自上一版 checkpoint 的采样分布，避免直接用 GPT-4 蒸馏。
