---
title: StreamingLLM 是做什么的？它如何让大模型处理无限长文本？
category: 大模型
difficulty: 高级
answer: StreamingLLM 指出「注意力汇」（attention sink，通常是首个 token）对分布式 softmax 稳定至关重要，从而用「固定首 token + 滑窗」的组配丢弃中间长上文，让 KV Cache 常驻显存、支持文本无限续写而近乎零掉点。
refs:
  - label: Efficient Streaming Language Models with Attention Sinks
    url: https://arxiv.org/abs/2309.17453
tags: ["StreamingLLM", "长文本", "Attention Sink"]
---

## 核心概念

StreamingLLM（微软，2023）解决「模型处理无限长文本」的工程痛点。朴素做法是把超长上下文滑窗截断，但直接滑动窗口会让模型性能骤降。作者发现这是「注意力汇」（Attention Sink）被移走导致的：模型会把相当一部分注意力固定分配给近层最靠近的那个 token（如 `<BOS>`），它像「安全港」一样吸收多余的能量，保证分布式 softmax 稳定。

## 关键要点 / 原理

- **Attention Sink**：LLM 训练里 softmax 依赖相对位置归一的视觉习惯，使初始 token 成为 sink,承担很高注意力权重；
- **KV Cache 常驻 + 滑窗**：保留首 token(sink) 的 KV + 最近 N 个 token 的 KV，丢弃中间内容，使 KV 大小有界、常驻显存；
- **两个方案，同一理念**：
  - **StreamingLLM**：只在推理侧做「sink + 滚动窗口」，不重训，可直接部署在现成模型上；
  - **LM-Infinite / 注意力 sink 训练版**：在训练阶段就注入 sink token，让模型天生支持流式；Llama 指令版等已把 sink 引入 SFT。
- **效果**：文本可无限续写，吞吐与显存固定，长程语言建模、摘要、代码续写等丢点极小，且比 sliding-window 大幅提升长文本保真度。

## 延伸 / 追问方向

- StreamingLLM 与「长上下文外推」（RoPE/YaRN）的定位差异：一个是扩展窗口，一个是让 KV 有界流式；
- 与 Prompt Cache（前缀复用）在工程上的协同；
- 面试加分点：能画图对比「滑动窗口 vs sink+窗口」的注意力分配，并解释为什么只留首个 token 就能稳定 softmax。

## 面试加分点

补充一句：StreamingLLM 本质没有扩展模型的「理解范围」，而是让「在超长对话里连续生成」成为可能——这是它和上下文长度扩展最本质的区别。