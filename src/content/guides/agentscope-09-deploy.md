---
title: "服务化部署（Agent Service）与生态"
description: "服务化部署：从自己的代码起服务、六步标准调用链、调度与渠道对接，以及仓库自带示例和终端调试台。"
order: 9
category: AgentScope
tags: ["AgentScope", "部署", "服务化"]
updated: 2026-09-15
---
## 概念

Agent Service 是 FastAPI 承载层，把 Agent 变成**多租户、多会话**的 HTTP 服务。它管的是 Agent 周围的一切：路由、会话状态、持久化、调度、工具卸载。资源模型七类：User / Credential / Agent / Workspace / Session / Schedule / MessageBus。

## 调用示例：从自己的代码起服务

```python
import uvicorn
from agentscope.app import create_app
from agentscope.app.storage import RedisStorage
from agentscope.app.message_bus import RedisMessageBus
from agentscope.app.workspace_manager import LocalWorkspaceManager

storage = RedisStorage(host="localhost", port=6379)
message_bus = RedisMessageBus(host="localhost", port=6379)

workspace_manager = LocalWorkspaceManager(
    basedir="/data/workspaces",
    ttl=3600.0,     # 空闲 workspace 回收时间
)

app = create_app(
    storage=storage,
    message_bus=message_bus,
    workspace_manager=workspace_manager,
    # knowledge_base_manager=...,  # 传入后启用 /knowledge_bases 全套 RAG 接口
)

uvicorn.run(app, host="0.0.0.0", port=8000)
```

沙箱可换：`DockerWorkspaceManager`（本地容器隔离）、`E2BWorkspaceManager`（云端沙箱，需 `E2B_API_KEY`）。

## 标准调用链

```bash
# 1. 建凭证（先 GET /credential/schemas 拿表单结构）
POST /credential
# 2. 建 agent（名称 + system prompt + 运行配置）
POST /agent
# 3. 建会话并绑定模型配置
POST /sessions
# 4. 触发对话（立即返回，事件走 SSE）
curl -X POST http://localhost:8000/chat \
  -H "X-User-ID: alice" -H "Content-Type: application/json" \
  -d '{"agent_id":"...","session_id":"...","input":{"name":"alice","role":"user","content":[{"type":"text","text":"Hello"}]}}'
# 5. 订阅事件流（可重连，晚加入会先重放缓冲历史）
curl -N -H "X-User-ID: alice" "http://localhost:8000/sessions/{id}/stream?agent_id=..."
# 6. 中断运行中 / HITL 挂起的会话
POST /sessions/{id}/interrupt
```

## 调度与渠道

- **Schedule**：cron 表达式定时触发智能体，会话可无状态（每次新开）或有状态（上下文累积）；持久化，重启后恢复。多副本部署时 `enable_scheduler=True` 只能一个进程持有。
- **Channel**：接入飞书（Lark）、钉钉、Discord 或自定义 IM；`enable_channel_worker` 控制长连接归属。
- **知识库服务**：`knowledge_base_manager` 传入后获得文档上传、切片索引、自然语言检索全套接口。
- **后台任务卸载**：长工具调用转后台，结果经消息总线回来并唤醒会话。

## 仓库自带示例（最快体验路径）

```bash
git clone https://github.com/agentscope-ai/agentscope.git
cd agentscope/examples/agent_service && python main.py     # 后端 :8000，需本地 Redis :6379
cd agentscope/examples/web_ui && pnpm install && pnpm dev  # 前端 :5173
```

## 终端调试台

```python
from agentscope.console import launch_console

await launch_console(agent)   # 终端聊天：流式输出、工具确认、Ctrl+C 中断全托管
```

## 生态要点

- **A2A 协议**：`A2AAgent` 可与任意远程 A2A 智能体对话
- **观测**：内置 OTel 支持；AgentScope Studio 提供 token 用量可视化与追踪
- **多智能体**：Pipeline（固定逻辑编排多个 Agent 共享事件流）、Agent Team（leader 生成 worker 并用内置团队工具协调）
- **实时语音**：`RealtimeAgent` 支持 DashScope / OpenAI / Gemini / xAI 的语音 API
- **认证**：服务不含用户系统，`get_current_user_id` 依赖可替换为 JWT / OAuth 等

## 常见坑

1. **没有 Redis 起不来**：示例默认 `localhost:6379`，本机没装就用 Docker 起 `redis:7-alpine`。
2. **多副本重复触发**：APScheduler jobstore 在内存里，持定时器的进程只能有一个。
3. **以为有自带登录**：没有，必须自己接认证中间件。
