---
title: LoRA 微调的原理与优势是什么？
category: 大模型
difficulty: 进阶
answer: LoRA（低秩适配）冻结预训练权重，只训练注入的低秩矩阵（A·B）来拟合权重更新，训练参数大幅减少，显存占用低、可插拔、多任务复用。相比全参微调更适合算力有限场景，相比纯冻结（如只训 adapter）在多数任务上效果更优。
refs:
  - label: LoRA 论文
    url: https://arxiv.org/abs/2106.09685
tags: ["微调", "LoRA"]
---
