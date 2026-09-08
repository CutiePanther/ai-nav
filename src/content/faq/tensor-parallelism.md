---
title: 模型并行里的张量并行（Tensor Parallelism）是怎么切分的？
category: AI八股文
difficulty: 进阶
answer: 张量并行把单个线性层 Y=X·W 的权重按列或按行切到多卡并行计算；列并行（W 按列切、结果拼接）与行并行（W 按行切、结果 All-Reduce 求和）交替布置，配合注意力与 FFN 的结构，把每层的跨卡同步压缩到少量 All-Reduce。
refs:
  - label: Megatron-LM 论文
    url: https://arxiv.org/abs/1909.08053
  - label: HuggingFace 多卡训练指南
    url: https://huggingface.co/docs/transformers/en/perf_train_gpu_many
tags: ["并行", "张量并行", "Megatron"]
---

## 核心概念

张量并行（TP）针对「单层过大撑爆显存」：把一行 `Y = X·W` 的计算劈到多张卡。**列并行**把 W 按列切成 `[W1, W2]`，各卡算 `X·Wi` 再拼接输出；**行并行**把 W 按行切 `[W1; W2]`，各卡算 `Xi·Wi` 后再做 All-Reduce 求和。这样一层内部并行计算、只同步一次结果。

## 关键要点 / 原理

- **切法与 Transformer 配合**：attention 的 Q/K/V、输出投影与 FFN 两层交替使用行列切；例如 Linear 用列并行（各卡产出部分中间维度）、随后的非线性/FFN 用行并行（把部分累加为完整输出），从而把每层的 All-Reduce 控制在 1~2 次。
- **通信开销**：额外通信主要是「每层一次全向量 All-Reduce」，随卡数增长但远小于数据并行（DP）的梯度同步频率；因此比 DP 的带宽敏感度低，但要求高性能互联。
- **适用边界**：TP 的切分在节点/卡间通信成本高，通常限单机 ≤8 卡使用；跨机走慢网络时不划算，更多依赖流水线并行（PP）。
- **与其它并行维度**：DP 切 batch、TP 切单层内参数、PP 切层，三方可组合成 3D 并行（Megatron、DeepSeek 的典型配置）。
- **推理侧应用**：vLLM/SGLang 的 `tensor_parallel_size` 也用 TP 把权重与 KV Cache 分片到多卡、扩大单卡可容纳的上下文与 batch。

## 追问方向

- 为什么 TP 不适合跨节点（慢网络）？对比 TP 与 PP、DP 的通信频率与显存开销。
- 行并行与列并行各自的激活尺寸、需要几次 All-Reduce？
- **面试加分点**：能画出 attention 里「列并行 → 行并行 → 输出投影」的切分与归约图，并说出两个并行变换的目标是让合并起来的 only 一个 All-Reduce 经过每块。