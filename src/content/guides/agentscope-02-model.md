---
title: "模型与凭证（Model & Credential）"
description: "模型与凭证：DashScope / OpenAI / Ollama 三种接入写法、通用构造参数，以及换供应商时该改哪一处。"
order: 2
category: AgentScope
tags: ["AgentScope", "模型", "凭证"]
updated: 2026-09-15
---
## 概念

2.0 把「凭证」从模型类中拆出来，形成固定模式：`XxxChatModel(credential=XxxCredential(...), model="...")`。换供应商只换这一对，Agent 其余配置不动。

## 支持的提供商

| Provider | Model 类 | Credential 类 |
|---|---|---|
| OpenAI | `OpenAIChatModel` | `OpenAICredential` |
| OpenAI Responses API | `OpenAIResponseModel` | `OpenAICredential` |
| Anthropic | `AnthropicChatModel` | `AnthropicCredential` |
| DashScope | `DashScopeChatModel` | `DashScopeCredential` |
| DeepSeek | `DeepSeekChatModel` | `DeepSeekCredential` |
| Gemini | `GeminiChatModel` | `GeminiCredential` |
| Moonshot | `MoonshotChatModel` | `MoonshotCredential` |
| Volcengine | `VolcengineChatModel` | `VolcengineCredential` |
| xAI | `XAIChatModel` | `XAICredential` |
| Ollama | `OllamaChatModel` | `OllamaCredential` |

## 调用示例

```python
# DashScope
from agentscope.model import DashScopeChatModel
from agentscope.credential import DashScopeCredential

model = DashScopeChatModel(
    credential=DashScopeCredential(api_key="YOUR_API_KEY"),
    model="qwen-max",
)

# OpenAI
from agentscope.model import OpenAIChatModel
from agentscope.credential import OpenAICredential

model = OpenAIChatModel(
    credential=OpenAICredential(api_key="YOUR_API_KEY"),
    model="gpt-4o",
)

# Ollama 本地
from agentscope.model import OllamaChatModel
from agentscope.credential import OllamaCredential

model = OllamaChatModel(
    credential=OllamaCredential(host="http://localhost:11434"),
    model="qwen3:8b",
)
```

## 通用构造参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `credential` | `CredentialBase` | 提供商凭证 |
| `model` | `str` | 模型标识，如 `"qwen-plus"` |
| `parameters` | `Parameters \| None` | 提供商参数：`temperature`、`thinking_enable`、`parallel_tool_calls` |
| `stream` | `bool` | 是否流式。`True` 时 `__call__` 返回 `AsyncGenerator[ChatResponse, None]`，最后一个 chunk（`is_last=True`）携带完整累积内容 |
| `max_retries` | `int` | API 重试次数 |
| `context_size` | `int` | 用于上下文压缩计算的窗口大小 |
| `formatter` | `FormatterBase \| None` | 覆盖消息格式化器 |

## Formatter（格式化器）

Formatter 把内部 `Msg` 转成提供商 API 格式。默认 `ChatFormatter` 适合一对一对话（会丢弃发言者名字）；多实体对话（群聊、辩论、Agent 团队）要用 `XxxMultiAgentFormatter`，它把历史合并为带名字的转录文本。

```python
from agentscope.model import OpenAIChatModel
from agentscope.credential import OpenAICredential
from agentscope.formatter import OpenAIMultiAgentFormatter

model = OpenAIChatModel(
    credential=OpenAICredential(api_key="YOUR_API_KEY"),
    model="gpt-4o",
    formatter=OpenAIMultiAgentFormatter(),
)
```

| Provider | Chat（默认） | MultiAgent |
|---|---|---|
| DashScope | `DashScopeChatFormatter` | `DashScopeMultiAgentFormatter` |
| OpenAI | `OpenAIChatFormatter` | `OpenAIMultiAgentFormatter` |
| DeepSeek | `DeepSeekChatFormatter` | `DeepSeekMultiAgentFormatter` |
| Moonshot | `MoonshotChatFormatter` | `MoonshotMultiAgentFormatter` |
| Ollama | `OllamaChatFormatter` | `OllamaMultiAgentFormatter` |

## 自定义 OpenAI 兼容端点

自定义 Provider 的标准做法：继承 `CredentialBase`，在凭证中声明 `base_url` 字段，并实现 `get_chat_model_class()` 指向自己的模型类；模型类若兼容 OpenAI 格式可复用 `OpenAIChatFormatter`。

```python
from typing import Literal, Type, TYPE_CHECKING
from pydantic import ConfigDict, Field, SecretStr
from agentscope.credential import CredentialBase

if TYPE_CHECKING:
    from agentscope.model import ChatModelBase

class MyProviderCredential(CredentialBase):
    model_config = ConfigDict(title="My Provider API")
    type: Literal["my_provider_credential"] = "my_provider_credential"

    api_key: SecretStr = Field(description="API key for My Provider.")
    base_url: str = Field(default="https://api.myprovider.com/v1")

    @classmethod
    def get_chat_model_class(cls) -> Type["ChatModelBase"]:
        from .my_model import MyProviderChatModel
        return MyProviderChatModel
```

## 常见坑

1. **网关 / 自建 OpenAI 兼容服务的 `base_url` 挂载点**：优先检查对应 Credential 类是否直接接受 `base_url` 字段（用 `XxxCredential.model_fields` 自省），不接受就按上面的自定义 Provider 模式扩展。
2. **思考模型的 `reasoning_content`**：部分推理模型在响应中返回 `reasoning_content` 字段，AgentScope 默认 formatter 不一定识别，需实测或改用关闭思考的模型变体。
3. **多实体对话忘切 formatter**：默认 formatter 会让 LLM 分不清谁在说话。
