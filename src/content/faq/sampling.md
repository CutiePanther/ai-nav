---
title: temperature、top-p、top-k 采样参数有什么区别？
category: 大模型
difficulty: 入门
answer: 三者都控制生成随机性：temperature 缩放 logits 改变分布平滑度，top-k 只从概率最高的 k 个 token 采样，top-p 从累计概率达 p 的最小集合中采样。
refs:
  - label: OpenAI 文本生成参数说明
    url: https://platform.openai.com/docs/guides/text-generation
  - label: 采样策略详解
    url: https://huggingface.co/blog/how-to-generate
tags: ["采样", "解码", "temperature"]
---

## 三者的作用位置

三者都作用在模型输出的概率分布上，用于从候选 token 中"选词"，控制随机性：

- **temperature（温度）**：先对 logits 除以温度再 softmax，改变分布形状；
- **top-k**：只在概率最高的 k 个 token 里采样，硬截断长尾；
- **top-p（核采样）**：从累计概率刚超过 p 的最小 token 集合里采样，动态截断。

## 详细对比

| 参数 | 机制 | 特点 |
| --- | --- | --- |
| temperature | 缩放 logits | 高=多样，低=确定；影响全局分布 |
| top-k | 固定取前 k | 简单，但 k 难选，长短尾不适配 |
| top-p | 动态累计截断 | 自适应，更符合直觉 |

- **temperature 高** → 分布平滑 → 输出多样、有创造性；
- **temperature 低** → 分布尖锐 → 趋近贪心、输出稳定；
- **top-k 小 / top-p 小** → 采样空间收窄，降低尾部噪声。

## 工程实践

- **事实性 / 代码任务**：低温（0~0.3）+ 小 top-p（0.8~0.9）；
- **创意写作**：高温（0.7~1.0），可放宽 top-p；
- 一般先调 temperature，再用 top-p 抑制尾部噪声；三者可组合使用。
