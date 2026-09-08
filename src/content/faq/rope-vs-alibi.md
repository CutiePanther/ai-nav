---
title: RoPE 与 ALiBi 两种位置编码方案有什么区别？
category: AI八股文
difficulty: 高级
answer: RoPE 用旋转矩阵把位置编码进 q、k（乘法式）；ALiBi 直接在注意力分数上按相对距离加一个线性偏置（加法式）。ALiBi 更简单、外推天然好，但表达力弱于 RoPE。
refs:
  - label: RoPE 论文
    url: https://arxiv.org/abs/2104.09864
  - label: ALiBi 论文
    url: https://arxiv.org/abs/2108.12409
tags: ["RoPE", "ALiBi", "位置编码"]
---

## 两种思路对比

| 维度 | RoPE | ALiBi |
| --- | --- | --- |
| 方式 | 旋转 q、k（乘法） | 在 attention score 上加偏置（加法） |
| 编码信息 | 相对位置 | 相对距离 |
| 外推性 | 需要缩放技巧（NTK/YaRN） | 天然外推 |
| 表达力 | 更强 | 较弱 |
| 代表 | LLaMA、Qwen | BLOOM、MPT |

## ALiBi 的做法

在计算注意力分数时，给「距离越远的 token」扣一个线性递减的惩罚：

```
score = q·k^T - m·|i-j|
```

其中 m 是每头可学习的斜率。这样远处的 token 天然被「降权」，模型不需要额外的位置编码，外推时也自然平滑。

## 为什么 RoPE 更主流

- RoPE 通过旋转把位置信息融合进表示，表达力更强，实验效果普遍更好；
- ALiBi 虽然简单、外推好，但在复杂语言任务上的上限不如 RoPE；
- 主流开源模型（LLaMA 系）都用 RoPE，生态也围绕 RoPE 展开（各种外推技巧）。

## 面试加分点 / 追问方向

- 能说清「加法式 vs 乘法式」编码位置的本质区别；
- 外推能力：ALiBi 天然好，RoPE 需要额外技巧——这是两者最重要的实践差异。
