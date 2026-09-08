---
title: 大模型流式输出（SSE）是怎么实现的？
category: 工程系统
difficulty: 进阶
answer: 流式输出用 SSE（Server-Sent Events）或 WebSocket 把生成结果按 token 增量推给客户端，而不是等全部生成完一次性返回，大幅降低「首字延迟」、提升体验。
refs:
  - label: SSE 规范
    url: https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events
tags: ["流式输出", "SSE", "WebSocket"]
---

## 为什么需要流式

LLM 生成是「一个 token 一个 token」地吐。如果等整段生成完才返回，用户要干等很久（尤其长回答）。流式输出让 token 一生成就推给前端，用户能「边看边出」。

## 实现方式

- **SSE（Server-Sent Events）**：单向、基于 HTTP，服务器持续推送 `data: {...}` 事件，前端用 EventSource 接收。实现简单，适合「服务器→客户端」单向流，是主流方案；
- **WebSocket**：全双工，适合双向交互，但复杂度更高。

## 典型流程

1. 后端调用模型 API 时开启 stream 参数；
2. 每收到一个 token 增量，包装成 SSE 事件推给前端；
3. 前端逐步拼接显示，直到收到结束标记（如 `[DONE]`）；
4. 连接关闭。

## 面试加分点 / 追问方向

- SSE vs WebSocket 的选型（单向推送用 SSE 更简单，双向用 WS）；
- 流式下的错误处理（中途失败如何优雅终止）、以及「打字机效果」的渲染细节。
