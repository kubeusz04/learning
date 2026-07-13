/**
 * Sentence Sprint — tap scrolling words in sentence order (Tetris lanes).
 */
(function (global) {
  'use strict';

  const LANES = 4;
  const XP_PER_SENTENCE = 8;
  const MAX_WORDS = 9;
  const MAX_LEN = 58;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function promptLabel(en) {
    return en
      .replace(/\([^)]*\)/g, '')
      .split(/\s*\//)[0]
      .trim();
  }

  function normWord(w) {
    return (w || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[.!?,…]/g, '');
  }

  function tokenize(text) {
    return text
      .replace(/[.!?…]+$/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function buildSentences(vocab, lang) {
    const key = lang === 'ko' ? 'ko' : 'pl';
    const sentences = [];
    const seen = new Set();

    (vocab || []).forEach((entry) => {
      let raw = entry[key];
      if (!raw || !raw.includes(' ')) return;
      raw = raw.split(/\s*\/\s*/)[0].trim();
      if (raw.length > MAX_LEN) return;

      const words = tokenize(raw);
      if (words.length < 2 || words.length > MAX_WORDS) return;

      const label = promptLabel(entry.en);
      const sig = normWord(words.join(' '));
      if (!label || seen.has(sig)) return;
      seen.add(sig);

      sentences.push({
        text: raw,
        words,
        label
      });
    });

    return sentences;
  }

  function SentenceSprint(config) {
    this.root = typeof config.root === 'string'
      ? document.querySelector(config.root)
      : config.root;
    this.lang = config.lang || 'pl';
    this.lessonId = config.lessonId || '';
    this.sentences = buildSentences(config.vocab, this.lang);
    this.running = false;
    this.paused = false;
    this.chips = [];
    this.raf = null;
    this.lastTs = 0;
    this.spawnTimer = null;
    this.round = null;
    this.step = 0;
    this.score = 0;
    this.streak = 0;
    this.completed = 0;
    this.target = Math.min(12, Math.max(6, this.sentences.length));
    this.speed = 95;
  }

  SentenceSprint.prototype._shell = function () {
    let lanes = '';
    for (let i = 0; i < LANES; i++) {
      lanes += '<div class="sprint-lane" data-lane="' + i + '"></div>';
    }

    this.root.innerHTML =
      '<div class="sprint-shell">' +
      '<div class="sprint-hud">' +
      '<div class="sprint-stat"><span class="sprint-stat-label">Score</span><strong id="sprintScore">0</strong></div>' +
      '<div class="sprint-stat"><span class="sprint-stat-label">Streak</span><strong id="sprintStreak">🔥 0</strong></div>' +
      '</div>' +
      '<div class="sprint-prompt" id="sprintPrompt">Build: …</div>' +
      '<div class="sprint-slots" id="sprintSlots"></div>' +
      '<div class="sprint-arena" id="sprintArena">' + lanes + '</div>' +
      '<p class="sprint-hint">Tap words in order as they scroll across the lanes!</p>' +
      '<div class="sprint-footer">' +
      '<button type="button" class="sprint-restart" id="sprintRestart">↻ Play again</button>' +
      '</div></div>';

    this.promptEl = this.root.querySelector('#sprintPrompt');
    this.slotsEl = this.root.querySelector('#sprintSlots');
    this.arena = this.root.querySelector('#sprintArena');
    this.laneEls = this.root.querySelectorAll('.sprint-lane');
    this.scoreEl = this.root.querySelector('#sprintScore');
    this.streakEl = this.root.querySelector('#sprintStreak');
    this.restartBtn = this.root.querySelector('#sprintRestart');

    this.restartBtn.addEventListener('click', () => this.restart());
    this.arena.addEventListener('click', (e) => this._onChipClick(e));
  };

  SentenceSprint.prototype._updateHud = function () {
    this.scoreEl.textContent = String(this.score);
    this.streakEl.textContent = '🔥 ' + this.streak;
  };

  SentenceSprint.prototype._renderSlots = function () {
    if (!this.round) return;
    this.slotsEl.innerHTML = this.round.words.map((w, i) => {
      let cls = 'sprint-slot';
      if (i < this.step) cls += ' filled';
      if (i === this.step) cls += ' next';
      return '<span class="' + cls + '">' + (i < this.step ? w : '?') + '</span>';
    }).join('');
  };

  SentenceSprint.prototype._pickRound = function () {
    if (!this.sentences.length) return null;
    return this.sentences[Math.floor(Math.random() * this.sentences.length)];
  };

  SentenceSprint.prototype._distractorWord = function () {
    const others = shuffle(this.sentences.filter((s) => s !== this.round));
    const pool = [];
    others.forEach((s) => pool.push(...s.words));
    if (this.round) pool.push(...this.round.words.filter((_, i) => i !== this.step));
    if (!pool.length) return '…';
    return pool[Math.floor(Math.random() * pool.length)];
  };

  SentenceSprint.prototype._spawnWord = function () {
    if (!this.running || this.paused || !this.round) return;

    const lane = Math.floor(Math.random() * LANES);
    const laneEl = this.laneEls[lane];
    const need = this.round.words[this.step];
    const word = Math.random() < 0.55 && need
      ? need
      : this._distractorWord();

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sprint-chip' + (this.lang === 'ko' ? ' ko' : '');
    if (word.length > 14) btn.classList.add('long');
    btn.textContent = word;
    btn.dataset.word = word;

    const laneW = laneEl.clientWidth || 280;
    const x = laneW + 20;
    btn.style.left = x + 'px';
    laneEl.appendChild(btn);

    this.chips.push({
      el: btn,
      lane,
      x,
      speed: this.speed + Math.random() * 35,
      word
    });
  };

  SentenceSprint.prototype._clearChips = function () {
    this.chips.forEach((c) => c.el.remove());
    this.chips = [];
  };

  SentenceSprint.prototype._tick = function (ts) {
    if (!this.running || this.paused) return;
    if (!this.lastTs) this.lastTs = ts;
    const dt = Math.min(32, ts - this.lastTs) / 1000;
    this.lastTs = ts;

    const remove = [];
    this.chips.forEach((chip) => {
      chip.x -= chip.speed * dt;
      chip.el.style.left = chip.x + 'px';
      const laneEl = this.laneEls[chip.lane];
      if (chip.x < -chip.el.offsetWidth - 10) remove.push(chip);
    });
    remove.forEach((chip) => {
      chip.el.remove();
      this.chips = this.chips.filter((c) => c !== chip);
    });

    this.raf = requestAnimationFrame((t) => this._tick(t));
  };

  SentenceSprint.prototype._onWrong = function () {
    this.streak = 0;
    this._updateHud();
    this.arena.classList.add('sprint-shake');
    setTimeout(() => this.arena.classList.remove('sprint-shake'), 400);
  };

  SentenceSprint.prototype._onChipClick = function (e) {
    const btn = e.target.closest('.sprint-chip');
    if (!btn || !this.round || !this.running || this.paused) return;

    const word = btn.dataset.word || btn.textContent;
    const expected = this.round.words[this.step];
    const ok = normWord(word) === normWord(expected);

    btn.classList.add(ok ? 'hit-ok' : 'hit-bad');
    setTimeout(() => btn.remove(), ok ? 180 : 220);
    this.chips = this.chips.filter((c) => c.el !== btn);

    if (ok) {
      this.step++;
      this._renderSlots();
      if (this.step >= this.round.words.length) {
        this._completeSentence();
      }
    } else {
      this._onWrong();
    }
  };

  SentenceSprint.prototype._completeSentence = function () {
    this.score++;
    this.streak++;
    this.completed++;
    this.speed = Math.min(165, this.speed + 4);
    this._updateHud();
    if (global.PlayerXP && global.PlayerXP.grant) {
      global.PlayerXP.grant(XP_PER_SENTENCE);
    }
    this.promptEl.classList.add('sprint-flash-ok');
    setTimeout(() => this.promptEl.classList.remove('sprint-flash-ok'), 350);

    this._clearChips();

    if (this.completed >= this.target) {
      this._gameWin();
      return;
    }

    setTimeout(() => this._startRound(), 550);
  };

  SentenceSprint.prototype._startRound = function () {
    this.round = this._pickRound();
    if (!this.round) return;
    this.step = 0;
    this.promptEl.innerHTML = 'Build: <strong>' + this.round.label + '</strong>';
    this._renderSlots();
  };

  SentenceSprint.prototype._gameWin = function () {
    this.stop();
    this.promptEl.innerHTML =
      '🏆 Sentence master! Score <strong>' + this.score + '</strong> · 🔥 ' + this.streak;
    this.restartBtn.style.display = '';
    if (typeof this.onRoundComplete === 'function') this.onRoundComplete();
  };

  SentenceSprint.prototype.restart = function () {
    this.stop();
    this.score = 0;
    this.streak = 0;
    this.completed = 0;
    this.speed = 95;
    this.target = this.mixMode
      ? Math.min(5, Math.max(3, this.sentences.length))
      : Math.min(12, Math.max(6, this.sentences.length));
    this.restartBtn.style.display = 'none';
    this._updateHud();
    this.start();
  };

  SentenceSprint.prototype.start = function () {
    if (!this.sentences.length) {
      this.promptEl.textContent = 'No sentences found for this lesson.';
      return;
    }
    this.running = true;
    this.paused = false;
    this.lastTs = 0;
    this.restartBtn.style.display = 'none';
    this._startRound();
    this._updateHud();
    this.spawnTimer = setInterval(() => this._spawnWord(), 720);
    this.raf = requestAnimationFrame((t) => this._tick(t));
  };

  SentenceSprint.prototype.stop = function () {
    this.running = false;
    this.paused = false;
    clearInterval(this.spawnTimer);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this._clearChips();
  };

  SentenceSprint.prototype.pause = function () {
    if (!this.running) return;
    this.paused = true;
    clearInterval(this.spawnTimer);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this._clearChips();
  };

  SentenceSprint.prototype.resume = function () {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.lastTs = 0;
    this.spawnTimer = setInterval(() => this._spawnWord(), 720);
    this.raf = requestAnimationFrame((t) => this._tick(t));
  };

  SentenceSprint.create = function (config) {
    const game = new SentenceSprint(config);
    game._shell();
    return game;
  };

  global.SentenceSprint = SentenceSprint;
})(typeof window !== 'undefined' ? window : globalThis);
