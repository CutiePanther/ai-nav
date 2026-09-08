---
title: LLM 应用的可观测性要关注哪些维度？
category: 工程系统
difficulty: 进阶
answer: LLM 可观测要覆盖质量、成本、延迟、安全四个维度，通过全链路 trace 记录输入输出、token、检索结果、工具调用，做评估与告警。
refs:
  - label: Langfuse 开源可观测
    url: https://langfuse.com
  - label: OpenTelemetry
    url: https://opentelemetry.io
tags: ["可观测性", "LLM 监控", "Langfuse"]
---

## 为什么传统监控不够

传统服务监控看延迟、错误率、资源就够了。但 LLM 应用是「非确定」的：输出质量参差不齐、成本按 token 波动、还可能有幻觉和安全风险，需要额外的观测维度。

## 四个维度

1. **质量**：答案是否忠实、是否相关（可用 RAGAS、LLM-as-a-Judge 打分）；
2. **成本**：每次调用的 token 消耗、按模型/用户/功能聚合的成本；
3. **延迟**：首字延迟（TTFT）、总延迟、各环节耗时（检索、生成）；
4. **安全**：越狱、敏感内容、数据泄露的检测与告警。

## 实现手段

- **全链路 Trace**：把一次请求的「检索 → prompt 组装 → 模型调用 → 后处理」串成一条 trace，记录每一步的输入输出和耗时；
- **评测回流**：定期抽样做质量评估，把 badcase 归类分析；
- 用 Langfuse、LangSmith 等工具，或基于 OpenTelemetry 自建。

## 面试加分点 / 追问方向

- 说清「监控（monitoring）」与「评测（evaluation）」的关系：监控看趋势，评测看质量，两者结合；
- 首字延迟 vs 总延迟分别影响什么体验。
