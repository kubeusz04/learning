/**
 * Duolingo-style interactive lesson engine.
 */
(function (global) {
  'use strict';

  const PRAISES = [
    'Amazing!', 'Perfect!', 'Great job!', 'You rock!', 'Brilliant!',
    'Super!', 'Well done!', 'Nice!', 'Correct!', 'Keep going!'
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
    return (s || '').trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  }

  function confetti() {
    const wrap = document.createElement('div');
    wrap.className = 'duo-confetti';
    const colors = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff', '#ff9600'];
    for (let i = 0; i < 48; i++) {
      const p = document.createElement('div');
      p.className = 'duo-confetti-piece';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.8 + Math.random() * 1.2) + 's';
      p.style.animationDelay = Math.random() * .4 + 's';
      p.style.width = (6 + Math.random() * 8) + 'px';
      p.style.height = (6 + Math.random() * 8) + 'px';
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 3200);
  }

  function DuolingoLesson(config) {
    this.root = typeof config.root === 'string' ? document.querySelector(config.root) : config.root;
    this.lessonId = config.lessonId;
    this.exercises = config.exercises || [];
    this.LP = config.LP;
    this.onProgress = config.onProgress || function () {};
    this.lang = config.lang || 'pl';

    this.index = 0;
    this.streak = 0;
    this.hearts = 5;
    this.answered = false;
    this.state = {};

    this._buildShell();
    this._skipCompleted();
    this._render();
  }

  DuolingoLesson.prototype._buildShell = function () {
    this.root.innerHTML =
      '<div class="duo-shell">' +
      '<div class="duo-top">' +
      '<div class="duo-progress-track"><div class="duo-progress-fill" id="duoProgressFill"></div></div>' +
      '<div class="duo-streak" id="duoStreak" title="Streak">🔥 0</div>' +
      '<button type="button" class="duo-restart" id="duoRestartBtn" title="Restart exercises">↻</button>' +
      '<div class="duo-hearts" id="duoHearts"></div>' +
      '</div>' +
      '<div class="duo-body" id="duoBody"></div>' +
      '<div class="duo-feedback" id="duoFeedback">' +
      '<span class="duo-feedback-icon" id="duoFeedbackIcon"></span>' +
      '<span id="duoFeedbackText"></span></div>' +
      '<div class="duo-footer">' +
      '<button type="button" class="duo-check" id="duoCheckBtn" disabled>Check</button>' +
      '</div></div>';
    this.body = this.root.querySelector('#duoBody');
    this.fillEl = this.root.querySelector('#duoProgressFill');
    this.streakEl = this.root.querySelector('#duoStreak');
    this.heartsEl = this.root.querySelector('#duoHearts');
    this.feedback = this.root.querySelector('#duoFeedback');
    this.feedbackIcon = this.root.querySelector('#duoFeedbackIcon');
    this.feedbackText = this.root.querySelector('#duoFeedbackText');
    this.checkBtn = this.root.querySelector('#duoCheckBtn');
    this.checkBtn.addEventListener('click', () => this._onCheck());
    this.restartBtn = this.root.querySelector('#duoRestartBtn');
    this.restartBtn.addEventListener('click', () => this.restart());
    this._renderHearts();
    this._updateProgress();
  };

  DuolingoLesson.prototype._skipCompleted = function () {
    if (!this.LP || !this.LP.completed) return;
    while (this.index < this.exercises.length && this.LP.completed.has(this.index + 1)) {
      this.index++;
    }
  };

  DuolingoLesson.prototype._renderHearts = function () {
    this.heartsEl.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const h = document.createElement('span');
      h.className = 'duo-heart' + (i >= this.hearts ? ' lost' : '');
      h.textContent = '❤️';
      this.heartsEl.appendChild(h);
    }
  };

  DuolingoLesson.prototype._updateProgress = function () {
    const pct = this.exercises.length
      ? Math.round((this.index / this.exercises.length) * 100)
      : 0;
    this.fillEl.style.width = pct + '%';
    this.streakEl.textContent = '🔥 ' + this.streak;
  };

  DuolingoLesson.prototype._render = function () {
    if (this.index >= this.exercises.length) {
      this._showComplete();
      return;
    }
    this.answered = false;
    this.state = {};
    this.feedback.classList.remove('show', 'correct', 'wrong');
    this.checkBtn.disabled = true;
    this.checkBtn.textContent = 'Check';
    this.checkBtn.classList.remove('continue');

    const ex = this.exercises[this.index];
    const card = document.createElement('div');
    card.className = 'duo-card';
    card.innerHTML =
      (ex.badge ? '<div class="duo-badge">' + ex.badge + '</div>' : '') +
      '<div class="duo-prompt">' + ex.prompt + '</div>' +
      (ex.hint ? '<p class="duo-hint">' + ex.hint + '</p>' : '');

    const area = document.createElement('div');
    area.className = 'duo-interaction';

    if (ex.type === 'choice' || ex.type === 'translate') {
      this._renderChoice(area, ex);
    } else if (ex.type === 'fill') {
      this._renderFill(area, ex);
    } else if (ex.type === 'build') {
      this._renderBuild(area, ex);
    } else if (ex.type === 'match') {
      this._renderMatch(area, ex);
    }

    card.appendChild(area);
    this.body.innerHTML = '';
    this.body.appendChild(card);
    this._updateProgress();
  };

  DuolingoLesson.prototype._renderChoice = function (area, ex) {
    const opts = shuffle(ex.options);
    const wrap = document.createElement('div');
    wrap.className = 'duo-options';
    opts.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'duo-option' + (ex.lang === 'ko' || this.lang === 'ko' ? ' ko' : '');
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        if (this.answered) return;
        wrap.querySelectorAll('.duo-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.state.selected = opt;
        this.checkBtn.disabled = false;
      });
      wrap.appendChild(btn);
    });
    area.appendChild(wrap);
  };

  DuolingoLesson.prototype._renderFill = function (area, ex) {
    const parts = ex.template.split('___');
    const wrap = document.createElement('div');
    wrap.className = 'duo-fill-wrap';
    parts.forEach((part, i) => {
      if (part) {
        const span = document.createElement('span');
        span.innerHTML = part;
        wrap.appendChild(span);
      }
      if (i < parts.length - 1) {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'duo-fill-input';
        inp.autocomplete = 'off';
        inp.spellcheck = false;
        inp.addEventListener('input', () => {
          this.state.fillValue = inp.value;
          this.checkBtn.disabled = !inp.value.trim();
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !this.checkBtn.disabled) this._onCheck();
        });
        wrap.appendChild(inp);
        this.state.inputEl = inp;
      }
    });
    area.appendChild(wrap);
    if (ex.chips && ex.chips.length) {
      const chips = document.createElement('div');
      chips.className = 'duo-chips';
      ex.chips.forEach((word) => {
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'duo-chip';
        c.textContent = word;
        c.addEventListener('click', () => {
          if (this.state.inputEl) {
            this.state.inputEl.value = word;
            this.state.fillValue = word;
            this.checkBtn.disabled = false;
            this.state.inputEl.focus();
          }
        });
        chips.appendChild(c);
      });
      area.appendChild(chips);
    }
    setTimeout(() => this.state.inputEl && this.state.inputEl.focus(), 100);
  };

  DuolingoLesson.prototype._renderBuild = function (area, ex) {
    this.state.slots = [];
    this.state.placed = [];
    const slots = document.createElement('div');
    slots.className = 'duo-build-slots';
    ex.answer.forEach((_, i) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'duo-slot';
      slot.dataset.idx = i;
      slot.addEventListener('click', () => this._removeFromSlot(i));
      slots.appendChild(slot);
      this.state.slots.push(slot);
    });
    area.appendChild(slots);

    const chips = document.createElement('div');
    chips.className = 'duo-chips';
    shuffle(ex.words).forEach((word) => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'duo-chip';
      c.textContent = word;
      c.dataset.word = word;
      c.addEventListener('click', () => this._addToBuild(word, c));
      chips.appendChild(c);
    });
    area.appendChild(chips);
    this.state.chipEls = chips.querySelectorAll('.duo-chip');
  };

  DuolingoLesson.prototype._addToBuild = function (word, chipEl) {
    if (this.answered) return;
    const empty = this.state.slots.find(s => !s.dataset.word);
    if (!empty) return;
    empty.textContent = word;
    empty.dataset.word = word;
    empty.classList.add('filled');
    chipEl.classList.add('used');
    this.state.placed.push(word);
    this.checkBtn.disabled = this.state.placed.length !== this.exercises[this.index].answer.length;
  };

  DuolingoLesson.prototype._removeFromSlot = function (idx) {
    if (this.answered) return;
    const slot = this.state.slots[idx];
    const word = slot.dataset.word;
    if (!word) return;
    slot.textContent = '';
    delete slot.dataset.word;
    slot.classList.remove('filled');
    this.state.placed = this.state.slots.map(s => s.dataset.word).filter(Boolean);
    this.state.chipEls.forEach(c => {
      if (c.dataset.word === word) c.classList.remove('used');
    });
    this.checkBtn.disabled = this.state.placed.length !== this.exercises[this.index].answer.length;
  };

  DuolingoLesson.prototype._renderMatch = function (area, ex) {
    this.state.pairsDone = 0;
    this.state.matchSelected = null;
    const leftItems = shuffle(ex.pairs.map((p, i) => ({ text: p[0], pair: i, side: 'left' })));
    const rightItems = shuffle(ex.pairs.map((p, i) => ({ text: p[1], pair: i, side: 'right' })));
    const isKo = ex.lang === 'ko' || this.lang === 'ko';

    const grid = document.createElement('div');
    grid.className = 'duo-match-grid';
    const leftCol = document.createElement('div');
    leftCol.className = 'duo-match-col';
    const rightCol = document.createElement('div');
    rightCol.className = 'duo-match-col';

    const allItems = [];
    leftItems.forEach(item => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'duo-match-item' + (isKo && /[\uAC00-\uD7A3]/.test(item.text) ? ' ko' : '');
      el.textContent = item.text;
      el.dataset.pair = item.pair;
      el.dataset.side = 'left';
      el.addEventListener('click', () => this._matchClick(el));
      leftCol.appendChild(el);
      allItems.push(el);
    });
    rightItems.forEach(item => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'duo-match-item' + (isKo && /[\uAC00-\uD7A3]/.test(item.text) ? ' ko' : '');
      el.textContent = item.text;
      el.dataset.pair = item.pair;
      el.dataset.side = 'right';
      el.addEventListener('click', () => this._matchClick(el));
      rightCol.appendChild(el);
      allItems.push(el);
    });
    this.state.matchItems = allItems;
    this.state.matchTotal = ex.pairs.length;
    grid.appendChild(leftCol);
    grid.appendChild(rightCol);
    area.appendChild(grid);
    this.checkBtn.disabled = true;
    this.checkBtn.textContent = 'Continue';
    this.state.autoMatch = true;
  };

  DuolingoLesson.prototype._matchClick = function (el) {
    if (this.answered || el.classList.contains('matched')) return;
    const sel = this.state.matchSelected;
    if (!sel) {
      el.classList.add('selected');
      this.state.matchSelected = el;
      return;
    }
    if (sel === el) {
      el.classList.remove('selected');
      this.state.matchSelected = null;
      return;
    }
    if (sel.dataset.side === el.dataset.side) {
      sel.classList.remove('selected');
      el.classList.add('selected');
      this.state.matchSelected = el;
      return;
    }
    if (sel.dataset.pair === el.dataset.pair) {
      sel.classList.remove('selected');
      sel.classList.add('matched');
      el.classList.add('matched');
      this.state.matchSelected = null;
      this.state.pairsDone++;
      if (this.state.pairsDone === this.state.matchTotal) {
        this.checkBtn.disabled = false;
        this.checkBtn.textContent = 'Continue';
      }
    } else {
      el.classList.add('wrong-flash');
      sel.classList.add('wrong-flash');
      setTimeout(() => {
        el.classList.remove('wrong-flash', 'selected');
        sel.classList.remove('wrong-flash', 'selected');
        this.state.matchSelected = null;
      }, 450);
    }
  };

  DuolingoLesson.prototype._checkAnswer = function () {
    const ex = this.exercises[this.index];
    if (ex.type === 'choice' || ex.type === 'translate') {
      return !!(this.state.selected && this.state.selected.correct);
    }
    if (ex.type === 'fill') {
      const val = norm(this.state.fillValue || '');
      const accepts = (ex.accept || [ex.answer]).map(norm);
      return accepts.includes(val);
    }
    if (ex.type === 'build') {
      const ans = ex.answer;
      return this.state.placed.length === ans.length &&
        this.state.placed.every((w, i) => w === ans[i]);
    }
    if (ex.type === 'match') {
      return this.state.pairsDone === this.state.matchTotal;
    }
    return false;
  };

  DuolingoLesson.prototype._revealCorrect = function () {
    const ex = this.exercises[this.index];
    if (ex.type === 'choice' || ex.type === 'translate') {
      this.root.querySelectorAll('.duo-option').forEach(btn => {
        const t = btn.textContent;
        const opt = ex.options.find(o => o.text === t);
        if (opt && opt.correct) btn.classList.add('correct');
        else if (btn.classList.contains('selected') && opt && !opt.correct) btn.classList.add('wrong');
      });
    }
    if (ex.type === 'fill' && this.state.inputEl) {
      this.state.inputEl.classList.add(this._checkAnswer() ? 'correct' : 'wrong');
      if (!this._checkAnswer()) this.state.inputEl.value = ex.answer;
    }
    if (ex.type === 'build') {
      ex.answer.forEach((word, i) => {
        const slot = this.state.slots[i];
        if (slot) {
          slot.textContent = word;
          slot.classList.add('filled');
          if (this.state.placed[i] !== word) slot.style.borderColor = 'var(--duo-green)';
        }
      });
    }
  };

  DuolingoLesson.prototype._onCheck = function () {
    if (this.answered) {
      this._next();
      return;
    }
    const ex = this.exercises[this.index];
    const ok = this._checkAnswer();
    this.answered = true;
    this._revealCorrect();

    if (ok) {
      this.streak++;
      confetti();

      const num = this.index + 1;
      let xpAwarded = 0;
      if (this.LP && this.LP.track(num)) {
        if (global.PlayerXP) {
          xpAwarded = PlayerXP.award(this.lessonId, num).awarded;
        } else {
          xpAwarded = 10;
        }
      }
      if (xpAwarded > 0) {
        const xp = document.createElement('div');
        xp.className = 'duo-xp show';
        xp.textContent = '+' + xpAwarded + ' XP';
        this.body.appendChild(xp);
        setTimeout(() => xp.remove(), 1100);
      }

      this.feedbackIcon.textContent = '🎉';
      this.feedbackText.textContent = PRAISES[Math.floor(Math.random() * PRAISES.length)];
      this.feedback.className = 'duo-feedback show correct';

      this.onProgress(num, this.exercises.length);

      this.checkBtn.textContent = 'Continue';
      this.checkBtn.disabled = false;
      this.checkBtn.classList.add('continue');
    } else {
      this.streak = 0;
      if (global.PracticeMistakes && global.PracticeMistakes.recordFromExercise) {
        global.PracticeMistakes.recordFromExercise(this.lessonId, ex, this.state);
      }
      if (this.hearts > 0) {
        this.hearts--;
        this._renderHearts();
      }
      this.feedbackIcon.textContent = '💪';
      let ansText = '';
      if (ex.type === 'fill') ansText = ex.answer;
      else if (ex.type === 'build') ansText = ex.answer.join(' ');
      else if (ex.type === 'choice' || ex.type === 'translate') {
        const c = ex.options.find(o => o.correct);
        ansText = c ? c.text : '';
      }
      this.feedbackText.textContent = ansText
        ? 'Correct answer: ' + ansText
        : 'Not quite — try the next one!';
      this.feedback.className = 'duo-feedback show wrong';

      this.checkBtn.textContent = 'Continue';
      this.checkBtn.disabled = false;
      this.checkBtn.classList.add('continue');
    }
    this.streakEl.textContent = '🔥 ' + this.streak;
  };

  DuolingoLesson.prototype._next = function () {
    const card = this.body.querySelector('.duo-card');
    if (card) card.classList.add('exit');
    setTimeout(() => {
      this.index++;
      this._render();
    }, card ? 260 : 0);
  };

  DuolingoLesson.prototype.restart = function () {
    if (this.LP && this.LP.reset) this.LP.reset();
    this.index = 0;
    this.streak = 0;
    this.hearts = 5;
    this.answered = false;
    this.state = {};
    this.feedback.classList.remove('show', 'correct', 'wrong');
    this.checkBtn.style.display = '';
    this.checkBtn.disabled = true;
    this.checkBtn.textContent = 'Check';
    this.checkBtn.classList.remove('continue');
    this._renderHearts();
    this.onProgress(0, this.exercises.length);
    this._render();
  };

  DuolingoLesson.prototype._showComplete = function () {
    confetti();
    this.fillEl.style.width = '100%';
    const xpLine = global.PlayerXP
      ? (function () {
          const s = PlayerXP.getState();
          return '<p class="duo-complete-xp">⭐ Level ' + s.level + '/' + s.maxLevel + ' · ' + s.xp + ' XP</p>';
        })()
      : '';
    this.body.innerHTML =
      '<div class="duo-complete">' +
      '<span class="duo-complete-emoji">🏆</span>' +
      '<h3>Lesson complete!</h3>' +
      '<p>You finished all ' + this.exercises.length + ' exercises. 🔥 Streak: ' + this.streak + '</p>' +
      xpLine +
      '<button type="button" class="duo-restart-big" id="duoRestartAgain">↻ Practice again</button>' +
      '</div>';
    this.feedback.classList.remove('show');
    this.checkBtn.style.display = 'none';
    const again = this.body.querySelector('#duoRestartAgain');
    if (again) again.addEventListener('click', () => this.restart());
  };

  global.DuolingoLesson = DuolingoLesson;

  global.reveal = function (el) {
    el.classList.toggle('revealed');
  };
})(typeof window !== 'undefined' ? window : globalThis);
