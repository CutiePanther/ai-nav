---
title: 什么是上下文学习（In-Context Learning）？它为什么不需要更新参数？
category: 大模型
difficulty: 进阶
answer: 上下文学习是 LLM 仅凭提示词中的指令和示例、不更新权重就完成新任务的能力。它源于预训练时的元学习，核心机制与 attention 中捕捉并复制模式的「induction heads」有关。
refs:
  - label: "GPT-3: Language Models are Few-Shot Learners"
    url: https://arxiv.org/abs/2005.14165
tags: ["上下文学习", "ICL", "元学习"]
---

## 核心概念

上下文学习（In-Context Learning, ICL）指大模型在不做任何梯度更新（不改权重）的前提下，通过剖析 Prompt 中呈现的指令或少量示例，临时「学会」完成一个从未训练过的任务。GPT-3 论文首次系统展现：只给若干翻译/分类示例，无需 fine-tune，模型即能胜任，这正是「涌现能力」（Emergent Ability）的一种。

## 关键要点 / 原理

- **不动权重的「学习」**：信息完全承载于上下文 token，属于推理时的临时能力，用完即弃；
- **两大解释假说**：
  - **Induction Heads（机制可解释性视角）**：若干特定 attention 头会识别上下文中的「模式—复制」结构，删除这些头 ICL 能力显著下降；
  - **隐式元学习（Meta-Learning 视角）**：预训练时见过海量「定义—使用」结构，从而学会「从例子推断任务」的通用算法；
- **与 Few-shot 的关系**：Few-shot 是 ICL 的提示形态，Few-shot / Zero-shot 依赖的都是 ICL 能力；
- 模型越大，ICL 越稳定、对示例顺序与标签噪声的鲁棒性越强。

## 延伸 / 追问方向

- ICL、RAG、SFT 三者的适用边界与取舍（Meta L5 高频追问）；
- 如何用检索挑选更好的 few-shot 示例来提升 ICL 效果（如代表性采样 / 题释嵌入相似度）；
- 面试加分点：能讲清 induction heads 从哪些层出现、为什么小模型 ICL 不稳定。

## 面试加分点

把 ICL 放到「涌现能力」框架里讲：它不是训练时显式教出来的，而是在超大规模预训练中自发涌现，这也是它和小模型「靠记忆」的质变点。