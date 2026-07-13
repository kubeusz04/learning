/**
 * Lesson progress — localStorage persistence across sessions.
 */
(function (global) {
  'use strict';

  const PREFIX = 'pp-lesson:';

  const LESSONS = [
    { id: 'pl-1', title: 'Polish L1 — Compliments', href: 'index.html', track: 'Polish', total: 12, practice: 'practice/pl-1.html', theory: 'lesson-1-theory.html' },
    { id: 'pl-2', title: 'Polish L2 — Feelings & się', href: 'lesson-2.html', track: 'Polish', total: 12, practice: 'practice/pl-2.html', theory: 'lesson-2-theory.html' },
    { id: 'pl-3', title: 'Polish L3 — Hugs', href: 'lesson-3.html', track: 'Polish', total: 12, practice: 'practice/pl-3.html', theory: 'lesson-3-theory.html' },
    { id: 'ko-1', title: 'Korean L1 — Topic marker', href: 'Korean/index.html', track: 'Korean', total: 12, practice: 'Korean/practice/ko-1.html', theory: 'Korean/lesson-1-theory.html' },
    { id: 'ko-2', title: 'Korean L2 — Happy & 너무', href: 'Korean/lesson-2.html', track: 'Korean', total: 12, practice: 'Korean/practice/ko-2.html', theory: 'Korean/lesson-2-theory.html' },
    { id: 'ko-3', title: 'Korean L3 — Hugs', href: 'Korean/lesson-3.html', track: 'Korean', total: 12, practice: 'Korean/practice/ko-3.html', theory: 'Korean/lesson-3-theory.html' }
  ];

  const PRAISES = [
    'Great!',
    'You are so good at it!',
    'I am so proud of you!',
    'Good job!',
    'Awesome!',
    'Well done!',
    'Fantastic!',
    'Keep it up!',
    'Brilliant!',
    'You nailed it!'
  ];

  function randomPraise() {
    return PRAISES[Math.floor(Math.random() * PRAISES.length)];
  }

  function storageKey(lessonId) {
    return PREFIX + lessonId;
  }

  function load(lessonId) {
    try {
      const raw = localStorage.getItem(storageKey(lessonId));
      if (!raw) return { completed: [], total: 12 };
      const data = JSON.parse(raw);
      return {
        completed: Array.isArray(data.completed) ? data.completed : [],
        total: data.total || 12,
        updated: data.updated || null
      };
    } catch {
      return { completed: [], total: 12 };
    }
  }

  function save(lessonId, data) {
    const payload = {
      completed: data.completed,
      total: data.total,
      updated: Date.now()
    };
    localStorage.setItem(storageKey(lessonId), JSON.stringify(payload));
    localStorage.setItem(PREFIX + 'last', lessonId);
  }

  function percent(done, total) {
    if (!total) return 0;
    return Math.round((done / total) * 100);
  }

  function create(lessonId, totalExercises) {
    const data = load(lessonId);
    const completed = new Set(data.completed);
    const total = totalExercises || data.total || 12;

    function persist() {
      save(lessonId, { completed: [...completed], total });
      updatePersistBar();
    }

    function updatePersistBar() {
      const pct = percent(completed.size, total);
      const fill = document.getElementById('persistFill');
      const text = document.getElementById('persistPct');
      if (fill) fill.style.width = pct + '%';
      if (text) text.textContent = pct + '%';
      const flashFill = document.getElementById('progressFill');
      const flashText = document.getElementById('progressText');
      if (flashFill) flashFill.style.width = pct + '%';
      if (flashText) flashText.textContent = pct + '%';
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

    function ensurePersistBar() {
      if (document.getElementById('lessonProgressPersist')) {
        updatePersistBar();
        return;
      }
      const header = document.querySelector('header');
      if (!header) return;
      const bar = document.createElement('div');
      bar.id = 'lessonProgressPersist';
      bar.className = 'lesson-progress-persist';
      bar.setAttribute('aria-label', 'Lesson progress');
      bar.innerHTML =
        '<div class="progress-label">' +
        '<span>Progress</span>' +
        '<span id="persistPct">0%</span>' +
        '</div>' +
        '<div class="progress-bar"><div class="progress-fill" id="persistFill"></div></div>';
      const parent = arcadeStatsParent(header);
      parent.insertBefore(bar, parent.firstChild);
      updatePersistBar();
    }

    function restoreExercise(num) {
      const row = document.querySelector('.exercise[data-exercise="' + num + '"]');
      if (!row) return;
      row.dataset.done = '1';
      row.classList.add('exercise-done');

      const scoreEl = document.getElementById('score' + num);
      if (scoreEl && !scoreEl.classList.contains('correct')) {
        scoreEl.textContent = randomPraise();
        scoreEl.className = 'exercise-score correct';
      }

      row.querySelectorAll('.btn').forEach((b) => {
        b.disabled = true;
        if (b.dataset.correct === 'true') b.classList.add('correct');
      });

      row.querySelectorAll('.match-item').forEach((item) => {
        item.classList.add('matched');
      });

      const input = document.getElementById('ex' + num + '-input');
      if (input) input.disabled = true;
    }

    function track(num) {
      if (completed.has(num)) return false;
      completed.add(num);
      persist();
      return true;
    }

    function reset() {
      completed.clear();
      persist();
    }

    function restore() {
      ensurePersistBar();
      completed.forEach(restoreExercise);
    }

    return { completed, total, track, reset, restore, updatePersistBar, lessonId };
  }

  function getAllLessons() {
    return LESSONS.map((lesson) => {
      const data = load(lesson.id);
      const done = data.completed.length;
      return {
        ...lesson,
        done,
        percent: percent(done, lesson.total),
        updated: data.updated
      };
    });
  }

  function getLastLessonId() {
    return localStorage.getItem(PREFIX + 'last');
  }

  function getLesson(id) {
    return LESSONS.find((l) => l.id === id);
  }

  global.LessonProgress = { create, load, getAllLessons, getLastLessonId, getLesson, LESSONS, randomPraise };
})(typeof window !== 'undefined' ? window : globalThis);
