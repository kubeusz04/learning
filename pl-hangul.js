/**
 * Polish → Hangul pronunciation guide (approximate, for Korean learners).
 * Hangul is hidden until the user clicks a Polish word.
 */
(function (global) {
  'use strict';

  const VOWEL = {
    a: 'ㅏ', e: 'ㅔ', i: 'ㅣ', o: 'ㅗ', u: 'ㅜ', y: 'ㅡ',
    ą: 'ㅗ', ę: 'ㅔ', ó: 'ㅜ'
  };

  const CONSON = {
    b: 'ㅂ', d: 'ㄷ', f: 'f', g: 'ㄱ', h: 'ㅎ', k: 'ㅋ',
    l: 'ㄹ', m: 'ㅁ', n: 'ㄴ', p: 'ㅍ', r: 'ㄹ', s: 'ㅅ', t: 'ㅌ'
  };

  const DIGRAPHS = [
    ['szcz', 'szㅊ'],
    ['sz', 'sz'],
    ['cz', 'ㅊ'],
    ['dz', 'ㅈ'],
    ['dź', 'ㅈ'],
    ['dż', 'ㅈ'],
    ['ch', 'ㅎ'],
    ['rz', 'rz'],
    ['cie', 'ㅊㅣㅔ'],
    ['cia', 'ㅊㅣㅏ'],
    ['cią', 'ㅊㅣㅗ'],
    ['cio', 'ㅊㅣㅗ'],
    ['ciu', 'ㅊㅣㅜ'],
    ['cię', 'ㅊㅣㅔ'],
    ['ci', 'ㅊㅣ'],
    ['się', 'ㅅㅣㅔ'],
    ['sie', 'ㅅㅣㅔ'],
    ['si', 'ㅅㅣ'],
    ['zie', 'ㅈㅣㅔ'],
    ['zia', 'ㅈㅣㅏ'],
    ['zi', 'ㅈㅣ'],
    ['nie', 'ㄴㅣㅔ'],
    ['ni', 'ㄴㅣ'],
    ['ja', 'ㅑ'],
    ['je', 'ㅖ'],
    ['jo', 'ㅛ'],
    ['ju', 'ㅠ'],
    ['ia', 'ㅑ'],
    ['ie', 'ㅖ'],
    ['io', 'ㅛ'],
    ['iu', 'ㅠ'],
    ['wa', 'wㅏ'],
    ['we', 'wㅔ'],
    ['wi', 'wㅣ'],
    ['wo', 'wㅗ'],
    ['wu', 'wㅜ'],
    ['ło', 'ㅝ'],
    ['łe', 'ㅞ'],
    ['łi', 'ㅟ'],
    ['ła', 'ㄹㅏ'],
    ['ły', 'ㄹㅡ'],
    ['le', 'ㄹㅔ']
  ];

  const SINGLE = {
    ć: 'ㅊㅣ', ń: 'ㄴ', ś: 'ㅅㅣ', ź: 'ㅈㅣ', ż: 'ż', ł: 'ㄹ',
    w: 'w', z: 'z', j: 'ㅣ', c: 'c', q: 'q', v: 'v', x: 'x'
  };

  const POLISH_HINT = /[ąćęłńóśźż]/i;
  const ENGLISH_PHRASE = /^(I'm|I am|You are|Too |The |like this|so much|yes\b|too\b|I'm |sentence pattern|topic marker|you \(|\()/i;

  let clickBound = false;

  function isPolishWord(word) {
    if (POLISH_HINT.test(word)) return true;
    return /^(tak|taka|taki|takie|zbyt|za|się|sie|bardzo|właśnie|wlascie|naj|jest|jestem|jesteś|jestes|czy|dziś|dzis|pogoda|gorąco|goraco|zimno|idealna|idealny|okropna|cudown|wspaniał|wspanial|perfekcyj|szczęśliw|szczesliw|cieszę|ciesze|czeszę|czesze|partykuł|partykul|niesamowit|piękn|piekn|najlepsz|najbardziej|wszechświat|wszechswiat|świat|swiat|ty|ja|na)$/i.test(word);
  }

  function isPolishText(text) {
    if (POLISH_HINT.test(text)) return true;
    if (ENGLISH_PHRASE.test(text.trim())) return false;
    return text.split(/\s+/).some(isPolishWord);
  }

  function polishWordToHangul(word) {
    if (!word) return '';
    let out = '';
    let i = 0;
    const s = word.toLowerCase();

    while (i < s.length) {
      let matched = false;
      for (const [pat, rep] of DIGRAPHS) {
        if (s.startsWith(pat, i)) {
          out += rep;
          i += pat.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      const ch = s[i];
      const next = s[i + 1] || '';

      if (ch === 'c' && (next === 'e' || next === 'i')) {
        out += 'c';
        i++;
        continue;
      }
      if (ch === 'c' && (next === 'a' || next === 'o' || next === 'u' || next === 'y')) {
        out += 'c';
        i++;
        continue;
      }
      if (ch === 'c') {
        out += 'ㄱ';
        i++;
        continue;
      }

      if (SINGLE[ch] !== undefined) {
        out += SINGLE[ch];
        i++;
        continue;
      }
      if (VOWEL[ch] !== undefined) {
        out += VOWEL[ch];
        i++;
        continue;
      }
      if (CONSON[ch] !== undefined) {
        out += CONSON[ch];
        i++;
        continue;
      }

      out += word[i];
      i++;
    }

    return out;
  }

  function wrapWord(part, hangul) {
    return `<span class="pl-word" role="button" tabindex="0" title="Tap for Hangul pronunciation">${part}<span class="pl-hangul">(${hangul})</span></span>`;
  }

  function formatPolishWithHangul(text, forceAll) {
    if (!text || text.includes('pl-word')) return text;

    return text.replace(
      /[\p{L}ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+(?:\/[\p{L}ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)*/gu,
      (word) => {
        const parts = word.split('/');
        return parts.map((part) => {
          const trimmed = part.trim();
          if (!trimmed || (!forceAll && !isPolishWord(trimmed))) return part;
          const h = polishWordToHangul(trimmed);
          if (!h) return part;
          return wrapWord(part, h);
        }).join(' / ');
      }
    );
  }

  function annotateElement(el, forceAll) {
    if (!el || el.dataset.plHangulDone) return;

    if (!el.querySelector('span.pl-word, input, button, a')) {
      const html = formatPolishWithHangul(el.textContent, forceAll);
      if (html !== el.textContent) {
        el.innerHTML = html;
        el.dataset.plHangulDone = '1';
        el.querySelectorAll('.pl-word').forEach((w) => {
          if (w.closest('.match-item, .word-chip')) {
            w.title = 'Double-tap for Hangul pronunciation';
          }
        });
      }
    }
  }

  function bindClickReveal() {
    if (clickBound) return;
    clickBound = true;

    function toggleWord(word) {
      word.classList.toggle('revealed');
    }

    function isInteractiveParent(word) {
      return word.closest('.match-item, .word-chip');
    }

    document.addEventListener('click', (e) => {
      const word = e.target.closest('.pl-word');
      if (!word || isInteractiveParent(word)) return;
      e.stopPropagation();
      toggleWord(word);
    });

    document.addEventListener('dblclick', (e) => {
      const word = e.target.closest('.pl-word');
      if (!word || !isInteractiveParent(word)) return;
      e.stopPropagation();
      e.preventDefault();
      toggleWord(word);
    });

    document.addEventListener('keydown', (e) => {
      const word = e.target.closest('.pl-word');
      if (!word) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggleWord(word);
      }
    });
  }

  function annotatePolishPage() {
    bindClickReveal();

    const forceSelectors = [
      '.example-pl',
      '.flashcard-pl',
      'table.vocab td.pl',
      'table.theory-table td.pl',
      'span.pl',
      '.example-box .pl',
      '.theory-rules .pl'
    ];

    forceSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => annotateElement(el, true));
    });

    document.querySelectorAll('.match-item').forEach((el) => {
      if (isPolishText(el.textContent)) annotateElement(el, true);
    });

    document.querySelectorAll('.gender-chip strong, .gender-chip em, .summary-item em, .explain-box em, .explain-compare em, .fill-sentence em, .word-chip').forEach((el) => {
      annotateElement(el, el.classList.contains('word-chip'));
    });
  }

  function plCell(text) {
    return formatPolishWithHangul(text, true);
  }

  global.polishWordToHangul = polishWordToHangul;
  global.formatPolishWithHangul = formatPolishWithHangul;
  global.annotatePolishPage = annotatePolishPage;
  global.plCell = plCell;
})(typeof window !== 'undefined' ? window : globalThis);
