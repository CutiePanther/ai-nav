---
title: logits、softmax、temperature 之间是什么关系？
category: AI八股文
difficulty: 入门
answer: logits 是模型输出的原始分数；softmax 把 logits 转成概率分布；temperature 是 softmax 前的缩放参数——温度越低分布越尖锐（越贪婪），越高越平滑（越多样）。
refs:
  - label: 采样参数讲解
    url: https://huggingface.co/blog/how-to-generate
tags: ["logits", "softmax", "temperature"]
---

## 三者的关系

生成一个 token 的流程：

1. 模型输出 **logits**（每个候选词一个原始分数，可正可负）；
2. 除以 temperature T，再进 **softmax**：

```
p_i = e^(logit_i / T) / Σ e^(logit_j / T)
```

3. 按得到的概率分布采样（或取 argmax）。

## temperature 的作用

- T → 1：标准 softmax，保持模型原始分布；
- T → 0：分布趋近 one-hot，等价于贪婪解码（选概率最大的）；
- T → ∞：分布趋近均匀，输出随机化、多样性高；
- 所以 T 控制「确定性 vs 多样性」：越低越稳、越高越发散。

## 与 top-k / top-p 的关系

- **top-k**：只保留概率最高的 k 个候选，其余置 0；
- **top-p（nucleus）**：保留累计概率达到 p 的最小候选集合；
- 三者可组合：先用 temperature 调温度，再用 top-k/top-p 截断分布，最后采样。

## 面试加分点 / 追问方向

- 说清 temperature 改变的是「分布的尖锐程度」而非「直接选谁」；
- 为什么纯 argmax（贪婪）容易重复、质量差，需要引入采样。
