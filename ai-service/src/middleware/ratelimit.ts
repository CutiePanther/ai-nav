import type { MiddlewareHandler } from 'hono';

// 内存令牌桶：10 次/分钟（未登录）。后续接入持久化存储（KV/SQLite）后可跨实例共享。
const LIMIT = Number(process.env.RATE_LIMIT_PER_MIN || 10);
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export const rateLimit: MiddlewareHandler = async (c, next) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();

  // 顺手清理过期桶，防内存泄漏
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (now > b.resetAt) buckets.delete(k);
    }
  }

  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (b.count >= LIMIT) {
    return c.json({ error: 'rate limit exceeded' }, 429);
  }
  b.count += 1;
  return next();
};
