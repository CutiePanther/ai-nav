---
title: DeepSeek 的 MLA（多头潜在注意力）是怎么压缩 KV Cache 的？
category: AI八股文
difficulty: 高级
answer: MLA 不直接缓存 K、V，而是把 KV 共同压缩进一个低维潜在向量 c_KV，推理时再用 up-projection 复原出各头的 K/V；再配 Decoupled RoPE 解耦「内容」与「位置」，把单 token 的 KV 缓存从 O(n_heads×d_head) 压到 O(d_c)，是 DeepSeek 高效推理的关键。
refs:
  - label: DeepSeek-V2 论文
    url: https://arxiv.org/abs/2405.04434
  - label: DeepSeek-V3 技术报告
    url: https://arxiv.org/abs/2412.19437
tags: ["MLA", "KV Cache", "DeepSeek", "注意力"]
---

## 核心概念

标准 MHA 每层对每个 token 缓存所有头的 K、V，缓存量随头数线性增长。MLA 的思路是「先低秩压缩、再按需复原」：把 KV 用线性投影压到低维潜在空间缓存 `c_KV`，推理时用一个共享 up-projection 从 `c_KV` 重建出所有头的 K、V，从而把缓存维度压到很小的 `d_c`。

## 关键要点 / 原理

- **低秩联合压缩**：`c_KV = W_DKV · h_t`，缓存这个低维向量而非完整 K/V；打分时再 `K = W_UK·c_KV`、`V = W_UV·c_KV` 复原（DeepSeek-V2 的 `d_c=512`，相比原本每 token 数千维）。
- **吸收效应（矩阵恒等变形）**：因 K 是 `W·c` 的线性组合，`Q·Kᵀ = Q·(W·c)` 可先算 `Q·W` 再与 `c` 点积，推理时把 up-projection 吸收进 Q 侧，避免为每个头重复展开高维缓存的 K——这是 MLA 真正能提速的关键工程点。
- **Decoupled RoPE**：RoPE 的旋转位置与「低秩压缩后的线性分解」互斥，MLA 把位置分量单独一维（decouple RoPE）：内容走潜向量、位置走独立旋转 route，二者拼接后打分。
- **效果**：DeepSeek-V2 报告 KV 缓存减少约 93%、吞吐提升约 5.76×；MLA 此后成为 DeepSeek-V3/R1 的默认注意力。
- **与 GQA/MQA 对比**：GQA/MQA 靠「减少 KV 头数」来节省缓存（主动丢弃信息）；MLA 靠「低秩压缩保留信息」还原出全部头，方向不同、效果更稳。

## 追问方向

- 「把 up-projection 吸收进 Q」具体指什么？为何能避免为每个头重复展开缓存的 K/V。
- MLA 与 GQA 在 KV 缩减方式上的本质差异（丢头 vs 低秩压缩）。
- **面试加分点**：能画出 `h_t → c_KV → K/V` 与 `Q·W_up → dot` 的计算流图，并说明这是一种在推理期合法的「低秩注意力的矩阵恒等变换」。