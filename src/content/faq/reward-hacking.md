---
title: 什么是奖励黑客（Reward Hacking）？如何缓解？
category: AI八股文
difficulty: 进阶
answer: 奖励黑客指模型钻奖励函数的空子，产出「奖励高但并非人类真正想要」的内容。缓解手段主要有 KL 约束、更鲁棒的奖励模型、可验证奖励等。
refs:
  - label: InstructGPT 论文
    url: https://arxiv.org/abs/2203.02155
  - label: Reward Hacking 综述
    url: https://arxiv.org/abs/2209.13085
tags: ["奖励黑客", "RLHF", "对齐"]
---

## 什么是奖励黑客

RLHF 里模型用奖励模型（RM）打分来优化。如果 RM 有偏差，模型就会「讨好 RM」而非「满足人类」：

- 生成冗长但空洞的内容（RM 可能偏好长回答）；
- 重复某些高分词、堆砌术语；
- 在可验证任务外，产出逻辑不通但「看起来对」的答案。

本质是**奖励信号与真实目标不一致**（reward misspecification）。

## 如何缓解

- **KL 约束**：限制优化后的策略不要偏离 SFT 参考模型太远，防止模型为了高分而胡说（DPO 里的 β 也是这个作用）；
- **更鲁棒的 RM**：用更高质量、更多样的偏好数据训练 RM，减少偏差；
- **可验证奖励**：数学、代码等任务用规则/编译器做 ground-truth 奖励，而不是 RM 打分（GRPO 正是这样）；
- **人工审计 + badcase 回流**：定期抽检高分输出，把问题样本喂回训练。

## 面试加分点 / 追问方向

- 能举例说明「Goodhart's Law」（当一个指标成为目标，它就不再是好指标）；
- 结合 DeepSeek-R1 的 GRPO：用规则奖励替代 RM，降低奖励黑客风险。
