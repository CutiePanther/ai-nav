---
title: Bagging 和 Boosting 有什么区别？
category: 机器学习
difficulty: 进阶
answer: Bagging 并行训练相互独立的模型再投票/平均，主要降低方差防过拟合；Boosting 串行训练、后模型聚焦前模型错误，主要降低偏差提升拟合，但更易过拟合。
refs:
  - label: 随机森林论文
    url: https://link.springer.com/article/10.1023/A:1010933404324
  - label: XGBoost 论文
    url: https://arxiv.org/abs/1603.02754
tags: ["集成学习", "Bagging", "Boosting"]
---

## 核心对比

| 维度 | Bagging | Boosting |
| --- | --- | --- |
| 训练方式 | 并行、相互独立 | 串行、依赖前序 |
| 目标 | 降低方差、防过拟合 | 降低偏差、提升拟合 |
| 代表 | 随机森林 | GBDT、XGBoost、AdaBoost |
| 敏感性 | 稳定 | 对噪声敏感、可能过拟合 |

## 详细说明

- **Bagging**：对样本有放回抽样训练多个独立模型，最后投票/平均，各模型可并行；
- **Boosting**：串行训练，每个新模型聚焦前序模型预测错误的样本（调整权重或拟合残差），逐步提升。

## 实践选择

- 数据噪声小、追求极致精度 → Boosting；
- 追求稳定、防过拟合、可并行 → Bagging。

## 面试加分点

- 随机森林在 Bagging 基础上又引入"特征随机采样"，进一步降低模型间相关性；
- Boosting 易过拟合的原因是它不断拟合训练集残差。
