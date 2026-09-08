---
title: PCA 主成分分析的原理与用途？
category: 机器学习
difficulty: 进阶
answer: PCA 找到数据方差最大的几个正交方向（主成分），把高维数据投影到低维并尽量保留信息，用于降维去噪、可视化、加速与去冗余。
refs:
  - label: PCA 详解
    url: https://en.wikipedia.org/wiki/Principal_component_analysis
  - label: Scikit-learn PCA
    url: https://scikit-learn.org/stable/modules/decomposition.html#pca
tags: ["PCA", "降维", "特征值"]
---

## 原理

1. 数据中心化（减均值）；
2. 计算协方差矩阵；
3. 特征值分解（或 SVD）；
4. 取特征值最大的 k 个特征向量构成投影矩阵，把数据投影到低维空间。

## 用途

1. **降维去噪**：丢弃小特征值方向，去除噪声；
2. **可视化**：降到 2~3 维便于观察；
3. **去冗余、加速**：减少特征、节省存储、加速下游模型。

## 注意事项

- PCA 是**线性**方法，对尺度敏感，需先标准化；
- 主成分可解释性差；
- 对比 t-SNE/UMAP：PCA 保全局结构、确定性；t-SNE 保局部邻域、适合可视化。

## 面试加分点

- 如何选 k：看累计解释方差比（如保留 95% 方差）；
- 为什么用协方差矩阵的特征向量——主成分方向就是方差最大的方向。
