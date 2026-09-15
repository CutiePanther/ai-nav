---
title: "快速开始：安装与第一个 Agent"
description: "AgentScope 2.0 安装与第一个 Agent：相对 1.0 的破坏性重构、最小可运行代码、流式事件消费与三个高频坑。"
order: 1
category: AgentScope
tags: ["AgentScope", "快速开始", "Agent"]
updated: 2026-09-15
---
## 概念

AgentScope 是阿里通义实验室开源的生产级智能体框架。**AgentScope 2.0 是当前主线版本，相对 1.0 是破坏性重构**，核心变化：`Agent` 取代 `ReActAgent` 成为唯一入口、凭证独立为 `agentscope.credential` 模块、工具体系重构为 `ToolBase` / `Toolkit` / 工具组。

## 安装

要求 Python 3.11+，推荐 uv 安装：

```bash
uv pip install agentscope              # 核心包
uv pip install "agentscope[full]"      # Windows 用户；Mac/Linux 写 agentscope\[full\]
```

验证安装：

```python
import agentscope
print(agentscope.__version__)   # 2.0.8
```

## 第一个 Agent（最小可用）

```python
import asyncio
import os

from agentscope.agent import Agent
from agentscope.credential import DashScopeCredential
from agentscope.event import EventType
from agentscope.message import UserMsg
from agentscope.model import DashScopeChatModel
from agentscope.tool import Toolkit, Bash, Read, Write, Edit


async def main() -> None:
    agent = Agent(
        name="Friday",
        system_prompt="You are a helpful assistant named Friday.",
        model=DashScopeChatModel(
            credential=DashScopeCredential(api_key=os.getenv("DASHSCOPE_API_KEY")),
            model="qwen-plus",
        ),
        toolkit=Toolkit(tools=[Bash(), Read(), Write(), Edit()]),
    )

    user_msg = UserMsg(name="user", content="Hello, who are you?")

    # 方式一：等待最终回复
    reply_msg = await agent.reply(user_msg)

    # 方式二：流式消费增量事件
    async for event in agent.reply_stream(user_msg):
        match event.type:
            case EventType.TEXT_BLOCK_DELTA:
                ...   # 流式文本增量
            case EventType.TOOL_CALL_START:
                ...   # 即将调用工具
            case _:
                ...   # 思考块 / 工具结果 / 回复结束等


asyncio.run(main())
```

## 关键点

| 点 | 说明 |
|---|---|
| `Agent` 无状态 | 推理-行动循环引擎，运行时状态放在 `AgentState`，由 `state` 参数注入 |
| 两个入口 | `reply()` 返回最终 `Msg`；`reply_stream()` 逐个产出 `AgentEvent` |
| 换供应商 | 只换 `model` 参数这一对（Model + Credential），其余不动 |

## 常见坑

1. **照抄 1.x 教程**：`ReActAgent`、`agentscope.init()` 在 2.0 中已不存在。
2. **`max_tokens` 给太小**：思考模型（如 deepseek-v4 系列）会先消耗 token 推理，配置低于 512 时正文可能为空串。
3. **忘记 async**：`reply` / `reply_stream` 都是协程，必须 `asyncio.run(main())` 驱动。
