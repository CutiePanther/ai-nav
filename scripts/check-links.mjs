/**
 * 死链检测：扫描 docs / tools 内容里的外链，输出健康度报告。
 * 仅报告、不自动修改。运行：npm run check:links
 * 输出：data/link-report.json（分类统计 + 全量明细 + 失败/可升级清单）
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'content');
const REPORT_FILE = path.join(ROOT, 'data', 'link-report.json');

const MAX_CONCURRENCY = Number(process.env.LINK_CONCURRENCY || 8); // 并发数
const TIMEOUT_MS = Number(process.env.LINK_TIMEOUT || 12000); // 单请求超时
const SECTIONS = [  // 只扫带外链 `url` 字段的集合
  { name: 'docs', glob: 'docs' },
  { name: 'tools', glob: 'tools' },
];

// 解析 markdown 头部 frontmatter 里的 title / url（文档条目的字段是简单 key: value）
function parseFrontmatter(raw) {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return null;
  const get = (key) => {
    const m = fm[1].match(new RegExp(`^${key}\\s*:\\s*(.+)$`, 'm'));
    return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : undefined;
  };
  return { title: get('title'), url: get('url') };
}

async function collectLinks() {
  const entries = [];
  for (const sec of SECTIONS) {
    const dir = path.join(CONTENT_DIR, sec.glob);
    let files = [];
    try {
      files = await readdir(dir);
    } catch {
      continue; // 目录不存在则跳过
    }
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const raw = await readFile(path.join(dir, f), 'utf-8');
      const meta = parseFrontmatter(raw);
      if (meta?.url) entries.push({ section: sec.name, file: f, ...meta, url: meta.url.trim() });
    }
  }
  return entries;
}

let timeout;
function check(url) {
  return new Promise((resolve) => {
    timeout = setTimeout(resolve, TIMEOUT_MS, 'timeout');
    const controller = new AbortController();
    const kill = () => controller.abort();
    const t = setTimeout(kill, TIMEOUT_MS);

    (async () => {
      // 先 HEAD，部分站点不接受 HEAD 时回退 GET（range 取 0 字节）
      const tryReq = (method) =>
        fetch(url, { method, redirect: 'follow', signal: controller.signal })
          .then((r) => ({ status: r.status }))
          .catch(() => null);

      let res = (await tryReq('HEAD')) || (await tryReq('GET'));
      clearTimeout(t);
      clearTimeout(timeout);

      if (!res) return resolve({ url, status: 0, kind: 'error' });
      const status = res.status;
      if (status >= 200 && status < 400) return resolve({ url, status, kind: 'ok' });
      if (status >= 400 && status < 500) return resolve({ url, status, kind: 'not_found' });
      return resolve({ url, status, kind: 'error' });
    })().finally(() => clearTimeout(t));
  });
}

async function run() {
  const entries = await collectLinks();
  console.log(`[check-links] 收集 ${entries.length} 条外链，开始检查（并发 ${MAX_CONCURRENCY}）…`);

  const results = [];
  for (let i = 0; i < entries.length; i += MAX_CONCURRENCY) {
    const batch = entries.slice(i, i + MAX_CONCURRENCY);
    results.push(...(await Promise.all(batch.map((e) => check(e.url)))));
  }

  // 归类
  const byKind = { ok: [], not_found: [], error: [], timeout: [] };
  for (const r of results) byKind[r.kind]?.push(r);

  // 可升级：http:// 且对应 https:// 可达
  const upgrades = [];
  const running = [];
  for (const r of results) {
    if (r.kind === 'ok' && r.url.startsWith('http://')) {
      const httpsUrl = 'https://' + r.url.slice('http://'.length);
      running.push(check(httpsUrl).then((s) => { if (s.kind === 'ok') upgrades.push({ from: r.url, to: httpsUrl }); }));
    }
  }
  await Promise.all(running);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: results.length,
      ok: byKind.ok.length,
      notFound: byKind.not_found.length,
      errorOrTimeout: byKind.error.length + byKind.timeout.length,
      httpUpgradable: upgrades.length,
    },
    issues: {
      notFound: byKind.not_found.map((r) => ({ url: r.url, status: r.status })),
      errorOrTimeout: [...byKind.error, ...byKind.timeout].map((r) => ({ url: r.url, status: r.status || 'timeout' })),
      httpUpgradable: upgrades,
    },
    detail: {
      docs: entries.filter((e) => e.section === 'docs').map((e) => ({ title: e.title, file: `${e.section}/${e.file}`, url: e.url })),
      tools: entries.filter((e) => e.section === 'tools').map((e) => ({ title: e.title, file: `${e.section}/${e.file}`, url: e.url })),
    },
  };

  await mkdir(path.dirname(REPORT_FILE), { recursive: true });
  await writeFile(REPORT_FILE, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`[check-links] 完成：总数 ${report.summary.total}，正常 ${report.summary.ok}，404 ${report.summary.notFound}，错误/超时 ${report.summary.errorOrTimeout}，可升级 https ${report.summary.httpUpgradable}`);
  if (report.issues.notFound.length || report.issues.errorOrTimeout.length) {
    console.log('[check-links] ⚠ 存在异常链接，详见 data/link-report.json');
  } else {
    console.log('[check-links] ✅ 未发现异常链接');
  }
}

run().catch((err) => {
  console.error('[check-links] 执行失败：', err);
  process.exit(1);
});