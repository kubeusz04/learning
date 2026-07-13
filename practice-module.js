/**
 * Practice hub — all minigames + random mix mode.
 */
(function (global) {
  'use strict';

  const MIX_GAMES = [
    { id: 'rain', label: '☔ Word Rain' },
    { id: 'whack', label: '🔨 Whack-a-Word' },
    { id: 'sprint', label: '🏃 Sentence Sprint' },
    { id: 'tower', label: '🏗️ Word Tower' },
    { id: 'boss', label: '👾 Boss Battle' },
    { id: 'flash', label: '👆 Flashcards' },
    { id: 'odd', label: '🎯 Odd One Out' }
  ];

  function onProgress(LP) {
    const total = (window.DUO_EXERCISES || []).length;
    const pct = total ? Math.round((LP.completed.size / total) * 100) : 0;
    ['persistFill', 'progressFill'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.width = pct + '%';
    });
    ['persistPct', 'progressText'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = pct + '%';
    });
    const wrap = document.getElementById('progressWrap');
    if (wrap) {
      wrap.hidden = false;
      wrap.classList.add('show');
      clearTimeout(window._duoProgressTimer);
      window._duoProgressTimer = setTimeout(() => {
        wrap.classList.remove('show');
        wrap.hidden = true;
      }, 2200);
    }
  }

  function init(config) {
    const total = config.totalExercises || 12;
    const LP = global.LessonProgress.create(config.lessonId, total);
    let duoReady = false;
    let rainGame = null;
    let whackGame = null;
    let sprintGame = null;
    let towerGame = null;
    let bossGame = null;
    let flashGame = null;
    let oddGame = null;
    let flashStarted = false;
    let activeMode = 'duo';
    let currentMixGame = null;
    let lastMixGame = null;
    let mixRound = 0;
    let mixPendingNext = false;
    let mixSessionId = 0;
    let mixCanComplete = false;
    let mixListenersAttached = false;

    const gameConfig = {
      lessonId: config.lessonId,
      lang: config.lang || 'pl',
      vocab: window.LESSON_VOCAB || []
    };

    const panels = {
      duo: document.getElementById('practicePanelDuo'),
      rain: document.getElementById('practicePanelRain'),
      whack: document.getElementById('practicePanelWhack'),
      sprint: document.getElementById('practicePanelSprint'),
      tower: document.getElementById('practicePanelTower'),
      boss: document.getElementById('practicePanelBoss'),
      flash: document.getElementById('practicePanelFlash'),
      odd: document.getElementById('practicePanelOdd')
    };

    const stage = document.querySelector('.practice-stage');
    let mixBar = null;
    let mixRoundEl = null;
    let mixGameEl = null;
    let mixNextBtn = null;
    let mixSkipBtn = null;

    function ensureMixUi() {
      if (stage && !document.getElementById('mixBar')) {
        stage.insertAdjacentHTML('afterbegin',
          '<div class="mix-bar arcade-mix-bar" id="mixBar" hidden>' +
          '<div class="mix-bar-info">' +
          '<span class="mix-round" id="mixRoundLabel">RND 01</span>' +
          '<span class="mix-game-name" id="mixGameLabel">🎲 Random Mix</span>' +
          '</div>' +
          '<div class="mix-bar-actions">' +
          '<button type="button" class="mix-next-btn mix-next-btn--bar" id="mixNextBtn" hidden>🎲 Next</button>' +
          '<button type="button" class="mix-skip arcade-deck-btn" id="mixSkipBtn">Skip →</button>' +
          '</div>' +
          '</div>'
        );
      }

      mixBar = document.getElementById('mixBar');
      mixRoundEl = document.getElementById('mixRoundLabel');
      mixGameEl = document.getElementById('mixGameLabel');
      mixNextBtn = document.getElementById('mixNextBtn');
      mixSkipBtn = document.getElementById('mixSkipBtn');

      document.getElementById('mixNextOverlay')?.remove();

      if (!mixListenersAttached && mixNextBtn && mixSkipBtn) {
        mixListenersAttached = true;
        mixNextBtn.addEventListener('click', () => {
          mixPendingNext = false;
          launchMixGame();
        });
        mixSkipBtn.addEventListener('click', () => {
          mixPendingNext = false;
          if (mixNextBtn) mixNextBtn.hidden = true;
          launchMixGame();
        });
      }
    }

    function stopAllMinigames() {
      if (rainGame && rainGame.stop) rainGame.stop();
      if (whackGame && whackGame.stop) whackGame.stop();
      if (sprintGame && sprintGame.stop) sprintGame.stop();
      if (towerGame) towerGame.running = false;
      if (bossGame) {
        bossGame.running = false;
        bossGame.paused = false;
      }
      if (flashGame) flashGame.running = false;
      if (oddGame) oddGame.running = false;
    }

    function gameIsRunnable(id) {
      initMinigame(id);
      const g = getGame(id);
      if (!g) return false;
      if (id === 'rain' || id === 'whack') return g.pool && g.pool.length > 0;
      if (id === 'sprint') return g.sentences && g.sentences.length > 0;
      if (id === 'tower') return g.levels && g.levels.length > 0;
      if (id === 'flash') return g.allCards && g.allCards.length > 0;
      if (id === 'boss') return g.vocab && g.vocab.length > 0;
      if (id === 'odd') {
        const session = global.OddOneOut
          ? (function () {
              const words = g.lessonWords || [];
              const foreign = g.foreignWords || [];
              const rounds = g.curatedRounds || [];
              return rounds.length > 0 || (words.length >= 3 && foreign.length > 0);
            })()
          : false;
        return session;
      }
      return false;
    }

    function pickRandomRunnableGame(lastId) {
      let pool = MIX_GAMES.filter((g) => gameIsRunnable(g.id));
      if (!pool.length) return null;
      if (lastId && pool.length > 1) {
        pool = pool.filter((g) => g.id !== lastId);
      }
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function getGame(mode) {
      const map = {
        rain: rainGame,
        whack: whackGame,
        sprint: sprintGame,
        tower: towerGame,
        boss: bossGame,
        flash: flashGame,
        odd: oddGame
      };
      return map[mode] || null;
    }

    function clearMixFlags() {
      [rainGame, whackGame, sprintGame, towerGame, bossGame, flashGame, oddGame]
        .forEach((g) => {
          if (!g) return;
          g.onRoundComplete = null;
          g.mixMode = false;
          g.mixSingleLevel = false;
          g.mixAutoStart = false;
          g.mixCardLimit = 0;
        });
    }

    function initDuo() {
      if (duoReady) return;
      new global.DuolingoLesson({
        root: '#duoRoot',
        lessonId: config.lessonId,
        lang: config.lang || 'pl',
        LP: LP,
        exercises: window.DUO_EXERCISES || [],
        onProgress: function () {
          onProgress(LP);
        }
      });
      duoReady = true;
    }

    function initRain() {
      if (rainGame || !global.WordRain) return;
      rainGame = global.WordRain.create({ root: '#rainRoot', ...gameConfig });
    }

    function initWhack() {
      if (whackGame || !global.WhackAWord) return;
      whackGame = global.WhackAWord.create({ root: '#whackRoot', ...gameConfig });
    }

    function initSprint() {
      if (sprintGame || !global.SentenceSprint) return;
      sprintGame = global.SentenceSprint.create({ root: '#sprintRoot', ...gameConfig });
    }

    function initTower() {
      if (towerGame || !global.WordTower) return;
      towerGame = global.WordTower.create({ root: '#towerRoot', ...gameConfig });
    }

    function initBoss() {
      if (bossGame || !global.BossBattle) return;
      bossGame = global.BossBattle.create({ root: '#bossRoot', ...gameConfig });
    }

    function initFlash() {
      if (flashGame || !global.SwipeFlashcards) return;
      flashGame = global.SwipeFlashcards.create({ root: '#flashRoot', ...gameConfig });
    }

    function initOdd() {
      if (oddGame || !global.OddOneOut) return;
      oddGame = global.OddOneOut.create({ root: '#oddRoot', ...gameConfig });
    }

    function initMinigame(mode) {
      if (mode === 'rain') initRain();
      else if (mode === 'whack') initWhack();
      else if (mode === 'sprint') initSprint();
      else if (mode === 'tower') initTower();
      else if (mode === 'boss') initBoss();
      else if (mode === 'flash') initFlash();
      else if (mode === 'odd') initOdd();
    }

    function pauseMinigames(except) {
      if (rainGame && except !== 'rain') rainGame.pause();
      if (whackGame && except !== 'whack') whackGame.pause();
      if (sprintGame && except !== 'sprint') sprintGame.pause();
      if (towerGame && except !== 'tower') towerGame.pause();
      if (bossGame && except !== 'boss') bossGame.pause();
      if (flashGame && except !== 'flash') flashGame.pause();
      if (oddGame && except !== 'odd') oddGame.pause();
    }

    function applyMixSessionSettings(mode, game) {
      if (!game) return;
      game.mixMode = true;
      if (mode === 'tower') game.mixSingleLevel = true;
      if (mode === 'boss') game.mixAutoStart = true;
      if (mode === 'flash') game.mixCardLimit = 12;
    }

    function onMixGameComplete(sessionId) {
      if (activeMode !== 'mix' || mixPendingNext || sessionId !== mixSessionId || !mixCanComplete) return;
      mixPendingNext = true;
      if (mixNextBtn) mixNextBtn.hidden = false;
      if (mixGameEl) {
        const meta = MIX_GAMES.find((g) => g.id === currentMixGame);
        mixGameEl.textContent = meta ? meta.label + ' — done!' : 'Round done!';
      }
    }

    function showPanelsForGame(gameId) {
      Object.keys(panels).forEach((key) => {
        if (panels[key]) panels[key].hidden = key !== gameId;
      });
    }

    function startMixGame(mode, sessionId) {
      const game = getGame(mode);
      if (!game) return;

      mixCanComplete = false;
      clearTimeout(window._mixCompleteTimer);
      game.onRoundComplete = function () {
        onMixGameComplete(sessionId);
      };
      applyMixSessionSettings(mode, game);

      if (mode === 'rain') {
        game.restart();
      } else if (mode === 'whack') {
        game.restart();
      } else if (mode === 'sprint') {
        game.restart();
      } else if (mode === 'tower') {
        game.mixSingleLevel = true;
        game.start();
      } else if (mode === 'boss') {
        game.mixAutoStart = true;
        game.start();
      } else if (mode === 'flash') {
        flashStarted = true;
        game.start();
      } else if (mode === 'odd') {
        game.start();
      }

      window._mixCompleteTimer = setTimeout(function () {
        if (sessionId === mixSessionId) mixCanComplete = true;
      }, 600);
    }

    function launchMixGame() {
      ensureMixUi();
      mixSessionId++;
      const sessionId = mixSessionId;
      mixPendingNext = false;
      mixCanComplete = false;
      if (mixNextBtn) mixNextBtn.hidden = true;

      stopAllMinigames();
      clearMixFlags();

      const pick = pickRandomRunnableGame(lastMixGame);
      if (!pick) {
        if (mixGameEl) mixGameEl.textContent = 'No mini-games available';
        if (mixBar) mixBar.hidden = false;
        return;
      }

      currentMixGame = pick.id;
      lastMixGame = pick.id;
      mixRound++;

      if (mixRoundEl) mixRoundEl.textContent = 'RND ' + String(mixRound).padStart(2, '0');
      if (mixGameEl) mixGameEl.textContent = pick.label;
      if (mixBar) mixBar.hidden = false;

      initMinigame(currentMixGame);
      showPanelsForGame(currentMixGame);
      pauseMinigames(currentMixGame);
      startMixGame(currentMixGame, sessionId);
    }

    function resumeMinigame(mode) {
      if (mode === 'rain' && rainGame) {
        if (rainGame.running) rainGame.resume();
        else rainGame.start();
      }
      if (mode === 'whack' && whackGame) {
        if (whackGame.running) whackGame.resume();
        else whackGame.start();
      }
      if (mode === 'sprint' && sprintGame) {
        if (sprintGame.running) sprintGame.resume();
        else sprintGame.start();
      }
      if (mode === 'tower' && towerGame) {
        if (towerGame.running) towerGame.resume();
        else towerGame.start();
      }
      if (mode === 'boss' && bossGame) {
        if (bossGame.phase === 'fight' && bossGame.running) bossGame.resume();
        else if (bossGame.phase === 'setup' || bossGame.phase === 'done') bossGame.start();
        else bossGame.resume();
      }
      if (mode === 'flash' && flashGame) {
        if (!flashStarted) {
          flashGame.start();
          flashStarted = true;
        } else if (flashGame.running) {
          flashGame.resume();
        } else {
          flashGame.start();
        }
      }
      if (mode === 'odd' && oddGame) {
        if (oddGame.running) oddGame.resume();
        else oddGame.start();
      }
    }

    function switchMode(mode) {
      if (mode === activeMode) return;
      activeMode = mode;

      document.querySelectorAll('.practice-mode[data-mode]').forEach((btn) => {
        const on = btn.dataset.mode === mode;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-current', on ? 'true' : 'false');
      });

      ensureMixUi();
      mixPendingNext = false;

      if (mode === 'mix') {
        if (mixNextBtn) mixNextBtn.hidden = true;
        launchMixGame();
        return;
      }

      clearMixFlags();
      mixCanComplete = false;
      clearTimeout(window._mixCompleteTimer);
      if (mixBar) mixBar.hidden = true;
      if (mixNextBtn) mixNextBtn.hidden = true;
      currentMixGame = null;

      showPanelsForGame(mode);
      pauseMinigames(mode);

      if (mode === 'duo') {
        initDuo();
      } else if (mode === 'rain') {
        initRain();
        resumeMinigame('rain');
      } else if (mode === 'whack') {
        initWhack();
        resumeMinigame('whack');
      } else if (mode === 'sprint') {
        initSprint();
        resumeMinigame('sprint');
      } else if (mode === 'tower') {
        initTower();
        resumeMinigame('tower');
      } else if (mode === 'boss') {
        initBoss();
        resumeMinigame('boss');
      } else if (mode === 'flash') {
        initFlash();
        resumeMinigame('flash');
      } else if (mode === 'odd') {
        initOdd();
        resumeMinigame('odd');
      }
    }

    document.querySelectorAll('.practice-mode[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    ensureMixUi();
    initDuo();
    LP.restore();
  }

  global.PracticeModule = { init };
})(typeof window !== 'undefined' ? window : globalThis);
