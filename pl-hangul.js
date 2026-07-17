/**
 * Polish → Hangul pronunciation guide (approximate, for Korean learners).
 *
 * Mapping from user romanization chart. Letters without a Hangul match
 * stay in Latin (w, z, sz, rz, ż, f, …).
 *
 * Hangul is hidden until the user clicks a Polish word.
 */
(function (global) {
  'use strict';

  /*
   * User chart (Hangul → Polish), applied in reverse here:
   * ㅏa ㅑja ㅓo ㅕjo ㅗo ㅛjo ㅜu ㅠju ㅡy ㅣi ㅐe ㅔe
   * ㅘwa ㅙwe ㅚoe ㅝło ㅞłe ㅟłi ㅢui
   * ㅈdz ㅊcz  ·  no Hangul for w/z/sz → keep Latin
   */
  const VOWEL = {
    a: 'ㅏ', e: 'ㅔ', i: 'ㅣ', o: 'ㅗ', u: 'ㅜ', y: 'ㅡ',
    ą: 'ㅗ', ę: 'ㅔ', ó: 'ㅜ'
  };

  const CONSON = {
    b: 'ㅂ', d: 'ㄷ', f: 'f', g: 'ㄱ', h: 'ㅎ', k: 'ㅋ',
    l: 'ㄹ', m: 'ㅁ', n: 'ㄴ', p: 'ㅍ', r: 'ㄹ', s: 'ㅅ', t: 'ㅌ'
  };

  const DIGRAPHS = [
    ['chcę', 'ㅎㅊㅔ'],
    ['chce', 'ㅎㅊㅔ'],
    ['chci', 'ㅎㅊㅣ'],
    ['chc', 'ㅎㅊ'],
    ['szcz', 'szㅊ'],
    ['sz', 'sz'],
    ['cz', 'ㅊ'],
    ['dź', 'ㅈ'],
    ['dż', 'ㅈ'],
    ['dz', 'ㅈ'],
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
    /* ㅘ/ㅙ exist in the chart as wa/we — use Hangul digraphs */
    ['wa', 'ㅘ'],
    ['we', 'ㅙ'],
    ['wi', 'wㅣ'],
    ['wo', 'wㅗ'],
    ['wu', 'wㅜ'],
    ['wy', 'wㅡ'],
    /* ㅝ/ㅞ/ㅟ = ło/łe/łi */
    ['ło', 'ㅝ'],
    ['łe', 'ㅞ'],
    ['łi', 'ㅟ'],
    ['ła', 'ㄹㅏ'],
    ['ły', 'ㄹㅡ'],
    ['łu', 'ㄹㅜ'],
    ['le', 'ㄹㅔ'],
    ['ui', 'ㅢ'],
    ['oe', 'ㅚ']
  ];

  const SINGLE = {
    ć: 'ㅊㅣ', ń: 'ㄴ', ś: 'ㅅㅣ', ź: 'ㅈㅣ', ż: 'ż', ł: 'ㄹ',
    w: 'w', z: 'z', j: 'ㅣ', c: 'c', q: 'q', v: 'v', x: 'x'
  };

  const POLISH_HINT = /[ąćęłńóśźż]/i;
  const POLISH_CLUSTER = /szcz|sz|cz|rz|ch|dzi|dź|dż|dz|cie|się|nie|ią|ię|ść|ość|enie|ować|ać|ić/i;
  const ENGLISH_PHRASE = /^(I'm|I am|You are|Too |The |like this|so much|yes\b|too\b|I'm |sentence pattern|topic marker|you \(|\()/i;

  const KNOWN_POLISH = /^(tak|taka|taki|takie|zbyt|za|się|sie|bardzo|właśnie|wlascie|naj|jest|jestem|jesteś|jestes|czy|czyż|czyz|dziś|dzis|pogoda|gorąco|goraco|zimno|idealna|idealny|idealne|przytul|przytula|przytulam|przytulę|przytule|przytulenie|przytulasa|tulę|tule|tulić|tulic|chcę|chce|mnie|cię|cie|skarb|skarbie|kotk|kotku|misi|misiu|kocham|człowiek|czlowiek|ludzie|niebo|ziemi|ziemia|wszechświat|wszechswiat|okropna|cudown|wspaniał|wspanial|szczęśliw|szczesliw|najszczęśliwsz|najszczesliwsz|cieszę|ciesze|czeszę|czesze|partykuł|partykul|niesamowit|piękn|piekn|najlepsz|najbardziej|świat|swiat|świąt|ty|ja|na|ten|ta|to|tego|tej|tę|te|mam|lubię|lubie|boję|boje|film|filmu|kot|chłopak|chlopak|dziewczyna|dziecko|książk|ksiazk|noc|mamy|księżyc|ksiezyc|naprawdę|naprawde|wyjątkowo|wyjatkowo|cudowną|cudowna|świecie|swiecie|dlatego|bez|do|od|dla|widzę|widze|rozumiem|miłość|milosc|co)$/i;

  let clickBound = false;

  function isPolishWord(word) {
    if (!word) return false;
    if (POLISH_HINT.test(word)) return true;
    if (POLISH_CLUSTER.test(word)) return true;
    if (KNOWN_POLISH.test(word)) return true;
    return false;
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

      /* hard c (no Hangul ts letter in chart) — keep Latin, except soft ce/ci/cę handled above via digraphs/ci */
      if (ch === 'c' && (next === 'e' || next === 'i' || next === 'ę')) {
        if (next === 'ę') {
          out += 'ㅊㅔ';
          i += 2;
          continue;
        }
        out += 'c';
        i++;
        continue;
      }
      if (ch === 'c') {
        out += 'c';
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
          if (!trimmed) return part;
          if (!forceAll && !isPolishWord(trimmed)) return part;
          if (ENGLISH_PHRASE.test(trimmed)) return part;
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
      '.theory-rules .pl',
      '.word-chip'
    ];

    forceSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => annotateElement(el, true));
    });

    document.querySelectorAll('.match-item').forEach((el) => {
      if (isPolishText(el.textContent)) annotateElement(el, true);
    });

    const softSelectors = [
      '.gender-chip strong',
      '.gender-chip em',
      '.summary-item em',
      '.summary-item strong',
      '.explain-box em',
      '.explain-box strong',
      '.explain-compare em',
      '.explain-compare strong',
      '.fill-sentence em',
      '.bonus-fact strong',
      '.bonus-fact em',
      '.sie-examples em',
      '.sie-examples strong',
      '.lesson-block-title em',
      '.callout em',
      '.callout strong',
      '.muted em',
      'h3 em',
      'li em'
    ];

    softSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.dataset.plHangulDone) return;
        if (el.closest('.pl-word')) return;
        annotateElement(el, false);
      });
    });

    document.querySelectorAll('em, strong').forEach((el) => {
      if (el.dataset.plHangulDone) return;
      if (el.closest('.pl-word')) return;
      if (!isPolishText(el.textContent)) return;
      annotateElement(el, false);
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
