---
title: System Prompt 的作用是什么？如何设计？
category: 大模型
difficulty: 入门
answer: System Prompt 是优先级最高的指令，用于设定角色、约束行为、注入规则。它贯穿整个对话，是控制模型输出的第一道「总开关」。
refs:
  - label: Anthropic System Prompt 指南
    url: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts
tags: ["System Prompt", "Prompt 工程"]
---

## 什么是 System Prompt

对话消息分三种角色：system（系统）、user（用户）、assistant（助手）。System Prompt 是给模型的「顶层指令」，通常放在最前面，优先级高于用户消息。

## 它的典型作用

- **设定角色**：「你是一名资深算法工程师」；
- **约束输出**：「用中文回答，控制在 200 字以内，不要编造数据」；
- **注入规则与知识**：公司规范、产品口径、禁止事项；
- **定义格式**：输出 JSON、Markdown 表格等。

## 设计要点

- **优先级高**：把最重要的约束放这里，而不是散落在每条 user 消息里；
- **具体可执行**：「拒绝回答敏感问题」不如「遇到政治/医疗建议时统一回复『请咨询专业人士』」；
- **不冲突**：system 与后续指令要一致，否则模型会混乱；
- **迭代测试**：system prompt 改动后要用评测集回归，防止副作用。

## 面试加分点 / 追问方向

- system / user / assistant 三种角色的区别（system 定基调，user 是需求，assistant 是历史回复）；
- 提示词注入（Prompt Injection）攻击：用户消息可能诱导模型无视 system 指令，是安全重点。
