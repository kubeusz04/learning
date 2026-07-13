window.DUO_EXERCISES = [
  {
    type: 'choice', badge: 'Gender',
    prompt: 'Speaking to a <strong>woman</strong> — pick the correct sentence:',
    options: [
      { text: 'Jesteś cudowny.', correct: false },
      { text: 'Jesteś cudowna.', correct: true },
      { text: 'Jesteś cudowne.', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Gender',
    prompt: 'Speaking to a <strong>man</strong> — which is correct?',
    options: [
      { text: 'Jesteś wspaniała.', correct: false },
      { text: 'Jesteś wspaniały.', correct: true },
      { text: 'Jesteś wspaniałe.', correct: false }
    ]
  },
  {
    type: 'translate', badge: 'Translate',
    prompt: 'How do you say <strong>"You are wonderful"</strong> to a woman?',
    options: [
      { text: 'Jesteś wspaniały.', correct: false },
      { text: 'Jesteś cudowna.', correct: true },
      { text: 'Jesteś idealny.', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in',
    prompt: 'Complete:', template: 'Ty ___ cudowna.',
    hint: '"You are" in Polish',
    answer: 'jesteś', accept: ['jesteś', 'jestes'],
    chips: ['jesteś', 'jestem', 'jest']
  },
  {
    type: 'fill', badge: 'Fill in',
    prompt: 'Complete:', template: 'Jesteś najbardziej ___ na świecie.',
    hint: '"amazing" — feminine form',
    answer: 'wspaniała', accept: ['wspaniała', 'wspaniala']
  },
  {
    type: 'match', badge: 'Match',
    prompt: 'Match English → Polish',
    pairs: [['I', 'ja'], ['You', 'ty'], ['She', 'ona'], ['We', 'my']]
  },
  {
    type: 'match', badge: 'Match',
    prompt: 'Match subject → <em>być</em> (to be)',
    pairs: [['He', 'jest'], ['We', 'jesteśmy'], ['They', 'są'], ['I', 'jestem']]
  },
  {
    type: 'build', badge: 'Build',
    prompt: 'Build: <strong>"You are perfect."</strong> (to a man)',
    words: ['Jesteś', 'idealny.', 'cudowna.', 'idealna.'],
    answer: ['Jesteś', 'idealny.']
  },
  {
    type: 'translate', badge: 'Translate',
    prompt: 'What does <strong>"najbardziej"</strong> mean?',
    options: [
      { text: 'the most', correct: true },
      { text: 'very', correct: false },
      { text: 'always', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Pick one',
    prompt: '<strong>"You are the most amazing in the world"</strong> — pick the right start:',
    options: [
      { text: 'Jesteś najbardziej wspaniała na świecie.', correct: true },
      { text: 'Jesteś wspaniały naj na świecie.', correct: false },
      { text: 'Ty jest najbardziej wspaniała.', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in',
    prompt: 'Complete:', template: '___ świecie',
    hint: '"in the world"',
    answer: 'na', accept: ['na'],
    chips: ['na', 'w', 'z']
  },
  {
    type: 'choice', badge: 'Final',
    prompt: 'Best compliment for a woman — <strong>perfect</strong>:',
    options: [
      { text: 'Jesteś idealna.', correct: true },
      { text: 'Jesteś idealny.', correct: false },
      { text: 'Jesteś idealne.', correct: false }
    ]
  }
];
