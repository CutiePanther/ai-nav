// 学习数据备份：导出/导入收藏与进度（JSON），以及导出收藏为 Markdown 清单。
import { loadFavorites, replaceFavorites } from './favorites.js';
import { exportAllProgress, replaceProgress, masteryCounts } from './progress.js';

export const DATA_VERSION = 1;

export function buildExport() {
  return JSON.stringify(
    { version: DATA_VERSION, exportedAt: new Date().toISOString(), favorites: loadFavorites(), progress: exportAllProgress() },
    null,
    2
  );
}

export function applyImport(json) {
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('文件不是有效的 JSON');
  }
  if (data && typeof data === 'object') {
    if (data.favorites !== undefined) replaceFavorites(data.favorites);
    if (data.progress !== undefined) replaceProgress(data.progress);
  }
}

function download(name, text, mime = 'application/json;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJSON() {
  download(
    `ai-nav-backup-${new Date().toISOString().slice(0, 10)}.json`,
    buildExport()
  );
}

export function downloadMarkdown() {
  const favs = loadFavorites();
  const { mastered, review } = masteryCounts();
  const lines = [];
  lines.push('# 我的 AI 学习收藏', '');
  lines.push(`- 生成时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push(`- 已掌握 ${mastered} 题${review ? ` · 待复习 ${review} 题` : ''}`);
  lines.push(`- 收藏 ${favs.length} 项`);
  lines.push('');
  const groups = { doc: '文档', tool: '工具', faq: '题库' };
  for (const [type, label] of Object.entries(groups)) {
    const items = favs.filter((f) => f.type === type);
    if (!items.length) continue;
    lines.push(`## ${label}`, '');
    items.forEach((f) => lines.push(`- [${f.title}](${f.url})`));
    lines.push('');
  }
  download('ai-nav-favorites.md', lines.join('\n'), 'text/markdown;charset=utf-8');
}

/** 弹出文件选择并导入（成功后刷新页面数据展示） */
export function bindImport(input, onDone) {
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applyImport(String(reader.result));
        if (onDone) onDone(true, '');
      } catch (err) {
        if (onDone) onDone(false, err instanceof Error ? err.message : '导入失败');
      }
    };
    reader.readAsText(file, 'utf-8');
    input.value = '';
  });
}