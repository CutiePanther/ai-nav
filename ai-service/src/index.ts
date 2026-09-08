import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { health } from './routes/health';
import { chat } from './routes/chat';
import { rateLimit } from './middleware/ratelimit';

const app = new Hono();

// CORS：只允许主站域名（ALLOWED_ORIGIN 逗号分隔）
// 额外放行 localhost / 127.0.0.1 的任意端口（本地开发便利，避免 host 变体导致跨域被拦）
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      // 无 Origin（curl / 同源 / 服务端调用）：不设 CORS 头，正常放行
      if (!origin) return origin;
      const allowed = (process.env.ALLOWED_ORIGIN || 'http://localhost:4322')
        .split(',')
        .map((s) => s.trim());
      if (allowed.includes(origin)) return origin;
      // 开发便利：放行本机回环地址任意端口（localhost:4322 / 127.0.0.1:3000 等）
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
      // 其余来源拒绝
      return false;
    },
  }),
);

// 限流：IP 令牌桶（未登录）
app.use('/api/*', rateLimit);

app.route('/api', health);
app.route('/api', chat);

export default app;
