---
title: Token 是什么？如何估算一段文本的 Token 数？
category: 大模型
difficulty: 入门
answer: Token 是大模型处理文本的最小单位（单词/子词/字符）。英文约 1 token ≈ 0.75 个单词，中文约 1 token ≈ 1~1.5 个汉字。精确值需用对应模型的 tokenizer 计算。
refs:
  - label: OpenAI Tokenizer 工具
    url: https://platform.openai.com/tokenizer
  - label: tiktoken 库
    url: https://github.com/openai/tiktoken
tags: ["Token", "计费", "分词"]
---

## 什么是 Token

模型不能直接「读」字符串，要先分词（tokenize）成 token。Token 可以是单词、子词或字符，取决于分词器。比如 "unbelievable" 可能被拆成 "un"、"believable" 两个 token。

## 估算经验值

- **英文**：约 1 token ≈ 0.75 个单词（即 100 词 ≈ 75 token）；
- **中文**：约 1 token ≈ 1~1.5 个汉字（中文单个字常占 1 个或更多 token，取决于分词器）；
- 标点、空格、代码、特殊符号都会计入。

## 为什么重要

- **成本**：API 按 token 计费，输入 + 输出都算；
- **上下文窗口**：token 数不能超过模型上下文上限；
- **批处理**：估算 token 才能合理设置 batch size。

## 精确计算

用模型自带的 tokenizer：

```python
import tiktoken
enc = tiktoken.encoding_for_model("gpt-4")
print(len(enc.encode("你好，世界")))
```

## 面试加分点 / 追问方向

- 为什么中文通常比英文「更吃 token」（中文语料常按字切分，信息密度高但单字 token 多）；
- token 数会因模型/分词器不同而不同，跨模型不能直接比。
