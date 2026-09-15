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
    const left = Math.ceil((b.resetAt - now) / 1000);
    console.log(
      `[rate-limit] 已拦截 ip=${ip}  本窗口第 ${b.count} 次（上限 ${LIMIT}/分钟）  ${left}s 后重置`,
    );
    return c.json({ error: '请求过于频繁，请稍后再试' }, 429);
  }
  b.count += 1;
  // 接近上限时提前预警，便于判断「差一点就被限流」
  if (b.count >= LIMIT - 2) {
    console.log(`[rate-limit] 预警 ip=${ip}  已用 ${b.count}/${LIMIT}`);
  }
  return next();
};
