---
title: 思维树（Tree-of-Thoughts，ToT）是什么？和 CoT 有何区别？
category: 大模型
difficulty: 进阶
answer: 思维树把问题求解建模成对「多个思维分支」的深度搜索：生成多种候选步骤、自我评估、回溯剪枝，再延伸探索，从而突破 CoT 单一路径不能试错、不能回头的局限，更接近人类求解复杂问题的「深思」模式。
refs:
  - label: "Tree of Thoughts: Deliberate Problem Solving with Large Language Models"
    url: https://arxiv.org/abs/2305.10601
tags: ["思维树", "ToT", "推理"]
---

## 核心概念

思维树（Tree-of-Thoughts, ToT）由普林斯顿团队提出，把「解题」还原为对一棵思维树的搜索：LLM 先生成多个**候选思维分支**（类似树的子节点），再由模型/规则对每个分支**打分评估**，保留有希望的、剪掉没希望的，沿高分分支继续生成，最终选出最终答案路径。它让模型「想到了多个方案再选」，而不是「一竿子走到黑」。

## 与 CoT 的关键区别

| 维度 | CoT 思维链 | ToT 思维树 |
| --- | --- | --- |
| 结构 | 单条线性推理路径 | 多分支并行 + 树形搜索 |
| 试错 | 不能回溯、一条道走到黑 | 可评估、可回退、可剪枝 |
| 成本 | 低、token 少 | 高、需多次生成与评估 |
| 适用 | 数学、逻辑等单路径问题 | 需规划、组合、错误可能致命的问题（难生成文本、字谜等） |

## 关键要点 / 原理

- **三个基本操作**：Thought Generator（扩展开出若干候选步骤）、State Evaluator（给每步打分/排序）、Search Algorithm（DFS/BFS 回溯搜索选择路径）；
- **评估方式**：价值函数打分（模型自评或规则判定），结合广度优先（BFS）或深度优先（DFS）探索；
- **对应用层 / Agent 的启示**：把「先想再干、干错能改」融入 Agent 规划，衍生出 ReAct、Self-Consistency、MCTS 等思想。

## 延伸 / 追问方向

- ToT 相比 Self-Consistency（多次采样取多数）有什么质的区别（结构搜索 vs 采样聚合）；
- ToT 的 token 成本很高，如何在线上做「先易后难」的降级策略；
- 面试加分点：能说明 ToT 与「强化学习间的 search」在推理模型中（如 rStar/AlphaZero 式）的融合趋势，以及评估函数如何用另一模型自动实现。

## 面试加分点

点出 ToT 是「让 LLM 学会搜索」的思想起点：它把 search 引入解码过程，是 o1/R1 推理模型「算力换正确率」思路的重要铺垫。