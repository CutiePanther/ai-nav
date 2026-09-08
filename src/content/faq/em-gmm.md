---
title: EM 算法的思想和步骤是什么？与 GMM 有什么关系？
category: 机器学习
difficulty: 高级
answer: EM（期望最大化）在含隐变量的模型里交替执行 E 步（根据当前参数计算隐变量的期望）和 M 步（最大化期望下的似然更新参数），反复迭代保证似然单调不降，用于处理缺失数据与潜在类别。
refs:
  - label: EM 算法维基百科
    url: https://en.wikipedia.org/wiki/Expectation%E2%80%93maximization_algorithm
  - label: Scikit-learn 高斯混合模型
    url: https://scikit-learn.org/stable/modules/mixture.html
tags: ["EM算法", "GMM", "概率模型"]
---

## 核心思想

当模型存在**隐变量（latent variable）**（如 K-Means 中样本属于哪个簇、GMM 中样本来自哪个高斯分量）难以直接最大似然估计时，EM 用迭代逼近最优参数：先猜参数→算隐变量期望→再更新参数。

## EM 步骤

1. **E 步（Expectation）**：固定当前参数 θ，计算每个样本在各隐状态下的责任（后验概率/期望）；
2. **M 步（Maximization）**：固定责任，最大化对数似然的期望，更新参数 θ；
3. 重复 E/M 直到参数或似然收敛。**每次迭代似然单调不减**，但可能停在局部最优。

## 与 GMM 的关系

- **GMM（高斯混合模型）**是 EM 的典型应用：K 个高斯分量加权混合，每个样本「属于哪个分量」即隐变量；
- E 步算后验责任，M 步用责任加权更新每个分量的均值/协方差/权重；
- 相比 K-Means，GMM 能处理**非球形簇**并给出软归属（概率）。

## 面试加分点

- EM 与 K-Means 的关系（K-Means 可看作 EM 的特例/硬版本，责任退化为最近簇）；
- EM 为什么收敛到局部最优、如何缓建（多次随机初始化）；
- EM 与变分推断（VI）的区别：EM 求点估计，VI 求后验分布的近似。