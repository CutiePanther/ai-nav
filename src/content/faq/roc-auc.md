---
title: ROC 曲线怎么画？AUC 到底在衡量什么、如何计算？
category: 机器学习
difficulty: 进阶
answer: ROC 曲线以 FPR 为 x 轴、TPR 为 y 轴，随分类阈值变化而画出的曲线；AUC 是该曲线下面积，统计上等于「随机给一个正样本一个负样本，正样本得分排到负样本前面的概率」。
refs:
  - label: ROC 与 AUC 详解
    url: https://en.wikipedia.org/wiki/Receiver_operating_characteristic
  - label: Scikit-learn 分类指标
    url: https://scikit-learn.org/stable/modules/model_evaluation.html#roc-metrics
tags: ["ROC", "AUC", "模型评估"]
---

## 核心概念

模型输出的是得分/概率，ROC 曲线描绘**在所有可能的分类阈值**下 TPR 与 FPR 的权衡曲线：
- **TPR（召回率）= TP/(TP+FN)**；
- **FPR = FP/(FP+TN)**，即负样本被误判为正的比例。

阈值从 0 调到 1，每个点对应一对 (FPR, TPR)，连接起来就是 ROC 曲线。

## AUC 的统计含义与计算

- **含义**：随机取一个正样本、一个负样本，模型把正样本得分排到负样本**前面**的概率；
- **等价计算**：与 **Mann-Whitney U 统计量**一致——遍历所有正负样本对，统计「正>负 得分」的比例，无需依赖具体阈值；
- **数值解读**：AUC=0.5 等于瞎猜（曲线=对角线），=1.0 为完美排序；类别不平衡时也比准确率更可靠。

## 关键要点

1. ROC/AUC 是**排序/区分能力**指标，不依赖阈值，适用于输出分数的模型；
2. 正负样本比例变化时 ROC 曲线基本稳定，适合类别不平衡场景。

## 追问方向

- 为什么类别极度不平衡时更推荐 **P-R 曲线**（精确率-召回率）而不是 ROC；
- 用手算小例子演示 AUC（枚举正负样本对数大于关系的占比）。