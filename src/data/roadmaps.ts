// 学习路线图数据 —— 按方向分路线，每条路线分阶段，每阶段配套资源

export interface StageResource {
  label: string;
  url: string;
}

export interface Stage {
  name: string;
  desc: string;
  resources: StageResource[];
}

export interface Roadmap {
  slug: string;
  title: string;
  icon: string;
  target: string;       // 目标人群
  duration: string;     // 预计周期
  stages: Stage[];
}

export const roadmaps: Roadmap[] = [
  {
    slug: 'app',
    title: '大模型应用开发',
    icon: '🛠️',
    target: '想做 RAG、Agent、智能应用的在职开发 / 转行者',
    duration: '约 2~3 个月',
    stages: [
      {
        name: '筑基：LLM 基础与 API 调用',
        desc: '理解大模型能力边界，掌握主流 API 调用与 Prompt 工程',
        resources: [
          { label: 'Prompt 工程指南', url: 'https://www.promptingguide.ai/zh' },
          { label: 'OpenAI API 文档', url: 'https://platform.openai.com/docs' },
          { label: 'DeepSeek 开放平台', url: 'https://platform.deepseek.com' },
        ],
      },
      {
        name: '核心：RAG 与向量检索',
        desc: '掌握文档切分、向量化、检索与生成增强的完整链路',
        resources: [
          { label: 'LangChain RAG 教程', url: 'https://python.langchain.com/docs/tutorials/rag/' },
          { label: 'LlamaIndex 文档', url: 'https://docs.llamaindex.ai' },
          { label: 'Milvus 向量库', url: 'https://milvus.io/docs' },
        ],
      },
      {
        name: '实战：Agent 与工具调用',
        desc: '构建能规划、调用工具、多轮迭代的智能体',
        resources: [
          { label: 'LangGraph 入门', url: 'https://langchain-ai.github.io/langgraph/' },
          { label: 'Dify 平台', url: 'https://docs.dify.ai' },
        ],
      },
      {
        name: '部署：服务化与上线',
        desc: '将应用封装为 API，掌握推理服务与工程化部署',
        resources: [
          { label: 'FastAPI', url: 'https://fastapi.tiangolo.com' },
          { label: 'vLLM 推理引擎', url: 'https://docs.vllm.ai' },
          { label: 'Gradio 演示', url: 'https://www.gradio.app/docs' },
        ],
      },
    ],
  },
  {
    slug: 'research',
    title: '算法研究',
    icon: '🔬',
    target: '想深入模型原理、读论文、做研究的同学',
    duration: '约 4~6 个月',
    stages: [
      {
        name: '筑基：数学与机器学习基础',
        desc: '夯实线性代数、概率、优化与经典 ML 算法',
        resources: [
          { label: '吴恩达机器学习', url: 'https://www.coursera.org/learn/machine-learning' },
          { label: 'Kaggle Learn', url: 'https://www.kaggle.com/learn' },
        ],
      },
      {
        name: '核心：深度学习与 Transformer',
        desc: '掌握神经网络、Transformer 架构与训练技巧',
        resources: [
          { label: 'PyTorch 文档', url: 'https://pytorch.org/docs' },
          { label: '图解 Transformer', url: 'https://jalammar.github.io/illustrated-transformer/' },
          { label: 'fast.ai', url: 'https://www.fast.ai' },
        ],
      },
      {
        name: '实战：LLM 微调与对齐',
        desc: '实践 LoRA/全参微调、RLHF 等对齐技术',
        resources: [
          { label: 'LLaMA-Factory', url: 'https://github.com/hiyouga/LLaMA-Factory' },
          { label: 'HuggingFace Transformers', url: 'https://huggingface.co/docs/transformers' },
        ],
      },
      {
        name: '前沿：论文与顶会',
        desc: '追踪 NeurIPS/ICML/ACL，复现前沿工作',
        resources: [
          { label: 'arXiv', url: 'https://arxiv.org' },
          { label: 'HuggingFace Papers', url: 'https://huggingface.co/papers' },
        ],
      },
    ],
  },
  {
    slug: 'engineering',
    title: 'AI 工程化',
    icon: '⚙️',
    target: '想做模型部署、推理优化、平台建设的工程同学',
    duration: '约 3~4 个月',
    stages: [
      {
        name: '筑基：推理与部署基础',
        desc: '理解模型推理流程、服务化与常见部署方式',
        resources: [
          { label: 'Ollama 本地部署', url: 'https://github.com/ollama/ollama' },
          { label: 'vLLM 文档', url: 'https://docs.vllm.ai' },
        ],
      },
      {
        name: '核心：推理优化',
        desc: '掌握量化、KV Cache、批处理调度等优化手段',
        resources: [
          { label: 'llama.cpp', url: 'https://github.com/ggml-org/llama.cpp' },
          { label: 'FlashAttention', url: 'https://github.com/Dao-AILab/flash-attention' },
        ],
      },
      {
        name: '实战：RAG 系统工程化',
        desc: '构建高可用向量检索与知识库系统',
        resources: [
          { label: 'FAISS', url: 'https://github.com/facebookresearch/faiss' },
          { label: 'pgvector', url: 'https://github.com/pgvector/pgvector' },
        ],
      },
      {
        name: '进阶：分布式与平台',
        desc: '多卡并行、模型服务治理与平台化',
        resources: [
          { label: 'SGLang', url: 'https://github.com/sgl-project/sglang' },
        ],
      },
    ],
  },
  {
    slug: 'multimodal',
    title: '多模态',
    icon: '🎨',
    target: '想做图文、视频、语音等多模态方向的同学',
    duration: '约 3~5 个月',
    stages: [
      {
        name: '筑基：多模态基础',
        desc: '理解图文对齐、CLIP 等基础范式',
        resources: [
          { label: 'CLIP 论文', url: 'https://arxiv.org/abs/2103.00020' },
        ],
      },
      {
        name: '核心：扩散模型与生成',
        desc: '掌握 Stable Diffusion 等生成模型原理',
        resources: [
          { label: 'Stable Diffusion', url: 'https://stability.ai' },
          { label: 'HuggingFace Diffusers', url: 'https://huggingface.co/docs/diffusers' },
        ],
      },
      {
        name: '实战：多模态大模型',
        desc: '实践 VLM、视频理解等前沿模型',
        resources: [
          { label: 'Gemini API', url: 'https://ai.google.dev/gemini-api/docs' },
        ],
      },
      {
        name: '前沿：端到端与统一架构',
        desc: '追踪端到端多模态统一模型的进展',
        resources: [
          { label: 'HuggingFace Papers', url: 'https://huggingface.co/papers' },
        ],
      },
    ],
  },
];
