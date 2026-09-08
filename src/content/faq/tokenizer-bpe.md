---
title: BPE 分词算法的原理是什么？
category: AI八股文
difficulty: 入门
answer: BPE 从字符级开始，迭代合并语料中出现频率最高的相邻 token 对，直到达到目标词表大小，兼顾词粒度（语义）与字符粒度（开放词汇）。
refs:
  - label: BPE 论文
    url: https://arxiv.org/abs/1508.07909
  - label: HuggingFace Tokenizer 教程
    url: https://huggingface.co/docs/transformers/tokenizer_summary
tags: ["BPE", "Tokenizer", "分词"]
---

## 为什么要 subword 分词

- **词粒度**：词表能表达语义，但遇到没见过的新词（OOV）就抓瞎，词表也爆炸；
- **字符粒度**：词表极小（几十个字符），但序列变长、语义丢失；
- **subword 折中**：把常见词保留成整体，罕见词拆成子词，兼顾语义与开放词汇。

## BPE 算法步骤

1. 把语料按字符切分，每个字符是一个 token；
2. 统计所有相邻 token 对的出现频率，找到最高频的一对；
3. 把这对合并成一个新 token，更新语料；
4. 重复 2-3，直到达到目标词表大小。

例如 "low"、"lower"、"lowest" 中，「l」+「o」高频出现，先合并成 "lo"，最终可能得到 "low"、"er"、"est" 这样的子词单元。

## 面试加分点 / 追问方向

- BPE 的变体：WordPiece（BERT，按「最大似然」而非「频率」合并）、Unigram（从大词表反向裁剪）；
- 中文 vs 英文：英文天然有空格分词，中文通常先按字/词切分再做 BPE；
- token 与成本的关系：分词方式直接影响 token 数，从而影响计费和上下文占用。
