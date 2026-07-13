/**
 * Swipe Flashcards — swipe know / don't know; review round at the end.
 */
(function (global) {
  'use strict';

  const SWIPE_THRESHOLD = 72;
  const XP_PER_CARD = 2;
  const XP_SESSION_BONUS = 12;
  const STORAGE_PREFIX = 'pp-flash:';

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

  function promptLabel(en) {
    return en
      .replace(/\([^)]*\)/g, '')
      .split(/\s*\//)[0]
      .trim();
  }

  function buildDeck(vocab, lang) {
    const key = lang === 'ko' ? 'ko' : 'pl';
    const deck = [];

    (vocab || []).forEach((entry, idx) => {
      const front = firstForm(entry[key]);
      const en = promptLabel(entry.en);
      if (!front || !en || front.length > 52) return;

      deck.push({
        id: idx,
        front,
        en,
        ko: firstForm(entry.ko),
        pl: firstForm(entry.pl),
        long: front.length > 20
      });
    });

    return deck;
  }

  function loadWeak(lessonId) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + lessonId);
      if (!raw) return new Set();
      const data = JSON.parse(raw);
      return new Set(Array.isArray(data.weak) ? data.weak : []);
    } catch {
      return new Set();
    }
  }

  function saveWeak(lessonId, weakSet) {
    localStorage.setItem(STORAGE_PREFIX + lessonId, JSON.stringify({
      weak: [...weakSet],
      updated: Date.now()
    }));
  }

  function SwipeFlashcards(config) {
    this.root = typeof config.root === 'string'
      ? document.querySelector(config.root)
      : config.root;
    this.lang = config.lang || 'pl';
    this.lessonId = config.lessonId || '';
    this.allCards = buildDeck(config.vocab, this.lang);
    this.running = false;
    this.paused = false;
    this.busy = false;
    this.flipped = false;
    this.round = 1;
    this.deck = [];
    this.dontKnow = [];
    this.known = 0;
    this.roundStartSize = 0;
    this.weak = loadWeak(this.lessonId);
    this.drag = null;
  }

  SwipeFlashcards.prototype._shell = function () {
    this.root.innerHTML =
      '<div class="flash-shell">' +
      '<div class="flash-hud">' +
      '<div class="flash-stat"><span class="flash-stat-label">Round</span><strong id="flashRound">1</strong></div>' +
      '<div class="flash-stat"><span class="flash-stat-label">Left</span><strong id="flashLeft">0</strong></div>' +
      '<div class="flash-stat"><span class="flash-stat-label">Know</span><strong id="flashKnown">0</strong></div>' +
      '<div class="flash-stat"><span class="flash-stat-label">Review</span><strong id="flashReview">0</strong></div>' +
      '</div>' +
      '<div class="flash-progress"><div class="flash-progress-fill" id="flashProgressFill"></div></div>' +
      '<p class="flash-round-label" id="flashRoundLabel"></p>' +
      '<div class="flash-stage" id="flashStage">' +
      '<div class="flash-card-wrap" id="flashCardWrap">' +
      '<div class="flash-card" id="flashCard">' +
      '<div class="flash-face flash-front" id="flashFront"></div>' +
      '<div class="flash-face flash-back" id="flashBack"></div>' +
      '</div></div>' +
      '<div class="flash-swipe-hints">' +
      '<span class="flash-hint-left">👈 Don\'t know</span>' +
      '<span class="flash-hint-tap">tap to flip</span>' +
      '<span class="flash-hint-right">Know 👉</span>' +
      '</div></div>' +
      '<div class="flash-actions">' +
      '<button type="button" class="flash-btn dont" id="flashDont">✗ Don\'t know</button>' +
      '<button type="button" class="flash-btn know" id="flashKnow">✓ Know</button>' +
      '</div>' +
      '<p class="flash-msg" id="flashMsg">Swipe or tap buttons — review weak cards at the end.</p>' +
      '<div class="flash-footer">' +
      '<button type="button" class="flash-restart" id="flashRestart">↻ New session</button>' +
      '<button type="button" class="flash-done" id="flashDone" hidden>🌙 Done for tonight</button>' +
      '</div></div>';

    this.roundEl = this.root.querySelector('#flashRound');
    this.leftEl = this.root.querySelector('#flashLeft');
    this.knownEl = this.root.querySelector('#flashKnown');
    this.reviewEl = this.root.querySelector('#flashReview');
    this.progressFill = this.root.querySelector('#flashProgressFill');
    this.roundLabelEl = this.root.querySelector('#flashRoundLabel');
    this.cardWrap = this.root.querySelector('#flashCardWrap');
    this.cardEl = this.root.querySelector('#flashCard');
    this.frontEl = this.root.querySelector('#flashFront');
    this.backEl = this.root.querySelector('#flashBack');
    this.msgEl = this.root.querySelector('#flashMsg');
    this.restartBtn = this.root.querySelector('#flashRestart');
    this.doneBtn = this.root.querySelector('#flashDone');

    this.root.querySelector('#flashDont').addEventListener('click', () => this._swipe('left'));
    this.root.querySelector('#flashKnow').addEventListener('click', () => this._swipe('right'));
    this.restartBtn.addEventListener('click', () => this.start());
    this.doneBtn.addEventListener('click', () => this._finish(true));

    this.cardEl.addEventListener('click', (e) => {
      if (this.drag && this.drag.moved) return;
      this._toggleFlip();
    });

    this._bindDrag(this.cardEl);
  };

  SwipeFlashcards.prototype._bindDrag = function (el) {
    const onStart = (e) => {
      if (this.busy || this.paused || !this.running || !this.deck.length) return;
      if (e.target.closest('button')) return;
      const pt = e.touches ? e.touches[0] : e;
      this.drag = { startX: pt.clientX, startY: pt.clientY, x: 0, moved: false };
      el.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e) => {
      if (!this.drag || this.busy) return;
      const pt = e.touches ? e.touches[0] : e;
      const dx = pt.clientX - this.drag.startX;
      const dy = pt.clientY - this.drag.startY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) this.drag.moved = true;
      this.drag.x = dx;
      this._applyDrag(dx);
    };

    const onEnd = () => {
      if (!this.drag || this.busy) return;
      const dx = this.drag.x;
      this.drag = null;
      if (dx > SWIPE_THRESHOLD) this._swipe('right');
      else if (dx < -SWIPE_THRESHOLD) this._swipe('left');
      else this._resetCardPos();
    };

    el.addEventListener('pointerdown', onStart);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onEnd);
    el.addEventListener('pointercancel', onEnd);
  };

  SwipeFlashcards.prototype._applyDrag = function (dx) {
    const rot = dx * 0.04;
    this.cardEl.style.transform = 'translateX(' + dx + 'px) rotate(' + rot + 'deg)';
    this.cardEl.classList.toggle('drag-know', dx > 30);
    this.cardEl.classList.toggle('drag-dont', dx < -30);
  };

  SwipeFlashcards.prototype._resetCardPos = function () {
    this.cardEl.style.transform = '';
    this.cardEl.classList.remove('drag-know', 'drag-dont');
  };

  SwipeFlashcards.prototype._toggleFlip = function () {
    if (this.busy || !this.running || !this.deck.length) return;
    this.flipped = !this.flipped;
    this.cardEl.classList.toggle('flipped', this.flipped);
  };

  SwipeFlashcards.prototype._current = function () {
    return this.deck[0];
  };

  SwipeFlashcards.prototype._updateHud = function () {
    this.roundEl.textContent = String(this.round);
    this.leftEl.textContent = String(this.deck.length);
    this.knownEl.textContent = String(this.known);
    this.reviewEl.textContent = String(this.dontKnow.length);

    const total = this.round === 1 ? this.allCards.length : this.roundStartSize;
    const done = total - this.deck.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    this.progressFill.style.width = pct + '%';

    if (this.round === 1) {
      this.roundLabelEl.textContent = this.deck.length
        ? 'Full lesson review'
        : '';
    } else {
      this.roundLabelEl.textContent = 'Review round — cards you skipped';
    }
  };

  SwipeFlashcards.prototype._renderCard = function () {
    const card = this._current();
    this.flipped = false;
    this.cardEl.classList.remove('flipped', 'exit-left', 'exit-right', 'drag-know', 'drag-dont');
    this._resetCardPos();

    if (!card) {
      this.frontEl.textContent = '';
      this.backEl.textContent = '';
      this.cardWrap.hidden = true;
      return;
    }

    this.cardWrap.hidden = false;
    const langClass = this.lang === 'ko' ? ' ko' : ' pl';
    this.frontEl.className = 'flash-face flash-front' + langClass + (card.long ? ' long' : '');
    this.backEl.className = 'flash-face flash-back';

    this.frontEl.textContent = card.front;
    let back = card.en;
    if (this.lang === 'ko' && global.hangulToPolish) {
      try {
        const tr = global.hangulToPolish(card.front);
        if (tr) back += '\n' + tr;
      } catch { /* ignore */ }
    } else if (this.lang === 'pl' && card.ko) {
      back += '\n' + card.ko;
    }
    this.backEl.textContent = back;
  };

  SwipeFlashcards.prototype._swipe = function (dir) {
    if (this.busy || this.paused || !this.running || !this.deck.length) return;
    this.busy = true;

    const card = this.deck.shift();
    const isKnow = dir === 'right';

    this.cardEl.classList.add(isKnow ? 'exit-right' : 'exit-left');

    if (isKnow) {
      this.known++;
      this.weak.delete(card.id);
      if (global.PlayerXP && global.PlayerXP.grant) global.PlayerXP.grant(XP_PER_CARD);
    } else {
      this.dontKnow.push(card);
      this.weak.add(card.id);
    }

    saveWeak(this.lessonId, this.weak);

    setTimeout(() => {
      this.busy = false;
      if (!this.deck.length) this._endRound();
      else {
        this._renderCard();
        this._updateHud();
      }
    }, 280);
  };

  SwipeFlashcards.prototype._endRound = function () {
    if (this.dontKnow.length) {
      this.round++;
      this.deck = shuffle(this.dontKnow);
      this.roundStartSize = this.deck.length;
      this.dontKnow = [];
      this.msgEl.textContent = '🔄 Review round — ' + this.deck.length + ' card(s) to retry!';
      this.doneBtn.hidden = false;
      this._renderCard();
      this._updateHud();
      return;
    }

    this._finish(false);
  };

  SwipeFlashcards.prototype._finish = function (early) {
    this.running = false;
    this.cardWrap.hidden = true;
    this.doneBtn.hidden = true;

    const weakCount = this.weak.size;
    if (early) {
      this.deck.forEach((c) => this.weak.add(c.id));
      this.dontKnow.forEach((c) => this.weak.add(c.id));
      saveWeak(this.lessonId, this.weak);
    }

    if (global.PlayerXP && global.PlayerXP.grant && !early) {
      global.PlayerXP.grant(XP_SESSION_BONUS);
    }

    this.msgEl.textContent = early
      ? '🌙 Good night! Saved ' + this.weak.size + ' card(s) for next time.'
      : '🏆 All clear! You knew every card.' + (weakCount ? '' : ' Perfect session!');

    if (!early) {
      this.msgEl.textContent += ' +' + XP_SESSION_BONUS + ' XP';
    }

    this.progressFill.style.width = early ? this.progressFill.style.width : '100%';
    this._updateHud();
    if (typeof this.onRoundComplete === 'function') this.onRoundComplete();
  };

  SwipeFlashcards.prototype.start = function () {
    if (!this.allCards.length) {
      this.msgEl.textContent = 'No vocabulary for flashcards.';
      return;
    }

    this.running = true;
    this.paused = false;
    this.busy = false;
    this.round = 1;
    this.known = 0;
    this.dontKnow = [];
    this.deck = shuffle(this.allCards.filter((c) => this.weak.has(c.id)))
      .concat(shuffle(this.allCards.filter((c) => !this.weak.has(c.id))));
    if (this.mixCardLimit && this.mixCardLimit > 0) {
      this.deck = this.deck.slice(0, this.mixCardLimit);
    }
    this.roundStartSize = this.deck.length;
    this.doneBtn.hidden = true;
    this.msgEl.textContent = 'Swipe right = know, left = don\'t know. Tap card for translation.';

    this._renderCard();
    this._updateHud();
  };

  SwipeFlashcards.prototype.pause = function () {
    this.paused = true;
  };

  SwipeFlashcards.prototype.resume = function () {
    this.paused = false;
  };

  SwipeFlashcards.create = function (config) {
    const game = new SwipeFlashcards(config);
    game._shell();
    return game;
  };

  global.SwipeFlashcards = SwipeFlashcards;
})(typeof window !== 'undefined' ? window : globalThis);
