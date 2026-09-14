// 收藏/书签：基于 localStorage 的纯前端实现，无后端依赖。
// 供各列表页与 /favorites 页共用；按钮通过 data-fav-toggle 识别。

const KEY = 'ai-nav:favorites';

/** 读取全部收藏 */
export function loadFavorites() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** 是否已收藏 */
export function isFavorite(key) {
  return loadFavorites().some((f) => f.key === key);
}

/** 切换收藏，返回是否新增（true=已加入，false=已移除） */
export function toggleFavorite(meta) {
  const list = loadFavorites();
  const i = list.findIndex((f) => f.key === meta.key);
  let added;
  if (i >= 0) {
    list.splice(i, 1);
    added = false;
  } else {
    list.push({ key: meta.key, title: meta.title, url: meta.url, type: meta.type, at: Date.now() });
    added = true;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 存储被禁用时静默 */
  }
  return added;
}

function read(btn) {
  return {
    key: btn.dataset.favToggle,
    title: btn.dataset.favTitle || '',
    url: btn.dataset.favUrl || '',
    type: btn.dataset.favType || '',
  };
}

function paint(btn, active) {
  btn.classList.toggle('is-fav', active);
  btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  btn.setAttribute('aria-label', active ? '取消收藏' : '收藏');
}

/** 扫描并绑定页面上所有 [data-fav-toggle] 按钮 */
export function initFavorites() {
  document.querySelectorAll('[data-fav-toggle]').forEach((btn) => {
    const meta = read(btn);
    if (!meta.key) return;
    paint(btn, isFavorite(meta.key));
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const added = toggleFavorite(meta);
      paint(btn, added);
      // 通知其它监听者（如 /favorites 页）刷新
      document.dispatchEvent(new CustomEvent('ai-nav:favchange', { detail: { key: meta.key, added } }));
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initFavorites);
}