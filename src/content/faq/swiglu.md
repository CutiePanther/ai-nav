---
title: SwiGLU 激活函数是什么？为什么现代 LLM 用它？
category: AI八股文
difficulty: 进阶
answer: SwiGLU 是门控线性单元（GLU）的变体，用 Swish 做门控，公式为 Swish(xW) ⊙ (xV)，相比 ReLU/GELU 在同等参数量下表现更好，被 LLaMA 等现代模型广泛采用。
refs:
  - label: SwiGLU 论文（GLU Variants）
    url: https://arxiv.org/abs/2002.05202
  - label: LLaMA 论文
    url: https://arxiv.org/abs/2302.13971
tags: ["SwiGLU", "激活函数", "LLM"]
---

## 什么是 GLU

门控线性单元（Gated Linear Unit）的基本形式是「两个线性变换，一个做门控」：

```
GLU(x) = (xW) ⊙ σ(xV)
```

其中 σ 是门控激活（如 sigmoid），⊙ 是逐元素相乘。门控机制让网络能「选择性通过」信息。

## SwiGLU 是什么

把 GLU 里的门控函数从 sigmoid 换成 Swish（SiLU），就是 SwiGLU：

```
SwiGLU(x) = Swish(xW) ⊙ (xV)
```

其中 Swish(x) = x·σ(x)。Swish 本身平滑、非单调、有下界无上界，梯度特性好。

## 为什么现代 LLM 用它

- 在相同参数量/计算量下，GLU 家族（含 SwiGLU）比 ReLU/GELU 的 FFN 表现更好（PaLM、LLaMA 等验证）；
- 门控带来的「乘法交互」比单纯激活更有表达力；
- 实际工程中常配合把 FFN 中间层维度调小（如 8/3 d_model），在等参数量下换效果提升。

## 面试加分点 / 追问方向

- 能说清 GLU 家族：ReGLU、GeGLU、SwiGLU 的区别只是门控函数不同；
- Swish vs ReLU vs GELU 的曲线特性（是否平滑、是否单调、负区间行为）。
