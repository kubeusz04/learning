/**
 * Tracks words the user got wrong in Standard Practice (Duolingo).
 * Boss Battle weights picks toward these mistakes.
 */
(function (global) {
  'use strict';

  const PREFIX = 'pp-mistakes:';

  function norm(s) {
    return (s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[.!?,…]/g, '');
  }

  function keyFor(text) {
    return norm(text);
  }

  function load(lessonId) {
    try {
      const raw = localStorage.getItem(PREFIX + lessonId);
      if (!raw) return {};
      const data = JSON.parse(raw);
      return typeof data === 'object' && data ? data : {};
    } catch {
      return {};
    }
  }

  function save(lessonId, map) {
    localStorage.setItem(PREFIX + lessonId, JSON.stringify(map));
  }

  function record(lessonId, texts) {
    if (!lessonId || !texts || !texts.length) return;
    const map = load(lessonId);
    texts.forEach((t) => {
      const k = keyFor(t);
      if (!k || k.length < 1) return;
      map[k] = (map[k] || 0) + 1;
    });
    save(lessonId, map);
  }

  function recordFromExercise(lessonId, ex, state) {
    const words = [];
    if (!ex) return;

    if (ex.type === 'fill') {
      if (ex.answer) words.push(ex.answer);
      if (state && state.fillValue) words.push(state.fillValue);
    } else if (ex.type === 'build') {
      if (ex.answer) words.push(...ex.answer);
      if (state && state.placed) words.push(...state.placed);
    } else if (ex.type === 'choice' || ex.type === 'translate') {
      const correct = (ex.options || []).find((o) => o.correct);
      if (correct) words.push(correct.text);
      if (state && state.selected) words.push(state.selected.text);
    } else if (ex.type === 'match' && ex.pairs) {
      ex.pairs.forEach((p) => words.push(p[0], p[1]));
    }

    record(lessonId, words);
  }

  function weightFor(lessonId, text) {
    const map = load(lessonId);
    const k = keyFor(text);
    return 1 + (map[k] || 0) * 2;
  }

  function getWeights(lessonId) {
    return load(lessonId);
  }

  global.PracticeMistakes = {
    record,
    recordFromExercise,
    weightFor,
    getWeights,
    keyFor
  };
})(typeof window !== 'undefined' ? window : globalThis);
