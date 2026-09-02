# AI 开发学习导航站

面向 AI 开发者的「学习导航 + 内容聚合 + 精选题库 + 学习路线」一站式站点。聚合散落各处的优质资源，结构清晰、可检索、SEO 友好。

## 技术栈

- **Astro 7** + **Tailwind CSS v4**（内容优先 + 静态优先 + 零后端）
- **Pagefind**（静态全文搜索）
- **rss-parser**（构建期自动抓取资讯）

## 栏目结构

| 栏目 | 路由 | 说明 |
|------|------|------|
| 首页 | `/` | 四栏入口 + 最新资讯 |
| 官方文档 | `/docs` | 大模型 API / 框架 / 推理部署 / 向量库 / 应用层导航库 |
| 最新资讯 | `/info`、`/info/[slug]` | 聚合外链 + 摘要，构建期 RSS 自动抓取 |
| 精选面试题 | `/faq`、`/faq/[slug]` | 高频题精选集 + 原创要点 + 参考外链 |
| 学习路线图 | `/roadmap`、`/roadmap/[slug]` | 4 条路线，分阶段进阶 |

## 目录结构

```text
src/
├── content.config.ts        # 内容集合 schema（docs/info/faq）
├── content/
│   ├── docs/                # 文档条目（markdown + frontmatter）
│   ├── info/                # 资讯条目（含 RSS 抓取产物）
│   └── faq/                 # 题库条目
├── data/roadmaps.ts         # 学习路线图数据
├── pages/                   # 页面路由
├── layouts/Layout.astro     # 全局布局（导航 + 搜索 + SEO）
└── components/Search.astro  # Pagefind 搜索组件
scripts/
├── fetch-rss.mjs            # RSS 抓取（prebuild 自动运行）
└── gen-sitemap.mjs          # sitemap + robots（postbuild 自动运行）
```

## 命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 本地开发（localhost:4321，注意：搜索需构建产物） |
| `npm run fetch-rss` | 手动抓取 RSS 资讯 |
| `npm run build` | 构建（自动执行 RSS 抓取 → 构建 → Pagefind 索引 → sitemap） |
| `npm run preview` | 预览构建产物 |

> 本地预览完整功能（含搜索）建议用 `node serve-dist.mjs` 静态服务器，因为 `astro preview` 在本环境的沙盒下可能因缓存清理被拦截。

## 内容维护

- **文档**：在 `src/content/docs/` 新建 `.md`，frontmatter 字段见 `content.config.ts`。
- **题库**：在 `src/content/faq/` 新建 `.md`。
- **路线图**：编辑 `src/data/roadmaps.ts`。
- **资讯**：手动条目放 `src/content/info/`，或让 `fetch-rss` 自动抓取（在 `scripts/fetch-rss.mjs` 的 `SOURCES` 加源）。

## 部署

见 [DEPLOY.md](./DEPLOY.md)。
