---
title: KV Cache 的显存怎么估算？
category: AI八股文
difficulty: 进阶
answer: KV Cache 显存 ≈ 2 × 层数 × 序列长度 × 头数(或组数) × 头维度 × 精度字节数。用 GQA/MQA、量化或 PagedAttention 都能显著降低它。
refs:
  - label: KV Cache 讲解
    url: https://huggingface.co/blog/llama2
tags: ["KV Cache", "显存", "推理"]
---

## 计算公式

对每层，K 和 V 各占一份缓存，所以：

```
KV Cache = 2 × num_layers × seq_len × num_kv_heads × head_dim × bytes_per_element
```

- 2 是因为 K、V 两份；
- num_kv_heads：标准 MHA 是头数 h；GQA/MQA 会小很多；
- bytes_per_element：FP16 是 2 字节，FP32 是 4 字节。

## 举例

以 LLaMA-2 7B（32 层、hidden 4096）为例：若用 MHA 32 头、head_dim 128、FP16、序列长 2048：

```
2 × 32 × 2048 × 32 × 128 × 2 ≈ 8.6 GB
```

可见长序列下 KV Cache 可能比模型权重本身（7B × 2 字节 ≈ 14GB）还占显存。

## 如何降低

- **GQA/MQA**：减少 KV 头数；
- **量化 KV Cache**：KV 用 8bit/4bit 存；
- **PagedAttention**：消除碎片、提高利用率；
- **滑动窗口/稀疏**：只缓存最近 window 的 KV。

## 面试加分点 / 追问方向

- 能现场估算一个模型的 KV Cache，是推理岗常见的考察点；
- 说清 KV Cache 只发生在**推理**阶段（训练是一次性前向，不缓存）。
