---
title: softmax 与交叉熵搭配做分类损失有什么优势？如何保证数值稳定性？
category: 深度学习
difficulty: 进阶
answer: Softmax 把 logits 转为概率分布，交叉熵度量其与 one-hot 目标的距离并作为损失。二者相除相消的梯度形式简洁稳定；数值安全通过减最大值（log-sum-exp）实现。
refs:
  - label: CS231n 线性分类与 Softmax
    url: https://cs231n.github.io/linear-classify/
  - label: Thirty Years of Softmax（综述）
    url: https://arxiv.org/abs/2008.00738
tags: ["softmax", "交叉熵", "损失函数", "数值稳定"]
---

## 核心概念

对多分类，网络输出各类别 logits `z`，用 **Softmax** 转成概率 `p_i = e^{z_i}/Σe^{z_j}`，再用（负）**交叉熵**做损失：`L = -log(p_y)`（y 为真实类别）。预测越准损失越小。

## 为什么两者搭配效果好

- 交叉熵对错误类别的惩罚**随概率下降大致是线性的**（梯度 `∂L/∂z_i = p_i - y_i`），不会像 MSE 那样在 saturate 区梯度消失，收敛快；
- Softmax 天然输出合法的概率分布、可解释；
- 对 softmax 的梯度与传统回归的 MSE 不同，配合使用能让深层网络训练更稳定、学得更快。

## 数值稳定性

直接先算 `e^{z_i}` 在 `z_i` 很大时会**溢出**（inf/nan）。标准做法是**减去最大值**：

```
m = max(z);  p_i = e^{z_i - m} / Σ e^{z_j - m}
```

不影响结果（分子分母同除以 e^m），但把指数输入压到 ≤0 区间避免溢出。更稳健等价形式为 **log-sum-exp**：`L = -z_y + log(Σ e^{z_j - m}) + m`。

## 关键要点

- `z`（logits）与归一化的 logits 往往训练特性不同；
- 常与 label smoothing、温度缩放（temperature）结合控制过度自信与分布锐度；
- 大规模分类时 Softmax 是瓶颈，启发稀疏 softmax（如噪声对比估计 NCE、采样子集）等加速。

## 延伸 / 追问方向

- 手写 log-sum-exp 公式推导并说明为何不改变数学结果；
- softmax 与 sigmoid（二分类）的关系（sigmoid 是两类 softmax 特例）；
- label smoothing / 温度参数对 softmax 行为的影响。

## 面试加分点

- 能给出梯度简化式 `∂L/∂z = p - y`，展示对「softmax+CE 搭配让梯度简洁」的深入理解；
- 主动讲清减 max 的溢出差与 log-sum-exp 等价关系。