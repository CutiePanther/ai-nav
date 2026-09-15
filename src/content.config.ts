import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 官方文档导航库
const docs = defineCollection({
  loader: glob({ base: './src/content/docs', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),          // 一句话简介
    url: z.string().url(),            // 外链
    category: z.string(),             // 分类：API / 框架 / 推理部署 / 向量库 / 应用层
    zhLevel: z.enum(['中文', '英文', '中英']), // 中文友好度
    popularity: z.number().min(1).max(5),     // 常用度 1-5
    updated: z.coerce.date().optional(),      // 最近更新日期（近 90 天在列表打「更新」角标）
    tags: z.array(z.string()).default([]),
  }),
});

// 最新资讯（聚合外链）
const info = defineCollection({
  loader: glob({ base: './src/content/info', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    source: z.string(),               // 来源：机器之心 / 量子位 / HuggingFace 等
    url: z.string().url(),            // 原文外链
    summary: z.string(),              // 摘要
    category: z.enum(['行业快讯', '技术前沿', '开源动态', '政策产业']),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    body: z.string().optional(),      // 可选：站内正文（Readhub 等聚合源直接存本站，不跳外部）
  }),
});

// AI 工具大全（按分类导航）
const tools = defineCollection({
  loader: glob({ base: './src/content/tools', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),          // 一句话简介
    url: z.string().url(),            // 外链
    category: z.enum([
      'AI写作', 'AI图像', 'AI视频', 'AI办公', 'AI开发平台', 'AI智能体',
      'AI聊天', 'AI音频', 'AI大模型', 'AI学习平台', 'AI搜索引擎', 'AI编程',
    ]),
    free: z.enum(['免费', '付费', '免费增值']).default('免费'),
    featured: z.boolean().default(false),    // 精选（编辑权重，用于「精选」筛选与推荐）
    popularity: z.number().min(1).max(5).default(3), // 热度评分（编辑权重，用于热度排序）
    updated: z.coerce.date().optional(),      // 最近更新日期（近 90 天在列表打「更新」角标）
    tags: z.array(z.string()).default([]),
  }),
});

// 精选面试题（精选集，外链 + 高频清单）
const faq = defineCollection({
  loader: glob({ base: './src/content/faq', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['大模型', '机器学习', '深度学习', '工程系统', 'AI八股文', '计算机基础']),
    difficulty: z.enum(['入门', '进阶', '高级']),
    answer: z.string(),               // 题目答案/要点（原创摘要）
    refs: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
    })).default([]),                  // 参考外链（LeetCode/牛客/CodeTop 等）
    tags: z.array(z.string()).default([]),
  }),
});

// 学习路线图（按方向分路线，每条路线分阶段；运营加路线只需加 YAML 文件）
const roadmaps = defineCollection({
  loader: glob({ base: './src/content/roadmaps', pattern: '**/*.yaml' }),
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    target: z.string(),               // 目标人群
    duration: z.string(),             // 总周期
    prerequisites: z.array(z.string()),
    stages: z.array(z.object({
      name: z.string(),
      desc: z.string(),
      time: z.string(),               // 预计用时
      skills: z.array(z.string()),
      tasks: z.array(z.string()),
      checkpoint: z.string(),         // 检验标准
      project: z.string().optional(), // 实践项目建议
      resources: z.array(z.object({
        label: z.string(),
        url: z.string().url(),
        kind: z.enum(['course', 'repo', 'doc', 'practice']).optional(),
      })),
    })),
  }),
});

// 站内实战教程（有正文的长文，区别于 docs 的外链导航）
const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),          // 一句话简介（列表卡片用）
    order: z.number().default(99),    // 系列内排序
    category: z.string(),             // 所属系列：AgentScope
    tags: z.array(z.string()).default([]),
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { docs, info, tools, faq, roadmaps, guides };
