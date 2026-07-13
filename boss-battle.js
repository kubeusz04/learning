/**
 * Boss Battle — attack with vocab hits; defend against boss word attacks.
 * Weighted toward words missed in Standard Practice.
 */
(function (global) {
  'use strict';

  const XP_PER_HIT = 5;
  const XP_WIN = 25;
  const BOSS_HP_PER_WORD = 12;
  const MIN_BOSS_HP = 80;
  const PLAYER_DAMAGE = 10;
  const BOSS_DAMAGE = 1;
  const PLAYER_HEARTS = 5;
  const ROUND_TIME = 8;
  const ROUND_TIME_MIX = 6;
  const OPTIONS = 4;

  const ATTACK_TYPES = [
    { id: 'all', label: 'All', icon: '🎯' },
    { id: 'pronoun', label: 'Pronouns', icon: '👤' },
    { id: 'verb', label: 'Verbs', icon: '⚡' },
    { id: 'adjective', label: 'Adjectives', icon: '✨' },
    { id: 'phrase', label: 'Phrases', icon: '💬' }
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function norm(s) {
    return (s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[.!?,…]/g, '');
  }

  function firstForm(text) {
    if (!text) return '';
    return text.split(/\s*\/\s*/)[0].replace(/\([^)]*\)/g, '').trim();
  }

  function promptLabel(en) {
    return en
      .replace(/\([^)]*\)/g, '')
      .split(/\s*\//)[0]
      .trim();
  }

  function categorizeEntry(entry, lang) {
    const key = lang === 'ko' ? 'ko' : 'pl';
    const form = firstForm(entry[key]);
    const en = (entry.en || '').toLowerCase();

    if (!form) return 'word';

    if (form.includes(' ') || form.length > 22) return 'phrase';

    if (
      /^(i|you|he|she|it|we|they|me|my|your|him|her|us|them)\b/.test(en) ||
      /\b(object|reflexive|topic|singular|plural)\b/.test(en) ||
      ['ja', 'ty', 'on', 'ona', 'ono', 'my', 'wy', 'mnie', 'cię', 'się', 'oni', 'one'].includes(norm(form)) ||
      ['나', '너', '너는', '나는', '널', '내'].includes(form)
    ) {
      return 'pronoun';
    }

    if (
      /^to /.test(en) ||
      /\b(verb|infinitive|imperative|ending)\b/.test(en) ||
      /(ć|cie|cz|się)$/.test(form) ||
      /(하다|해|다|줘|고 있어)$/.test(form)
    ) {
      return 'verb';
    }

    if (
      /(ny|na|ne|ły|ła|le|my|mi|te|ty|ki|ka|kie|wszy|wska|wskie)$/.test(form) ||
      /(한|운|워|해|야|네|같|적)/.test(form) ||
      /\b(wonderful|amazing|perfect|beautiful|happy|best|hot|cold|awful|ideal|tight)\b/.test(en) ||
      en.includes('adj')
    ) {
      return 'adjective';
    }

    return 'word';
  }

  function buildPool(vocab, lang, attackType) {
    const key = lang === 'ko' ? 'ko' : 'pl';
    const pool = [];

    (vocab || []).forEach((entry, idx) => {
      const form = firstForm(entry[key]);
      const label = promptLabel(entry.en);
      if (!form || !label || form.length > 48) return;

      const category = categorizeEntry(entry, lang);
      if (attackType !== 'all' && category !== attackType) return;

      pool.push({
        id: idx,
        form,
        label,
        category,
        long: form.length > 16,
        ko: lang === 'ko'
      });
    });

    return pool;
  }

  function weightedPick(pool, lessonId) {
    if (!pool.length) return null;
    const PM = global.PracticeMistakes;
    let total = 0;
    const weights = pool.map((w) => {
      const wt = PM && PM.weightFor ? PM.weightFor(lessonId, w.form) : 1;
      total += wt;
      return wt;
    });
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function pickOptions(correct, pool, getText) {
    const opts = [{ text: getText(correct), correct: true, word: correct }];
    const used = new Set([norm(getText(correct))]);
    const shuffled = shuffle(pool.filter((w) => w !== correct));

    for (let i = 0; i < shuffled.length && opts.length < OPTIONS; i++) {
      const t = getText(shuffled[i]);
      const k = norm(t);
      if (used.has(k)) continue;
      used.add(k);
      opts.push({ text: t, correct: false, word: shuffled[i] });
    }

    while (opts.length < OPTIONS && pool.length > opts.length) {
      const w = pool[Math.floor(Math.random() * pool.length)];
      const t = getText(w);
      const k = norm(t);
      if (!used.has(k)) {
        used.add(k);
        opts.push({ text: t, correct: false, word: w });
      }
    }

    return shuffle(opts);
  }

  function BossBattle(config) {
    this.root = typeof config.root === 'string'
      ? document.querySelector(config.root)
      : config.root;
    this.lang = config.lang || 'pl';
    this.lessonId = config.lessonId || '';
    this.vocab = config.vocab || [];
    this.running = false;
    this.paused = false;
    this.phase = 'setup';
    this.attackType = 'all';
    this.pool = [];
    this.bossHp = 100;
    this.bossMaxHp = 100;
    this.hits = 0;
    this.score = 0;
    this.turn = 'player';
    this.busy = false;
    this.playerHearts = PLAYER_HEARTS;
    this.playerMaxHearts = PLAYER_HEARTS;
    this.timerMs = ROUND_TIME * 1000;
    this.timerEnd = 0;
    this.timerRaf = 0;
    this.timerPausedLeft = 0;
  }

  BossBattle.prototype._shell = function () {
    this.root.innerHTML =
      '<div class="boss-shell">' +
      '<div class="boss-hud">' +
      '<div class="boss-stat"><span class="boss-stat-label">Score</span><strong id="bossScore">0</strong></div>' +
      '<div class="boss-stat"><span class="boss-stat-label">Hits</span><strong id="bossHits">0</strong></div>' +
      '<div class="boss-hearts" id="bossPlayerHearts" aria-label="Your health"></div>' +
      '</div>' +
      '<div class="boss-arena" id="bossArena"></div>' +
      '<div class="boss-action" id="bossAction" hidden></div>' +
      '<p class="boss-msg" id="bossMsg"></p>' +
      '<div class="boss-footer">' +
      '<button type="button" class="boss-restart" id="bossRestart" hidden>↻ Fight again</button>' +
      '</div></div>';

    this.arenaEl = this.root.querySelector('#bossArena');
    this.actionEl = this.root.querySelector('#bossAction');
    this.msgEl = this.root.querySelector('#bossMsg');
    this.scoreEl = this.root.querySelector('#bossScore');
    this.hitsEl = this.root.querySelector('#bossHits');
    this.heartsEl = this.root.querySelector('#bossPlayerHearts');
    this.restartBtn = this.root.querySelector('#bossRestart');
    this.restartBtn.addEventListener('click', () => this.start());
  };

  BossBattle.prototype._updateHud = function () {
    this.scoreEl.textContent = String(this.score);
    this.hitsEl.textContent = String(this.hits);
    if (this.heartsEl) {
      let hearts = '';
      for (let i = 0; i < this.playerMaxHearts; i++) {
        hearts += i < this.playerHearts ? '❤️' : '🖤';
      }
      this.heartsEl.textContent = hearts;
    }
  };

  BossBattle.prototype._clearTimer = function () {
    if (this.timerRaf) {
      cancelAnimationFrame(this.timerRaf);
      this.timerRaf = 0;
    }
    this.timerEnd = 0;
    this.timerPausedLeft = 0;
  };

  BossBattle.prototype._timerDuration = function () {
    return this.mixMode ? ROUND_TIME_MIX : ROUND_TIME;
  };

  BossBattle.prototype._updateTimerUi = function (ratio, secondsLeft) {
    const fill = this.root.querySelector('#bossTimerFill');
    const num = this.root.querySelector('#bossTimerNum');
    const wrap = this.root.querySelector('.boss-timer-wrap');
    if (fill) fill.style.width = Math.max(0, Math.round(ratio * 100)) + '%';
    if (num) num.textContent = String(Math.max(0, secondsLeft));
    if (wrap) {
      wrap.classList.toggle('boss-timer-wrap--urgent', secondsLeft <= 2);
      wrap.classList.toggle('boss-timer-wrap--warn', secondsLeft > 2 && secondsLeft <= 4);
    }
  };

  BossBattle.prototype._startTimer = function () {
    this._clearTimer();
    const duration = this._timerDuration() * 1000;
    this.timerMs = duration;
    this.timerEnd = performance.now() + duration;
    this.timerPausedLeft = 0;

    const tick = () => {
      if (!this.running || this.paused || this.phase !== 'fight' || this.busy) return;
      const left = Math.max(0, this.timerEnd - performance.now());
      const ratio = left / duration;
      const secondsLeft = Math.ceil(left / 1000);
      this._updateTimerUi(ratio, secondsLeft);

      if (left <= 0) {
        this.timerRaf = 0;
        this._onTimeout();
        return;
      }
      this.timerRaf = requestAnimationFrame(tick);
    };

    this.timerRaf = requestAnimationFrame(tick);
  };

  BossBattle.prototype._pauseTimer = function () {
    if (!this.timerEnd || this.busy) return;
    this.timerPausedLeft = Math.max(0, this.timerEnd - performance.now());
    if (this.timerRaf) {
      cancelAnimationFrame(this.timerRaf);
      this.timerRaf = 0;
    }
  };

  BossBattle.prototype._resumeTimer = function () {
    if (!this.timerPausedLeft || this.busy || this.phase !== 'fight') return;
    this.timerEnd = performance.now() + this.timerPausedLeft;
    this.timerPausedLeft = 0;
    const duration = this.timerMs;
    const tick = () => {
      if (!this.running || this.paused || this.phase !== 'fight' || this.busy) return;
      const left = Math.max(0, this.timerEnd - performance.now());
      const ratio = left / duration;
      const secondsLeft = Math.ceil(left / 1000);
      this._updateTimerUi(ratio, secondsLeft);
      if (left <= 0) {
        this.timerRaf = 0;
        this._onTimeout();
        return;
      }
      this.timerRaf = requestAnimationFrame(tick);
    };
    this.timerRaf = requestAnimationFrame(tick);
  };

  BossBattle.prototype._renderSetup = function () {
    this.phase = 'setup';
    this.actionEl.hidden = true;
    this.restartBtn.hidden = true;

    let types = '';
    ATTACK_TYPES.forEach((t) => {
      types +=
        '<button type="button" class="boss-type' + (this.attackType === t.id ? ' active' : '') +
        '" data-type="' + t.id + '">' + t.icon + ' ' + t.label + '</button>';
    });

    this.arenaEl.innerHTML =
      '<div class="boss-setup">' +
      '<div class="boss-setup-icon">👾</div>' +
      '<h3 class="boss-setup-title">Choose your attack</h3>' +
      '<p class="boss-setup-desc">Answer before the timer runs out — correct hits hurt the boss; too slow and you take damage!</p>' +
      '<div class="boss-types">' + types + '</div>' +
      '<button type="button" class="boss-start" id="bossStartBtn">⚔️ Start battle</button>' +
      '</div>';

    this.arenaEl.querySelectorAll('.boss-type').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.attackType = btn.dataset.type;
        this.arenaEl.querySelectorAll('.boss-type').forEach((b) => {
          b.classList.toggle('active', b === btn);
        });
      });
    });

    this.arenaEl.querySelector('#bossStartBtn').addEventListener('click', () => {
      this._beginFight();
    });

    this.msgEl.textContent = 'Beat the clock — boss attacks when time runs out!';
    if (this.mixAutoStart) this._beginFight();
  };

  BossBattle.prototype._beginFight = function () {
    this.pool = buildPool(this.vocab, this.lang, this.attackType);
    if (this.pool.length < 4) {
      this.pool = buildPool(this.vocab, this.lang, 'all');
      this.attackType = 'all';
    }
    if (this.pool.length < 4) {
      this.msgEl.textContent = 'Not enough vocabulary for Boss Battle.';
      return;
    }

    this.phase = 'fight';
    this.bossMaxHp = Math.max(MIN_BOSS_HP, this.pool.length * BOSS_HP_PER_WORD);
    if (this.mixMode) this.bossMaxHp = Math.min(this.bossMaxHp, 50);
    this.bossHp = this.bossMaxHp;
    this.hits = 0;
    this.score = 0;
    this.playerHearts = PLAYER_HEARTS;
    this.turn = 'player';
    this.busy = false;
    this.running = true;
    this.restartBtn.hidden = false;
    this._clearTimer();
    this._renderBoss();
    this._updateHud();
    this._startRound();
  };

  BossBattle.prototype._renderBoss = function () {
    const pct = Math.max(0, Math.round((this.bossHp / this.bossMaxHp) * 100));
    const hurt = pct < 35 ? ' critical' : (pct < 65 ? ' hurt' : '');

    this.arenaEl.innerHTML =
      '<div class="boss-field">' +
      '<div class="boss-enemy' + hurt + '" id="bossEnemy">' +
      '<span class="boss-sprite">👾</span>' +
      '<div class="boss-name">Vocab Boss</div>' +
      '<div class="boss-hpbar"><div class="boss-hpfill" id="bossHpFill" style="width:' + pct + '%"></div></div>' +
      '<div class="boss-hpnum" id="bossHpNum">' + this.bossHp + ' / ' + this.bossMaxHp + '</div>' +
      '</div></div>';
  };

  BossBattle.prototype._updateBossHp = function () {
    const fill = this.root.querySelector('#bossHpFill');
    const num = this.root.querySelector('#bossHpNum');
    const enemy = this.root.querySelector('#bossEnemy');
    if (!fill) return;

    const pct = Math.max(0, Math.round((this.bossHp / this.bossMaxHp) * 100));
    fill.style.width = pct + '%';
    if (num) num.textContent = Math.max(0, this.bossHp) + ' / ' + this.bossMaxHp;

    if (enemy) {
      enemy.classList.toggle('hurt', pct < 65 && pct >= 35);
      enemy.classList.toggle('critical', pct < 35);
    }
  };

  BossBattle.prototype._flashBoss = function (kind) {
    const enemy = this.root.querySelector('#bossEnemy');
    if (!enemy) return;
    enemy.classList.add(kind === 'hit' ? 'boss-hit' : 'boss-miss');
    setTimeout(() => enemy.classList.remove('boss-hit', 'boss-miss'), 450);
  };

  BossBattle.prototype._startRound = function () {
    if (!this.running || this.paused || this.phase !== 'fight') return;
    this.turn = 'player';
    this.busy = false;

    const target = weightedPick(this.pool, this.lessonId);
    this.currentWord = target;
    const options = pickOptions(target, this.pool, (w) => w.form);

    this.actionEl.hidden = false;
    this.actionEl.innerHTML =
      '<div class="boss-turn player">' +
      '<div class="boss-timer-wrap">' +
      '<div class="boss-timer-bar"><div class="boss-timer-fill" id="bossTimerFill"></div></div>' +
      '<span class="boss-timer-num" id="bossTimerNum">' + this._timerDuration() + '</span>' +
      '</div>' +
      '<div class="boss-turn-label">⚔️ Answer before the boss strikes!</div>' +
      '<div class="boss-prompt">' + target.label + '</div>' +
      '<div class="boss-options" id="bossOptions"></div></div>';

    const wrap = this.actionEl.querySelector('#bossOptions');
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'boss-opt' + (this.lang === 'ko' ? ' ko' : '') + (opt.text.length > 18 ? ' long' : '');
      btn.textContent = opt.text;
      btn.addEventListener('click', () => this._onPick(opt, btn));
      wrap.appendChild(btn);
    });

    this.msgEl.textContent = 'Pick the correct word — hurry!';
    this._startTimer();
  };

  BossBattle.prototype._disableOptions = function () {
    this.actionEl.querySelectorAll('.boss-opt').forEach((b) => { b.disabled = true; });
  };

  BossBattle.prototype._showCorrectOption = function () {
    if (!this.currentWord) return;
    this.actionEl.querySelectorAll('.boss-opt').forEach((b) => {
      if (b.textContent === this.currentWord.form) b.classList.add('correct');
    });
  };

  BossBattle.prototype._onPick = function (opt, btn) {
    if (this.busy || this.turn !== 'player') return;
    this.busy = true;
    this._clearTimer();
    this._disableOptions();

    if (opt.correct) {
      btn.classList.add('correct');
      this.bossHp -= PLAYER_DAMAGE;
      this.hits++;
      this.score += PLAYER_DAMAGE;
      this._flashBoss('hit');
      this._updateBossHp();
      this._updateHud();
      if (global.PlayerXP && global.PlayerXP.grant) global.PlayerXP.grant(XP_PER_HIT);

      if (this.bossHp <= 0) {
        this._win();
        return;
      }

      this.msgEl.textContent = '💥 Hit! Boss −' + PLAYER_DAMAGE + ' HP';
      setTimeout(() => this._startRound(), 700);
    } else {
      btn.classList.add('wrong');
      this._showCorrectOption();
      this._playerHit('Wrong answer — boss counter-attacks!');
    }
  };

  BossBattle.prototype._onTimeout = function () {
    if (this.busy || this.turn !== 'player' || !this.running) return;
    this.busy = true;
    this._clearTimer();
    this._disableOptions();
    this._showCorrectOption();
    this._playerHit('⏱️ Too slow — boss attacks!');
  };

  BossBattle.prototype._playerHit = function (message) {
    this.playerHearts = Math.max(0, this.playerHearts - BOSS_DAMAGE);
    this._updateHud();
    const turnEl = this.actionEl.querySelector('.boss-turn');
    if (turnEl) {
      turnEl.classList.add('boss-attacking');
      setTimeout(() => turnEl.classList.remove('boss-attacking'), 400);
    }
    const enemy = this.root.querySelector('#bossEnemy');
    if (enemy) {
      enemy.classList.add('boss-miss');
      setTimeout(() => enemy.classList.remove('boss-miss'), 450);
    }
    this.msgEl.textContent = message + ' −' + BOSS_DAMAGE + ' ❤️';

    if (this.playerHearts <= 0) {
      setTimeout(() => this._lose(), 900);
      return;
    }

    setTimeout(() => this._startRound(), 900);
  };

  BossBattle.prototype._win = function () {
    this.running = false;
    this.phase = 'done';
    this._clearTimer();
    this.actionEl.hidden = true;
    this.bossHp = 0;
    this._updateBossHp();
    if (global.PlayerXP && global.PlayerXP.grant) global.PlayerXP.grant(XP_WIN);
    this.msgEl.textContent = '🏆 Boss defeated! +' + XP_WIN + ' XP bonus!';
    const enemy = this.root.querySelector('#bossEnemy');
    if (enemy) enemy.classList.add('defeated');
    if (typeof this.onRoundComplete === 'function') this.onRoundComplete();
  };

  BossBattle.prototype._lose = function () {
    this.running = false;
    this.phase = 'done';
    this._clearTimer();
    this.actionEl.hidden = true;
    this.msgEl.textContent = '👾 Boss wins… Train in Standard Practice and try again!';
    const enemy = this.root.querySelector('#bossEnemy');
    if (enemy) enemy.classList.add('victorious');
    if (typeof this.onRoundComplete === 'function') this.onRoundComplete();
  };

  BossBattle.prototype.start = function () {
    this.running = false;
    this.paused = false;
    this._clearTimer();
    this._renderSetup();
    this._updateHud();
  };

  BossBattle.prototype.pause = function () {
    this.paused = true;
    this._pauseTimer();
  };

  BossBattle.prototype.resume = function () {
    this.paused = false;
    if (this.phase === 'fight' && !this.busy) this._resumeTimer();
  };

  BossBattle.create = function (config) {
    const game = new BossBattle(config);
    game._shell();
    return game;
  };

  global.BossBattle = BossBattle;
})(typeof window !== 'undefined' ? window : globalThis);
