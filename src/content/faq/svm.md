---
title: SVM 的核技巧（Kernel Trick）是什么？
category: 机器学习
difficulty: 高级
answer: 核技巧把样本隐式映射到高维空间使其线性可分，但不显式计算高维坐标，而是通过核函数直接算内积，既获高维表达能力又避免维度灾难。
refs:
  - label: SVM 核技巧讲解
    url: https://en.wikipedia.org/wiki/Kernel_method
  - label: Scikit-learn SVM 文档
    url: https://scikit-learn.org/stable/modules/svm.html
tags: ["SVM", "核技巧", "分类"]
---

## 核心思想

SVM 找最大化间隔的超平面分割数据。当数据线性不可分时，把样本**隐式映射**到高维空间，在高维中变得线性可分。

## 核技巧的关键

**不显式计算高维坐标**，而是通过核函数直接算内积：

```text
K(x, z) = ⟨φ(x), φ(z)⟩
```

这样既获得高维表达能力，又避免"维度灾难"的计算开销。

## 常用核函数

- **线性核**：原空间（数据已线性可分）；
- **多项式核**；
- **RBF / 高斯核**：映射到无穷维，最常用；
- **Sigmoid 核**。

## 面试加分点

- 核函数选择与超参数（RBF 的 γ、惩罚 C）对效果影响大；
- 对大规模数据训练慢，是 SVM 的短板；
- 会追问"为什么 RBF 能映射到无穷维"——高斯核的泰勒展开。
