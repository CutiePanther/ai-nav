---
title: 提示词缓存（Prompt Caching）如何降本？
category: 工程系统
difficulty: 进阶
answer: 很多请求的前缀（system prompt、历史对话、检索到的文档）是重复的。提示词缓存把这些前缀的 KV 缓存下来，后续相同前缀的请求直接复用，省掉重复计算，降低成本与延迟。
refs:
  - label: Anthropic Prompt Caching
    url: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
tags: ["Prompt Caching", "降本", "KV Cache"]
---

## 原理

LLM 推理时，前缀部分的 KV 计算结果是确定的、可复用的。提示词缓存：

1. 识别请求中的公共前缀（system prompt、few-shot 示例、工具定义等）；
2. 第一次计算后缓存前缀的 KV；
3. 后续请求命中相同前缀，直接复用缓存的 KV，不再重复计算。

## 收益

- **降本**：缓存命中的 token 按更低价格计费（如 Anthropic 的缓存读取价远低于写入价）；
- **降延迟**：省掉前缀的重复计算，响应更快；
- 特别适合 system prompt 很长、或多轮对话前缀重复的场景。

## 工程注意点

- 缓存对「前缀」敏感，前缀变了就 miss；
- 尽量把稳定内容放前面、变化内容放后面，提高命中率；
- 检索增强（RAG）里，公共的 system prompt + 检索到的文档也可作为缓存前缀。

## 面试加分点 / 追问方向

- 说清它和 KV Cache 的关系（本质就是跨请求复用前缀 KV）；
- 如何提高命中率（稳定前缀在前、变化内容在后）。
