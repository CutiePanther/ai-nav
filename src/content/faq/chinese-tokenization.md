---
title: 为什么 Qwen 比 GPT 更省中文 Token？大模型的中文分词如何优化？
category: 大模型
difficulty: 进阶
answer: 主因是词表与分词器设计：Qwen 用约 15 万词表的 Byte-level BPE，把更多常用中文词整体收进词表（中文每 token 约 1.5~1.8 字符），而 GPT 系列词表更偏英文、中文常被切碎成每字 1~2 token，导致中文更「贵」。
refs:
  - label: SentencePiece 论文 (Kudo & Richardson)
    url: https://arxiv.org/abs/1808.06226
tags: ["中文分词", "Tokenizer", "词表", "压缩率"]
---

## 核心概念

分词（Tokenization）决定一段文字会被切分成多少 token，直接影响输入长度、计费、上下文窗口利用率和效果。中文没有天然空格分隔，主流方案是 Byte-level BPE（BBPE，如 Qwen/DeepSeek 用 tiktoken）或 SentencePiece（Unigram，如 ChatGLM/Yi）。「中文比英文贵」是词表与分词偏好造成的事实差异。

## 关键要点 / 原理

- **为什么 Qwen 更省**：
  - Qwen 词表约 15 万、把「北京大学」等常用词直接做成整体 token（1 token 而非 4 个单字 token）；
  - GPT 词表约 5 万、更偏英文子词，中文汉字常在 UTF-8 字节层被切得更碎（1 汉字 ≈ 1~2 token）；
  - 中文响应的压缩率：Qwen ~1.5~1.8 字符/token，ChatGLM ~1.4，都显著高于 LLaMA 对中文的切法。
- **中文分词的优化方向**：
  - 词表引入高频中文词 & 常用 n-gram，让语义单元整块落地；
  - 用 SentencePiece 以整句为单元训练（支持中文不用预分词）；
  - 数字编码策略（single-digit 切法利于数学推理）；调大词表需权衡 embedding 参数开销与显存；
- **工程权衡**：词表越大中文越省 token、但 embedding 参数与显存越大；需结合具体语言的语料配比设计。

## 延伸 / 追问方向

- 字节级 BPE（BBPE）如何消除 OOV、为何对多语言（含中文）更鲁棒；
- 分词对下游能力的影响：为什么 GPT 数不对字母、token 切碎后会影响 RAG 关键字匹配；
- 面试加分点：能比较 BPE / WordPiece / SentencePiece / BBPE 的差异，以及词表大小与中文压缩率的权衡曲线。

## 面试加分点

落到部署与成本：中文场景选 Qwen 系模型不仅能省 token（省钱），还能让长上下文与上下文窗口利用率更好——这正是「为何中文业务主用 Qwen」的工程理由。