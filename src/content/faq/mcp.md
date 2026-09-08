---
title: MCP（Model Context Protocol）是什么？
category: 工程系统
difficulty: 进阶
answer: MCP 是 Anthropic 提出的开放协议，统一「AI 应用连接外部工具/数据源」的方式——类似 AI 的「USB-C」，让任意模型能通过标准接口接入任意工具，避免为每个工具写定制代码。
refs:
  - label: MCP 官方文档
    url: https://modelcontextprotocol.io/
  - label: MCP 规范
    url: https://github.com/modelcontextprotocol/modelcontextprotocol
tags: ["MCP", "协议", "工具接入"]
---

## 解决的问题

过去每接入一个新工具（数据库、文件系统、API），都要针对每个模型/框架写一套适配代码，碎片化严重。MCP 定义了一套标准协议：

- **客户端-服务器架构**：AI 应用是「客户端」，工具/数据源是「服务器」；
- **标准能力**：资源（resources）、工具（tools）、提示词（prompts）三类原语；
- **统一接入**：模型通过 MCP 客户端发现并调用任意 MCP 服务器，一个工具写好，处处可用。

## 意义

- 把「N 模型 × M 工具」的集成复杂度，降为「各实现一次 MCP 接口」；
- 生态快速扩大：主流模型和 IDE 都在支持 MCP；
- 与 Function Calling 互补：Function Calling 是单模型内定义工具，MCP 是跨模型的标准工具接入层。

## 面试加分点 / 追问方向

- 说清 MCP 与 Function Calling 的区别（协议标准 vs 模型原生能力）；
- 安全考量：MCP 服务器可能访问敏感资源，需要权限控制与用户确认。
