/**
 * Word Rain — catch the right translation before it hits the ground.
 */
(function (global) {
  'use strict';

  const XP_PER_CATCH = 5;
  const MAX_FORM_LEN = 42;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function expandForms(text) {
    if (!text) return [];
    return text.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
  }

  function promptLabel(en) {
    return en
      .replace(/\([^)]*\)/g, '')
      .split(/\s*\//)[0]
      .trim();
  }

  function norm(s) {
    return (s || '').trim().toLowerCase();
  }

  function buildPool(vocab, lang) {
    const key = lang === 'ko' ? 'ko' : 'pl';
    const pool = [];
    (vocab || []).forEach((entry, idx) => {
      const forms = expandForms(entry[key]);
      const label = promptLabel(entry.en);
      if (!label) return;
      forms.forEach((form) => {
        if (!form || form.length > MAX_FORM_LEN) return;
        pool.push({
          form,
          label,
          labelNorm: norm(label),
          entryIdx: idx,
          long: form.length > 22
        });
      });
    });
    return pool;
  }

  function WordRain(config) {
    this.root = typeof config.root === 'string'
      ? document.querySelector(config.root)
      : config.root;
    this.lang = config.lang || 'pl';
    this.lessonId = config.lessonId || '';
    this.pool = buildPool(config.vocab, this.lang);
    this.running = false;
    this.paused = false;
    this.drops = [];
    this.raf = null;
    this.lastTs = 0;
    this.spawnTimer = null;
    this.round = null;
    this.score = 0;
    this.streak = 0;
    this.speedMul = 1;
    this.roundsPlayed = 0;
    this.targetRounds = Math.min(20, Math.max(10, this.pool.length));
  }

  WordRain.prototype._shell = function () {
    this.root.innerHTML =
      '<div class="rain-shell">' +
      '<div class="rain-hud">' +
      '<div class="rain-stat"><span class="rain-stat-label">Score</span><strong id="rainScore">0</strong></div>' +
      '<div class="rain-stat"><span class="rain-stat-label">Streak</span><strong id="rainStreak">🔥 0</strong></div>' +
      '</div>' +
      '<div class="rain-prompt" id="rainPrompt">Find: …</div>' +
      '<div class="rain-arena" id="rainArena"><div class="rain-ground"></div></div>' +
      '<div class="rain-footer">' +
      '<button type="button" class="rain-restart" id="rainRestart">↻ Play again</button>' +
      '</div></div>';

    this.arena = this.root.querySelector('#rainArena');
    this.promptEl = this.root.querySelector('#rainPrompt');
    this.scoreEl = this.root.querySelector('#rainScore');
    this.streakEl = this.root.querySelector('#rainStreak');
    this.restartBtn = this.root.querySelector('#rainRestart');

    this.restartBtn.addEventListener('click', () => this.restart());
    this.arena.addEventListener('click', (e) => this._onTap(e));
  };

  WordRain.prototype._updateHud = function () {
    this.scoreEl.textContent = String(this.score);
    this.streakEl.textContent = '🔥 ' + this.streak;
  };

  WordRain.prototype._pickRound = function () {
    if (!this.pool.length) return null;
    const target = this.pool[Math.floor(Math.random() * this.pool.length)];
    const correctForms = this.pool
      .filter((p) => p.labelNorm === target.labelNorm)
      .map((p) => p.form);
    const distractors = shuffle(
      this.pool.filter((p) => p.labelNorm !== target.labelNorm)
    )
      .slice(0, 8)
      .map((p) => p.form);
    return {
      label: target.label,
      correctForms: [...new Set(correctForms)],
      distractors: [...new Set(distractors)],
      resolved: false
    };
  };

  WordRain.prototype._spawnDrop = function (form, isCorrect) {
    if (!this.running || this.paused || !this.round || this.round.resolved) return;
    const arenaW = this.arena.clientWidth || 320;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'rain-drop' +
      (this.lang === 'ko' ? ' ko' : '') +
      (form.length > 22 ? ' long' : '');
    el.textContent = form;
    el.dataset.correct = isCorrect ? '1' : '0';
    const pad = 12;
    const w = Math.min(arenaW - pad * 2, Math.max(64, form.length * (this.lang === 'ko' ? 11 : 9)));
    const x = pad + Math.random() * Math.max(pad, arenaW - w - pad);
    el.style.left = x + 'px';
    el.style.width = w + 'px';
    el.style.top = '-36px';
    this.arena.appendChild(el);
    this.drops.push({
      el,
      y: -36,
      speed: (55 + Math.random() * 35) * this.speedMul,
      isCorrect,
      form
    });
  };

  WordRain.prototype._scheduleSpawns = function () {
    clearTimeout(this.spawnTimer);
    if (!this.running || this.paused || !this.round || this.round.resolved) return;

    const r = this.round;
    const batch = shuffle([
      ...r.correctForms.map((f) => ({ form: f, ok: true })),
      ...r.distractors.slice(0, 4).map((f) => ({ form: f, ok: false }))
    ]).slice(0, 5);

    let i = 0;
    const spawnNext = () => {
      if (!this.running || this.paused || !this.round || this.round.resolved) return;
      if (i < batch.length) {
        this._spawnDrop(batch[i].form, batch[i].ok);
        i++;
        this.spawnTimer = setTimeout(spawnNext, 450 + Math.random() * 350);
      } else {
        this.spawnTimer = setTimeout(() => this._scheduleSpawns(), 900);
      }
    };
    spawnNext();
  };

  WordRain.prototype._startRound = function () {
    this._clearDrops();
    this.round = this._pickRound();
    if (!this.round) return;
    this.promptEl.innerHTML = 'Find: <strong>' + this.round.label + '</strong>';
    this._scheduleSpawns();
  };

  WordRain.prototype._clearDrops = function () {
    this.drops.forEach((d) => d.el.remove());
    this.drops = [];
  };

  WordRain.prototype._tick = function (ts) {
    if (!this.running || this.paused) return;
    if (!this.lastTs) this.lastTs = ts;
    const dt = Math.min(32, ts - this.lastTs) / 1000;
    this.lastTs = ts;

    const floor = this.arena.clientHeight - 8;
    const missed = [];

    this.drops.forEach((drop) => {
      drop.y += drop.speed * dt;
      drop.el.style.top = drop.y + 'px';
      if (drop.y > floor) missed.push(drop);
    });

    missed.forEach((drop) => {
      if (drop.isCorrect && this.round && !this.round.resolved) {
        this._onWrong();
        this._resolveRound(false);
      }
      drop.el.remove();
      this.drops = this.drops.filter((d) => d !== drop);
    });

    this.raf = requestAnimationFrame((t) => this._tick(t));
  };

  WordRain.prototype._onWrong = function () {
    this.streak = 0;
    this._updateHud();
    this.arena.classList.add('rain-shake');
    setTimeout(() => this.arena.classList.remove('rain-shake'), 400);
  };

  WordRain.prototype._onTap = function (e) {
    const btn = e.target.closest('.rain-drop');
    if (!btn || !this.round || this.round.resolved) return;

    const ok = btn.dataset.correct === '1';
    btn.classList.add(ok ? 'hit-correct' : 'hit-wrong');

    if (ok) {
      this._resolveRound(true);
    } else {
      this._onWrong();
      setTimeout(() => btn.remove(), 200);
      this.drops = this.drops.filter((d) => d.el !== btn);
      return;
    }
  };

  WordRain.prototype._resolveRound = function (success) {
    if (!this.round || this.round.resolved) return;
    this.round.resolved = true;
    clearTimeout(this.spawnTimer);
    this._clearDrops();

    if (success) {
      this.score++;
      this.streak++;
      this.roundsPlayed++;
      this.speedMul = Math.min(2.2, 1 + this.roundsPlayed * 0.04);
      this._updateHud();
      if (global.PlayerXP && global.PlayerXP.grant) {
        global.PlayerXP.grant(XP_PER_CATCH);
      }
      this.promptEl.classList.add('rain-flash-ok');
      setTimeout(() => this.promptEl.classList.remove('rain-flash-ok'), 350);

      if (this.roundsPlayed >= this.targetRounds) {
        this._gameWin();
        return;
      }
      setTimeout(() => this._startRound(), 500);
    } else {
      setTimeout(() => this._startRound(), 700);
    }
  };

  WordRain.prototype._gameWin = function () {
    this.stop();
    this.promptEl.innerHTML =
      '🏆 Great run! Score <strong>' + this.score + '</strong> · 🔥 ' + this.streak;
    this.restartBtn.style.display = '';
    if (typeof this.onRoundComplete === 'function') this.onRoundComplete();
  };

  WordRain.prototype.restart = function () {
    this.stop();
    this.score = 0;
    this.streak = 0;
    this.speedMul = 1;
    this.roundsPlayed = 0;
    this.targetRounds = this.mixMode
      ? 8
      : Math.min(20, Math.max(10, this.pool.length));
    this.restartBtn.style.display = 'none';
    this._updateHud();
    this.start();
  };

  WordRain.prototype.start = function () {
    if (!this.pool.length) {
      this.promptEl.textContent = 'No vocabulary loaded for this lesson.';
      return;
    }
    this.running = true;
    this.paused = false;
    this.lastTs = 0;
    this.restartBtn.style.display = 'none';
    this._updateHud();
    this._startRound();
    this.raf = requestAnimationFrame((t) => this._tick(t));
  };

  WordRain.prototype.stop = function () {
    this.running = false;
    this.paused = false;
    clearTimeout(this.spawnTimer);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this._clearDrops();
    if (this.round) this.round.resolved = true;
  };

  WordRain.prototype.pause = function () {
    if (!this.running) return;
    this.paused = true;
    clearTimeout(this.spawnTimer);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  };

  WordRain.prototype.resume = function () {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.lastTs = 0;
    if (this.round && !this.round.resolved) this._scheduleSpawns();
    this.raf = requestAnimationFrame((t) => this._tick(t));
  };

  WordRain.create = function (config) {
    const game = new WordRain(config);
    game._shell();
    return game;
  };

  global.WordRain = WordRain;
})(typeof window !== 'undefined' ? window : globalThis);
