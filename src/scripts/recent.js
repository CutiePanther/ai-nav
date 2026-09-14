// 最近浏览：记录最近访问的 faq / 资讯 / 路线详情，供首页学习概览回访使用。
const KEY = 'ai-nav:recent';
const MAX = 5;

export function loadRecent() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function recordRecent(item) {
  if (!item || !item.title || !item.url) return;
  const rest = loadRecent().filter((r) => r.url !== item.url);
  rest.unshift({ title: item.title, url: item.url, type: item.type || '', at: Date.now() });
  rest.length = Math.min(rest.length, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    /* 存储被禁用时静默 */
  }
}

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** 把最近浏览渲染进容器（#id 元素） */
export function renderRecent(container) {
  if (!container) return;
  const l = loadRecent();
  container.innerHTML = l.length
    ? l.map(
        (r) =>
          `<a href="${esc(r.url)}" class="fav-row card block p-3 transition hover:bg-[var(--surface-2)]">` +
          `<p class="truncate text-sm font-medium text-[var(--text-1)]">${esc(r.title)}</p></a>`
      ).join('')
    : '<p class="text-sm text-[var(--text-3)]">暂无浏览记录，去题库、资讯或路线逛逛吧。</p>';
}