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
  }),
});

// 精选面试题（精选集，外链 + 高频清单）
const faq = defineCollection({
  loader: glob({ base: './src/content/faq', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['大模型', '机器学习', '深度学习', '工程系统']),
    difficulty: z.enum(['入门', '进阶', '高级']),
    answer: z.string(),               // 题目答案/要点（原创摘要）
    refs: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
    })).default([]),                  // 参考外链（LeetCode/牛客/CodeTop 等）
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { docs, info, faq };
