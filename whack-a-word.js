/**
 * Whack-a-Word — hit the correct translation when it pops up.
 */
(function (global) {
  'use strict';

  const HOLES = 9;
  const XP_PER_WHACK = 5;
  const MAX_FORM_LEN = 40;
  const BASE_VISIBLE_MS = 1500;

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
          long: form.length > 18
        });
      });
    });
    return pool;
  }

  function WhackAWord(config) {
    this.root = typeof config.root === 'string'
      ? document.querySelector(config.root)
      : config.root;
    this.lang = config.lang || 'pl';
    this.lessonId = config.lessonId || '';
    this.pool = buildPool(config.vocab, this.lang);
    this.running = false;
    this.paused = false;
    this.round = null;
    this.active = {};
    this.waveTimer = null;
    this.waveEndTimer = null;
    this.score = 0;
    this.streak = 0;
    this.roundsWon = 0;
    this.targetRounds = Math.min(18, Math.max(10, this.pool.length));
    this.visibleMs = BASE_VISIBLE_MS;
  }

  WhackAWord.prototype._shell = function () {
    let grid = '';
    for (let i = 0; i < HOLES; i++) {
      grid +=
        '<button type="button" class="whack-hole" data-hole="' + i + '" aria-label="Hole ' + (i + 1) + '">' +
        '<span class="whack-mole"></span>' +
        '<span class="whack-word"></span>' +
        '</button>';
    }

    this.root.innerHTML =
      '<div class="whack-shell">' +
      '<div class="whack-hud">' +
      '<div class="whack-stat"><span class="whack-stat-label">Score</span><strong id="whackScore">0</strong></div>' +
      '<div class="whack-stat"><span class="whack-stat-label">Streak</span><strong id="whackStreak">🔥 0</strong></div>' +
      '</div>' +
      '<div class="whack-prompt" id="whackPrompt">Whack: …</div>' +
      '<div class="whack-board" id="whackBoard">' + grid + '</div>' +
      '<p class="whack-hint">Tap only the correct word — ignore the decoys!</p>' +
      '<div class="whack-footer">' +
      '<button type="button" class="whack-restart" id="whackRestart">↻ Play again</button>' +
      '</div></div>';

    this.board = this.root.querySelector('#whackBoard');
    this.promptEl = this.root.querySelector('#whackPrompt');
    this.scoreEl = this.root.querySelector('#whackScore');
    this.streakEl = this.root.querySelector('#whackStreak');
    this.restartBtn = this.root.querySelector('#whackRestart');
    this.holeEls = this.root.querySelectorAll('.whack-hole');

    this.restartBtn.addEventListener('click', () => this.restart());
    this.holeEls.forEach((hole) => {
      hole.addEventListener('click', () => this._onHoleClick(Number(hole.dataset.hole)));
    });
  };

  WhackAWord.prototype._updateHud = function () {
    this.scoreEl.textContent = String(this.score);
    this.streakEl.textContent = '🔥 ' + this.streak;
  };

  WhackAWord.prototype._pickRound = function () {
    if (!this.pool.length) return null;
    const target = this.pool[Math.floor(Math.random() * this.pool.length)];
    const correctForms = [...new Set(
      this.pool.filter((p) => p.labelNorm === target.labelNorm).map((p) => p.form)
    )];
    const distractors = [...new Set(
      shuffle(this.pool.filter((p) => p.labelNorm !== target.labelNorm)).map((p) => p.form)
    )];
    return {
      label: target.label,
      correctForms,
      distractors
    };
  };

  WhackAWord.prototype._setRound = function () {
    this.round = this._pickRound();
    if (!this.round) return;
    this.promptEl.innerHTML = 'Whack: <strong>' + this.round.label + '</strong>';
  };

  WhackAWord.prototype._hideHole = function (idx) {
    const mole = this.active[idx];
    if (!mole) return;
    const hole = this.holeEls[idx];
    hole.classList.remove('up', 'correct-flash', 'wrong-flash');
    hole.querySelector('.whack-word').textContent = '';
    delete this.active[idx];
  };

  WhackAWord.prototype._hideAll = function () {
    clearTimeout(this.waveEndTimer);
    Object.keys(this.active).forEach((k) => this._hideHole(Number(k)));
  };

  WhackAWord.prototype._showMole = function (idx, form, isCorrect) {
    const hole = this.holeEls[idx];
    const wordEl = hole.querySelector('.whack-word');
    wordEl.textContent = form;
    wordEl.classList.toggle('long', form.length > 18);
    wordEl.classList.toggle('ko', this.lang === 'ko');
    hole.classList.add('up');

    this.active[idx] = {
      form,
      isCorrect,
      resolved: false
    };
  };

  WhackAWord.prototype._endWave = function () {
    if (!this.running || this.paused) return;

    let missed = false;
    Object.keys(this.active).forEach((k) => {
      const idx = Number(k);
      const mole = this.active[idx];
      if (mole.isCorrect && !mole.resolved) missed = true;
      this._hideHole(idx);
    });

    if (missed) {
      this._onMiss();
    }

    this._scheduleWave();
  };

  WhackAWord.prototype._spawnWave = function () {
    if (!this.running || this.paused || !this.round) return;
    this._hideAll();

    const correctForm = this.round.correctForms[
      Math.floor(Math.random() * this.round.correctForms.length)
    ];
    const slots = shuffle([...Array(HOLES).keys()]);
    const correctSlot = slots[0];
    const decoyCount = Math.min(2, this.round.distractors.length);
    const decoySlots = slots.slice(1, 1 + decoyCount);

    this._showMole(correctSlot, correctForm, true);
    decoySlots.forEach((slot, i) => {
      const form = this.round.distractors[i % this.round.distractors.length];
      if (form && form !== correctForm) this._showMole(slot, form, false);
    });

    this.waveEndTimer = setTimeout(() => this._endWave(), this.visibleMs);
  };

  WhackAWord.prototype._scheduleWave = function () {
    clearTimeout(this.waveTimer);
    if (!this.running || this.paused) return;
    const delay = Math.max(400, 900 - this.roundsWon * 25);
    this.waveTimer = setTimeout(() => this._spawnWave(), delay);
  };

  WhackAWord.prototype._onMiss = function () {
    this.streak = 0;
    this._updateHud();
    this.board.classList.add('whack-shake');
    setTimeout(() => this.board.classList.remove('whack-shake'), 400);
  };

  WhackAWord.prototype._onHoleClick = function (idx) {
    const mole = this.active[idx];
    if (!mole || mole.resolved || !this.running || this.paused) return;

    mole.resolved = true;
    const hole = this.holeEls[idx];

    if (mole.isCorrect) {
      clearTimeout(this.waveEndTimer);
      hole.classList.add('correct-flash');
      this.score++;
      this.streak++;
      this.roundsWon++;
      this.visibleMs = Math.max(900, BASE_VISIBLE_MS - this.roundsWon * 35);
      this._updateHud();
      if (global.PlayerXP && global.PlayerXP.grant) {
        global.PlayerXP.grant(XP_PER_WHACK);
      }
      this.promptEl.classList.add('whack-flash-ok');
      setTimeout(() => this.promptEl.classList.remove('whack-flash-ok'), 350);

      clearTimeout(this.waveEndTimer);
      this._hideAll();

      if (this.roundsWon >= this.targetRounds) {
        this._gameWin();
        return;
      }

      this._setRound();
      setTimeout(() => this._spawnWave(), 450);
    } else {
      mole.resolved = true;
      hole.classList.add('wrong-flash');
      this._onMiss();
      setTimeout(() => this._hideHole(idx), 280);
    }
  };

  WhackAWord.prototype._gameWin = function () {
    this.stop();
    this.promptEl.innerHTML =
      '🏆 Nice reflexes! Score <strong>' + this.score + '</strong> · 🔥 ' + this.streak;
    this.restartBtn.style.display = '';
    if (typeof this.onRoundComplete === 'function') this.onRoundComplete();
  };

  WhackAWord.prototype.restart = function () {
    this.stop();
    this.score = 0;
    this.streak = 0;
    this.roundsWon = 0;
    this.targetRounds = this.mixMode
      ? 8
      : Math.min(18, Math.max(10, this.pool.length));
    this.visibleMs = BASE_VISIBLE_MS;
    this.restartBtn.style.display = 'none';
    this._updateHud();
    this.start();
  };

  WhackAWord.prototype.start = function () {
    if (!this.pool.length) {
      this.promptEl.textContent = 'No vocabulary loaded for this lesson.';
      return;
    }
    this.running = true;
    this.paused = false;
    this.restartBtn.style.display = 'none';
    this._setRound();
    this._updateHud();
    this._spawnWave();
  };

  WhackAWord.prototype.stop = function () {
    this.running = false;
    this.paused = false;
    clearTimeout(this.waveTimer);
    clearTimeout(this.waveEndTimer);
    this._hideAll();
  };

  WhackAWord.prototype.pause = function () {
    if (!this.running) return;
    this.paused = true;
    clearTimeout(this.waveTimer);
    this._hideAll();
  };

  WhackAWord.prototype.resume = function () {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this._spawnWave();
  };

  WhackAWord.create = function (config) {
    const game = new WhackAWord(config);
    game._shell();
    return game;
  };

  global.WhackAWord = WhackAWord;
})(typeof window !== 'undefined' ? window : globalThis);
