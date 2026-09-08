---
title: 向量检索中 ANN 与精确检索的区别？
category: 工程系统
difficulty: 进阶
answer: 精确检索暴力扫描召回 100% 但耗时随数据量线性增长；ANN 通过索引结构牺牲少量召回换对数级查询速度，是大规模向量库的标准做法。
refs:
  - label: Milvus 索引说明
    url: https://milvus.io/docs/index.md
  - label: Faiss 索引选择指南
    url: https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index
tags: ["向量检索", "ANN"]
---

## 精确检索 vs ANN

| 维度 | 精确检索 | ANN（近似最近邻） |
| --- | --- | --- |
| 召回率 | 100% | 略低于 100% |
| 耗时 | 随数据量线性增长 | 对数级 |
| 内存 | 高（存全量向量） | 视索引而定 |
| 适用 | 小规模 | 大规模 |

## 为什么用 ANN

- 数据量一大，暴力扫描无法实时响应；
- ANN 通过索引结构（HNSW、IVF 等）**牺牲少量召回换取查询速度**，是 Milvus、FAISS 等向量库的标准做法。

## 核心权衡

**召回率 vs 查询延迟与内存**：调索引参数（如 HNSW 的 M、efSearch，IVF 的 nlist、nprobe）可在两者间平衡。

## 面试加分点

- 常见索引：HNSW（图）、IVF（聚类倒排）、PQ（乘积量化）；
- 常配合 Rerank 重排，用 ANN 粗筛 + 精排提升召回。
