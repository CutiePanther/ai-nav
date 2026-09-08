---
title: Prefix-LM 与纯 Causal Decoder 的掩码有什么不同？
category: AI八股文
difficulty: 进阶
answer: 纯 Causal Decoder 整个序列都只能看到前文（下三角掩码）；Prefix-LM 把序列切成「前缀」与后续 token——前缀内部可双向 attend，前缀之后的 token 仍是因果单向。这样既能在长上下文/提示上利用双向表征，又保持端到端自回归生成。
refs:
  - label: UL2 统一预训练（含 Prefix-LM）
    url: https://arxiv.org/abs/2205.05131
  - label: 双向 LM 也能少样本推理
    url: https://arxiv.org/abs/2207.13586
tags: ["掩码", "Prefix-LM", "预训练目标"]
---

## 核心概念

三种典型 attention 形态：Encoder 的**双向**（全可见，BERT-style）、Decoder 的**纯因果**（下三角，GPT-style）、以及 **Prefix-LM / 前缀因果**——前 T 个「前缀」 token 彼此可见（前缀内部允许互相 attend），自第 T+1 个 token 起只能 attend 前缀与自己之前的 token。前缀因此能被后续任何一个 token 当作可回看的双向上下文读取。

## 关键要点 / 原理

- **掩码形状**：表现为「上三角为 -inf、但左上角 T×T 子块不屏蔽」的矩阵；相对纯下三角，多出前缀块内部的双向回看能力、整体仍是 causal。
- **训练动机**：为统一 span-corruption 去噪与完整 causal LM 目标；UL2 把 denoise、prefix、causal 三种掩码混合预训练，Prefix-LM 对应其中面向少样本/前缀上下文的形式。
- **实用性**：Baichuan（prefix decoder）等用「前缀侧双向理解 prompt、生成侧因果自回归」，兼顾表征与解码、又免去 Encoder-Decoder 的第二个编码器。
- **与交叉注意力差异**：Prefix-LM 不增加独立 encoder，而是同一自注意力里换一种掩码；与 T5 的「encoder 双向 + decoder 交叉」是不同路线。
- **推理成本**：仍单向前向、逐 token 生成，不引入额外注意力头开销。

## 追问方向

- 前缀长度如何选择 / 是否需要固定，才能既保持自回归又享受双向表征？
- Prefix-LM 与「把 prompt 直接塞进因果层」在长上下文理解上的能力差异。
- **面试加分点**：能复述 UL2 的 denoise / prefix / causal 三种掩码及其统一动机，落到「既想要双向理解、又要能自回归生成」的架构权衡。