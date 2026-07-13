window.DUO_EXERCISES = [
  {
    type: 'choice', badge: 'Happy', lang: 'ko',
    prompt: 'What does <strong class="ko">기뻐</strong> mean?',
    options: [
      { text: 'Happy', correct: true },
      { text: 'Too much', correct: false },
      { text: 'Perfect', correct: false }
    ]
  },
  {
    type: 'translate', badge: 'Translate', lang: 'ko',
    prompt: '<strong>"I\'m so happy."</strong> in Korean?',
    options: [
      { text: '나 너무 기뻐', correct: true },
      { text: '너 너무 완벽해', correct: false },
      { text: '너무 더워', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in', lang: 'ko',
    prompt: 'Complete:', template: '나 ___ 기뻐',
    hint: '"so / too much"',
    answer: '너무', accept: ['너무']
  },
  {
    type: 'fill', badge: 'Fill in', lang: 'ko',
    prompt: 'Complete:', template: '나 세상에서 ___ 기뻐',
    hint: '"the most"',
    answer: '제일', accept: ['제일']
  },
  {
    type: 'match', badge: 'Match', lang: 'ko',
    prompt: 'Match English → Korean',
    pairs: [['I\'m so happy.', '나 너무 기뻐'], ['You are so perfect.', '너 너무 완벽해'], ['It\'s too hot.', '너무 더워'], ['It\'s too cold.', '너무 추워']]
  },
  {
    type: 'choice', badge: '너무', lang: 'ko',
    prompt: 'What does <strong class="ko">너무</strong> mean?',
    options: [
      { text: 'Too / so much', correct: true },
      { text: 'You', correct: false },
      { text: 'Weather', correct: false }
    ]
  },
  {
    type: 'build', badge: 'Build', lang: 'ko',
    prompt: 'Build: <strong>"I\'m so happy."</strong>',
    words: ['나', '너무', '기뻐', '완벽해'],
    answer: ['나', '너무', '기뻐']
  },
  {
    type: 'translate', badge: 'Translate', lang: 'ko',
    prompt: '<strong>"You are so perfect."</strong>?',
    options: [
      { text: '너 너무 완벽해', correct: true },
      { text: '나 너무 기뻐', correct: false },
      { text: '너무 추워', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Weather', lang: 'ko',
    prompt: '<strong>"Too cold"</strong> in Korean?',
    options: [
      { text: '너무 추워', correct: true },
      { text: '너무 더워', correct: false },
      { text: '너무 핫해', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in', lang: 'ko',
    prompt: 'Complete:', template: '너 ___ 완벽해',
    hint: '"so" before perfect',
    answer: '너무', accept: ['너무']
  },
  {
    type: 'match', badge: 'Match', lang: 'ko',
    prompt: 'Match slang & weather',
    pairs: [['The weather is awful.', '날씨 거지 같네'], ['too hot (Konglish)', '너무 핫해'], ['in the world', '세상에서'], ['I', '나']]
  },
  {
    type: 'choice', badge: 'Final', lang: 'ko',
    prompt: '<strong class="ko">나 세상에서 제일 기뻐</strong> means:',
    options: [
      { text: 'I\'m the happiest in the world.', correct: true },
      { text: 'You are so happy.', correct: false },
      { text: 'It\'s too hot.', correct: false }
    ]
  }
];
