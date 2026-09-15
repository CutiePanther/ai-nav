---
title: "RAG（检索增强生成）"
description: "RAG 全流程：解析 → 切片 → 入库三步、检索与文档管理、metadata_filter 多租户隔离、RAGMiddleware 两种模式与 Rerank。"
order: 7
category: AgentScope
tags: ["AgentScope", "RAG", "向量检索"]
updated: 2026-09-15
---
## 概念

RAG 由五个**可独立替换**的模块组成：

| 模块 | 职责 | 默认实现 |
|---|---|---|
| Parser | 原始文件 → `Section` 列表（PDF 页 / PPT 页 / Markdown 标题块等自然边界） | `TextParser`、`PDFParser`、`PPTParser`、`WordParser`、`ExcelParser`、`ImageParser` |
| Chunker | `Section` → 最终 `Chunk`（不跨 Section 合并） | `ApproxTokenChunker` |
| Embedding Model | 文本/多模态内容向量化 | 各提供商 embedding 类（`agentscope.embedding`） |
| Vector Store | 向量存储与检索 | `QdrantStore`、`MilvusLiteStore`、`MongoDBStore`、`ElasticsearchStore` |
| KnowledgeBase | 一站式句柄：绑定后三者，暴露四个操作 | `KnowledgeBase` |

解析依赖：`pip install agentscope[rag]`；向量库各自有 extra：`agentscope[vdb-qdrant]`、`[vdb-milvus]`、`[vdb-mongodb]`、`[vdb-elasticsearch]`。

**平台提示：`milvus-lite` 没有 Windows wheel（仅 macOS / manylinux）。Windows 本地落盘选 `QdrantStore(path=...)`。**

## 索引三步：解析 → 切片 → 入库

```python
from agentscope.rag import TextParser, ApproxTokenChunker, KnowledgeBase, QdrantStore
from agentscope.embedding import DashScopeEmbeddingModel
from agentscope.credential import DashScopeCredential

# 1) 解析（str 传路径自动读盘；bytes 直接是内容）
sections = await TextParser().parse(file="./cats.md", filename="cats.md")

# 2) 切片
chunker = ApproxTokenChunker(
    parameters=ApproxTokenChunker.Parameters(chunk_size=256, overlap=32),
)
chunks = await chunker.chunk(sections)

# 3) 入库（向量化由句柄代劳）
embedding_model = DashScopeEmbeddingModel(
    credential=DashScopeCredential(api_key="YOUR_API_KEY"),
    model="text-embedding-v4",
    dimensions=1024,
)
store = QdrantStore(location=":memory:")     # 或 path="./data/qdrant" 本地落盘 / url= 远程

async with store:                            # store 是异步上下文管理器
    knowledge = KnowledgeBase(
        name="demo-kb",
        description="A toy corpus.",
        embedding_model=embedding_model,
        vector_store=store,
        collection="demo-kb",
    )
    document_id = await knowledge.insert_document(
        chunks, document_metadata={"filename": "cats.md"},
    )
```

## 检索与文档管理

```python
async with store:
    results = await knowledge.search(queries=["When do cats sleep?"], top_k=3)
    for r in results:
        print(r.score, r.document_id, r.chunk.content)

    summaries = await knowledge.list_documents()      # DocumentSummary 列表
    await knowledge.delete_document(document_id)      # 按文档整体删除
```

`search` 内部：丢弃不可用查询 → 批量向量化 → 并发检索 → 按 `(document_id, chunk_index)` 去重 → 排序截断 `top_k`。分数越高越匹配；距离型度量（如 L2）分数为负，`score_threshold` 也要为负。

## 多租户隔离：metadata_filter

```python
knowledge = KnowledgeBase(
    name="tenant-a-kb",
    description="...",
    embedding_model=embedding_model,
    vector_store=store,
    collection="shared",
    metadata_filter={"tenant_id": "tenant-a"},   # 查询强制过滤；写入强制打标
)
```

## 挂到智能体：RAGMiddleware

| 模式 | 触发 | 检索词 | 注入方式 |
|---|---|---|---|
| `"static"` | 每轮回复的第一个推理步前 | 用户输入原文 | 检索结果包成 `HintBlock` 注入上下文 |
| `"agentic"`（默认） | 模型自主调用检索工具 | 模型决定 | 暴露 `search_knowledge` 工具 |

```python
from agentscope.middleware import RAGMiddleware
from agentscope.tool import Toolkit

agentic_mw = RAGMiddleware(
    knowledge_bases=[knowledge],
    parameters=RAGMiddleware.Parameters(mode="agentic", top_k=3),
)

# agentic 模式必须手动把检索工具挂进 Toolkit
toolkit = Toolkit(tools=await agentic_mw.list_tools())

agent = Agent(
    name="agentic-agent",
    system_prompt="When necessary, call the search_knowledge tool to look up material.",
    model=chat_model,
    toolkit=toolkit,
    middlewares=[agentic_mw],
)
```

两个模式可以叠加（static 给第一轮兜底 + agentic 按需深挖）：挂两个不同 mode 的实例即可。

## 重排（Rerank）

```python
rag_mw = RAGMiddleware(
    knowledge_bases=[knowledge],
    rerank_model=chat_model,               # 用一个对话模型做重排
    parameters=RAGMiddleware.Parameters(
        mode="agentic", top_k=3, rerank_candidate_k=10,
    ),
)
```

`rerank_candidate_k` 必须 ≥ `top_k`，默认 2 倍、上限 50；重排失败只降级不中断；每检索一次多一次 LLM 调用，成本与候选长度成正比。

## 常见坑

1. **忘开 store 上下文**：`KnowledgeBase` 不负责连接生命周期，`VectorStoreBase` 要 `async with`。
2. **agentic 模式没挂工具**：`await mw.list_tools()` 的结果必须进 `Toolkit`，否则模型永远检索不了。
3. **阈值正负号搞反**：距离型度量的分数和阈值都是负数。
4. **Windows 上装 milvus-lite**：没有 Windows wheel，本地模式改用 Qdrant。
