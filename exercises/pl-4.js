window.DUO_EXERCISES = [
  {
    type: 'choice', badge: 'Gender',
    prompt: 'Which form matches a <strong>masculine</strong> noun?',
    options: [
      { text: 'ten', correct: true },
      { text: 'ta', correct: false },
      { text: 'tej', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Gender',
    prompt: 'Which form matches a <strong>feminine</strong> noun?',
    options: [
      { text: 'ta', correct: true },
      { text: 'ten', correct: false },
      { text: 'tego', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Gender',
    prompt: '<strong>"this child"</strong> — which demonstrative?',
    options: [
      { text: 'to dziecko', correct: true },
      { text: 'ten dziecko', correct: false },
      { text: 'ta dziecko', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'to',
    prompt: 'How do you say <strong>"What\'s that?"</strong>?',
    options: [
      { text: 'Co to?', correct: true },
      { text: 'Co ten?', correct: false },
      { text: 'Co tego?', correct: false }
    ]
  },
  {
    type: 'match', badge: 'Match',
    prompt: 'Match form → gender / role',
    pairs: [['ten', 'masculine'], ['ta', 'feminine'], ['to', 'neuter / this is'], ['tego', 'genitive of ten/to']]
  },
  {
    type: 'choice', badge: 'tego',
    prompt: 'Why do we say <strong>"Nie lubię tego"</strong>?',
    options: [
      { text: 'tego is genitive after nie lubię', correct: true },
      { text: 'tego is the feminine form', correct: false },
      { text: 'tego means “yes”', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in',
    prompt: 'Complete:', template: 'Nie ma ___.',
    hint: '"that" in genitive (m./n.)',
    answer: 'tego', accept: ['tego']
  },
  {
    type: 'choice', badge: 'Feminine',
    prompt: '<strong>"I don\'t like this book"</strong> — which form?',
    options: [
      { text: 'Nie lubię tej książki.', correct: true },
      { text: 'Nie lubię tego książki.', correct: false },
      { text: 'Nie lubię ta książki.', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Feminine',
    prompt: 'Feminine accusative of <em>ta</em> is:',
    options: [
      { text: 'tę', correct: true },
      { text: 'tego', correct: false },
      { text: 'tej', correct: false }
    ]
  },
  {
    type: 'match', badge: 'Phrases',
    prompt: 'Match English → Polish',
    pairs: [['What\'s that?', 'Co to?'], ['I don\'t like this.', 'Nie lubię tego.'], ['this girl', 'ta dziewczyna'], ['this guy', 'ten chłopak']]
  },
  {
    type: 'build', badge: 'Build',
    prompt: 'Build: <strong>"This is a cat."</strong>',
    words: ['To', 'jest', 'kot.', 'Ten', 'tego'],
    answer: ['To', 'jest', 'kot.']
  },
  {
    type: 'choice', badge: 'Love',
    prompt: 'Pick the line: <strong>"I\'m the happiest in the world that I have you!"</strong> (masculine)',
    options: [
      { text: 'Jestem najszczęśliwszy na świecie, że cię mam!', correct: true },
      { text: 'Jestem najszczęśliwsza na świecie, że cię mam!', correct: false },
      { text: 'Jestem szczęśliwy na świecie tego!', correct: false }
    ]
  }
];
