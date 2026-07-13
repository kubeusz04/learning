/**
 * Odd One Out — pick the word that doesn't fit the lesson theme.
 */
(function (global) {
  'use strict';

  const XP_CORRECT = 5;
  const XP_WIN = 15;
  const MAX_ROUNDS = 10;
  const OPTIONS = 4;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function firstForm(text) {
    if (!text) return '';
    return text.split(/\s*\/\s*/)[0].replace(/\([^)]*\)/g, '').trim();
  }

  function buildLessonWords(vocab, lang) {
    const key = lang === 'ko' ? 'ko' : 'pl';
    const words = [];
    (vocab || []).forEach((entry) => {
      const form = firstForm(entry[key]);
      if (form && form.length <= 40) words.push(form);
    });
    return [...new Set(words)];
  }

  function prepareRound(raw) {
    const items = raw.words.map((text, i) => ({
      text,
      isOdd: i === raw.odd
    }));
    return shuffle(items);
  }

  function autoRound(lessonWords, foreignWords) {
    const pool = lessonWords.filter((w) => w.split(' ').length <= 3);
    const foreign = foreignWords.filter((w) => !pool.includes(w));
    if (pool.length < 3 || !foreign.length) return null;

    const picked = shuffle(pool).slice(0, 3);
    const oddWord = foreign[Math.floor(Math.random() * foreign.length)];
    const words = picked.concat([oddWord]);
    return prepareRound({
      words,
      odd: words.indexOf(oddWord)
    });
  }

  function buildSession(rounds, lessonWords, foreignWords) {
    const curated = shuffle(rounds || []).map(prepareRound);
    const session = curated.slice(0, MAX_ROUNDS);

    while (session.length < Math.min(MAX_ROUNDS, Math.max(6, curated.length + 2))) {
      const auto = autoRound(lessonWords, foreignWords);
      if (!auto) break;
      session.push(auto);
    }

    return session.slice(0, MAX_ROUNDS);
  }

  function OddOneOut(config) {
    this.root = typeof config.root === 'string'
      ? document.querySelector(config.root)
      : config.root;
    this.lang = config.lang || 'pl';
    this.lessonId = config.lessonId || '';
    this.lessonWords = buildLessonWords(config.vocab, this.lang);
    this.foreignWords = config.foreignWords || global.ODD_ONE_FOREIGN || [];
    this.curatedRounds = config.rounds || global.ODD_ONE_ROUNDS || [];
    this.running = false;
    this.paused = false;
    this.busy = false;
    this.session = [];
    this.roundIdx = 0;
    this.score = 0;
    this.streak = 0;
    this.correct = 0;
  }

  OddOneOut.prototype._shell = function () {
    this.root.innerHTML =
      '<div class="odd-shell">' +
      '<div class="odd-hud">' +
      '<div class="odd-stat"><span class="odd-stat-label">Score</span><strong id="oddScore">0</strong></div>' +
      '<div class="odd-stat"><span class="odd-stat-label">Streak</span><strong id="oddStreak">🔥 0</strong></div>' +
      '<div class="odd-stat"><span class="odd-stat-label">Round</span><strong id="oddRound">1/' + MAX_ROUNDS + '</strong></div>' +
      '</div>' +
      '<p class="odd-prompt" id="oddPrompt">Which word doesn\'t belong?</p>' +
      '<div class="odd-grid" id="oddGrid"></div>' +
      '<p class="odd-msg" id="oddMsg">Cross-lesson review — spot the word from another topic!</p>' +
      '<div class="odd-footer">' +
      '<button type="button" class="odd-restart" id="oddRestart">↻ Play again</button>' +
      '</div></div>';

    this.promptEl = this.root.querySelector('#oddPrompt');
    this.gridEl = this.root.querySelector('#oddGrid');
    this.msgEl = this.root.querySelector('#oddMsg');
    this.scoreEl = this.root.querySelector('#oddScore');
    this.streakEl = this.root.querySelector('#oddStreak');
    this.roundEl = this.root.querySelector('#oddRound');
    this.restartBtn = this.root.querySelector('#oddRestart');
    this.restartBtn.addEventListener('click', () => this.start());
  };

  OddOneOut.prototype._updateHud = function () {
    this.scoreEl.textContent = String(this.score);
    this.streakEl.textContent = '🔥 ' + this.streak;
    this.roundEl.textContent = Math.min(this.roundIdx + 1, this.session.length) + '/' + this.session.length;
  };

  OddOneOut.prototype._renderRound = function () {
    const round = this.session[this.roundIdx];
    if (!round) {
      this._win();
      return;
    }

    this.busy = false;
    this.gridEl.innerHTML = '';
    const langClass = this.lang === 'ko' ? ' ko' : ' pl';

    round.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'odd-word' + langClass + (item.text.length > 16 ? ' long' : '');
      btn.textContent = item.text;
      btn.dataset.idx = String(idx);
      btn.addEventListener('click', () => this._pick(item, btn));
      this.gridEl.appendChild(btn);
    });

    this.msgEl.textContent = 'Tap the odd one out — mixed review from other lessons!';
    this._updateHud();
  };

  OddOneOut.prototype._pick = function (item, btn) {
    if (this.busy || this.paused || !this.running) return;
    this.busy = true;

    this.gridEl.querySelectorAll('.odd-word').forEach((b) => { b.disabled = true; });

    if (item.isOdd) {
      btn.classList.add('correct');
      this.correct++;
      this.streak++;
      this.score += 10;
      if (global.PlayerXP && global.PlayerXP.grant) global.PlayerXP.grant(XP_CORRECT);
      this.msgEl.textContent = '🎯 Correct! That one is from another lesson.';
    } else {
      btn.classList.add('wrong');
      this.streak = 0;
      this.gridEl.querySelectorAll('.odd-word').forEach((b) => {
        const i = Number(b.dataset.idx);
        if (this.session[this.roundIdx][i].isOdd) b.classList.add('correct');
      });
      this.msgEl.textContent = 'Not that one — look for the different topic!';
    }

    this._updateHud();
    setTimeout(() => {
      this.roundIdx++;
      if (this.roundIdx >= this.session.length) this._win();
      else this._renderRound();
    }, 850);
  };

  OddOneOut.prototype._win = function () {
    this.running = false;
    this.gridEl.innerHTML = '';
    if (global.PlayerXP && global.PlayerXP.grant) global.PlayerXP.grant(XP_WIN);
    this.promptEl.textContent = '🏆 Sharp eye!';
    this.msgEl.textContent = 'You spotted ' + this.correct + ' odd words. +' + XP_WIN + ' XP bonus!';
    if (typeof this.onRoundComplete === 'function') this.onRoundComplete();
  };

  OddOneOut.prototype.start = function () {
    this.session = buildSession(this.curatedRounds, this.lessonWords, this.foreignWords);
    if (!this.session.length) {
      this.msgEl.textContent = 'Not enough words for Odd One Out.';
      return;
    }

    this.running = true;
    this.paused = false;
    this.busy = false;
    this.roundIdx = 0;
    this.score = 0;
    this.streak = 0;
    this.correct = 0;
    this.promptEl.textContent = 'Which word doesn\'t belong?';
    this._renderRound();
  };

  OddOneOut.prototype.pause = function () {
    this.paused = true;
  };

  OddOneOut.prototype.resume = function () {
    this.paused = false;
  };

  OddOneOut.create = function (config) {
    const game = new OddOneOut(config);
    game._shell();
    return game;
  };

  global.OddOneOut = OddOneOut;
})(typeof window !== 'undefined' ? window : globalThis);
