/**
 * RAG 索引新鲜度检查
 * 运行：npm run check:index                    仅报告，退出码恒为 0
 *       npm run check:index -- --strict        索引落后于内容时退出码 1
 *       npm run check:index -- --strict --max-age-days 14
 *
 * 背景：AI 问答的检索质量完全取决于 ai-service/data/index.json 与内容是否同步。
 * 索引是**手动构建**的（cd ai-service && npm run build:index），而 data/ 在 .gitignore 里，
 * 不进版本库、也没有任何自动重建。结果就是：主站内容更新了，线上 AI 仍按旧索引回答，
 * 而且不会有任何报错——静默地答错，比直接失败更难发现。
 *
 * 本脚本把这件事变成可观测的：比对索引 builtAt 与内容文件的最新修改时间。
 *
 * ⚠ 判据的局限（务必知道，否则会误读结果）：
 *   这里用的是**文件 mtime**，它只是「内容变了没」的近似信号。
 *   `git clone` / `git checkout` / `git pull` 会把工作区文件的 mtime 全部刷成当前时间，
 *   因此刚拉完代码时本脚本可能报「索引落后」，而内容其实一个字都没改。
 *   反向的漏报也存在：改动内容后手动把 mtime 改回去（或从归档解包保留了原 mtime），
 *   脚本就看不出来。
 *   结论：报「落后」时先确认是否只是刚 checkout 过；要精确判断应以 CI 里
 *   `git diff --name-only <上次索引提交>..HEAD -- src/content` 为准。
 *   因为默认只报告不拦截，且 ai-service/data 本身在 .gitignore 内（CI 上通常不存在索引），
 *   这个局限不会传导成误拦构建。
 */
import { readdir, readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// 与 ai-service/scripts/build-index.ts 的索引来源保持一致，改那边要同步这里
const SOURCE_DIRS = ['src/content/faq', 'src/content/roadmaps', 'src/content/guides'];
const DATA_DIR = path.join(ROOT, 'ai-service', 'data');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');
const VECTORS_FILE = path.join(DATA_DIR, 'vectors.json');
const REPORT_FILE = path.join(ROOT, 'data', 'index-freshness.json');

const argv = process.argv.slice(2);
const STRICT = argv.includes('--strict');
const maxAgeArg = argv.indexOf('--max-age-days');
const MAX_AGE_DAYS = maxAgeArg >= 0 ? Number(argv[maxAgeArg + 1]) : 30;

const DAY = 24 * 60 * 60 * 1000;

// 递归收集目录下所有内容文件（含 .md / .yaml），返回最新修改时间
async function newestMtime(dir) {
  let newest = 0;
  let newestFile = '';
  let count = 0;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return { newest, newestFile, count }; // 目录不存在按 0 处理
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const sub = await newestMtime(full);
      count += sub.count;
      if (sub.newest > newest) {
        newest = sub.newest;
        newestFile = sub.newestFile;
      }
    } else {
      count++;
      const st = await stat(full);
      if (st.mtimeMs > newest) {
        newest = st.mtimeMs;
        newestFile = path.relative(ROOT, full).replace(/\\/g, '/');
      }
    }
  }
  return { newest, newestFile, count };
}

function humanAge(ms) {
  const days = ms / DAY;
  if (days >= 1) return `${days.toFixed(1)} 天`;
  return `${(ms / (60 * 60 * 1000)).toFixed(1)} 小时`;
}

async function run() {
  let contentCount = 0;
  let newest = 0;
  let newestFile = '';
  for (const rel of SOURCE_DIRS) {
    const r = await newestMtime(path.join(ROOT, rel));
    contentCount += r.count;
    if (r.newest > newest) {
      newest = r.newest;
      newestFile = r.newestFile;
    }
  }

  // 索引不存在：data/ 被 gitignore，新克隆的仓库本来就没有，属正常状态，但要明确提示
  let index = null;
  try {
    index = JSON.parse(await readFile(INDEX_FILE, 'utf-8'));
  } catch {
    index = null;
  }

  if (!index) {
    const msg = [
      `[check-index] 未找到索引文件 ${path.relative(ROOT, INDEX_FILE)}`,
      '[check-index] 该目录（ai-service/data）已被 .gitignore 忽略，新克隆的仓库不会带上它，属正常情况。',
      '[check-index] 需要重建并重传 KV：cd ai-service && npm run build:index',
      '[check-index]   然后：cd ai-service/worker && npm run upload:kv',
    ].join('\n');
    console.log(msg);
    await mkdir(path.dirname(REPORT_FILE), { recursive: true });
    await writeFile(
      REPORT_FILE,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), status: 'missing', contentFiles: contentCount }, null, 2)}\n`,
      'utf-8',
    );
    // 索引缺失不算失败：真实部署流程会在构建阶段生成它
    return;
  }

  const builtAt = Number(index.builtAt ?? 0);
  const lagMs = newest - builtAt; // >0 表示有内容比索引新
  const ageMs = Date.now() - builtAt;
  const stale = lagMs > 0;
  const tooOld = builtAt > 0 && ageMs > MAX_AGE_DAYS * DAY;

  let vectorsInfo = '缺失';
  try {
    const vs = JSON.parse(await readFile(VECTORS_FILE, 'utf-8'));
    vectorsInfo = Array.isArray(vs) ? `${vs.length} 条 × ${vs[0]?.length ?? 0} 维` : '格式异常';
  } catch {
    vectorsInfo = '缺失（若已启用向量检索需重建）';
  }

  console.log(`[check-index] 内容文件：${contentCount} 个（来源：${SOURCE_DIRS.join(', ')}）`);
  console.log(`[check-index] 索引构建于：${new Date(builtAt).toISOString()}（距今 ${humanAge(ageMs)}）`);
  console.log(`[check-index] 索引规模：${index.totalDocs ?? '?'} 个 chunk，向量 ${vectorsInfo}`);
  console.log(`[check-index] 最近改动内容：${newestFile}（${new Date(newest).toISOString()}）`);

  if (stale) {
    console.log(`[check-index] ⚠ 索引落后于内容 ${humanAge(lagMs)}：线上 AI 会按旧索引作答，需重建。`);
    console.log('[check-index]   重建：cd ai-service && npm run build:index && cd worker && npm run upload:kv');
    console.log('[check-index]   注意：mtime 只是近似判据。若刚刚执行过 git clone/checkout/pull，');
    console.log('[check-index]         工作区 mtime 会被整体刷新，可能出现「假落后」，请先确认内容是否真有改动。');
  } else {
    console.log('[check-index] ✓ 索引未落后于内容');
  }
  if (tooOld) {
    console.log(`[check-index] ⚠ 索引已超过 ${MAX_AGE_DAYS} 天未更新（阈值可用 --max-age-days 调整）`);
  }

  await mkdir(path.dirname(REPORT_FILE), { recursive: true });
  await writeFile(
    REPORT_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        status: stale ? 'stale' : 'fresh',
        contentFiles: contentCount,
        indexBuiltAt: new Date(builtAt).toISOString(),
        indexAgeDays: Number((ageMs / DAY).toFixed(2)),
        newestContentAt: new Date(newest).toISOString(),
        newestContentFile: newestFile,
        lagHours: Number((lagMs / (60 * 60 * 1000)).toFixed(2)),
        totalDocs: index.totalDocs ?? null,
        vectors: vectorsInfo,
        maxAgeDays: MAX_AGE_DAYS,
      },
      null,
      2,
    )}\n`,
    'utf-8',
  );
  console.log(`[check-index] 报告已写入 ${path.relative(ROOT, REPORT_FILE)}`);

  if (STRICT && (stale || tooOld)) {
    console.error('[check-index] --strict：索引需要重建，退出码 1');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('[check-index] 执行失败：', err);
  process.exit(1);
});
