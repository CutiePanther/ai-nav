---
title: SGD、Momentum、AdaGrad、RMSProp、Adam 等优化器各有什么特点？
category: 深度学习
difficulty: 高级
answer: SGD 简单但收敛慢、摇摆；Momentum 沿惯性加速冲过局部波动；AdaGrad 按参数历史累计平方自适应学习率但会单调衰减；RMSProp 用指数滑动平均替代累计解决衰减；Adam 融合动量与 RMSProp，是默认首选但有偏差校正与极端学习率问题。
refs:
  - label: "Adam: A Method for Stochastic Optimization"
    url: https://arxiv.org/abs/1412.6980
  - label: RMSProp 背景（Hinton Course Notes）
    url: https://www.cs.toronto.edu/~tijmen/csc321/slides/lecture_slides_lec6.pdf
tags: ["优化器", "SGD", "Adam", "学习率"]
---

## 核心概念

优化器决定「如何用算出的梯度更新参数」。从固定学习率的 SGD，到逐参数自适应学习率的一族方法，核心演进是：**引入动量 + 依据历史梯度调整各参数步长**。

## 各优化器特点

- **SGD**：`θ = θ - η·g`，简单、鲁棒、内存占用小，但收敛慢、在病态条件数路径上来回震荡，学习率难调；
- **Momentum**：累计历史梯度方向 `v = βv + η·g`，沿惯性加速冲过谷底，减少震荡并加速收敛；Nesterov 在其基础上「前瞻半步」；
- **AdaGrad**：`θ = θ - η/√G·g`，对历史平方梯度累加，让更新频繁的参数步长变小（稀疏数据有利），但累加无界 → 学习率**单调递减到 0**，训练后期停滞；
- **RMSProp**：用指数移动平均 `E[g²] = β·E[g²]+(1-β)g²` 替代 AdaGrad 的累加，解决了学习率单调衰减问题；
- **Adam**：同时维护一阶矩（动量）与二阶矩，并做**偏差校正**，一般不用调学习率就能收敛快，是当前最常用默认优化器；缺点是极端情况下二阶矩过大导致学习率骤降，且理论收敛性在部分问题上有局限。

## 关键要点

- 梯度「平方」做的是**逐参数缩放**：梯度大的维度步长小，梯度小的维度步长大；
- AdaGrad → RMSProp → Adam 是一条清晰的演进主线，面试常考对比；
- 实际工程常配权重衰减（weight decay，AdamW 将其分离实现）与学习率调度。

## 延伸 / 追问方向

- 推导 SGD 与 Adam 更新公式差异、Adam 的偏差校正为什么必要；
- 大 batch 场景为什么常回退到 SGD/Momentum 配学习率扫描；
- AdamW 与 Adam 在权重衰减处理上的区别。

## 面试加分点

- 能画出从 SGD 到 Adam 的演进动机链并说明各自解决什么问题；
- 结合调参经验谈何时选 SGD、何时选 Adam（如 batch 大、稀疏、稳定性）。