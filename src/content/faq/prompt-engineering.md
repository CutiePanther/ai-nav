---
title: Prompt Engineering 有哪些核心技巧？
category: 大模型
difficulty: 入门
answer: 目标是让模型稳定输出符合预期的结果，核心技巧包括角色设定、few-shot 示例、思维链 CoT、结构化输出、约束与任务分解等。
refs:
  - label: OpenAI Prompt 工程指南
    url: https://platform.openai.com/docs/guides/prompt-engineering
  - label: 吴恩达提示词课程
    url: https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/
tags: ["Prompt", "CoT", "few-shot"]
---

## 核心目标

让模型**稳定、可复现**地输出符合预期的结果，而不是靠运气。

## 常用技巧

1. **角色设定**：明确身份与场景，如"你是一名资深算法工程师"；
2. **Few-shot 示例**：给 2~3 个输入输出范例，比长篇描述更有效；
3. **思维链 CoT**：要求"一步步思考"，显著提升推理类任务准确率；
4. **结构化输出**：指定 JSON / Markdown 等格式，便于程序解析；
5. **约束与负面示例**：明确"不要做什么"，缩小输出空间；
6. **任务分解**：把复杂任务拆成子步骤，逐个击破。

## 进阶手段

- **ReAct**：推理 + 行动交替，配合工具调用完成搜索、计算；
- **Self-Consistency**：多次采样取多数答案，提升推理稳定性；
- **System Prompt**：在系统层注入全局约束，与用户输入分离。

## 面试加分点

- Prompt 的本质是"缩小模型的搜索空间"，越具体越可控；
- 参数（temperature 等）与 prompt 要配合：事实性任务低温 + 确定性指令；
- 生产环境要防止 **Prompt 注入**（用户输入覆盖系统指令）。
