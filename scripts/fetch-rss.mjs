/**
 * 资讯 RSS 抓取脚本
 * 在 `astro build` 前运行（prebuild），从配置的 RSS 源抓取最新条目，
 * 生成 Markdown 文件到 src/content/info/，实现资讯的「持续更新」。
 *
 * 设计原则：
 * - 只写「新增」条目，不覆盖手动维护的 markdown（用手动条目去重）；
 * - 抓取失败不影响构建（单源失败跳过）；
 * - 通过 SOURCE_MAP 映射来源名称与分类，新增源只需加一行。
 */
import Parser from 'rss-parser';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INFO_DIR = path.resolve(__dirname, '../src/content/info');

// RSS 源配置：url + 来源名 + 分类
const SOURCES = [
  {
    url: 'https://www.aiera.com.cn/feed',
    source: '新智元',
    category: '行业快讯',
    max: 8,
  },
  {
    url: 'https://arxiv.org/rss/cs.AI',
    source: 'arXiv',
    category: '技术前沿',
    max: 3,
    cleanSummary: true, // arXiv 摘要需清理噪声前缀
  },
];

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (ai-dev-nav rss fetcher)' },
});

// 从现有 markdown 里提取已存在的标题，用于去重
async function loadExistingTitles() {
  const files = (await readdir(INFO_DIR)).filter((f) => f.endsWith('.md'));
  const titles = new Set();
  for (const f of files) {
    const content = await readFile(path.join(INFO_DIR, f), 'utf-8');
    const m = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (m) titles.add(m[1].trim());
  }
  return titles;
}

// 生成 markdown 文件名（用标题 slug 化 + 时间戳兜底）
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function escapeYaml(s) {
  return s.replace(/"/g, "'").replace(/\n/g, ' ');
}

async function main() {
  const existing = await loadExistingTitles();
  let added = 0;

  for (const src of SOURCES) {
    try {
      const feed = await parser.parseURL(src.url);
      console.log(`[rss] ${src.source}: 抓到 ${feed.items?.length ?? 0} 条`);

      for (const item of (feed.items ?? []).slice(0, src.max ?? 8)) {
        const title = (item.title ?? '').trim();
        if (!title || existing.has(title)) continue;

        const link = item.link ?? '';
        let summary = (item.contentSnippet ?? item.content ?? '')
          .replace(/\s+/g, ' ')
          .trim();
        if (src.cleanSummary) {
          // 清理 arXiv 的 "arXiv:xxxx Announce Type: new Abstract:" 前缀
          summary = summary.replace(/^arXiv:\S+\s+(?:Announce Type:\s*\w+\s+)?Abstract:\s*/i, '');
        }
        summary = summary.slice(0, 200);
        const date = item.isoDate ?? item.pubDate ?? new Date().toISOString();
        const filename = `${slugify(title) || Date.now()}.md`;

        // 分类推断：arxiv 归技术前沿，其余按配置
        const category = src.category;

        const frontmatter = [
          '---',
          `title: "${escapeYaml(title)}"`,
          `source: ${src.source}`,
          `url: ${link}`,
          `summary: "${escapeYaml(summary)}"`,
          `category: ${category}`,
          `date: ${date}`,
          `tags: []`,
          '---',
          '',
        ].join('\n');

        await writeFile(path.join(INFO_DIR, filename), frontmatter, 'utf-8');
        existing.add(title);
        added++;
      }
    } catch (e) {
      console.warn(`[rss] ${src.source} 抓取失败，跳过：${e.message}`);
    }
  }

  console.log(`[rss] 完成，新增 ${added} 条资讯`);
  // 显式退出，避免 rss-parser 未关闭的连接导致进程挂起
  process.exit(0);
}

// 目录不存在则创建
if (!existsSync(INFO_DIR)) await mkdir(INFO_DIR, { recursive: true });
await main();
