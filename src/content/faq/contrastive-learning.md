---
title: 对比学习（Contrastive Learning）的原理是什么？在大模型里用在哪？
category: 大模型
difficulty: 进阶
answer: 对比学习通过拉近正样本对、推开负样本对来学习判别式表征，核心在 InfoNCE 目标。它在 embedding/文本表征、多模态对齐（如 CLIP）以及无监督预训练中都是主流范式。
refs:
  - label: A Simple Framework for Contrastive Learning (SimCLR)
    url: https://arxiv.org/abs/2002.05709
tags: ["对比学习", "表征学习", "InfoNCE"]
---

## 核心概念

对比学习（Contrastive Learning，如 SimCLR）的核心思想：对同一样本做不同增广得到正样本对，把 batch 里其他样本当作负样本，训练模型让**正样本对在表征空间里距离更近、负样本对距离更远**。这样既不依赖人工标签，也能学到对「关键语义」敏感的判别式特征。

## 关键要点 / 原理

- **InfoNCE loss**：`L = -log[ exp(sim(q,k+)/τ) / Σ exp(sim(q,k)/τ) ]`，本质是「在多候选里找出正样本」的 softmax 多分类，后面的相似度分布；温度 τ 控制对比强度；
- **负样本是关键**：负样本数量与质量直接决定表征质量。「batch 内互为负样本」是常见近似，困难负样本（相似样本）能逼模型学到更细粒度差异；
- **在大模型里的应用**：
  - **Embedding / 检索模型**：训练文本 embedding 时用 InfoNCE 学「相关文档—查询」拉近，接在向量库 + RAG 前；
  - **多模态对齐**：CLIP 用图像—文本对比对学习共享嵌入空间，是 VLM 的基础；
  - **蒸馏 / 训练稳定**：对比与自监督预训练结合时能强化表征。
- **局限**：对 batch size 与负样本质量敏感，偶发「崩坏」（表征退化成聚类）需要靠 stop-gradient、预测头等缓解。

## 延伸 / 追问方向

- SimCLR、MoCo、SimSiam 在正负样本与避免崩溃上的设计差异；
- 为什么 InfoNCE 里的温度 τ 会影响「难度」，τ 太小模型易崩塌；
- 面试加分点：能说明对比学习在 embedding 模型（如 BGE/SimCSE）训练中的具体 loss 写法与负样本挖掘（hard negative）策略。

## 面试加分点

落到 RAG 场景：高质量 embedding 往往就是对比学习 + hard negative 挖掘训出来的，能体现你对「检索召回」工程的理解深度。