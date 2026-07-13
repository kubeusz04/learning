/**
 * Global XP & levels (1–100) — earned from all practice modules.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'pp-player-xp';
  const XP_PER_EXERCISE = 10;
  const MAX_LEVEL = 100;

  function buildLevelThresholds() {
    const thresholds = new Array(MAX_LEVEL + 2);
    thresholds[1] = 0;
    let cumulative = 0;
    for (let level = 2; level <= MAX_LEVEL + 1; level++) {
      cumulative += Math.floor(12 + (level - 2) * 1.6);
      thresholds[level] = cumulative;
    }
    return thresholds;
  }

  const LEVEL_XP = buildLevelThresholds();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { xp: 0, earned: [] };
      const data = JSON.parse(raw);
      return {
        xp: typeof data.xp === 'number' ? data.xp : 0,
        earned: Array.isArray(data.earned) ? data.earned : []
      };
    } catch {
      return { xp: 0, earned: [] };
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      xp: data.xp,
      earned: data.earned,
      updated: Date.now()
    }));
  }

  function earnedKey(lessonId, exerciseNum) {
    return lessonId + ':' + exerciseNum;
  }

  function getLevel(xp) {
    for (let level = MAX_LEVEL; level >= 1; level--) {
      if (xp >= LEVEL_XP[level]) return level;
    }
    return 1;
  }

  function getLevelProgress(xp) {
    const level = getLevel(xp);
    if (level >= MAX_LEVEL) {
      return { level: MAX_LEVEL, inLevel: 0, perLevel: 1, progress: 1 };
    }
    const start = LEVEL_XP[level];
    const next = LEVEL_XP[level + 1];
    const inLevel = xp - start;
    const perLevel = next - start;
    return { level, inLevel, perLevel, progress: perLevel ? inLevel / perLevel : 0 };
  }

  function uniqueExerciseTotal() {
    const lessons = global.LessonProgress && global.LessonProgress.LESSONS;
    if (!lessons) return 72;
    return lessons.reduce((sum, l) => sum + (l.total || 12), 0);
  }

  function getState() {
    const { xp, earned } = load();
    const prog = getLevelProgress(xp);
    return {
      xp,
      level: prog.level,
      maxLevel: MAX_LEVEL,
      inLevel: prog.inLevel,
      perLevel: prog.perLevel,
      progress: prog.progress,
      earnedCount: earned.length,
      uniqueTotal: uniqueExerciseTotal(),
      xpToNext: prog.level >= MAX_LEVEL ? 0 : prog.perLevel - prog.inLevel
    };
  }

  function renderBadge(el, state) {
    const s = state || getState();
    const pct = Math.round(s.progress * 100);
    const title = s.level >= MAX_LEVEL
      ? s.xp + ' XP · max level'
      : s.xp + ' XP · ' + s.xpToNext + ' to Lv ' + (s.level + 1);
    el.innerHTML =
      '<div class="player-xp-inner" title="' + title + '">' +
      '<span class="player-xp-level" aria-label="Level ' + s.level + ' of ' + MAX_LEVEL + '">' +
      'Lv ' + s.level + '</span>' +
      '<div class="player-xp-meta">' +
      '<div class="player-xp-bar"><div class="player-xp-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="player-xp-text">' + s.xp + ' XP · ' + s.level + '/' + MAX_LEVEL + '</span>' +
      '</div></div>';
  }

  function updateAll() {
    document.querySelectorAll('[data-player-xp]').forEach((el) => renderBadge(el));
  }

  function showLevelUp(level) {
    const existing = document.getElementById('playerXpLevelUp');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'playerXpLevelUp';
    toast.className = 'player-xp-levelup';
    toast.innerHTML =
      '<span class="player-xp-levelup-emoji">🎉</span>' +
      '<strong>Level ' + level + '!</strong>' +
      (level >= MAX_LEVEL
        ? '<span>Max level reached!</span>'
        : '<span>Keep practicing!</span>');
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  function grant(amount) {
    const xp = Math.max(0, amount || 0);
    if (!xp) return getState();
    const data = load();
    const oldLevel = getLevel(data.xp);
    data.xp += xp;
    save(data);
    const state = getState();
    const leveledUp = state.level > oldLevel;
    updateAll();
    if (leveledUp) showLevelUp(state.level);
    return { awarded: xp, leveledUp, ...state };
  }

  function award(lessonId, exerciseNum) {
    const data = load();
    const key = earnedKey(lessonId, exerciseNum);
    const oldLevel = getLevel(data.xp);

    if (!data.earned.includes(key)) data.earned.push(key);
    data.xp += XP_PER_EXERCISE;
    save(data);

    const state = getState();
    const leveledUp = state.level > oldLevel;
    updateAll();
    if (leveledUp) showLevelUp(state.level);

    return { awarded: XP_PER_EXERCISE, leveledUp, ...state };
  }

  function arcadeStatsParent(header) {
    if (!header.classList.contains('arcade-header')) return header;
    let wrap = header.querySelector('.arcade-header-stats');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'arcade-header-stats';
      header.appendChild(wrap);
    }
    return wrap;
  }

  function ensureBadge() {
    if (document.getElementById('playerXpBadge')) return;
    const header = document.querySelector('header');
    if (!header) return;
    const badge = document.createElement('div');
    badge.id = 'playerXpBadge';
    badge.className = 'player-xp-badge';
    badge.setAttribute('data-player-xp', '');
    const parent = header.classList.contains('home-header')
      ? header.parentElement
      : arcadeStatsParent(header);
    if (header.classList.contains('home-header')) {
      header.insertAdjacentElement('afterend', badge);
    } else {
      parent.appendChild(badge);
    }
    renderBadge(badge);
  }

  function syncFromProgress() {
    if (!global.LessonProgress) return;
    const data = load();
    let changed = false;
    global.LessonProgress.LESSONS.forEach((lesson) => {
      const progress = global.LessonProgress.load(lesson.id);
      progress.completed.forEach((num) => {
        const key = earnedKey(lesson.id, num);
        if (!data.earned.includes(key)) {
          data.earned.push(key);
          data.xp += XP_PER_EXERCISE;
          changed = true;
        }
      });
    });
    if (changed) save(data);
  }

  function init() {
    syncFromProgress();
    ensureBadge();
    updateAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.PlayerXP = {
    award,
    grant,
    getState,
    getLevel,
    updateAll,
    uniqueExerciseTotal,
    XP_PER_EXERCISE,
    MAX_LEVEL,
    LEVEL_XP
  };
})(typeof window !== 'undefined' ? window : globalThis);
