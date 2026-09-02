---
title: 大模型推理如何做量化？
category: 工程系统
difficulty: 高级
answer: 量化将 FP16/FP32 权重与激活映射到低比特（INT8/INT4）以降低显存与加速。常见方法包括 GPTQ、AWQ（激活感知）、以及 GGUF 格式配合 llama.cpp 在 CPU/边缘部署。关键权衡是精度损失 vs 资源节省，通常需 PTQ 校准或少量数据。
refs:
  - label: llama.cpp
    url: https://github.com/ggml-org/llama.cpp
tags: ["量化", "推理"]
---
