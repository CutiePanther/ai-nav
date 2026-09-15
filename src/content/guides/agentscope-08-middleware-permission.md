---
title: "中间件与权限（Middleware / Permission / HITL）"
description: "中间件与权限：Agent 级与工具级中间件、PermissionMode 权限模式、PermissionDecision 安全契约及人机协同（HITL）。"
order: 8
category: AgentScope
tags: ["AgentScope", "中间件", "权限"]
updated: 2026-09-15
---
## 概念

中间件是非侵入修改智能体行为的钩子层，覆盖 reply、reasoning、acting、model call、permission check、context compression、system prompt 等环节。权限系统是三层安全（工具级审查 → 人机协同 → 沙箱）的核心。

## Agent 级中间件

`Agent(middlewares=[...])` 接收 `MiddlewareBase` 子类列表。长期记忆（AgenticMemory / ReMe / Mem0）和 RAG（RAGMiddleware）都是以中间件形式挂载的。

## 工具级中间件（ToolMiddlewareBase）

挂在具体工具实例上，只包工具自己的 `call()` 执行链（在工具外被直接调用时同样生效）。洋葱模型：**第一个注册的最外层**。

```python
from typing import AsyncGenerator, Any, Callable
from agentscope.tool import ToolMiddlewareBase, ToolBase, ToolChunk, Bash

class LoggingMiddleware(ToolMiddlewareBase):
    async def on_tool_call(
        self,
        tool: ToolBase,
        input_kwargs: dict[str, Any],
        next_handler: Callable[..., AsyncGenerator[ToolChunk, None]],
    ) -> AsyncGenerator[ToolChunk, None]:
        print(f"→ Calling {tool.name} with {input_kwargs}")
        async for chunk in next_handler(**input_kwargs):
            yield chunk
        print(f"✓ {tool.name} finished")

bash = Bash(middlewares=[LoggingMiddleware()])
```

## 权限模式（PermissionMode）

| 模式 | 行为 |
|---|---|
| `EXPLORE` | 只读工具自动放行 |
| `ACCEPT_EDITS` | 配置的工作目录内的文件编辑自动放行 |
| `BYPASS` | 全部放行（自愿放弃安全提示） |
| `DONT_ASK` | 需要 ASK 的操作转为 DENY |

```python
from agentscope.permission import AdditionalWorkingDirectory, PermissionMode

agent.state.permission_context.mode = PermissionMode.ACCEPT_EDITS
agent.state.permission_context.working_directories[workdir] = (
    AdditionalWorkingDirectory(path=workdir, source="demo")
)
```

## PermissionDecision 与安全契约

```python
from agentscope.permission import PermissionContext, PermissionDecision, PermissionBehavior

async def check_permissions(self, tool_input: dict, context: PermissionContext) -> PermissionDecision:
    return PermissionDecision(behavior=PermissionBehavior.ALLOW, message="Read-only.")
```

- `bypass_immune=True` 的 ASK：标记为安全检查，allow 规则无法静默放行（如部署工具标记 `prod-*` 目标）；`BYPASS` 模式仍会跳过，`DONT_ASK` 下转 DENY
- 内置工具的精细控制：`Bash` 有注入检测、只读识别、危险命令/路径检测、前缀规则匹配（如 `git commit:*`）和建议规则生成；`Write`/`Edit` 对敏感文件（`.bashrc`、`.env`、`.ssh/`）返回 bypass 免疫 ASK

## 人机协同（HITL）与外部执行工具

设 `is_external_tool = True`、不实现 `call`。智能体调用时发出 `RequireExternalExecutionEvent` 并暂停，直到外部通过 `ExternalExecutionResultEvent` 送回结果——这是审批流的底层机制。

```python
from agentscope.tool import ToolBase
from agentscope.permission import PermissionContext, PermissionDecision, PermissionBehavior

class HumanApproval(ToolBase):
    name = "HumanApproval"
    description = "Request human approval for a sensitive operation."
    input_schema = {
        "type": "object",
        "properties": {
            "action": {"type": "string", "description": "The action requiring approval."},
            "reason": {"type": "string", "description": "Why this action needs approval."},
        },
        "required": ["action", "reason"],
    }
    is_external_tool = True

    async def check_permissions(self, tool_input: dict, context: PermissionContext) -> PermissionDecision:
        return PermissionDecision(behavior=PermissionBehavior.ALLOW, message="Dispatch always allowed.")
```

## 中断与恢复

Agent 支持实时中断：用户打断后状态完整保存，可从暂停点续接。服务端对应 `POST /sessions/{id}/interrupt`。

## 常见坑

1. **体验卡在逐次确认**：内置 `Write`/`Edit` 默认 ASK、`PowerShell` 一律 ASK——个人助手场景要显式配 `ACCEPT_EDITS` + 工作目录白名单。
2. **中间件选错层**：要访问权限决定、工具调用事件等上下文用 `MiddlewareBase.on_acting`；只关心工具自身执行用 `ToolMiddlewareBase`。
3. **BYPASS 不是无限制**：bypass 免疫的 ASK 在 BYPASS 下跳过、但在 DONT_ASK 下是 DENY，语义不同。
