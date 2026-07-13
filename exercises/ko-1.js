window.DUO_EXERCISES = [
  {
    type: 'choice', badge: 'Particle', lang: 'ko',
    prompt: 'What does <strong class="ko">너는</strong> mean?',
    options: [
      { text: 'You (as for you)', correct: true },
      { text: 'The most', correct: false },
      { text: 'Amazing', correct: false }
    ]
  },
  {
    type: 'translate', badge: 'Translate', lang: 'ko',
    prompt: 'How do you say <strong>"You are the best."</strong> in Korean?',
    options: [
      { text: '너는 최고야', correct: true },
      { text: '너는 대단해', correct: false },
      { text: '너는 아름다워', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in', lang: 'ko',
    prompt: 'Complete:', template: '___ 최고야',
    hint: '"You" with topic marker',
    answer: '너는', accept: ['너는'],
    chips: ['너는', '나는', '너무']
  },
  {
    type: 'translate', badge: 'Translate', lang: 'ko',
    prompt: '<strong>"You are amazing."</strong> in Korean?',
    options: [
      { text: '너는 대단해', correct: true },
      { text: '너는 최고야', correct: false },
      { text: '너는 추워', correct: false }
    ]
  },
  {
    type: 'match', badge: 'Match', lang: 'ko',
    prompt: 'Match English → Korean',
    pairs: [['You are the best.', '너는 최고야'], ['You are amazing.', '너는 대단해'], ['You are beautiful.', '너는 아름다워'], ['Amazing Kuba', '대단한 쿠바']]
  },
  {
    type: 'choice', badge: 'Pattern', lang: 'ko',
    prompt: 'The core pattern for compliments is:',
    options: [
      { text: '너는 + description', correct: true },
      { text: '나는 + verb only', correct: false },
      { text: 'description + 너는', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in', lang: 'ko',
    prompt: 'Complete:', template: '너는 ___',
    hint: '"beautiful (is)"',
    answer: '아름다워', accept: ['아름다워']
  },
  {
    type: 'choice', badge: 'Particle', lang: 'ko',
    prompt: '<strong class="ko">는</strong> is a…',
    options: [
      { text: 'topic marker', correct: true },
      { text: 'past tense ending', correct: false },
      { text: 'question word', correct: false }
    ]
  },
  {
    type: 'build', badge: 'Build', lang: 'ko',
    prompt: 'Build: <strong>"You are the best."</strong>',
    words: ['너는', '최고야', '대단해', '아름다워'],
    answer: ['너는', '최고야']
  },
  {
    type: 'translate', badge: 'Meaning', lang: 'ko',
    prompt: 'What does <strong class="ko">너는 아름다워</strong> mean?',
    options: [
      { text: 'You are beautiful.', correct: true },
      { text: 'You are the best.', correct: false },
      { text: 'I am beautiful.', correct: false }
    ]
  },
  {
    type: 'match', badge: 'Match', lang: 'ko',
    prompt: 'Match Korean → English',
    pairs: [['최고', 'the best'], ['대단해', 'amazing (is)'], ['아름다운', 'beautiful (adj.)'], ['너', 'you']]
  },
  {
    type: 'choice', badge: 'Final', lang: 'ko',
    prompt: 'In <strong class="ko">너는 대단해</strong>, what stays the same in every compliment?',
    options: [
      { text: '너는', correct: true },
      { text: '대단해', correct: false },
      { text: '최고야', correct: false }
    ]
  }
];
