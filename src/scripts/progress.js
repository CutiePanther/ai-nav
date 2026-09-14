// 学习进度：题库掌握度 + 路由阶段完成，基于 localStorage 的纯前端实现。
// 进度 key 约定：
//   'faq:<id>'       → 'mastered' | 'review'（题库掌握度）
//   'rm:<routeId>'   → { '<idx>': true, ... }（路线各阶段完成状态）

const KEY = 'ai-nav:progress';

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

function save(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* 存储被禁用时静默 */
  }
}

/** 通知各页面刷新进度展示 */
function notify() {
  document.dispatchEvent(new CustomEvent('ai-nav:progresschange'));
}

// ---------- 题库掌握度 ----------
export function getMastery(id) {
  return load()['faq:' + id] || '';
}

export function setMastery(id, status) {
  const p = load();
  if (status) p['faq:' + id] = status;
  else delete p['faq:' + id];
  save(p);
  notify();
}

/** 三态循环：无 → 已掌握 → 待复习 → 无 */
export function toggleMastery(id) {
  const cur = getMastery(id);
  const next = cur === 'mastered' ? 'review' : cur === 'review' ? '' : 'mastered';
  setMastery(id, next);
  return next;
}

/** 统计掌握/待复习数量 */
export function masteryCounts() {
  const p = load();
  let mastered = 0;
  let review = 0;
  for (const k of Object.keys(p)) {
    if (k.startsWith('faq:') && p[k] === 'mastered') mastered++;
    else if (k.startsWith('faq:') && p[k] === 'review') review++;
  }
  return { mastered, review };
}

const LABELS = { mastered: '已掌握', review: '待复习', '': '标记掌握' };

function paintMasteryBtn(el, state) {
  el.classList.toggle('is-mastered', state === 'mastered');
  el.classList.toggle('is-review', state === 'review');
  el.classList.toggle('is-idle', state === '');
  el.setAttribute('aria-pressed', state ? 'true' : 'false');
  // 图标模式（列表页）保留静态内容，仅换配色；文本模式（详情页）更新文案
  if (el.dataset.masteryText === '1') el.textContent = LABELS[state];
  el.setAttribute('aria-label', LABELS[state]);
  return state;
}

/** 扫描并绑定 [data-mastery-key] 按钮，同时同步其所属 .faq-card 的 data-mastery（供列表筛选） */
export function initMasteryButtons() {
  const bind = () => {
    document.querySelectorAll('[data-mastery-key]').forEach((el) => {
      const state = getMastery(el.dataset.masteryKey);
      paintMasteryBtn(el, state);
      const card = el.closest('.faq-card');
      if (card) card.dataset.mastery = state;
    });
  };
  bind();
  document.querySelectorAll('[data-mastery-key]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const state = toggleMastery(el.dataset.masteryKey);
      paintMasteryBtn(el, state);
      const card = el.closest('.faq-card');
      if (card) card.dataset.mastery = state;
    });
  });
  document.addEventListener('ai-nav:progresschange', bind);
}

// ---------- 路线阶段完成 ----------
export function roadmapDone(rid) {
  return load()['rm:' + rid] || {};
}

export function isStageDone(rid, idx) {
  return !!roadmapDone(rid)[idx];
}

export function doneCount(rid, total) {
  let n = 0;
  for (let i = 0; i < total; i++) if (roadmapDone(rid)[i]) n++;
  return n;
}

export function toggleStage(rid, idx) {
  const p = load();
  const m = p['rm:' + rid] || {};
  if (m[idx]) delete m[idx];
  else m[idx] = true;
  p['rm:' + rid] = m;
  save(p);
  notify();
}

/** 绑定 [data-stage-done]（data-roadmap + data-stage-idx），同步其所属 .roadmap-stage 高亮 */
export function initRoadmapDetail(rid, total) {
  const paintHeader = () => {
    const n = doneCount(rid, total);
    const text = document.getElementById('rm-progress-text');
    if (text) text.textContent = `已完成 ${n} / ${total} 阶段`;
    const bar = document.getElementById('rm-progress-bar');
    if (bar) bar.style.width = `${total ? Math.round((n / total) * 100) : 0}%`;
  };

  document.querySelectorAll('[data-stage-done]').forEach((el) => {
    const idx = Number(el.dataset.stageIdx);
    const stage = el.closest('.roadmap-stage');
    const paint = () => {
      const done = isStageDone(rid, idx);
      if (stage) stage.classList.toggle('is-done', done);
      el.classList.toggle('is-done', done);
      el.textContent = done ? '✓ 已完成' : '标记完成';
    };
    paint();
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleStage(rid, idx);
    });
  });

  paintHeader();
  document.addEventListener('ai-nav:progresschange', paintHeader);
}

/** 路线列表页：按 [data-rm-id]/[data-rm-total] 更新进度标签与进度条 */
export function paintRoadmapCards() {
  document.querySelectorAll('[data-rm-id]').forEach((el) => {
    const rid = el.dataset.rmId;
    const total = Number(el.dataset.rmTotal || 0);
    const n = doneCount(rid, total);
    const pct = total ? Math.round((n / total) * 100) : 0;
    const label = document.querySelector(`[data-rm-label="${rid}"]`);
    if (label) label.textContent = `${n} / ${total} 阶段 · ${pct}%`;
    const bar = document.querySelector(`[data-rm-bar="${rid}"]`);
    if (bar) bar.style.width = `${pct}%`;
  });
}