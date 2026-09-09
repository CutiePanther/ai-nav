---
title: 什么是 AgentScope？它解决了什么问题？
category: 大模型
difficulty: 入门
answer: AgentScope 是阿里达摩院开源的多智能体开发框架，围绕消息驱动 + Actor 模型设计，让开发者用模块化方式构建、编排并容错运行多智能体应用，解决"多智能体难以开发、调试与稳定部署"的痛点。
refs:
  - label: AgentScope 官方仓库
    url: https://github.com/agentscope-ai/agentscope
  - label: AgentScope 中文文档
    url: https://modelscope.github.io/agentscope/zh_CN/
tags: ["Agent", "多智能体", "AgentScope"]
---

## 核心定位

AgentScope 是一套 **多智能体（multi-agent）开发平台**，把智能体当作一等公民：你可以组合不同类型的 Agent（如 `DialogAgent`、`ReActAgent`、`UserAgent`），让它们通过**消息**协作完成单个模型难以胜任的复杂任务。

## 解决的核心问题

- **开发门槛高**：提供 `DialogAgent` 等内置 Agent、统一模型接入（`agentscope.init` + `ModelWrapper`）与 Workstation 拖拽式低代码编排，降低上手成本；
- **稳定性差**：内置错误分类与自定义容错、重试机制，提升长链路执行的鲁棒性；
- **难以规模化**：基于 **Actor 模型** 的分布式框架，支持多智能体并行与自动调度。

## 关键设计

- **消息驱动**：智能体间通过 `Msg(name, content, url)` 传递消息，所有交互都是消息交换；
- **模块化**：Agent / Memory / Model / Service 等均可插拔替换；
- **多模态**：消息可带 URL 引用图片、音视频，支持多模态对话与传输。

## 面试加分点

- 与 LangGraph、AutoGen 等对比：AgentScope 更强调**开箱即用 + 工程化鲁棒性**与低代码；LangGraph 侧重图式流程编排，AutoGen 侧重对话式协作；
- 核心概念顺序：Model（模型）→ Agent（智能体）→ Message（消息）→ 多 Agent 协作；
- 用 Actor 模型做分布式，天然支持并行，适合企业落地。