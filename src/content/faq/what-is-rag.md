---
title: 什么是 RAG？它解决了什么问题？
category: 大模型
difficulty: 入门
answer: RAG（检索增强生成）在生成前先从外部知识库检索相关文档，再将其拼入提示词引导模型生成，从而缓解大模型幻觉、知识时效性差与私有知识缺失的问题。核心链路：文档切分 → 向量化入库 → 查询检索 → 拼接生成。
refs:
  - label: LangChain RAG 教程
    url: https://python.langchain.com/docs/tutorials/rag/
tags: ["RAG", "检索"]
---
