import { Hono } from 'hono';

export const health = new Hono();

health.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'ai-service',
    time: new Date().toISOString(),
  }),
);
