---
title: AgentScope 为什么用消息驱动 + Actor 模型？相比函数调用式协作好在哪？
category: 工程系统
difficulty: 进阶
answer: 消息驱动让智能体间通过 Msg 一等地交换输入/输出，解耦依赖；Actor 模型让每个智能体作为独立计算单元，收到所需消息后自行计算并回发，天然支持并行调度与故障隔离，比硬编码函数串调更灵活、更易扩展为分布式。
refs:
  - label: AgentScope 官方仓库
    url: https://github.com/agentscope-ai/agentscope
  - label: AgentScope 教程：Agent
    url: https://modelscope.github.io/agentscope/zh_CN/tutorial/
tags: ["AgentScope", "Actor模型", "消息驱动"]
---

## 为什么用消息驱动

智能体之间不直接调用彼此的内部方法，而是**交换消息** `Msg(name, content, url)`。好处：

- **解耦**：每个 Agent 只关心收到的消息与自己的处理逻辑，不依赖队友的具体实现；
- **可组合**：同一套 Agent 可以自由拼接成不同工作流；
- **可观测**：所有交互都是一条条消息，方便记录、回放与调试。

## Actor 模型如何落地

每个智能体（Actor）拥有：**自己的状态 + 消息队列 + 处理逻辑**。当它收到所需的所有消息后才触发计算（`reply`），再把结果作为新消息发出。

```python
while True:
    x = dialog_agent(x)   # 助手处理用户消息
    x = user_agent(x)     # 用户继续输入
    if x.content == "exit":
        break
```

## 相比函数调用式协作

| 维度 | 直接函数串调 | 消息驱动 + Actor |
| --- | --- | --- |
| 耦合度 | 高（强依赖对方签名） | 低（只看消息） |
| 并行性 | 需手动编排多个线程 | Actor 天然支持并行调度 |
| 故障隔离 | 一处异常拖垮整体 | 单个 Actor 隔离，可重试 |
| 扩展分布式 | 困难 | 天然分布，Actor 可跨进程 |

## 面试加分点

- 消息里可带 `url` 引用多模态数据，实现文本、图像、音视频的解耦传输；
- 与 Dapr / Orleans 等 Actor 框架思想同源，可迁移理解；
- 强调其容错：错误可分类（可访问性、规则可解析、模型可解析等）并定制重试策略。