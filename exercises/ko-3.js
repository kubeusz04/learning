window.DUO_EXERCISES = [
  {
    type: 'choice', badge: 'Noun', lang: 'ko',
    prompt: '<strong>"a hug"</strong> (noun) in Korean?',
    options: [
      { text: '포옹', correct: true },
      { text: '안다', correct: false },
      { text: '안고 있어', correct: false }
    ]
  },
  {
    type: 'choice', badge: 'Verb', lang: 'ko',
    prompt: '<strong>"to hug"</strong> (verb)?',
    options: [
      { text: '안다', correct: true },
      { text: '포옹', correct: false },
      { text: '안아줄게', correct: false }
    ]
  },
  {
    type: 'translate', badge: 'Translate', lang: 'ko',
    prompt: '<strong>"I\'m hugging"</strong> (right now)?',
    options: [
      { text: '안고 있어', correct: true },
      { text: '안아줄게', correct: false },
      { text: '포옹', correct: false }
    ]
  },
  {
    type: 'translate', badge: 'Translate', lang: 'ko',
    prompt: '<strong>"I\'ll hug you"</strong>?',
    options: [
      { text: '안아줄게', correct: true },
      { text: '안고 있어', correct: false },
      { text: '안다', correct: false }
    ]
  },
  {
    type: 'match', badge: 'Match', lang: 'ko',
    prompt: 'Match English → Korean',
    pairs: [['I\'m hugging', '안고 있어'], ['I\'ll hug you', '안아줄게'], ['a hug (noun)', '포옹'], ['I\'m hugging you tight', '나는 널 꽉 안고 있어']]
  },
  {
    type: 'fill', badge: 'Fill in', lang: 'ko',
    prompt: 'Complete:', template: '___',
    hint: '"I\'m hugging."',
    answer: '안고 있어', accept: ['안고 있어']
  },
  {
    type: 'choice', badge: 'Meaning', lang: 'ko',
    prompt: '<strong class="ko">나는 널 꽉 안고 있어</strong> means:',
    options: [
      { text: 'I\'m hugging you tight.', correct: true },
      { text: 'I\'ll hug you soon.', correct: false },
      { text: 'I want a hug.', correct: false }
    ]
  },
  {
    type: 'fill', badge: 'Fill in', lang: 'ko',
    prompt: 'Complete:', template: '나는 널 ___ 안고 있어',
    hint: '"tightly"',
    answer: '꽉', accept: ['꽉']
  },
  {
    type: 'choice', badge: 'Word', lang: 'ko',
    prompt: 'In <strong class="ko">나는 널 꽉 안고 있어</strong>, <strong class="ko">널</strong> means:',
    options: [
      { text: 'you (object)', correct: true },
      { text: 'I', correct: false },
      { text: 'tightly', correct: false }
    ]
  },
  {
    type: 'match', badge: 'Match', lang: 'ko',
    prompt: 'Match word → meaning',
    pairs: [['꽉', 'tightly'], ['널', 'you (object)'], ['나는', 'I (topic)'], ['-고 있어', 'am …ing']]
  },
  {
    type: 'build', badge: 'Build', lang: 'ko',
    prompt: 'Build: <strong>"I\'ll hug you."</strong>',
    words: ['안아줄게', '안고 있어', '포옹'],
    answer: ['안아줄게']
  },
  {
    type: 'build', badge: 'Build', lang: 'ko',
    prompt: 'Build: <strong>"I\'m hugging you tight."</strong>',
    words: ['나는', '널', '꽉', '안고 있어', '안아줄게'],
    answer: ['나는', '널', '꽉', '안고 있어']
  }
];
