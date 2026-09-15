---
title: "消息与事件（Msg / AgentEvent）"
description: "消息与事件：Msg 与 AgentEvent 两套体系的分工、流式事件分发写法，以及多实体对话的组织方式。"
order: 5
category: AgentScope
tags: ["AgentScope", "消息", "事件"]
updated: 2026-09-15
---
## 概念

`Msg` 是智能体间统一的消息单元，`AgentEvent` 是 `reply_stream()` 产出的统一事件流。前端、日志、观测都消费同一套事件。

## 核心 API

| 方法 | 说明 |
|---|---|
| `reply(inputs, structured_schema)` | 跑完推理-行动循环，返回最终 `Msg`；可强制结构化输出 |
| `reply_stream(inputs, structured_schema, yield_final_msg)` | 同上，但逐个产出 `AgentEvent` |
| `observe(msgs)` | 只把消息加入上下文，不触发推理 |
| `compress_context(context_config, instructions)` | 上下文超阈值时压缩，可注入压缩指令 |

## 调用示例：流式事件分发

```python
from agentscope.event import EventType

async for event in agent.reply_stream(user_msg):
    match event.type:
        case EventType.TEXT_BLOCK_DELTA:   # 流式文本增量
            ...
        case EventType.TOOL_CALL_START:    # 即将调用工具
            ...
        case _:                            # 思考块 / 工具结果 / 回复结束等
            ...
```

## 多实体对话

多个命名实体的消息共享同一上下文，靠 `Msg.name` 区分说话者：

```python
from agentscope.message import UserMsg

msgs = [
    UserMsg(name="Alice", content="I vote for the beach."),
    UserMsg(name="Bob", content="I'd rather go hiking."),
    UserMsg(name="user", content="Friday, summarize everyone's preference."),
]
result = await agent.reply(msgs)
```

要让 LLM 看清谁在说话，必须换 `MultiAgentFormatter`（见模型章节），并在 system prompt 里声明智能体自己的名字。

## 常见坑

1. **默认 formatter 丢名字**：一对一没问题，群聊场景必须切 `XxxMultiAgentFormatter`。
2. **事件没消费完**：`reply_stream` 是异步生成器，中途 `break` 会中断循环。
3. **结构化输出忘了留余量**：`ReActConfig.structured_output_grace_iters` 控制结构化输出的宽限迭代数，默认 3。
