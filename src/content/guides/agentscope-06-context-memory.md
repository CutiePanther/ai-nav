---
title: "上下文与记忆（Context / Long-Term Memory）"
description: "上下文与记忆：上下文压缩配置、长期记忆的落地选型，Agentic Memory 零依赖方案与 ReMe 自动写回实践。"
order: 6
category: AgentScope
tags: ["AgentScope", "上下文", "长期记忆"]
updated: 2026-09-15
---
## 概念

上下文管理解决「窗口装不下」：自动压缩 + 工具结果卸载。长期记忆解决「隔次就忘」：以**中间件**形式实现，非侵入挂载，支持多种后端。

## 上下文压缩配置

```python
from agentscope.agent import Agent, ContextConfig

agent = Agent(
    name="my_agent",
    system_prompt="You are a helpful assistant.",
    model=chat_model,
    context_config=ContextConfig(
        trigger_ratio=0.7,       # 上下文用到 70% 时触发压缩
        reserve_ratio=0.2,       # 压缩后保留最近 20%
        tool_result_limit=1000,  # 工具结果截断到 1000 token
        max_image_num=5,         # 只保留最近 5 张图
    ),
)
```

## 长期记忆实现

| 名称 | 代码 API | 特点 |
|---|---|---|
| Agentic Memory | `AgenticMemoryMiddleware` | 基于 Markdown 文件，智能体自主创建、维护、使用；索引写入固定的 `MEMORY.md` 并自动注入 system prompt（渐进式披露） |
| ReMe | `ReMeMiddleware` | 进程内文件型记忆（官方 ReMe 项目驱动），每轮回复后通过 `auto_memory` 自动提取写回；`pip install "agentscope[reme]"` |
| Mem0 | `Mem0Middleware` | 接入 mem0 开源版或托管平台；`pip install "agentscope[mem0]"` |

## 调用示例：Agentic Memory（零外部依赖）

```python
from agentscope.agent import Agent
from agentscope.middleware import AgenticMemoryMiddleware
from agentscope.permission import AdditionalWorkingDirectory, PermissionMode
from agentscope.tool import Read, Toolkit, Write, Edit

workdir = "/tmp/agentscope_ltm_demo"
memory = AgenticMemoryMiddleware(workdir=workdir)

agent = Agent(
    name="assistant",
    system_prompt="You are a helpful assistant.",
    model=chat_model,
    toolkit=Toolkit(tools=[Read(), Write(), Edit()]),
    middlewares=[memory],
)

# 放行写入记忆目录（生产环境按安全策略配置）
agent.state.permission_context.mode = PermissionMode.ACCEPT_EDITS
agent.state.permission_context.working_directories[workdir] = (
    AdditionalWorkingDirectory(path=workdir, source="long-term-memory-demo")
)

await agent.reply("Remember that I live in Hangzhou and prefer concise Chinese answers.")

# 复用同一 workdir 重建 Agent，即可跨会话回忆
new_agent = Agent(
    name="assistant",
    system_prompt="You are a helpful assistant.",
    model=chat_model,
    toolkit=Toolkit(tools=[Read(), Write(), Edit()]),
    middlewares=[AgenticMemoryMiddleware(workdir=workdir)],
)
await new_agent.reply("Do you remember my location and answer style preference?")
```

## 调用示例：ReMe 自动写回

```python
from agentscope.agent import Agent, AgentState
from agentscope.middleware import ReMeMiddleware
from agentscope.tool import Toolkit

memory = ReMeMiddleware(
    workspace_dir=".reme",
    parameters=ReMeMiddleware.Parameters(
        chat_model=my_chat_model,
        embedding_model=my_embedding_model,   # 提供后自动启用向量检索
        mode="both",
        top_k=5,
    ),
)

agent = Agent(
    name="assistant",
    system_prompt="You are a helpful assistant.",
    model=my_chat_model,
    toolkit=Toolkit(tools=await memory.list_tools()),
    middlewares=[memory],
    state=AgentState(session_id="alice-main"),
)

try:
    await agent.reply("Remember that I live in Hangzhou.")
finally:
    await memory.close()
```

## 常见坑

1. **跨会话失效**：记忆后端按 `workdir` / `workspace_dir` / `user_id` 定位，重建 Agent 时必须复用同一个值。
2. **权限没放行**：Agentic Memory 需要写文件权限，默认 ASK 会卡住记忆写入。
3. **ReMe/Mem0 忘记注册工具**：`middleware.list_tools()` 的返回要手动挂进 `Toolkit`。
4. **忘记关闭**：ReMe 中间件用完要 `await memory.close()`。
