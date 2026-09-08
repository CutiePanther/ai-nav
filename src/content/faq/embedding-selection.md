---
title: 如何选择 Embedding 模型？怎么评测？
category: 工程系统
difficulty: 进阶
answer: 选型看语言、维度、检索任务与成本，用 MTEB 榜单做初筛，再在自有数据上测召回指标（Recall@K、MRR、NDCG）做最终决定。
refs:
  - label: MTEB 榜单
    url: https://huggingface.co/spaces/mteb/leaderboard
tags: ["Embedding", "选型", "评测"]
---

## 选型考虑因素

- **语言**：中英混合场景要用支持中文的模型（如 bge、text-embedding 系列）；
- **维度**：维度越高表达力越强，但存储与检索成本也越高；
- **任务**：检索、聚类、语义相似度的最优模型可能不同；
- **成本**：API embedding 按 token 计费，本地开源模型一次性成本。

## 评测方法

1. **通用榜单**：MTEB 覆盖多任务多语言，先做初筛；
2. **自有数据评测**：构造「query + 正样本 + 负样本」评测集，测：
   - **Recall@K**：前 K 个结果里召回正确文档的比例；
   - **MRR**：第一个正确结果的平均倒数排名；
   - **NDCG**：考虑排序质量的指标。

## 实践建议

- 通用 embedding 在垂直领域可能不够好，必要时做对比学习微调；
- 检索质量不仅看 embedding，还受 chunk 切分、混合检索、Rerank 影响，要整体调。

## 面试加分点 / 追问方向

- 为什么不能只看 MTEB（榜单与业务分布可能不一致，必须自建评测集验证）；
- 负样本质量对 embedding 训练/评测的关键影响。
