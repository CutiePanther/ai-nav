---
title: Function Calling / 工具调用是什么？如何保证结构化输出？
category: 大模型
difficulty: 进阶
answer: Function Calling 让模型不直接生成答案，而是输出「调用哪个函数 + 参数 JSON」，由程序执行后再把结果回传。它让 LLM 能操作外部世界，是 Agent 的基础能力。
refs:
  - label: OpenAI Function Calling 文档
    url: https://platform.openai.com/docs/guides/function-calling
  - label: 结构化输出 JSON mode
    url: https://platform.openai.com/docs/guides/structured-outputs
tags: ["Function Calling", "工具调用", "Agent"]
---

## 什么是 Function Calling

- 开发者先把可用工具（函数名、参数 schema、描述）告诉模型；
- 模型判断「用户意图需要调用哪个工具」，输出工具名 + 结构化参数（JSON），而不是自然语言；
- 程序真正执行该函数，把结果回传给模型，模型再综合生成最终回答。

这解决了 LLM 的两个短板：**无法执行外部操作**、**输出格式不稳定**。

## 如何保证结构化输出

- **JSON mode / 约束解码**：在解码时强制 token 符合 JSON 语法（如 OpenAI 的 structured outputs、outlines、jsonformer）；
- **Schema 约束**：给模型明确的字段名、类型、枚举值；
- **Function Calling**：本身就是一种强结构化的输出协议；
- **兜底 + 重试**：解析失败时把报错回喂给模型让它修正。

## 在 Agent 中的作用

Agent 的「规划 - 行动 - 观察」循环里，行动环节就是靠 Function Calling 落地：模型决定调哪个工具、传什么参，程序执行并反馈结果。

## 面试加分点 / 追问方向

- 说清「工具调用」与「让模型直接算」的区别（模型不会真执行，只会输出意图）；
- 约束解码（constrained decoding）的原理：在采样时屏蔽非法 token，比事后正则解析更可靠。
