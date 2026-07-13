/**
 * Duolingo-style exercise engine — one question at a time, hearts, animations.
 */
(function (global) {
  'use strict';

  const PRAISES = [
    'Great!', 'Perfect!', 'Awesome!', 'Well done!', 'Nice!', 'Brilliant!',
    'You nailed it!', 'Super!', 'Excellent!', 'Amazing!'
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function confetti(root) {
    const layer = document.createElement('div');
    layer.className = 'duo-particles';
    const colors = ['#58cc02', '#1cb0f6', '#ff9600', '#ff4b4b', '#ce82ff', '#ffd900'];
    for (let i = 0; i < 36; i++) {
      const p = document.createElement('div');
      p.className = 'duo-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = '-5%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.4 + 's';
      p.style.animationDuration = 0.8 + Math.random() * 0.6 + 's';
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1600);
  }

  function init(config) {
    const root = typeof config.root === 'string'
      ? document.querySelector(config.root)
      : config.root;
    if (!root || !config.questions?.length) return;

    const lessonId = config.lessonId;
    const lang = config.lang || 'pl';
    const maxHearts = config.hearts ?? 5;
    const questions = config.questions;
    const LP = config.LP || (global.LessonProgress && lessonId
      ? global.LessonProgress.create(lessonId, questions.length)
      : null);

    let index = 0;
    let hearts = maxHearts;
    let streak = 0;
    let phase = 'question';
    let selectedBtn = null;
    let tileAnswer = [];
    let matchSelected = null;
    let matchDone = 0;
    let feedbackEl = null;

    for (let i = 0; i < questions.length; i++) {
      if (!LP || !LP.completed.has(questions[i].id)) {
        index = i;
        break;
      }
      if (i === questions.length - 1) index = questions.length - 1;
    }

    const oldProgress = document.getElementById('progressWrap');
    if (oldProgress) oldProgress.hidden = true;

    root.innerHTML =
      '<div class="duo-wrap">' +
      '<div class="duo-top">' +
      '<div class="duo-hearts" id="duoHearts"></div>' +
      '<div class="duo-progress-track" id="duoProgress"></div>' +
      '<div class="duo-streak" id="duoStreak"></div>' +
      '</div>' +
      '<div id="duoCard"></div>' +
      '<div class="duo-footer" id="duoFooter"></div>' +
      '</div>';

    const cardEl = root.querySelector('#duoCard');
    const footerEl = root.querySelector('#duoFooter');
    const heartsEl = root.querySelector('#duoHearts');
    const progressEl = root.querySelector('#duoProgress');
    const streakEl = root.querySelector('#duoStreak');

    function renderHearts() {
      heartsEl.innerHTML = '';
      for (let h = 0; h < maxHearts; h++) {
        const span = document.createElement('span');
        span.className = 'duo-heart' + (h >= hearts ? ' lost' : '');
        span.textContent = h >= hearts ? '🖤' : '❤️';
        heartsEl.appendChild(span);
      }
    }

    function renderProgress() {
      progressEl.innerHTML = '';
      questions.forEach((q, i) => {
        const seg = document.createElement('div');
        const done = LP && LP.completed.has(q.id);
        seg.className = 'duo-progress-seg' +
          (done ? ' done' : '') +
          (i === index && !done ? ' current' : '');
        seg.innerHTML = '<span></span>';
        progressEl.appendChild(seg);
      });
    }

    function langClass(text) {
      return lang === 'ko' ? ' lang-ko' : '';
    }

    function canCheck() {
      const q = questions[index];
      if (q.type === 'complete') return true;
      if (phase !== 'question') return false;
      if (q.type === 'choice' || q.type === 'translate') return selectedBtn !== null;
      if (q.type === 'fill') {
        const inp = cardEl.querySelector('.duo-fill-input');
        return inp && inp.value.trim().length > 0;
      }
      if (q.type === 'tiles') return tileAnswer.length === q.answer.length;
      if (q.type === 'match') return matchDone === q.pairs.length;
      return false;
    }

    function updateCheckBtn() {
      const btn = footerEl.querySelector('.duo-check');
      if (!btn) return;
      btn.disabled = !canCheck();
    }

    function renderFooter(showCheck) {
      if (questions[index].type === 'complete') {
        footerEl.innerHTML = '';
        return;
      }
      footerEl.innerHTML =
        '<button type="button" class="duo-check" id="duoCheckBtn" disabled>Check</button>';
      const btn = footerEl.querySelector('#duoCheckBtn');
      btn.addEventListener('click', onCheck);
      if (showCheck !== false) updateCheckBtn();
    }

    function resetState() {
      selectedBtn = null;
      tileAnswer = [];
      matchSelected = null;
      matchDone = 0;
      phase = 'question';
    }

    function renderQuestion() {
      const q = questions[index];
      resetState();

      if (q.type === 'complete') {
        cardEl.innerHTML =
          '<div class="duo-complete">' +
          '<div class="duo-complete-icon">🎉</div>' +
          '<h3>Lesson complete!</h3>' +
          '<p class="muted">' + (q.text || 'You finished all exercises. Great job!') + '</p>' +
          '</div>';
        renderFooter(false);
        confetti(root);
        if (LP) LP.track(q.id);
        renderProgress();
        return;
      }

      let html = '<div class="duo-card">';
      html += '<div class="duo-prompt-label">' + (q.label || getDefaultLabel(q)) + '</div>';
      if (q.prompt) html += '<div class="duo-prompt">' + q.prompt + '</div>';
      if (q.question) {
        html += '<div class="duo-prompt-big' + langClass() + '">' + q.question + '</div>';
      }

      if (q.type === 'choice' || q.type === 'translate') {
        html += '<div class="duo-options">';
        shuffle(q.options).forEach((opt) => {
          html += '<button type="button" class="duo-option' + langClass(opt.text) +
            '" data-correct="' + (opt.correct ? '1' : '0') + '">' + opt.text + '</button>';
        });
        html += '</div>';
      }

      if (q.type === 'fill') {
        html += '<div class="duo-fill-row">' + q.template.replace('___',
          '<input type="text" class="duo-fill-input" autocomplete="off" spellcheck="false">') + '</div>';
        if (q.hint) html += '<p class="muted">' + q.hint + '</p>';
      }

      if (q.type === 'tiles') {
        html += '<div class="duo-answer-line" id="duoAnswerLine"></div>';
        html += '<div class="duo-tile-bank" id="duoTileBank">';
        shuffle(q.words).forEach((w) => {
          html += '<button type="button" class="duo-tile' + langClass() +
            '" data-word="' + escapeAttr(w) + '">' + w + '</button>';
        });
        html += '</div>';
      }

      if (q.type === 'match') {
        const left = shuffle(q.pairs.map((p, i) => ({ text: p.left, pair: i, side: 'L' })));
        const right = shuffle(q.pairs.map((p, i) => ({ text: p.right, pair: i, side: 'R' })));
        html += '<div class="duo-match-grid">';
        left.forEach((item) => {
          html += '<button type="button" class="duo-match-item" data-pair="' + item.pair +
            '" data-side="L">' + item.text + '</button>';
        });
        right.forEach((item) => {
          html += '<button type="button" class="duo-match-item' + langClass() +
            '" data-pair="' + item.pair + '" data-side="R">' + item.text + '</button>';
        });
        html += '</div>';
        html += '<p class="muted" style="margin-top:.5rem">Tap a word, then its match.</p>';
      }

      html += '</div>';
      cardEl.innerHTML = html;
      bindQuestionEvents(q);
      renderFooter();
    }

    function escapeAttr(s) {
      return String(s).replace(/"/g, '&quot;');
    }

    function getDefaultLabel(q) {
      if (q.type === 'translate') return 'Translate';
      if (q.type === 'tiles') return 'Build the sentence';
      if (q.type === 'match') return 'Match pairs';
      if (q.type === 'fill') return 'Fill in the blank';
      return 'Choose the correct answer';
    }

    function bindQuestionEvents(q) {
      if (q.type === 'choice' || q.type === 'translate') {
        cardEl.querySelectorAll('.duo-option').forEach((btn) => {
          btn.addEventListener('click', () => {
            if (phase !== 'question') return;
            cardEl.querySelectorAll('.duo-option').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedBtn = btn;
            updateCheckBtn();
          });
        });
      }

      if (q.type === 'fill') {
        const inp = cardEl.querySelector('.duo-fill-input');
        inp.addEventListener('input', updateCheckBtn);
        inp.focus();
      }

      if (q.type === 'tiles') {
        const line = cardEl.querySelector('#duoAnswerLine');
        cardEl.querySelectorAll('.duo-tile').forEach((tile) => {
          tile.addEventListener('click', () => {
            if (phase !== 'question' || tile.classList.contains('used')) return;
            const word = tile.dataset.word;
            tileAnswer.push(word);
            tile.classList.add('used');
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'duo-tile' + langClass();
            chip.textContent = word;
            chip.dataset.word = word;
            chip.addEventListener('click', () => {
              if (phase !== 'question') return;
              const idx = tileAnswer.indexOf(word);
              if (idx >= 0) tileAnswer.splice(idx, 1);
              chip.remove();
              cardEl.querySelectorAll('.duo-tile[data-word="' + escapeAttr(word) + '"]').forEach((t) => {
                if (tileAnswer.indexOf(word) === -1) t.classList.remove('used');
              });
              updateCheckBtn();
            });
            line.appendChild(chip);
            updateCheckBtn();
          });
        });
      }

      if (q.type === 'match') {
        cardEl.querySelectorAll('.duo-match-item').forEach((item) => {
          item.addEventListener('click', () => onMatchClick(item, q));
        });
      }
    }

    function onMatchClick(item, q) {
      if (phase !== 'question' || item.classList.contains('matched')) return;
      if (!matchSelected) {
        matchSelected = item;
        item.classList.add('selected');
        return;
      }
      if (matchSelected === item) {
        item.classList.remove('selected');
        matchSelected = null;
        return;
      }
      if (matchSelected.dataset.side === item.dataset.side) {
        matchSelected.classList.remove('selected');
        matchSelected = item;
        item.classList.add('selected');
        return;
      }
      if (matchSelected.dataset.pair === item.dataset.pair) {
        matchSelected.classList.remove('selected');
        matchSelected.classList.add('matched');
        item.classList.add('matched');
        matchSelected = null;
        matchDone++;
        updateCheckBtn();
      } else {
        item.classList.add('wrong-flash');
        matchSelected.classList.add('wrong-flash');
        setTimeout(() => {
          item.classList.remove('wrong-flash');
          matchSelected.classList.remove('wrong-flash', 'selected');
          matchSelected = null;
        }, 450);
      }
    }

    function validate() {
      const q = questions[index];
      if (q.type === 'complete') return true;

      if (q.type === 'choice' || q.type === 'translate') {
        cardEl.querySelectorAll('.duo-option').forEach((btn) => {
          if (btn.dataset.correct === '1') btn.classList.add('correct');
          if (btn.classList.contains('selected') && btn.dataset.correct !== '1') btn.classList.add('wrong');
        });
        return selectedBtn && selectedBtn.dataset.correct === '1';
      }

      if (q.type === 'fill') {
        const inp = cardEl.querySelector('.duo-fill-input');
        const val = inp.value.trim().toLowerCase();
        const ok = val === q.answer.toLowerCase();
        inp.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) inp.value = q.answer;
        return ok;
      }

      if (q.type === 'tiles') {
        const ok = tileAnswer.length === q.answer.length &&
          tileAnswer.every((w, i) => w === q.answer[i]);
        return ok;
      }

      if (q.type === 'match') {
        return matchDone === q.pairs.length;
      }

      return false;
    }

    function showFeedback(ok, q) {
      if (!feedbackEl) {
        feedbackEl = document.createElement('div');
        feedbackEl.className = 'duo-feedback';
        feedbackEl.innerHTML =
          '<div class="duo-feedback-title"></div>' +
          '<div class="duo-feedback-body"></div>' +
          '<button type="button" class="duo-feedback-btn">Continue</button>';
        document.body.appendChild(feedbackEl);
        feedbackEl.querySelector('.duo-feedback-btn').addEventListener('click', onContinue);
      }

      const title = feedbackEl.querySelector('.duo-feedback-title');
      const body = feedbackEl.querySelector('.duo-feedback-body');
      feedbackEl.className = 'duo-feedback ' + (ok ? 'correct' : 'wrong');

      if (ok) {
        title.textContent = PRAISES[Math.floor(Math.random() * PRAISES.length)];
        body.textContent = q.feedback || 'Keep going!';
        confetti(root);
      } else {
        title.textContent = 'Not quite…';
        body.textContent = q.feedbackWrong || q.feedback || 'Correct answer shown above.';
      }

      requestAnimationFrame(() => feedbackEl.classList.add('show'));
    }

    function onCheck() {
      if (!canCheck() || phase !== 'question') return;
      const q = questions[index];
      const ok = validate();
      phase = 'feedback';

      if (ok) {
        streak++;
        streakEl.textContent = streak > 1 ? '🔥 ' + streak : '';
        streakEl.classList.toggle('show', streak > 1);
      } else {
        streak = 0;
        streakEl.classList.remove('show');
        if (hearts > 0) {
          hearts--;
          renderHearts();
        }
      }

      if (LP) LP.track(q.id);
      renderProgress();

      footerEl.querySelector('.duo-check').disabled = true;
      showFeedback(ok, q);
    }

    function onContinue() {
      feedbackEl.classList.remove('show');
      const card = cardEl.querySelector('.duo-card');
      if (card) card.classList.add('exit-left');

      setTimeout(() => {
        if (index < questions.length - 1) {
          index++;
          renderQuestion();
          renderProgress();
        } else {
          renderQuestion();
        }
      }, 280);
    }

    renderHearts();
    renderProgress();
    renderQuestion();
    if (LP && LP.updatePersistBar) LP.updatePersistBar();
  }

  global.DuoExercises = { init };
})(typeof window !== 'undefined' ? window : globalThis);
