window.DUO_EXERCISES = [
  {
    type: 'choice', badge: 'Happy',
    prompt: 'A <strong>woman</strong> says "I am happy" — pick the correct form:',
    options: [
      { text: 'Jestem szczęśliwy.', correct: false },
      { text: 'Jestem szczęśliwa.', correct: true },
      { text: 'Jestem szczęśliwe.', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Reflexive',
    prompt: 'How do you say <strong>"I\'m glad / happy"</strong> with <em>się</em>?',
    options: [
      { text: 'Cieszę się.', correct: true },
      { text: 'Jestem się.', correct: false },
      { text: 'Cieszę.', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in',
    prompt: 'Complete:', template: 'Cieszę ___.',
    hint: 'reflexive particle',
    answer: 'się', accept: ['się', 'sie']
  },
  {
    type: 'fill', badge: 'Fill in',
    prompt: 'Complete:', template: 'Jestem ___ szczęśliwa.',
    hint: '"so" (feminine)',
    answer: 'taka', accept: ['taka']
  },
  {
    type: 'match', badge: 'Match',
    prompt: 'Match English → Polish',
    pairs: [['I\'m glad.', 'Cieszę się.'], ['I am so happy.', 'Jestem taka szczęśliwa.'], ['Too hot', 'Zbyt gorąco.'], ['You are too perfect.', 'Jesteś zbyt idealna.']]
  },
  {
    type: 'choice', badge: 'się',
    prompt: 'What does the particle <strong>się</strong> do?',
    options: [
      { text: 'It makes a verb reflexive', correct: true },
      { text: 'It means "yes"', correct: false },
      { text: 'It means "the most"', correct: false }
    ]
  },
  {
    type: 'build', badge: 'Build',
    prompt: 'Build: <strong>"I\'m glad."</strong>',
    words: ['Cieszę', 'się.', 'Jestem', 'szczęśliwa.'],
    answer: ['Cieszę', 'się.']
  },
  {
    type: 'choice', badge: 'Too',
    prompt: 'What does <strong>zbyt</strong> mean?',
    options: [
      { text: 'Too', correct: true },
      { text: 'Very', correct: false },
      { text: 'Yes', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in',
    prompt: 'Complete:', template: 'Jestem ___ bardzo szczęśliwa.',
    hint: '"so very"',
    answer: 'tak', accept: ['tak']
  },
  {
    type: 'choice', badge: 'Gender',
    prompt: 'To a <strong>woman</strong>: "You are too perfect."',
    options: [
      { text: 'Jesteś zbyt idealna.', correct: true },
      { text: 'Jesteś zbyt idealny.', correct: false },
      { text: 'Jesteś idealna zbyt.', correct: false }
    ]
  },
  {
    type: 'match', badge: 'Match',
    prompt: 'Match intensifiers',
    pairs: [['so much', 'tak bardzo'], ['too', 'zbyt'], ['the happiest (fem.)', 'najszczęśliwsza'], ['like this', 'właśnie tak']]
  },
  {
    type: 'fill', badge: 'Fill in',
    prompt: 'Complete:', template: 'Jesteś ___ gorący.',
    hint: '"too hot" (to a man)',
    answer: 'zbyt', accept: ['zbyt']
  }
];
