import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { health } from './routes/health';
import { chat } from './routes/chat';
import { rateLimit } from './middleware/ratelimit';

const app = new Hono();

// 请求日志：排查限流/CORS 问题时，能看清每个请求的来源、结果与耗时。
// 放在最前面，这样连被 CORS 拒绝、被限流拦截的请求也会留下记录。
app.use('/api/*', async (c, next) => {
  const started = Date.now();
  const origin = c.req.header('origin') || '-';
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  await next();
  const ms = Date.now() - started;
  const status = c.res.status;
  const flag = status === 429 ? '  <<< 限流拦截' : status >= 400 ? '  <<< 错误' : '';
  console.log(`[req] ${status}${flag}  ${c.req.method} ${new URL(c.req.url).pathname}  ${ms}ms  origin=${origin}  ip=${ip}`);
});

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
      // 其余来源拒绝：注意这里只是「不加 CORS 头」，请求仍会被正常处理并返回，
      // 但浏览器会因缺少 Access-Control-Allow-Origin 而拦截响应，前端只会看到
      // "Failed to fetch"。排查跨域问题的第一现场就是上面那行日志。
      return false;
    },
  }),
);

// 限流：IP 令牌桶（未登录）
app.use('/api/*', rateLimit);

app.route('/api', health);
app.route('/api', chat);

export default app;
