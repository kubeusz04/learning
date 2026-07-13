window.DUO_EXERCISES = [
  {
    type: 'choice', badge: 'Noun',
    prompt: 'What is <strong>"a hug"</strong> (noun)?',
    options: [
      { text: 'przytulenie', correct: true },
      { text: 'przytulam', correct: false },
      { text: 'przytulę', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Want',
    prompt: 'How do you say <strong>"I want a hug"</strong>?',
    options: [
      { text: 'Chcę przytulasa.', correct: true },
      { text: 'Przytul mnie.', correct: false },
      { text: 'Przytulam cię.', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in',
    prompt: 'Complete:', template: '___ przytulasa.',
    hint: '"I want" — don\'t forget <strong>ę</strong>',
    answer: 'chcę', accept: ['chcę', 'chce'],
    chips: ['Chcę', 'Chce', 'Chcą']
  },
  {
    type: 'choice', badge: 'Command',
    prompt: 'How do you say <strong>"Hug me"</strong>?',
    options: [
      { text: 'Przytul mnie.', correct: true },
      { text: 'Przytulę cię.', correct: false },
      { text: 'Chcę przytulasa.', correct: false }
    ]
  },
  {
    type: 'match', badge: 'Match',
    prompt: 'Match English → Polish',
    pairs: [['I want a hug.', 'Chcę przytulasa.'], ['Hug me.', 'Przytul mnie.'], ['I\'m hugging you.', 'Przytulam cię.'], ['I\'ll hug you.', 'Przytulę cię.']]
  },
  {
    type: 'fill', badge: 'Fill in',
    prompt: 'Complete:', template: 'Przytul ___.',
    hint: '"me"',
    answer: 'mnie', accept: ['mnie']
  },
  {
    type: 'choice', badge: 'Present',
    prompt: '<strong>"I\'m hugging you"</strong> with <em>przytulać</em>:',
    options: [
      { text: 'Przytulam cię.', correct: true },
      { text: 'Przytulę cię.', correct: false },
      { text: 'Przytul mnie.', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Nickname',
    prompt: 'Sweet nickname meaning <strong>"darling / treasure"</strong>:',
    options: [
      { text: 'Skarbie!', correct: true },
      { text: 'Kotku!', correct: false },
      { text: 'Misiu!', correct: false }
    ]
  },
  {
    type: 'match', badge: 'Nicknames',
    prompt: 'Match nickname → meaning',
    pairs: [['Skarbie!', 'darling'], ['Kotku!', 'kitty'], ['Misiu!', 'teddy bear']]
  },
  {
    type: 'build', badge: 'Build',
    prompt: 'Build: <strong>"I\'ll hug you."</strong>',
    words: ['Przytulę', 'cię.', 'Przytulam', 'mnie.'],
    answer: ['Przytulę', 'cię.']
  },
  {
    type: 'choice', badge: 'człowiek / ludzie',
    prompt: 'Which word means <strong>"people"</strong> (plural only)?',
    options: [
      { text: 'ludzie', correct: true },
      { text: 'człowiek', correct: false },
      { text: 'osoba', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Love',
    prompt: 'Pick the start of: <strong>"I love you more than sky, earth & universe…"</strong>',
    options: [
      { text: 'Kocham cię bardziej niż…', correct: true },
      { text: 'Kocham cię mniej niż…', correct: false },
      { text: 'Kocham cię bez…', correct: false }
    ]
  }
];
