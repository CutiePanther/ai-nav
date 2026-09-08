---
title: 如何评估一个大模型的能力？
category: 大模型
difficulty: 高级
answer: 评估分通用能力、对齐安全、指令遵循、垂直任务与工程指标多层，常用 MMLU、GSM8K、HumanEval、MT-Bench 等基准，并警惕数据污染。
refs:
  - label: Open LLM Leaderboard
    url: https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard
  - label: MT-Bench 论文
    url: https://arxiv.org/abs/2306.05685
tags: ["评估", "Benchmark", "MMLU"]
---

## 分层评估体系

| 层次 | 代表基准 | 考察点 |
| --- | --- | --- |
| 通用知识 | MMLU、C-Eval | 多学科知识 |
| 推理与数学 | GSM8K、MATH | 数学、逻辑 |
| 代码能力 | HumanEval、MBPP | 代码生成 |
| 指令遵循 | MT-Bench、AlpacaEval | 对话质量（LLM-as-a-Judge） |
| 对齐与安全 | TruthfulQA | 真实性、无害性 |

## 垂直与工程评估

- **RAG 场景**：答案忠实度、引用是否命中；
- **Agent 场景**：工具调用成功率、任务完成率；
- **工程指标**：吞吐、首字延迟（TTFT）、单 token 延迟（TPOT）、成本。

## 关键坑点

- **数据污染**：评测集泄露进训练数据，导致分数虚高；
- **刷分 vs 真实能力**：公开榜分数高不代表业务场景好用。

## 面试加分点

- 最佳实践是**结合真实业务做自定义评测集 + 人工抽检**；
- LLM-as-a-Judge 需注意裁判模型自身的偏差与位置偏置。
