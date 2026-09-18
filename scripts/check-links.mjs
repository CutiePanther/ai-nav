/**
 * 死链检测：扫描 docs / tools 内容里的外链，输出健康度报告。
 * 运行：npm run check:links              仅报告，退出码恒为 0
 *       npm run check:links -- --strict  存在「真实死链」时退出码为 1（可用于门禁）
 * 输出：data/link-report.json（分类统计 + 全量明细 + 问题清单）
 *
 * 为什么不能把 4xx 一律当作死链（旧实现的问题）：
 *   大量正常站点会对自动化请求返回 403（Cloudflare/WAF 反爬）、405（不接受 HEAD）、
 *   429（限流），而链接本身用浏览器打开完全正常。把它们计入死链，报告里 80% 是误报，
 *   长期下来没人再看这份报告——比没有报告更糟。
 *   因此这里把「拒绝自动访问」与「真的不存在」分开：只有 404/410 才算 dead。
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
const STRICT = process.argv.includes('--strict');
const SECTIONS = [ // 只扫带外链 `url` 字段的集合
  { name: 'docs', glob: 'docs' },
  { name: 'tools', glob: 'tools' },
];

// 不带 UA 的请求会被相当一部分站点直接 403；带浏览器 UA 能显著降低误报。
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

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

/**
 * 状态码 → 语义分类。
 * ok          2xx/3xx：正常
 * blocked     401/403/405/429/451：站点拒绝自动化请求或需鉴权，链接本身通常仍然有效
 * not_found   404/410：真正失效——唯一值得人工处理的类别
 * client_error 其余 4xx：请求本身有问题（如 400/406），需人工看一眼
 * server_error 5xx：对方服务端故障，可能是临时性的
 */
function classify(status) {
  if (status >= 200 && status < 400) return 'ok';
  if (status === 404 || status === 410) return 'not_found';
  if ([401, 403, 405, 429, 451].includes(status)) return 'blocked';
  if (status >= 400 && status < 500) return 'client_error';
  return 'server_error';
}

/**
 * 探测单个链接。
 *
 * 注意：定时器必须是**每次调用独立的局部变量**。
 * 旧实现用了模块级 `let timeout`，在 MAX_CONCURRENCY=8 的并发下会被互相覆盖，
 * clearTimeout 清掉的是别的请求的定时器，导致 timeout 分类永远为空、结果不稳定。
 */
async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // 先 HEAD（省流量），失败再退 GET。
    // 不少站点对 HEAD 返回 405/403，只发 HEAD 会把这批站点误判为异常。
    const doFetch = (method) =>
      fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: method === 'GET' ? { ...BROWSER_HEADERS, Range: 'bytes=0-0' } : BROWSER_HEADERS,
      });

    let res;
    try {
      res = await doFetch('HEAD');
      if (res.status === 405 || res.status === 403 || res.status >= 500) {
        res = await doFetch('GET');
      }
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      res = await doFetch('GET'); // HEAD 网络层失败，再试一次 GET
    }

    return { url, status: res.status, kind: classify(res.status) };
  } catch (e) {
    return { url, status: 0, kind: e?.name === 'AbortError' ? 'timeout' : 'error' };
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const entries = await collectLinks();
  console.log(`[check-links] 收集 ${entries.length} 条外链，开始检查（并发 ${MAX_CONCURRENCY}，超时 ${TIMEOUT_MS}ms）…`);

  const results = [];
  for (let i = 0; i < entries.length; i += MAX_CONCURRENCY) {
    const batch = entries.slice(i, i + MAX_CONCURRENCY);
    results.push(...(await Promise.all(batch.map((e) => check(e.url)))));
  }

  const byKind = { ok: [], blocked: [], not_found: [], client_error: [], server_error: [], timeout: [], error: [] };
  for (const r of results) (byKind[r.kind] ?? byKind.error).push(r);

  // 可升级：http:// 且对应 https:// 可达
  const upgrades = [];
  await Promise.all(
    results
      .filter((r) => r.kind === 'ok' && r.url.startsWith('http://'))
      .map(async (r) => {
        const httpsUrl = `https://${r.url.slice('http://'.length)}`;
        const s = await check(httpsUrl);
        if (s.kind === 'ok') upgrades.push({ from: r.url, to: httpsUrl });
      }),
  );

  // 需要人工处理的只有「真实死链」；blocked 单独列出供抽查，不计入问题总数
  const realDead = [...byKind.not_found, ...byKind.client_error];
  const transient = [...byKind.server_error, ...byKind.timeout, ...byKind.error];

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: results.length,
      ok: byKind.ok.length,
      blocked: byKind.blocked.length,
      notFound: byKind.not_found.length,
      clientError: byKind.client_error.length,
      serverError: byKind.server_error.length,
      timeoutOrError: byKind.timeout.length + byKind.error.length,
      httpUpgradable: upgrades.length,
    },
    issues: {
      // 唯一需要人工修的类别
      deadLinks: realDead.map((r) => ({ url: r.url, status: r.status })),
      // 反爬/鉴权：链接大概率有效，仅供人工抽查，不要据此改内容
      blockedByAntiBot: byKind.blocked.map((r) => ({ url: r.url, status: r.status })),
      // 对方服务端故障或网络问题，可能自愈
      transientFailures: transient.map((r) => ({ url: r.url, status: r.status || r.kind })),
      httpUpgradable: upgrades,
    },
    detail: {
      docs: entries.filter((e) => e.section === 'docs').map((e) => ({ title: e.title, file: `${e.section}/${e.file}`, url: e.url })),
      tools: entries.filter((e) => e.section === 'tools').map((e) => ({ title: e.title, file: `${e.section}/${e.file}`, url: e.url })),
    },
  };

  await mkdir(path.dirname(REPORT_FILE), { recursive: true });
  await writeFile(REPORT_FILE, JSON.stringify(report, null, 2), 'utf-8');

  const s = report.summary;
  console.log(
    `[check-links] 完成：总数 ${s.total}，正常 ${s.ok}，反爬/鉴权 ${s.blocked}，` +
      `真实死链 ${s.notFound + s.clientError}，服务端/网络异常 ${s.timeoutOrError + s.serverError}，可升级 https ${s.httpUpgradable}`,
  );
  console.log(`[check-links] 报告已写入 ${path.relative(ROOT, REPORT_FILE)}`);

  if (realDead.length) {
    console.log('[check-links] ⚠ 需要人工处理的链接（404/410 及其他 4xx）：');
    for (const r of realDead) console.log(`    ${r.status}  ${r.url}`);
  }
  if (byKind.blocked.length) {
    console.log(`[check-links] ℹ ${byKind.blocked.length} 条被反爬/鉴权拦截（403/405/429/451），链接本身通常有效，未计入问题。`);
  }
  if (!realDead.length) {
    console.log('[check-links] ✅ 未发现真实死链');
  }

  // 默认只报告不拦截；--strict 时把真实死链作为失败信号
  if (STRICT && realDead.length) {
    console.error(`[check-links] --strict：存在 ${realDead.length} 条真实死链，退出码 1`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('[check-links] 执行失败：', err);
  process.exit(1);
});
