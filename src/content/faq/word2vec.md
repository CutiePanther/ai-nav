---
title: word2vec 的原理是什么？CBOW 和 Skip-gram 有什么区别？
category: 机器学习
difficulty: 进阶
answer: word2vec 用浅层神经网络把词映射为稠密低维向量，通过「上下文预测中心词（CBOW）」或「中心词预测上下文（Skip-gram）」训练得到词向量，语义相近的词向量更接近。
refs:
  - label: word2vec 原始论文
    url: https://arxiv.org/abs/1301.3781
  - label: word2vec 说明
    url: https://arxiv.org/abs/1310.4546
tags: ["word2vec", "词向量", "自然语言处理"]
---

## 核心思想

word2vec 是**分布式词表示**：用无监督的浅层网络，根据一个词的邻居上下文学习它的稠密向量。训练出的词向量具有语义性质（`vec(king) - vec(man) + vec(woman) ≈ vec(queen)`）。

## 两种架构

- **CBOW**：用上下文词预测中心词，适合**小数据集**、对高频词效果好、训练快；
- **Skip-gram**：用中心词预测上下文词，适合**大数据集**、对低频词/稀有词更有效。

## 关键技巧

1. **负采样（Negative Sampling）**：只对少数「噪声词」做二分类，避免全词表 softmax 的高昂计算；
2. **层次 Softmax / 负采样**：是 word2vec 提高大规模训练效率的两大工程手段；
3. 词向量捕获的是**共现（分布）语义**，不包含词序/语法强先验。

## 面试加分点

- word2vec 与 TF-IDF 的区别（稠密 vs 稀疏、是否编码语义相似度）；
- 与后续 BERT 等预训练模型的关系（静态词向量 vs 上下文相关词向量）；
- 负采样为何用词频 3/4 次幂的采样分布。

## 延伸 / 追问

- OOV（词表外词）如何处理；
- word2vec 与 GloVe、FastText 的差异。