---
title: 向量检索中 ANN 与精确检索的区别？
category: 工程系统
difficulty: 进阶
answer: 精确检索（暴力扫描）召回率 100% 但耗时随数据量线性增长；ANN（近似最近邻，如 HNSW、IVF）通过索引结构牺牲少量召回换取对数级查询速度，是大规模向量库（Milvus、FAISS）的标准做法。核心权衡是召回率 vs 查询延迟与内存。
refs:
  - label: Milvus 索引说明
    url: https://milvus.io/docs/index.md
tags: ["向量检索", "ANN"]
---
