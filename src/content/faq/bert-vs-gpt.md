---
title: BERT 与 GPT 在架构和任务上有什么区别？
category: AI八股文
difficulty: 入门
answer: BERT 是双向 Transformer 编码器，用掩码语言模型（MLM）做理解类任务；GPT 是单向（因果）解码器，用自回归语言模型做生成类任务。
refs:
  - label: BERT 论文
    url: https://arxiv.org/abs/1810.04805
  - label: GPT 论文
    url: https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf
tags: ["BERT", "GPT", "Transformer"]
---

## 核心区别对比

| 维度 | BERT | GPT |
| --- | --- | --- |
| 架构 | Transformer 编码器（双向） | Transformer 解码器（单向/因果） |
| 注意力掩码 | 双向可见全部 token | 只能看到当前位置及之前（causal mask） |
| 预训练目标 | 掩码语言模型 MLM（预测被 mask 的词） | 自回归语言模型（预测下一个词） |
| 强项任务 | 分类、NER、问答等理解任务 | 生成、对话、代码补全 |
| 代表 | BERT、RoBERTa | GPT-2/3/4、ChatGPT |

## 为什么现在大模型几乎都是 GPT 式（decoder-only）？

- **生成能力强**：自回归天然适配生成任务，而生成是通用任务的基础；
- **训练更高效**：decoder-only 训练每个 token 时一次预测下一个词，监督信号密集；
- **Scaling 更友好**：实践表明 decoder-only 在超大参数规模下表现出更好的涌现能力；
- **prompting 友好**：单向模型配合 in-context learning 能做 few-shot，BERT 式双向模型在这点上不自然。

## 面试加分点 / 追问方向

- MLM 的 mask 比例（约 15%）、[MASK] 与真实词随机替换的细节（80/10/10）；
- BERT 的 [CLS] token 怎么用于分类任务；
- 为什么 BERT 不适合直接做生成（双向 + MLM 不是自回归）。
