/**
 * 站点 RSS feed 生成器
 * 在 `astro build` 后运行（postbuild），聚合 src/content/info/ 资讯
 * 生成 dist/rss.xml，供外部订阅器订阅站点最新资讯。
 *
 * 与 gen-sitemap.mjs 同源：优先读 SITE_URL 环境变量，未配置回退占位域名。
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INFO_DIR = path.resolve(__dirname, '../src/content/info');
const DIST = path.resolve(__dirname, '../dist');
const SITE = process.env.SITE_URL || 'https://ai-dev-nav.example.com';

function xmlEscape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  }[c]));
}

// 从 markdown frontmatter 提取字段（兼容带/不带引号）
function parseFrontmatter(content) {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return null;
  const block = fm[1];
  const get = (key) => {
    const m = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    if (!m) return '';
    return m[1].replace(/^["']|["']$/g, '').trim();
  };
  return {
    title: get('title'),
    url: get('url'),
    summary: get('summary'),
    source: get('source'),
    category: get('category'),
    date: get('date'),
  };
}

async function main() {
  const files = (await readdir(INFO_DIR)).filter((f) => f.endsWith('.md'));
  const items = [];
  for (const f of files) {
    const content = await readFile(path.join(INFO_DIR, f), 'utf-8');
    const data = parseFrontmatter(content);
    if (data && data.title && data.url) {
      items.push({ ...data, slug: f.replace(/\.md$/, '') });
    }
  }
  // 按日期倒序，取最新 20 条
  items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  const top = items.slice(0, 20);

  const pubDate = new Date().toUTCString();
  const itemsXml = top.map((it) => {
    const d = it.date ? new Date(it.date) : new Date();
    const link = `${SITE}/info/${it.slug}`;
    return `    <item>
      <title>${xmlEscape(it.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${d.toUTCString()}</pubDate>
      <category>${xmlEscape(it.category || '资讯')}</category>
      <source url="${xmlEscape(it.url)}">${xmlEscape(it.source || '外部来源')}</source>
      <description>${xmlEscape(it.summary || '')}</description>
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI 开发学习导航 · 最新资讯</title>
    <link>${SITE}/info</link>
    <description>聚合新智元、量子位、机器之心、arXiv、HuggingFace、OpenAI 等源的 AI 开发资讯</description>
    <language>zh-CN</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>
`;

  await writeFile(path.join(DIST, 'rss.xml'), rss, 'utf-8');
  console.log(`[rss] 生成 dist/rss.xml，含 ${top.length} 条资讯`);
}

await main();
