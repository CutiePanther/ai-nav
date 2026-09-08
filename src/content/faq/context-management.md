---
title: LLM 应用如何处理长对话的上下文管理（多轮问答）？
category: 工程系统
difficulty: 进阶
answer: 模型无跨轮记忆，应用层需管理上下文，常用「滑动窗口截断 + 摘要压缩 + 向量检索召回历史」组合，控制 token 与成本，并规避长上下文中「迷失在中间」问题。
refs:
  - label: LangChain 短期记忆
    url: https://docs.langchain.com/oss/python/langchain/short-term-memory
  - label: vLLM 自动前缀缓存
    url: https://docs.vllm.ai/en/latest/features/automatic_prefix_caching.html
tags: ["上下文管理", "多轮对话", "上下文工程", "memory"]
---

## 核心概念

LLM 对多轮对话并没有内在记忆——每轮都把历史重新拼进 Prompt 再整体计算一遍。上下文越长，参与注意力的 token 越多，**越慢越贵且越占显存**。因此多轮问答的工程核心是：在信息保留、token 成本、延迟之间做取舍。

## 关键要点 / 原理

1. **滑动窗口截断**：只保留最近 N 轮，实现最简单、成本可控，但早期信息彻底失忆；
2. **摘要压缩**：把旧历史用模型总结成一段摘要替换原文，保留长程要点、省 token，但多一次总结调用且有信息损失；
3. **向量检索召回**：将历史分块 embedding，相关轮次按相似度动态召回拼入，兼顾长程与成本；
4. **参照丢失（Lost in the Middle）**：关键信息放在上下文中间时召回率明显下滑，布置时应前置关键内容或做指令增强；
5. **叠加前缀缓存**：公共部分（system prompt/历史前缀）可复用 KV Cache 降本提速。

## 延伸 / 追问方向

- 三策略如何组合设计（近几轮原文 + 早期摘要 + 回忆式检索）？
- 上下文管理与语义缓存、Prefix Cache 的配合关系；
- 长对话如何限定 max-model-len 避免超窗截断；
- 摘要压缩带来的信息损失如何衡量与补偿。

## 面试加分点

- 点出「上下文窗口是计算范围而非内存」——窗口里每个 token 都真正参与计算，这是成本题的前提。