---
title: 困惑度（Perplexity）是什么？
category: AI八股文
difficulty: 入门
answer: 困惑度是语言模型预测能力的度量，等于序列交叉熵的指数（PPL = e^交叉熵），含义是「模型平均在每个位置面临多少个等可能的候选」。PPL 越低越好。
refs:
  - label: Perplexity 维基百科
    url: https://en.wikipedia.org/wiki/Perplexity
  - label: 交叉熵与困惑度
    url: https://huggingface.co/docs/transformers/perplexity
tags: ["Perplexity", "评测", "交叉熵"]
---

## 定义

对一个序列，语言模型的交叉熵为：

```
H = -(1/N) · Σ log P(w_i | w_<i)
```

困惑度就是它的指数：

```
PPL = e^H = e^(-(1/N)·Σ log P(w_i | w_<i))
```

## 直观含义

- 如果模型在每个位置都「四选一」且完全均匀（每个概率 1/4），交叉熵 = log 4，PPL = 4；
- 所以 PPL 可以理解为「模型平均要面对多少个等概率的候选」——候选越多、越犹豫，PPL 越高；
- PPL 越低，说明模型对语料的预测越有把握，语言建模能力越强。

## 注意事项

- **只在同一 tokenizer、同一数据集上可比**：不同分词方式或不同语料，PPL 不能直接比较；
- PPL 度量的是「语言建模能力」，不完全等价于「下游任务能力」——生成流畅但答非所问，PPL 也可能很低；
- 因此评测大模型还会结合 MMLU、GSM8K、HumanEval 等下游基准，而非只看 PPL。

## 面试加分点 / 追问方向

- 能推导 PPL 与交叉熵、负对数似然（NLL）的关系；
- 说清为什么 PPL 不能跨 tokenizer 比较（词表大小不同，均匀分布的基数不同）。
