---
title: 什么是 Agent？与普通 LLM 调用的区别？
category: 大模型
difficulty: 入门
answer: Agent（智能体）在 LLM 基础上增加规划、工具调用、记忆与环境反馈闭环，能自主拆解任务、调用外部工具并迭代执行，而非单轮一问一答。
refs:
  - label: LangGraph 入门
    url: https://langchain-ai.github.io/langgraph/
  - label: Building Effective Agents
    url: https://www.anthropic.com/research/building-effective-agents
tags: ["Agent", "工具调用"]
---

## 核心概念

Agent = **LLM（大脑）+ 工具（手）+ 记忆（经验）+ 规划（思考）**，形成一个"思考—行动—观察"的闭环。

## 与普通 LLM 调用的区别

| 维度 | 普通 LLM 调用 | Agent |
| --- | --- | --- |
| 交互模式 | 一问一答，单轮 | 多轮循环，自主推进 |
| 能力边界 | 只会生成文本 | 能调用工具、读写环境 |
| 任务类型 | 简单问答、摘要 | 多步复杂任务 |
| 控制流 | 一次前向 | 规划 + 执行 + 反馈迭代 |

## 核心组件

- **规划（Planning）**：把复杂任务拆成子任务，决定下一步做什么；
- **工具调用（Tool Use）**：调用搜索、计算器、API、代码执行等外部能力；
- **记忆（Memory）**：短期记忆（当前上下文）与长期记忆（跨会话经验）；
- **反馈循环**：观察工具结果，判断是否达成目标，未达成则继续迭代。

## 面试加分点

- **ReAct 范式**：Reasoning + Acting，让模型交替"思考"和"行动"；
- **多 Agent 协作**：角色分工（规划者、执行者、评审者）提升复杂任务成功率；
- **风险**：循环失控、工具误用、token 消耗大，需超时与次数限制兜底。
