# AI 助手 Worker（Cloudflare）部署

把 `ai-dev-nav` 的站内 RAG 问答（BM25 + 向量 + LLM 流式）部署为边缘函数。
与 `ai-service`（Node/Hono，内网用）同一套检索与 SSE 协议，前端通过 `PUBLIC_AI_API_BASE` 指向这里即可线上点亮。

## 前置
- 安装依赖：`cd ai-service/worker && npm i`
- 登录：`npx wrangler login`

## 1. 创建 KV 命名空间并上传索引
```bash
npx wrangler kv namespace create AI_DOCS
# 把返回的 id 填进 wrangler.toml 的 [[kv_namespaces]] 的 id

node scripts/upload-kv.mjs                     # 生成 data/bulk.json（数组格式）
npx wrangler kv bulk put data/bulk.json --namespace-id=ad191bb336314f439eb3b71a5a92edde --remote
```

## 2. 配置机密（LLM 网关，写进 env 不入仓库）
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENAI_BASE_URL
npx wrangler secret put MODEL
npx wrangler secret put EMBEDDING_MODEL
# 可选：EMBEDDING_BASE_URL / EMBEDDING_API_KEY / EMBEDDING_QUERY_PREFIX（query 端 instruction）
```
`wrangler.toml` 里把 `ALLOWED_ORIGIN` 改成你的主站域名（如 `https://ai-nav-flax.vercel.app`）。

## 3. 发布
```bash
npm run deploy
```
发布到这里后，会得到一个 `https://ai-dev-nav-ai.<your-account>.workers.dev` 地址，作为 AI 服务的 `API_BASE`。

## 4. 主站点亮
在 Vercel 项目环境变量里设置：
```
PUBLIC_AI_API_BASE=https://ai-dev-nav-ai.<your-account>.workers.dev
```
前端（`ai.astro` / `index.astro`）检测到该变量即在生产环境渲染 AI 助手入口，并把请求发往该地址。
未设置该变量时，线上自动回退为「暂未开放」的优雅降级，不会请求死地址。

## 本地调试
```bash
npm run dev   # 默认 http://localhost:8787；可用 PUBLIC_AI_API_BASE 指向本机
curl -N -X POST http://localhost:8787/api/chat -H 'content-type: application/json' \
  -d '{"question":"什么是 RAG？"}'
```

## 说明
- 未配置 `OPENAI_API_KEY` 时，Worker 返回「骨架就绪（未配置 LLM）」的流式回显，并报告检索命中的条目——用于验证检索链路，不返回真实生成。
- 向量数据缺失或 embedding 不可用时会自动降级为 BM25-only，不影响主链路。
- 限流（默认 10 次/分/IP）为进程内滑动窗口；对公网建议再套 Cloudflare Rate Limiting。