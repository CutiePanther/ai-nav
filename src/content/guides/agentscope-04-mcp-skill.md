---
title: "MCP 与技能（MCP / Skill / Tool Group）"
description: "MCP 与技能：接入 MCP 服务的完整写法、工具组（Tool Group）如何收敛工具面、技能（Skill）的封装方式。"
order: 4
category: AgentScope
tags: ["AgentScope", "MCP", "Skill"]
updated: 2026-09-15
---
## 概念

Toolkit 除了本地 Python 工具，还能挂三类能力源：**MCP 服务器**（外部工具协议）、**技能包 Skill**（SOP 知识，按需加载）、**工具组 Tool Group**（整体启停的能力束）。

## 调用示例：接入 MCP

```python
import os
from agentscope.tool import Toolkit, Bash, Read
from agentscope.mcp import MCPClient, HttpMCPConfig

agent = Agent(
    name="my_agent",
    system_prompt="You are a helpful assistant.",
    model=chat_model,
    toolkit=Toolkit(
        tools=[Bash(), Read()],
        mcps=[
            MCPClient(
                name="amap",
                is_stateful=False,
                mcp_config=HttpMCPConfig(
                    url=f"https://mcp.amap.com/mcp?key={os.environ['AMAP_API_KEY']}",
                ),
            ),
        ],
        skills_or_loaders=["./skills"],
    ),
)
```

## Tool Group（工具组）

- 用 `tools` 构造的 Toolkit 进入始终激活的 `"basic"` 组
- 追加 `mcps`、`skills_or_loaders`、`tool_groups` 扩展可达能力
- `Toolkit` 在存在额外组或技能时**自动注册** `reset_tools` meta 工具和 `Skill` 查看器，供模型在运行时切换组，开发者无需手动实例化

## 技能（Skill）

技能是按目录组织的 SOP 知识，用 `skills_or_loaders=["./skills"]` 挂载；兼容 Anthropic 风格的技能定义，注册方式为 `toolkit.register_agent_skill()`。配合 MCP & Skill Hub（GitHub MCP Registry、ClawHub）可浏览和安装生态里的现成能力。

## 常见坑

1. **MCP 连接失败先查协议**：确认 URL 是 MCP 协议端点而非普通 REST API。
2. **技能没有加载**：检查目录结构是否符合技能规范，以及是否被工具组关停。
3. **工具组状态是运行时的**：模型可通过 meta 工具启停组，调试「工具不见了」时先查组状态。
