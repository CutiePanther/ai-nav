/**
 * 内容文件名规范检查
 * 运行：npm run check:filenames              仅报告，退出码恒为 0
 *       npm run check:filenames -- --strict  存在不合规文件名时退出码 1
 *
 * 背景：scripts/fetch-rss.mjs 生成的文件名是纯 ASCII 的 `YYYY-MM-DD-<标题 md5 前12位>.md`，
 * 目的是「跨平台 + URL 友好 + 幂等」。但手工新增的条目常常直接把中文标题当文件名，
 * 于是同一个集合里混着两套命名，带来几个具体后果：
 *   1. 静态站点里中文文件名会被转义成一大串百分号编码，URL 长且难读、分享易断；
 *   2. 部分托管/CDN 与对象存储对非 ASCII key 的处理不一致，出现过 404；
 *   3. 大小写不一致的文件名在 macOS/Windows（大小写不敏感）能跑，到 Linux CI 上才会暴露。
 * 本脚本把这类问题在提交前就指出来。默认只报告——存量文件不阻塞构建，改不改由人决定。
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'content');

const STRICT = process.argv.includes('--strict');
const CONTENT_EXT = new Set(['.md', '.mdx', '.yaml', '.yml', '.json']);

/** 与 scripts/fetch-rss.mjs 的 filenameFor() 输出的字符集一致：小写字母、数字、连字符 */
const CONFORMANT = /^[a-z0-9-]+\.(md|mdx|yaml|yml|json)$/;

/**
 * 诊断单个文件名，返回问题原因列表（空数组表示合规）。
 * 逐项判断而不是只做一次正则，是为了让报告能直接说明「哪里不合规」。
 */
function diagnose(name) {
  const reasons = [];
  // eslint-disable-next-line no-control-regex
  if (/[^\x00-\x7F]/.test(name)) reasons.push('含非 ASCII 字符（中文等），URL 会被百分号编码');
  if (/[A-Z]/.test(name)) reasons.push('含大写字母，在大小写不敏感的文件系统上易与同名文件冲突');
  if (/\s/.test(name)) reasons.push('含空格，URL 与命令行中都需要额外转义');
  if (/[#%?&=+,;:'"<>|\\*]/.test(name)) reasons.push('含 URL/文件系统不友好字符');
  if (/[\u3000-\u303F\uFF00-\uFFEF]/.test(name)) reasons.push('含全角标点');
  return reasons;
}

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full, out);
    } else if (CONTENT_EXT.has(path.extname(e.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

async function run() {
  const files = await walk(CONTENT_DIR);
  if (files.length === 0) {
    console.log(`[check-filenames] 未在 ${path.relative(ROOT, CONTENT_DIR)} 下找到内容文件`);
    return;
  }

  // 按集合（src/content/<collection>/...）分组统计，便于逐批处理
  const byCollection = new Map();
  const offenders = [];

  for (const full of files) {
    const rel = path.relative(CONTENT_DIR, full).replace(/\\/g, '/');
    const collection = rel.split('/')[0];
    const name = path.basename(full);
    const stat_ = byCollection.get(collection) ?? { total: 0, bad: 0 };
    stat_.total++;
    byCollection.set(collection, stat_);

    if (CONFORMANT.test(name)) continue;

    const reasons = diagnose(name);
    if (reasons.length === 0) reasons.push('不符合 `小写字母-数字-连字符` 命名');
    stat_.bad++;
    offenders.push({ collection, file: `src/content/${rel}`, name, reasons });
  }

  console.log(`[check-filenames] 扫描 ${files.length} 个内容文件，发现 ${offenders.length} 个命名不合规`);
  console.log('[check-filenames] 规范：纯 ASCII、小写字母/数字/连字符，形如 2026-09-18-a1b2c3d4e5f6.md');
  console.log('[check-filenames] 分集合统计：');
  for (const [c, s] of [...byCollection.entries()].sort((a, b) => b[1].total - a[1].total)) {
    const pct = ((s.bad / s.total) * 100).toFixed(0);
    console.log(`    ${c.padEnd(12)} ${String(s.total).padStart(4)} 个，其中 ${String(s.bad).padStart(3)} 个不合规（${pct}%）`);
  }

  if (offenders.length) {
    console.log('[check-filenames] 明细（最多显示 40 条）：');
    for (const o of offenders.slice(0, 40)) {
      console.log(`    ${o.file}`);
      for (const r of o.reasons) console.log(`        · ${r}`);
    }
    if (offenders.length > 40) {
      console.log(`    … 其余 ${offenders.length - 40} 条已省略`);
    }
    console.log('[check-filenames] 提示：改名会影响既有 URL 与外部链接，请评估后再动；');
    console.log('[check-filenames]      新增条目建议沿用 fetch-rss 的 `日期-标题md5` 规则。');
  } else {
    console.log('[check-filenames] ✓ 全部文件名合规');
  }

  if (STRICT && offenders.length) {
    console.error(`[check-filenames] --strict：存在 ${offenders.length} 个不合规文件名，退出码 1`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('[check-filenames] 执行失败：', err);
  process.exit(1);
});
