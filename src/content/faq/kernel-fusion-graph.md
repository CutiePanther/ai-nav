---
title: 推理优化里的算子融合（Kernel Fusion）和 CUDA Graph 是什么？
category: AI八股文
difficulty: 高级
answer: 算子融合把相邻的多个小 kernel（如 linear+add+layerNorm/softmax）合并成一个，减少 HBM 与 SRAM 之间反复搬运中间张量、并减少内核启动次数；CUDA Graph 把一组 kernel 以图对象一次性捕获并按图回放，消除 CPU→GPU 的逐 kernel 启动与同步延迟。
refs:
  - label: PyTorch torch.compile 文档
    url: https://pytorch.org/docs/stable/generated/torch.compile.html
  - label: PyTorch 编译优化教程
    url: https://pytorch.org/tutorials/intermediate/torch_compile_tutorial.html
tags: ["推理优化", "Kernel Fusion", "CUDA Graph", "torch.compile"]
---

## 核心概念

LLM 推理常受「访存受限 / 内核启动开销」牵制：一串像 `linear → add → layernorm → softmax` 的小 kernel，每次都在全局内存（HBM）与片上（SRAM）间搬运中间张量，并且每次都触发 CPU→GPU 的函数调度。算子融合把这些算子合并为目标单个 kernel，把中间结果留在寄存器/共享内存里；CUDA Graph 再把调度好的内核序列捕获成图、重复回放。

## 关键要点 / 原理

- **融合的价值**：减少全局内存往返（每次少读写在带宽敏感型模型里直接变成延迟收益），也削减内核启动次数；FlashAttention 即把 `QK → softmax → ×V` 在线融合的典型代表。
- **CUDA Graph**：用一次 graph capture 记录内核依赖与内存布局，之后每次推理只下发一个图对象，省去大量逐 kernel launch 与同步开销；对 decode（小 batch、kernel 密集）收益尤其明显。
- **torch.compile**：把 PyTorch 动态图编译成固定的捕获图并生成 Fusion + Triton 内核，`mode="reduce-overhead"` 会用 CUDA Graph 包住解码循环。
- **适用边界**：动态 shape / 控制流分支会使图失效需重新捕获；graph 本身占用额外显存（推理引擎常对 graph 做按需复用/池化）。
- **与量化关系**：融合不损精度，在吞吐与延迟上通常双赢，是大模型服务层（vLLM、TensorRT-LLM）默认支撑技术。

## 追问方向

- 为什么 decode（batch 小、每步 1 token）比 prefill 更吃「内核速度」？
- CUDA Graph 捕获失败或遇到动态 shape 时如何兜底？
- **面试加分点**：能说清 Fusion + CUDA Graph + PagedAttention（页面化注意力）这些引擎级内核如何叠加协同。