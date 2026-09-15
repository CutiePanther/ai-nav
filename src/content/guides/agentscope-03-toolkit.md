---
title: "工具体系（ToolBase / FunctionTool / Toolkit）"
description: "工具体系：ToolBase 接口契约、内置工具清单、FunctionTool 把普通函数变工具、自定义子类与 Toolkit 组装。"
order: 3
category: AgentScope
tags: ["AgentScope", "工具", "Toolkit"]
updated: 2026-09-15
---
## 概念

工具是智能体作用于世界的手段。2.0 的工具体系三层：**Tool**（满足 `ToolBase` 接口的对象）、**Toolkit**（注册与分发容器）、**Tool Group**（可整体启停的工具包，内置 meta 工具在运行时切换）。

## ToolBase 接口

| 属性/方法 | 说明 |
|---|---|
| `name` / `description` | 暴露给 LLM 的名称与描述 |
| `input_schema` | 参数的 JSON Schema |
| `is_concurrency_safe` | 是否可并行调用 |
| `is_read_only` | 是否无副作用（影响权限自动放行） |
| `check_permissions(tool_input, context)` | 必须实现；执行前权限检查，返回 `PermissionDecision` |
| `check_read_only(tool_input)` | 可选；只读性依赖输入时覆盖（如 `Bash`: `ls` 只读、`rm` 不是） |
| `call(**kwargs)` | 必须实现；执行逻辑，返回 `ToolChunk` 或其异步生成器 |
| `__call__(**kwargs)` | 框架分发入口，跑中间件链后转 `call()`，**不要覆盖** |

## 内置工具

| 工具 | 说明 | 只读 |
|---|---|---|
| `Bash` / `PowerShell` | 执行 shell / PowerShell 命令 | 否 |
| `Read` / `Write` / `Edit` | 文件读写与精确替换 | 读是 |
| `Glob` / `Grep` | 文件名匹配 / ripgrep 内容搜索 | 是 |
| `TaskCreate` / `TaskGet` / `TaskList` / `TaskUpdate` | 结构化任务规划 | 多数是 |

注意：文件工具强制「先读后写」—— `Write`/`Edit` 要求目标文件先被 `Read` 过。Windows 上 `LocalWorkspace.list_tools()` 返回 `PowerShell` 替代 `Bash`；`PowerShell` 出于保守，**所有命令一律 ASK**（无只读识别）。

## FunctionTool：函数秒变工具

自动从函数名、docstring、类型注解生成 schema：

```python
from agentscope.tool import FunctionTool, Toolkit

def get_weather(city: str, unit: str = "celsius") -> str:
    """Get the current weather for a city.

    Args:
        city: The city name to look up.
        unit: Temperature unit, either "celsius" or "fahrenheit".
    """
    return f"The weather in {city} is 22°{unit[0].upper()}"

toolkit = Toolkit(tools=[FunctionTool(get_weather)])
```

需要枚举、数值范围或嵌套结构时，直接传 Pydantic 模型：

```python
from pydantic import BaseModel, Field

class WeatherInput(BaseModel):
    city: str
    days: int = Field(default=1, ge=1, le=7)

weather_tool = FunctionTool(get_forecast, input_schema=WeatherInput)
```

| 覆盖参数 | 说明 |
|---|---|
| `name` / `description` | 覆盖自动提取的名称/描述 |
| `input_schema` | 显式 JSON Schema 或 Pydantic 模型 |
| `is_concurrency_safe` | 默认 `True` |
| `is_read_only` | 默认 `False`（有副作用） |
| `is_state_injected` | `True` 时通过 `_agent_state` 注入智能体状态 |

## 自定义 ToolBase 子类

```python
from agentscope.tool import ToolBase, ToolChunk
from agentscope.permission import PermissionContext, PermissionDecision, PermissionBehavior
from agentscope.message import TextBlock

class WebSearch(ToolBase):
    name = "WebSearch"
    description = "Search the web for information on a given query."
    input_schema = {
        "type": "object",
        "properties": {"query": {"type": "string", "description": "The search query."}},
        "required": ["query"],
    }
    is_concurrency_safe = True
    is_read_only = True

    async def check_permissions(self, tool_input: dict, context: PermissionContext) -> PermissionDecision:
        return PermissionDecision(behavior=PermissionBehavior.ALLOW, message="Read-only search.")

    async def call(self, query: str) -> ToolChunk:
        results = await do_search(query)
        return ToolChunk(content=[TextBlock(text=results)])
```

## 组装 Toolkit

```python
from agentscope.tool import Toolkit, Bash, Read, Write, Edit

toolkit = Toolkit(tools=[Bash(), Read(), Write(), Edit()])
```

仅用 `tools` 构造时，这些工具进入始终激活的 `"basic"` 组；`mcps`、`skills_or_loaders`、`tool_groups` 用于扩展。

## 外部执行工具（人机协同入口）

设 `is_external_tool = True`、不实现 `call`。智能体调用时发出 `RequireExternalExecutionEvent` 并暂停，直到收到 `ExternalExecutionResultEvent`。

## 常见坑

1. **`FunctionTool` 默认 ASK**：包装的函数默认需要用户逐次确认，要自动放行请子类化 `ToolBase` 写自定义权限逻辑。
2. **忘了 `check_permissions`**：`ToolBase` 子类必须实现，否则无法通过权限系统。
3. **docstring 空洞**：`FunctionTool` 的描述直接来自 docstring，写得含糊 LLM 就不会正确调用。
