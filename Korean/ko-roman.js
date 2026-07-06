/**
 * Korean → Polish transcription (approximate, mirrors pl-hangul.js rules in reverse).
 * Transcription is hidden until the user clicks Korean text.
 */
(function (global) {
  'use strict';

  const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const MEDIALS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const FINALS = [
    '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ',
    'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];

  /* Vowels — inverse of pl-hangul VOWEL + DIGRAPHS (ja, jo, ju, ła, ło, y→ㅡ, …) */
  const VOWEL = {
    'ㅏ': 'a', 'ㅐ': 'e', 'ㅑ': 'ja', 'ㅒ': 'je', 'ㅓ': 'o', 'ㅔ': 'e',
    'ㅕ': 'jo', 'ㅖ': 'je', 'ㅗ': 'o', 'ㅘ': 'ła', 'ㅙ': 'we', 'ㅚ': 'we',
    'ㅛ': 'jo', 'ㅜ': 'u', 'ㅝ': 'ło', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅠ': 'ju',
    'ㅡ': 'y', 'ㅢ': 'yj', 'ㅣ': 'i'
  };

  /* Consonants — inverse of pl-hangul CONSON + cz/dz/ch → ㅊ/ㅈ/ㅎ */
  const CONSON_INITIAL = {
    'ㄱ': 'g', 'ㄲ': 'k', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'd', 'ㄹ': 'r',
    'ㅁ': 'm', 'ㅂ': 'b', 'ㅃ': 'pp', 'ㅅ': 's', 'ㅆ': 'sz', 'ㅇ': '',
    'ㅈ': 'dz', 'ㅉ': 'dź', 'ㅊ': 'cz', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h'
  };

  const CONSON_FINAL = {
    '': '', 'ㄱ': 'k', 'ㄲ': 'k', 'ㄳ': 'k', 'ㄴ': 'n', 'ㄵ': 'n', 'ㄶ': 'n',
    'ㄷ': 't', 'ㄹ': 'l', 'ㄺ': 'k', 'ㄻ': 'm', 'ㄼ': 'l', 'ㄽ': 'l', 'ㄾ': 'l',
    'ㄿ': 'p', 'ㅀ': 'l', 'ㅁ': 'm', 'ㅂ': 'p', 'ㅄ': 'p', 'ㅅ': 't', 'ㅆ': 't',
    'ㅇ': 'ng', 'ㅈ': 't', 'ㅊ': 't', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'k'
  };

  /* pl-hangul: ć→ㅊㅣ, ś→ㅅㅣ, zi/ź→ㅈㅣ; ㅈㅣ forward = dzi (dz+i) */
  const INITIAL_VOWEL = {
    'ㅈㅕ': 'dżo', 'ㅈㅖ': 'dże', 'ㅈㅛ': 'dżo', 'ㅈㅠ': 'dżu',
    'ㅈㅏ': 'dża', 'ㅈㅗ': 'dżo', 'ㅈㅜ': 'dżu', 'ㅈㅔ': 'dże', 'ㅈㅓ': 'dżo',
    'ㅊㅣ': 'ć', 'ㅊㅕ': 'czo', 'ㅊㅖ': 'cze', 'ㅊㅛ': 'czo', 'ㅊㅠ': 'czu',
    'ㅊㅏ': 'cza', 'ㅊㅗ': 'czo', 'ㅊㅜ': 'czu', 'ㅊㅔ': 'cze', 'ㅊㅓ': 'czo',
    'ㅅㅣ': 'ś', 'ㅅㅕ': 'so', 'ㅅㅖ': 'se', 'ㅅㅛ': 'so', 'ㅅㅠ': 'su',
    'ㄴㅣㅔ': 'nie', 'ㄴㅣ': 'ni'
  };

  const HANGUL_RUN = /~?[\uAC00-\uD7A3]+(?:\s[\uAC00-\uD7A3]+)*/g;
  const HAS_HANGUL = /[\uAC00-\uD7A3]/;

  let clickBound = false;

  function decompose(char) {
    const code = char.charCodeAt(0);
    if (code < 0xAC00 || code > 0xD7A3) return null;
    const offset = code - 0xAC00;
    const fi = offset % 28;
    const mi = Math.floor((offset % 588) / 28);
    const ii = Math.floor(offset / 588);
    return {
      i: INITIALS[ii],
      m: MEDIALS[mi],
      f: FINALS[fi]
    };
  }

  function syllableToPolish(char) {
    const parts = decompose(char);
    if (!parts) return char;

    const combo = parts.i + parts.m;
    if (INITIAL_VOWEL[combo]) {
      return INITIAL_VOWEL[combo] + (CONSON_FINAL[parts.f] || '');
    }

    const initial = CONSON_INITIAL[parts.i] ?? parts.i;
    const vowel = VOWEL[parts.m] ?? parts.m;
    const fin = CONSON_FINAL[parts.f] ?? parts.f;

    return initial + vowel + fin;
  }

  function hangulToPolish(text) {
    if (!text) return '';
    return text
      .split(/(\s+)/)
      .map((part) => {
        if (/^\s+$/.test(part)) return ' ';
        let out = '';
        for (const ch of part) {
          out += syllableToPolish(ch);
        }
        return out;
      })
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ─── Polish → Hangul (reverse of syllableToPolish) ─── */

  const POLISH_IV = [
    ['ła', 'ㅇ', 'ㅘ'],
    ['ło', 'ㅇ', 'ㅝ'],
    ['czwe', 'ㅊ', 'ㅚ'],
    ['he', 'ㅎ', 'ㅐ'],
    ['de', 'ㄷ', 'ㅐ'],
    ['go', 'ㄱ', 'ㅗ'],
    ['gat', 'ㄱ', 'ㅏ', 'ㅌ'],
    ['dzi', 'ㅈ', 'ㅣ'], ['zi', 'ㅈ', 'ㅣ'], ['ź', 'ㅈ', 'ㅣ'],
    ['dżo', 'ㅈ', 'ㅕ'], ['dże', 'ㅈ', 'ㅖ'], ['dża', 'ㅈ', 'ㅏ'], ['dżu', 'ㅈ', 'ㅜ'],
    ['czo', 'ㅊ', 'ㅕ'], ['cze', 'ㅊ', 'ㅖ'], ['cza', 'ㅊ', 'ㅏ'], ['czu', 'ㅊ', 'ㅜ'],
    ['ci', 'ㅊ', 'ㅣ'], ['ć', 'ㅊ', 'ㅣ'],
    ['si', 'ㅅ', 'ㅣ'], ['ś', 'ㅅ', 'ㅣ'], ['so', 'ㅅ', 'ㅕ'], ['se', 'ㅅ', 'ㅖ'], ['su', 'ㅅ', 'ㅠ'],
    ['ni', 'ㄴ', 'ㅣ']
  ];

  const POLISH_INIT = [
    ['pp', 'ㅃ'], ['sz', 'ㅆ'], ['dz', 'ㅈ'], ['dź', 'ㅉ'], ['cz', 'ㅊ'],
    ['g', 'ㄱ'], ['k', 'ㄱ'], ['n', 'ㄴ'], ['d', 'ㄷ'], ['r', 'ㄹ'], ['l', 'ㄹ'], ['m', 'ㅁ'],
    ['b', 'ㅂ'], ['p', 'ㅍ'], ['s', 'ㅅ'], ['t', 'ㅌ'], ['h', 'ㅎ']
  ];

  const POLISH_VOWEL = [
    ['yj', 'ㅢ'], ['ju', 'ㅠ'], ['jo', 'ㅕ'], ['ja', 'ㅑ'], ['je', 'ㅖ'],
    ['ła', 'ㅘ'], ['ło', 'ㅝ'],
    ['ą', 'ㅗ'], ['ę', 'ㅔ'], ['ó', 'ㅜ'],
    ['a', 'ㅏ'], ['e', 'ㅔ'], ['i', 'ㅣ'], ['o', 'ㅓ'], ['u', 'ㅜ'], ['y', 'ㅡ']
  ];

  /* lone w + e/i/u = Latin w + vowel (no w in Hangul); lone j = ㅣ (mirrors pl-hangul) */
  const POLISH_W_LATIN = { e: 'ㅔ', i: 'ㅣ', u: 'ㅜ' };
  const POLISH_J_VOWEL = new Set(['a', 'e', 'o', 'u']);

  /* t/d = ㄷ batchim; l/r = ㄹ batchim (forward: ㄷ→t, ㄹ→l; aliases accepted on input) */
  const POLISH_FINAL = [
    ['ng', 'ㅇ'], ['k', 'ㄱ'], ['n', 'ㄴ'], ['t', 'ㄷ'], ['d', 'ㄷ'], ['l', 'ㄹ'], ['r', 'ㄹ'], ['m', 'ㅁ'], ['p', 'ㅂ']
  ];

  function composeSyllable(initial, medial, final) {
    const ii = INITIALS.indexOf(initial);
    const mi = MEDIALS.indexOf(medial);
    const fi = FINALS.indexOf(final || '');
    if (ii < 0 || mi < 0 || fi < 0) return '';
    return String.fromCharCode(0xAC00 + ii * 588 + mi * 28 + fi);
  }

  function canStartSyllable(s, pos) {
    if (pos >= s.length) return false;
    for (const [pat] of POLISH_IV) {
      if (s.startsWith(pat, pos)) return true;
    }
    for (const [ip] of POLISH_INIT) {
      if (!s.startsWith(ip, pos)) continue;
      const after = pos + ip.length;
      for (const [vp] of POLISH_VOWEL) {
        if (s.startsWith(vp, after)) return true;
      }
    }
    for (const [vp] of POLISH_VOWEL) {
      if (s.startsWith(vp, pos)) return true;
    }
    return false;
  }

  function parseFinal(s, pos) {
    for (const [pat, jamo] of POLISH_FINAL) {
      if (!s.startsWith(pat, pos)) continue;
      const after = pos + pat.length;
      if (after < s.length && POLISH_INIT.some(([ip]) => ip === pat) && canStartSyllable(s, pos)) {
        continue;
      }
      return { f: jamo, next: after };
    }
    return { f: '', next: pos };
  }

  function parseNextSyllable(s, pos) {
    const options = [];

    for (const entry of POLISH_IV) {
      const [pat, ini, med, finFixed] = entry;
      if (!s.startsWith(pat, pos)) continue;
      if (pat === 'go' && (s.startsWith('godz', pos) || s.startsWith('goź', pos))) continue;
      const fin = finFixed !== undefined
        ? { f: finFixed, next: pos + pat.length }
        : parseFinal(s, pos + pat.length);
      options.push({ i: ini, m: med, f: fin.f, next: fin.next, len: fin.next - pos });
    }

    const tryInits = [['', 'ㅇ']].concat(POLISH_INIT);
    for (const [ip, ini] of tryInits) {
      if (ip && !s.startsWith(ip, pos)) continue;
      const i1 = pos + ip.length;
      for (const [vp, medDefault] of POLISH_VOWEL) {
        if (!s.startsWith(vp, i1)) continue;
        const medials = [medDefault];
        for (const med of medials) {
          const i2 = i1 + vp.length;
          options.push({ i: ini, m: med, f: '', next: i2, len: i2 - pos });
          for (const [fp, fj] of POLISH_FINAL) {
            if (!s.startsWith(fp, i2)) continue;
            const next = i2 + fp.length;
            if (next < s.length && POLISH_INIT.some(([p]) => p === fp) && canStartSyllable(s, i2)) {
              continue;
            }
            options.push({ i: ini, m: med, f: fj, next, len: next - pos });
          }
        }
      }
    }

    if (!options.length) return null;
    options.sort((a, b) => b.len - a.len);
    const best = options[0];
    return { i: best.i, m: best.m, f: best.f, next: best.next };
  }

  function polishWordToHangul(word) {
    if (!word) return '';
    const s = word.toLowerCase();
    let out = '';
    let i = 0;

    while (i < s.length) {
      if (s[i] === 'w') {
        const next = s[i + 1];
        if (next && POLISH_W_LATIN[next]) {
          out += 'w' + composeSyllable('ㅇ', POLISH_W_LATIN[next], '');
          i += 2;
          continue;
        }
        out += 'w';
        i++;
        continue;
      }

      if (s[i] === 'j' && !POLISH_J_VOWEL.has(s[i + 1])) {
        out += composeSyllable('ㅇ', 'ㅣ', '');
        i++;
        continue;
      }

      const parsed = parseNextSyllable(s, i);
      if (!parsed) {
        out += word[i] ?? s[i];
        i++;
        continue;
      }
      const syllable = composeSyllable(parsed.i, parsed.m, parsed.f);
      out += syllable || s.slice(i, parsed.next);
      i = parsed.next;
    }
    return out;
  }

  function polishToHangul(text) {
    if (!text) return '';
    return text.split('\n').map((line) =>
      line.split(/(\s+)/).map((part) => {
        if (/^\s+$/.test(part)) return part;
        if (!part.trim()) return part;
        return polishWordToHangul(part);
      }).join('')
    ).join('\n');
  }

  function hangulToPolishPreserve(text) {
    if (!text) return '';
    return text.split('\n').map((line) =>
      line.split(/(\s+)/).map((part) => {
        if (/^\s+$/.test(part)) return part;
        let out = '';
        for (const ch of part) {
          const cp = ch.codePointAt(0);
          out += (cp >= 0xAC00 && cp <= 0xD7A3) ? syllableToPolish(ch) : ch;
        }
        return out;
      }).join('')
    ).join('\n');
  }

  function wrapKoWord(display, transcript) {
    if (!transcript) return display;
    return `<span class="ko-word" role="button" tabindex="0" title="Kliknij, aby zobaczyć transkrypcję">${display}<span class="ko-roman">(${transcript})</span></span>`;
  }

  function formatKoreanWithRoman(text) {
    if (!text || text.includes('ko-word')) return text;
    if (!HAS_HANGUL.test(text)) return text;

    return text.replace(HANGUL_RUN, (segment) => {
      const transcript = hangulToPolish(segment.replace(/^~/, ''));
      if (!transcript) return segment;
      return wrapKoWord(segment, transcript);
    });
  }

  function annotateElement(el) {
    if (!el || el.dataset.koRomanDone) return;

    if (!el.querySelector('span.ko-word, input, button, a')) {
      const html = formatKoreanWithRoman(el.textContent);
      if (html !== el.textContent) {
        el.innerHTML = html;
        el.dataset.koRomanDone = '1';
        el.querySelectorAll('.ko-word').forEach((w) => {
          if (w.closest('.match-item, .word-chip')) {
            w.title = 'Double-tap for transcription';
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
      const word = e.target.closest('.ko-word');
      if (!word || isInteractiveParent(word)) return;
      e.stopPropagation();
      toggleWord(word);
    });

    document.addEventListener('dblclick', (e) => {
      const word = e.target.closest('.ko-word');
      if (!word || !isInteractiveParent(word)) return;
      e.stopPropagation();
      e.preventDefault();
      toggleWord(word);
    });

    document.addEventListener('keydown', (e) => {
      const word = e.target.closest('.ko-word');
      if (!word) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggleWord(word);
      }
    });
  }

  function annotateKoreanPage() {
    bindClickReveal();

    const forceSelectors = [
      '.example-pl.ko',
      '.example-pl',
      '.flashcard-pl.ko',
      'table.vocab td.ko',
      'table.theory-table td.ko',
      '.pattern-formula .ko',
      '.gender-chip .ko',
      '.summary-item .ko',
      '.fill-sentence.ko'
    ];

    forceSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (HAS_HANGUL.test(el.textContent)) annotateElement(el);
      });
    });

    document.querySelectorAll('.match-item.ko, .word-chip.ko, em.ko, span.ko, strong.ko').forEach((el) => {
      if (HAS_HANGUL.test(el.textContent) && !el.closest('table.vocab')) {
        annotateElement(el);
      }
    });
  }

  function koCell(text) {
    return formatKoreanWithRoman(text);
  }

  global.hangulToPolish = hangulToPolish;
  global.hangulToRoman = hangulToPolish;
  global.hangulToPolishPreserve = hangulToPolishPreserve;
  global.polishToHangul = polishToHangul;
  global.polishWordToHangul = polishWordToHangul;
  global.formatKoreanWithRoman = formatKoreanWithRoman;
  global.annotateKoreanPage = annotateKoreanPage;
  global.koCell = koCell;
})(typeof window !== 'undefined' ? window : globalThis);
