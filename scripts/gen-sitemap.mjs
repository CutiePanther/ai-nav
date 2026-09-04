/**
 * 构建后生成 sitemap.xml 和 robots.txt（提升 SEO）
 * 遍历 dist 下所有 index.html，生成站点地图。
 */
import { readdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
// 与 astro.config.mjs 同源：优先读 SITE_URL 环境变量，未配置回退占位域名
const SITE = process.env.SITE_URL || 'https://ai-dev-nav.example.com';

async function walk(dir) {
  const urls = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      urls.push(...(await walk(full)));
    } else if (e.name === 'index.html') {
      // 相对 dist 的路径 -> URL
      let rel = path.relative(DIST, full).replace(/\\/g, '/');
      if (rel === 'index.html') rel = '';
      else rel = rel.replace(/\/index\.html$/, '') + '/';
      urls.push(rel);
    }
  }
  return urls;
}

const urls = await walk(DIST);
urls.sort();

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${SITE}/${u}</loc></url>`)
  .join('\n')}
</urlset>
`;

await writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf-8');

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
await writeFile(path.join(DIST, 'robots.txt'), robots, 'utf-8');

console.log(`[seo] 生成 sitemap.xml（${urls.length} 个 URL）和 robots.txt`);
