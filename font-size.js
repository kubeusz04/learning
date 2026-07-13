(function () {
  'use strict';

  var STEPS = [85, 92, 100, 110, 120, 135];
  var KEY = 'pp-font-scale';
  var DEFAULT = 2;

  function getIndex() {
    var v = parseInt(localStorage.getItem(KEY), 10);
    return v >= 0 && v < STEPS.length ? v : DEFAULT;
  }

  var current = getIndex();

  function apply(i) {
    current = i;
    document.documentElement.style.fontSize = STEPS[i] + '%';
    localStorage.setItem(KEY, String(i));

    var value = document.querySelector('.font-size-value');
    if (value) value.textContent = STEPS[i] + '%';

    var smaller = document.querySelector('.font-size-control [data-action="smaller"]');
    var larger = document.querySelector('.font-size-control [data-action="larger"]');
    if (smaller) smaller.disabled = i === 0;
    if (larger) larger.disabled = i === STEPS.length - 1;
  }

  apply(current);

  function build() {
    var script = document.currentScript || document.querySelector('script[src*="font-size.js"]');
    var base = script && script.src ? script.src.replace(/[^/]+$/, '') : '';

    if (!document.querySelector('link[href*="font-size.css"]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = base + 'font-size.css';
      document.head.appendChild(link);
    }

    if (document.querySelector('.font-size-control')) return;

    var wrap = document.createElement('div');
    wrap.className = 'font-size-control';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Font size');
    wrap.innerHTML =
      '<button type="button" data-action="smaller" aria-label="Smaller text">A−</button>' +
      '<span class="font-size-value" aria-hidden="true">' + STEPS[current] + '%</span>' +
      '<button type="button" data-action="larger" aria-label="Larger text">A+</button>';
    document.body.appendChild(wrap);

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn || btn.disabled) return;
      if (btn.dataset.action === 'smaller' && current > 0) apply(current - 1);
      if (btn.dataset.action === 'larger' && current < STEPS.length - 1) apply(current + 1);
    });

    apply(current);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
