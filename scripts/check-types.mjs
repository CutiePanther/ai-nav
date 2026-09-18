/**
 * 类型基线棘轮（type debt ratchet）
 * 运行：npm run check:types          校验类型错误数未超过基线
 *       npm run check:types -- --update   把当前值写为新基线
 *
 * 背景：项目里 8 个 .astro 文件的客户端 <script> 块是无类型注解的纯 JS，
 * 而 Astro 会把它们按 TypeScript strict 检查，因此 astro check 存在一批存量错误
 * （type-baseline.json 记录了数量）。直接把它做成「零错误」门禁会让 CI 长期红灯，
 * 结果必然是门禁被绕过——那还不如没有。
 *
 * 因此采用棘轮策略：不要求一次清零，但**禁止继续变多**。
 * 新增的类型错误会立刻让 CI 失败，存量债务则保留清晰的量化基线，
 * 每修掉一批就 `--update` 下压一次，只降不升。
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASELINE_FILE = path.join(__dirname, 'type-baseline.json');
const ASTRO_BIN = path.join(ROOT, 'node_modules', 'astro', 'bin', 'astro.mjs');

// astro check 的诊断输出带 ANSI 颜色码，先剥掉再解析，否则正则匹配不到行首
function stripAnsi(s) {
  return s.replace(/\u001B\[[0-9;]*m/g, '');
}

/**
 * 从 astro check 的收尾汇总块里取计数：
 *   Result (34 files):
 *   - 185 errors
 *   - 0 warnings
 *   - 11 hints
 * 同一标签可能出现多次（分文件块 + 总计块），取最后一次即为总计。
 */
function parseSummary(output) {
  const readLast = (label) => {
    const re = new RegExp(`^-\\s*(\\d+)\\s+${label}$`, 'gm');
    let last = null;
    let m;
    while ((m = re.exec(output)) !== null) last = Number(m[1]);
    return last;
  };
  return {
    errors: readLast('errors?'),
    warnings: readLast('warnings?'),
    hints: readLast('hints?'),
  };
}

// 逐文件统计错误数，用于在失败时直接指出「往哪儿看」
function countByFile(output) {
  const counts = new Map();
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes(' - error ts(')) continue;
    const file = line.replace(/:\d+:\d+ - error ts\(.*$/, '').trim();
    counts.set(file, (counts.get(file) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function runAstroCheck() {
  if (!existsSync(ASTRO_BIN)) {
    console.error(`[check-types] 未找到 ${ASTRO_BIN}`);
    console.error('[check-types] 请先执行 npm install');
    process.exit(1);
  }
  const res = spawnSync(process.execPath, [ASTRO_BIN, 'check'], {
    cwd: ROOT,
    encoding: 'utf8',
    // astro check 有错误时退出码为 1，属预期情况，不作为失败判据
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (res.error) {
    console.error('[check-types] 无法启动 astro check：', res.error.message);
    process.exit(1);
  }
  return stripAnsi(`${res.stdout ?? ''}${res.stderr ?? ''}`);
}

function readBaseline() {
  if (!existsSync(BASELINE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(BASELINE_FILE, 'utf-8'));
  } catch (e) {
    console.error(`[check-types] 基线文件解析失败：${e.message}`);
    return null;
  }
}

function writeBaseline(errors, warnings, byFile) {
  const payload = {
    errors,
    warnings,
    updatedAt: new Date().toISOString(),
    // 基线对应的主要债务位置，便于后续按文件逐批清偿
    topFiles: Object.fromEntries(byFile.slice(0, 10)),
    note: 'astro check 的存量类型错误基线（棘轮）。只允许下降；修掉一批后用 npm run check:types -- --update 下压。',
  };
  writeFileSync(BASELINE_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  return payload;
}

function main() {
  const update = process.argv.includes('--update');

  // 先校验基线是否存在，再跑 astro check。
  // 基线缺失时没有任何可比对的对象，没必要先白等一轮类型检查（约 60s）。
  let baseline = null;
  if (!update) {
    baseline = readBaseline();
    // 基线缺失时必须失败，不能就地重记后放行。
    // 否则「基线文件被删/漏提交」会让门禁静默退化成一个永远通过的检查——
    // 而门禁一旦可以被自己关掉，就等于不存在。要重建基线请显式带 --update。
    if (!baseline) {
      console.error(`[check-types] ✗ 未找到可用基线 ${path.relative(ROOT, BASELINE_FILE)}。`);
      console.error('[check-types] 该文件必须入库。若确为首次建立基线，请显式执行：');
      console.error('[check-types]   npm run check:types -- --update');
      process.exit(1);
    }
  }

  const output = runAstroCheck();
  const { errors, warnings, hints } = parseSummary(output);

  if (errors === null) {
    console.error('[check-types] 未能从 astro check 输出中解析出错误数，原始输出如下：');
    console.error(output.slice(-4000));
    process.exit(1);
  }

  const byFile = countByFile(output);

  if (update) {
    const saved = writeBaseline(errors, warnings ?? 0, byFile);
    console.log(`[check-types] 基线已更新：errors=${saved.errors} warnings=${saved.warnings}`);
    console.log(`[check-types] 写入 ${path.relative(ROOT, BASELINE_FILE)}`);
    return;
  }

  const base = Number(baseline.errors ?? 0);
  console.log(`[check-types] 当前 errors=${errors}（基线 ${base}），warnings=${warnings ?? 0}，hints=${hints ?? 0}`);

  if (errors > base) {
    console.error('');
    console.error(`[check-types] ✗ 类型错误增加了 ${errors - base} 个（${base} → ${errors}）。`);
    console.error('[check-types] 本次改动引入了新的类型问题，请先修复。错误分布（按文件）：');
    for (const [file, n] of byFile.slice(0, 10)) {
      console.error(`  ${String(n).padStart(4)}  ${file}`);
    }
    console.error('');
    console.error('[check-types] 本地查看完整明细：npm run check');
    if (baseline.updatedAt) console.error(`[check-types] 基线记录于 ${baseline.updatedAt}`);
    process.exit(1);
  }

  if (errors < base) {
    console.log(`[check-types] ✓ 比基线减少 ${base - errors} 个。`);
    console.log(`[check-types] 建议下压基线：npm run check:types -- --update`);
    return;
  }

  console.log('[check-types] ✓ 与基线持平，未引入新的类型错误。');
}

main();
