---
title: HNSW 为什么能高效做向量近似检索？
category: 工程系统
difficulty: 进阶
answer: HNSW 构建多层图，顶层稀疏快速定位、下层密集精细搜索，查询时从顶层贪心游走逐层向下，在 O(log N) 级别找到近似最近邻。
refs:
  - label: HNSW 论文
    url: https://arxiv.org/abs/1603.09320
  - label: Faiss 索引选择指南
    url: https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index
tags: ["HNSW", "ANN", "向量检索"]
---

## 核心结构

HNSW（Hierarchical Navigable Small World）是一种基于图的 ANN 索引，构建**多层图**：

- **顶层**：节点稀疏、跨度大，负责快速定位大致区域；
- **下层**：节点密集，负责精细搜索。

## 查询过程

从顶层入口点开始，逐层向下做"贪心游走"——每步移动到距离查询更近的邻居，直到无法再靠近，在 O(log N) 级别找到近似最近邻。

## 优势与代价

- **优势**：查询快、召回率高（参数可调）、支持增量插入，是向量库主流索引；
- **代价**：构建耗时、内存占用较高。

## 面试加分点

- 关键参数：M（每节点连接数）、efConstruction（构建时候选集）、efSearch（查询时候选集）；
- 适用于召回优先、实时查询的场景。
