---
title: 向量数据库怎么选型？Faiss、Milvus、Qdrant、pgvector 各自适合什么场景？
category: 工程系统
difficulty: 进阶
answer: 按数据规模、是否需分布式与持久化、标量过滤与高可用需求权衡：Faiss 是单机检索库，Milvus 是分布式向量数据库，Qdrant 擅长复杂过滤，pgvector 适合已有 PG 栈的中小规模。
refs:
  - label: Faiss 官方仓库
    url: https://github.com/facebookresearch/faiss
  - label: Milvus 文档
    url: https://milvus.io/docs/
  - label: pgvector
    url: https://github.com/pgvector/pgvector
tags: ["向量数据库", "选型", "Faiss", "Milvus", "pgvector"]
---

## 核心概念

向量数据库用于存储与检索高维向量，底层依赖 ANN 索引（HNSW / IVF / PQ）。选型题先要**区分「向量检索库」与「向量数据库」**：Faiss 只是检索库，没有 CRUD、持久化、分布式、过滤等能力；Milvus 则是完整的分布式向量数据库，底层甚至复用 Faiss/ 相关索引作为引擎。

## 关键要点 / 原理

1. **Faiss**：Meta 开源单机检索库，性能极致、原生支持 GPU，需自行封装持久化与分布式，适合原型与百万级场景；
2. **Milvus**：云原生分布式向量库，支持百亿级向量、水平扩展、分区与多副本高可用，适合大规模生产；
3. **Qdrant**：Rust 实现、性能强、支持丰富的元数据过滤（Payload Filtering），适合有复杂过滤的自托管生产；
4. **pgvector**：PostgreSQL 插件，复用已有关系库与事务，适合数据量中等、不想引入新组件、向量与业务数据同库；
5. **Chroma / Pinecone**：Chroma 轻量适合本地 Demo；Pinecone 全托管 SaaS，零运维适合快速上线。

## 延伸 / 追问方向

- 为什么常把 Faiss 比作「发动机」，Milvus 比作「整车」？它到底缺哪些数据库能力；
- 粗略阈值如何划分（百万级用 Faiss/pgvector，千万到亿级用 Milvus）；
- 已有 ES / PG 技术栈时如何融合向量检索；
- 选型之外还要关注索引类型、距离度量与 embedding 维度和检索端的一致性。

## 面试加分点

- 用「发动机 vs 整车」类比 Faiss 与完整向量库；
- 强调 embedding 模型必须与检索端一致，否则向量不在同一语义空间，相似度无意义。