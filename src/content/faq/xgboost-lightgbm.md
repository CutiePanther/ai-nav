---
title: XGBoost 和 LightGBM 有什么特点与区别？
category: 机器学习
difficulty: 进阶
answer: XGBoost 用二阶泰勒展开+正则项求叶子最优解并支持列采样；LightGBM 用直方图分桶和 Leaf-wise 生长，内存更省、训练更快，但需限制最大深度防过拟合。
refs:
  - label: XGBoost 文档
    url: https://xgboost.readthedocs.io/en/stable/
  - label: LightGBM 官方文档
    url: https://lightgbm.readthedocs.io/en/stable/
tags: ["XGBoost", "LightGBM", "GBDT"]
---

## 核心思想

两者都是 GBDT 的工程化增强版：串行加树、拟合负梯度。XGBoost 更强调精度与正则，LightGBM 更强调训练速度与内存占用。

## XGBoost 的特点

- **二阶泰勒展开**：利用损失函数一阶、二阶导数做更多信息逼近，配正则项（叶子数 T、叶子权重 w）得到**叶子权重的闭式最优解**；
- **列采样 / 子采样**：类似随机森林增加随机性，抗过拟合；
- **内置缺失值处理**：训练时自动学习缺失样本走左/右子树的默认方向；
- 支持并行建直方图、weighted 分位数近似。

## LightGBM 的特点

- **直方图分桶（Histogram）**：把连续特征离散成有限桶，内存降约 8 倍、计算大幅减少；
- **Leaf-wise 生长**：每次只分裂增益最大的叶子（而非 XGB 的 level-wise），同精度往往更少迭代，但更容易过拟合，**需配合 max_depth/min_data 限制**；
- 原生支持类别特征、EFB 绑互斥特征进一步省内存。

## 面试加分点

- XGB 为什么比 GBDT 快/准（预排序→近似直方图、二阶+正则）；
- LightGBM 快在「直方图分桶 + Leaf-wise」两点，代价是过拟合风险。

## 追问方向

- XGBoost 如何给叶子权重求闭式解（对目标函数关于 w 求导）；
- leaf-wise vs level-wise 各自的过拟合差异。