---
title: 什么是 MoE（混合专家）？为什么能降本？
category: 大模型
difficulty: 进阶
answer: MoE 用"多个专家子网络 + 门控路由"替代单一稠密 FFN，每个 token 只激活少数专家，总参数大但单次前向计算少，从而在保持能力的同时降低推理算力与成本。
refs:
  - label: Mixtral of Experts 论文
    url: https://arxiv.org/abs/2401.04088
  - label: MoE 综述
    url: https://huggingface.co/blog/moe
tags: ["MoE", "稀疏激活", "降本"]
---

## 核心思想

传统 Transformer 的 FFN 层是"稠密"的——每个 token 都走完整的 FFN。MoE 把 FFN 换成 **N 个专家（Expert）+ 1 个门控路由（Router）**：

- 门控根据 token 内容，选出 top-k 个最相关的专家（如 top-2）；
- 只有被选中的专家参与计算，其余专家"闲置"。

## 为什么能降本

- **稀疏激活**：总参数量可做到极大（几百 B 甚至上 T），但单次前向只计算一小部分参数；
- **效果接近稠密大模型**：用更少的实际计算量，逼近甚至超越同规模稠密模型的能力；
- **推理算力成本下降**：激活参数少 → 计算量少 → 省钱、省电。

## 代价与挑战

- **负载均衡**：训练时易出现"专家坍缩"（少数专家被频繁选中），需加辅助损失或路由策略；
- **显存**：仍需加载全量参数，不能省显存，只是省算力；
- **工程复杂**：路由稳定性、专家并行（Expert Parallelism）增加部署难度。

## 面试加分点

- 代表模型：Mixtral、DeepSeek-V3、Grok、Qwen 系列等；
- "参数多、激活少"是 MoE 的核心 slogan；
- 常与专家并行、All-to-All 通信等分布式技术结合部署。
