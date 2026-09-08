import { serve } from '@hono/node-server';
import { loadEnvFile } from 'node:process';
import app from './index';

// 加载 .env（不存在则忽略，走系统环境变量）
try { loadEnvFile(); } catch { /* ignore */ }

// ai-service 仅访问内网 LLM 网关，需直连；清除沙盒 HTTP 代理（它不转发内网地址）
for (const k of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy']) {
  delete process.env[k];
}

const port = Number(process.env.PORT || 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[ai-service] listening on http://localhost:${info.port}`);
});
