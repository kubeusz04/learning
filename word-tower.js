/**
 * Word Tower — build sentences block by block; wrong word wobbles the tower.
 */
(function (global) {
  'use strict';

  const XP_PER_LEVEL = 7;
  const XP_WIN_BONUS = 18;
  const MAX_BANK = 9;
  const WORD_TIME = 12;
  const WORD_TIME_MIX = 8;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function normWord(w) {
    return (w || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[.!?,…]/g, '')
      .trim();
  }

  function buildBank(level, allLevels) {
    const required = level.slots.slice();
    const set = new Set(required);

    required.forEach((w) => set.add(w));
    (level.extra || []).forEach((w) => set.add(w));

    allLevels.forEach((other) => {
      if (other === level) return;
      other.slots.forEach((w) => set.add(w));
      (other.extra || []).forEach((w) => set.add(w));
      if (other.foundation) set.add(other.foundation);
    });

    required.forEach((w) => set.delete(w));
    const extras = shuffle(Array.from(set));
    const bank = required.concat(extras).slice(0, MAX_BANK);

    if (bank.length < required.length + 2) {
      required.forEach((w) => {
        if (!bank.includes(w)) bank.push(w);
      });
    }

    return shuffle(bank);
  }

  function WordTower(config) {
    this.root = typeof config.root === 'string'
      ? document.querySelector(config.root)
      : config.root;
    this.lang = config.lang || 'pl';
    this.lessonId = config.lessonId || '';
    this.levels = (config.levels || []).filter((l) => l.slots && l.slots.length > 0);
    this.running = false;
    this.paused = false;
    this.levelIdx = 0;
    this.step = 0;
    this.placed = [];
    this.bank = [];
    this.score = 0;
    this.streak = 0;
    this.completed = 0;
    this.busy = false;
    this.timerMs = WORD_TIME * 1000;
    this.timerEnd = 0;
    this.timerRaf = 0;
    this.timerPausedLeft = 0;
  }

  WordTower.prototype._shell = function () {
    this.root.innerHTML =
      '<div class="tower-shell">' +
      '<div class="tower-hud">' +
      '<div class="tower-stat"><span class="tower-stat-label">Score</span><strong id="towerScore">0</strong></div>' +
      '<div class="tower-stat"><span class="tower-stat-label">Streak</span><strong id="towerStreak">🔥 0</strong></div>' +
      '<div class="tower-stat"><span class="tower-stat-label">Tower</span><strong id="towerProgress">1/' +
      Math.max(1, this.levels.length) + '</strong></div>' +
      '</div>' +
      '<div class="tower-mission" id="towerMission">' +
      '<p class="tower-mission-label">Sentence goal</p>' +
      '<p class="tower-mission-en" id="towerMissionEn">…</p>' +
      '<div class="tower-mission-next-wrap">' +
      '<span class="tower-mission-next-label">Next word to place</span>' +
      '<strong class="tower-mission-next" id="towerMissionNext">…</strong>' +
      '<span class="tower-mission-next-en" id="towerMissionNextEn"></span>' +
      '</div>' +
      '<div class="tower-timer-wrap">' +
      '<div class="tower-timer-bar"><div class="tower-timer-fill" id="towerTimerFill"></div></div>' +
      '<span class="tower-timer-num" id="towerTimerNum">' + WORD_TIME + '</span>' +
      '</div>' +
      '</div>' +
      '<div class="tower-prompt" id="towerPrompt">Build: …</div>' +
      '<div class="tower-scene">' +
      '<div class="tower-stack" id="towerStack"></div>' +
      '</div>' +
      '<div class="tower-bank" id="towerBank"></div>' +
      '<p class="tower-msg" id="towerMsg">Place each word before the timer runs out!</p>' +
      '<div class="tower-footer">' +
      '<button type="button" class="tower-restart" id="towerRestart">↻ Play again</button>' +
      '</div></div>';

    this.promptEl = this.root.querySelector('#towerPrompt');
    this.missionEnEl = this.root.querySelector('#towerMissionEn');
    this.missionNextEl = this.root.querySelector('#towerMissionNext');
    this.missionNextEnEl = this.root.querySelector('#towerMissionNextEn');
    this.stackEl = this.root.querySelector('#towerStack');
    this.bankEl = this.root.querySelector('#towerBank');
    this.msgEl = this.root.querySelector('#towerMsg');
    this.scoreEl = this.root.querySelector('#towerScore');
    this.streakEl = this.root.querySelector('#towerStreak');
    this.progressEl = this.root.querySelector('#towerProgress');
    this.sceneEl = this.root.querySelector('.tower-scene');
    this.restartBtn = this.root.querySelector('#towerRestart');

    this.restartBtn.addEventListener('click', () => this.start());
  };

  WordTower.prototype._timerDuration = function () {
    return this.mixMode ? WORD_TIME_MIX : WORD_TIME;
  };

  WordTower.prototype._clearTimer = function () {
    if (this.timerRaf) {
      cancelAnimationFrame(this.timerRaf);
      this.timerRaf = 0;
    }
    this.timerEnd = 0;
    this.timerPausedLeft = 0;
  };

  WordTower.prototype._updateTimerUi = function (ratio, secondsLeft) {
    const fill = this.root.querySelector('#towerTimerFill');
    const num = this.root.querySelector('#towerTimerNum');
    const wrap = this.root.querySelector('.tower-timer-wrap');
    if (fill) fill.style.width = Math.max(0, Math.round(ratio * 100)) + '%';
    if (num) num.textContent = String(Math.max(0, secondsLeft));
    if (wrap) {
      wrap.classList.toggle('tower-timer-wrap--urgent', secondsLeft <= 3);
      wrap.classList.toggle('tower-timer-wrap--warn', secondsLeft > 3 && secondsLeft <= 6);
    }
  };

  WordTower.prototype._startTimer = function () {
    this._clearTimer();
    if (!this.running || this.paused || this.busy) return;

    const level = this._currentLevel();
    if (!level || this.step >= level.slots.length) return;

    const duration = this._timerDuration() * 1000;
    this.timerMs = duration;
    this.timerEnd = performance.now() + duration;

    const tick = () => {
      if (!this.running || this.paused || this.busy) return;
      const left = Math.max(0, this.timerEnd - performance.now());
      const ratio = left / duration;
      this._updateTimerUi(ratio, Math.ceil(left / 1000));

      if (left <= 0) {
        this.timerRaf = 0;
        this._onTimeout();
        return;
      }
      this.timerRaf = requestAnimationFrame(tick);
    };

    this.timerRaf = requestAnimationFrame(tick);
  };

  WordTower.prototype._pauseTimer = function () {
    if (!this.timerEnd || this.busy) return;
    this.timerPausedLeft = Math.max(0, this.timerEnd - performance.now());
    if (this.timerRaf) {
      cancelAnimationFrame(this.timerRaf);
      this.timerRaf = 0;
    }
  };

  WordTower.prototype._resumeTimer = function () {
    if (!this.timerPausedLeft || this.busy) return;
    const level = this._currentLevel();
    if (!level || this.step >= level.slots.length) return;

    this.timerEnd = performance.now() + this.timerPausedLeft;
    this.timerPausedLeft = 0;
    const duration = this.timerMs;

    const tick = () => {
      if (!this.running || this.paused || this.busy) return;
      const left = Math.max(0, this.timerEnd - performance.now());
      const ratio = left / duration;
      this._updateTimerUi(ratio, Math.ceil(left / 1000));
      if (left <= 0) {
        this.timerRaf = 0;
        this._onTimeout();
        return;
      }
      this.timerRaf = requestAnimationFrame(tick);
    };

    this.timerRaf = requestAnimationFrame(tick);
  };

  WordTower.prototype._slotHintEn = function (level, step) {
    if (level.slotEn && level.slotEn[step]) return level.slotEn[step];
    return '';
  };

  WordTower.prototype._updateHud = function () {
    this.scoreEl.textContent = String(this.score);
    this.streakEl.textContent = '🔥 ' + this.streak;
    this.progressEl.textContent = (this.levelIdx + 1) + '/' + this.levels.length;
  };

  WordTower.prototype._currentLevel = function () {
    return this.levels[this.levelIdx];
  };

  WordTower.prototype._renderStack = function () {
    const level = this._currentLevel();
    if (!level) return;

    const langClass = this.lang === 'ko' ? ' ko' : ' pl';
    let html = '<div class="tower-block foundation' + langClass + '">' + level.foundation + '</div>';

    this.placed.forEach((word) => {
      html += '<div class="tower-block placed' + langClass + '">' + word + '</div>';
    });

    const remaining = level.slots.length - this.step;
    for (let i = 0; i < remaining; i++) {
      html += '<div class="tower-block empty">?</div>';
    }

    this.stackEl.innerHTML = html;
  };

  WordTower.prototype._renderPrompt = function () {
    const level = this._currentLevel();
    if (!level) return;

    const langClass = this.lang === 'ko' ? ' ko' : ' pl';
    const parts = ['<span class="tower-build-foundation' + langClass + '">' + level.foundation + '</span>'];
    this.placed.forEach((word) => {
      parts.push('<span class="tower-build-placed' + langClass + '">' + word + '</span>');
    });

    for (let i = this.step; i < level.slots.length; i++) {
      const cls = i === this.step ? ' tower-build-active' : '';
      parts.push('<span class="tower-build-empty' + cls + '">___</span>');
    }

    this.promptEl.innerHTML = 'Your tower: ' + parts.join(' ');

    this.missionEnEl.textContent = level.en || '';

    if (this.step < level.slots.length) {
      const nextWord = level.slots[this.step];
      const nextEn = this._slotHintEn(level, this.step);
      this.missionNextEl.textContent = nextWord;
      this.missionNextEl.className = 'tower-mission-next' + langClass;
      this.missionNextEnEl.textContent = nextEn
        ? ('= ' + nextEn + ' · block ' + (this.step + 1) + '/' + level.slots.length)
        : ('Block ' + (this.step + 1) + ' of ' + level.slots.length);
    } else {
      this.missionNextEl.textContent = '—';
      this.missionNextEnEl.textContent = '';
    }
  };

  WordTower.prototype._renderBank = function () {
    const level = this._currentLevel();
    if (!level) return;

    const langClass = this.lang === 'ko' ? ' ko' : ' pl';
    this.bankEl.innerHTML = '';

    this.bank.forEach((word, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tower-chip' + langClass + (word.length > 14 ? ' long' : '');
      btn.textContent = word;
      btn.dataset.idx = String(idx);
      btn.addEventListener('click', () => this._onPick(word, idx, btn));
      this.bankEl.appendChild(btn);
    });
  };

  WordTower.prototype._loadLevel = function () {
    const level = this._currentLevel();
    if (!level) {
      if (!this.levels.length) {
        this.running = false;
        this.msgEl.textContent = 'No tower levels for this lesson.';
        return;
      }
      this._win();
      return;
    }

    this.step = 0;
    this.placed = [];
    this.bank = buildBank(level, this.levels);
    this.msgEl.textContent = 'Pick the highlighted word before time runs out!';
    this._renderStack();
    this._renderPrompt();
    this._renderBank();
    this._updateHud();
    this._startTimer();
  };

  WordTower.prototype._failPick = function (message) {
    this.busy = true;
    this._clearTimer();
    this.streak = 0;
    this.sceneEl.classList.add('wobble');
    setTimeout(() => this.sceneEl.classList.remove('wobble'), 650);

    if (this.placed.length > 0) {
      this.placed.pop();
      this.step = Math.max(0, this.step - 1);
      this.msgEl.textContent = message;
      this._renderStack();
      this._renderPrompt();
    } else {
      this.msgEl.textContent = message.replace('Lost a floor.', 'Try again.');
    }

    this._updateHud();
    this.busy = false;
    this._startTimer();
  };

  WordTower.prototype._onTimeout = function () {
    if (this.busy || !this.running || this.paused) return;
    this._failPick('⏱️ Time\'s up! Lost a floor.');
  };

  WordTower.prototype._onPick = function (word, idx, btn) {
    if (this.paused || !this.running || btn.disabled || this.busy) return;

    const level = this._currentLevel();
    if (!level) return;

    this.busy = true;
    this._clearTimer();

    const expected = level.slots[this.step];
    const ok = normWord(word) === normWord(expected);

    if (ok) {
      btn.disabled = true;
      btn.classList.add('used');
      this.placed.push(word);
      this.step++;
      this.score += 2;
      this.streak++;
      this._renderStack();
      this._renderPrompt();
      this._updateHud();

      if (this.step >= level.slots.length) {
        this.completed++;
        this.score += 5;
        if (global.PlayerXP && global.PlayerXP.grant) global.PlayerXP.grant(XP_PER_LEVEL);
        this.msgEl.textContent = '🏗️ Tower complete! ' + (level.en || '');
        this.busy = false;

        setTimeout(() => {
          if (!this.running) return;
          if (this.mixSingleLevel) {
            this._win();
            return;
          }
          this.levelIdx++;
          this._loadLevel();
        }, 900);
      } else {
        this.msgEl.textContent = '✓ Good block!';
        this.busy = false;
        this._startTimer();
      }
    } else {
      this._failPick('💥 Wrong block! Lost a floor.');
    }
  };

  WordTower.prototype._win = function () {
    this.running = false;
    this._clearTimer();
    this.msgEl.textContent = '🏆 All towers built! Amazing!';
    if (global.PlayerXP && global.PlayerXP.grant) global.PlayerXP.grant(XP_WIN_BONUS);
    this.promptEl.innerHTML = 'Done! Score: <strong>' + this.score + '</strong>';
    this.missionNextEl.textContent = '—';
    this.missionNextEnEl.textContent = '';
    this.bankEl.innerHTML = '';
    if (typeof this.onRoundComplete === 'function') this.onRoundComplete();
  };

  WordTower.prototype.start = function () {
    if (!this.levels.length) {
      this.msgEl.textContent = 'No tower levels for this lesson.';
      return;
    }

    this.running = true;
    this.paused = false;
    this.busy = false;
    this._clearTimer();
    this.levelIdx = 0;
    this.score = 0;
    this.streak = 0;
    this.completed = 0;
    this._loadLevel();
  };

  WordTower.prototype.pause = function () {
    this.paused = true;
    this._pauseTimer();
  };

  WordTower.prototype.resume = function () {
    this.paused = false;
    if (this.running && !this.busy) this._resumeTimer();
  };

  WordTower.create = function (config) {
    const levels = config.levels || global.TOWER_LEVELS || [];
    const game = new WordTower({ ...config, levels });
    game._shell();
    return game;
  };

  global.WordTower = WordTower;
})(typeof window !== 'undefined' ? window : globalThis);
