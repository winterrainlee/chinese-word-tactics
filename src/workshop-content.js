/* Workshop vocabulary and stage data. Keep authored learning content separate from the base tutorial file. */
(() => {
  Object.assign(WORDS, {
    '改變': {
      p: 'ㄍㄞˇ ㄅㄧㄢˋ',
      k: '바꾸다, 변화시키다',
      ex: '水量改變了。',
      rule: '이 판에서는 왼쪽 수문의 상태를 실제로 바꾸면 改變이 성립해. 한 번 바꾼 뒤에도 결과를 보고 더 조절할 수 있어.'
    },
    '保持': {
      p: 'ㄅㄠˇ ㄔˊ',
      k: '유지하다, 그대로 두다',
      ex: '右邊保持原樣。',
      rule: '이 판에서는 오른쪽 수문을 처음 상태 그대로 두어야 해. 바꿨다가 되돌리는 것과 처음부터 건드리지 않는 것을 구분해.'
    }
  });

  STAGES.push({
    id: 'workshop-stage-1',
    title: '改變・保持',
    subtitle: '멈춘 물레방아',
    kicker: '1장 · 장인골 1/7',
    grid: ['S'],
    goal: '改變左邊的水門，右邊保持原樣。',
    rule: '左邊的水還太少。右邊不用動。',
    words: ['改變', '保持'],
    win: [],
    story: '필요한 곳만 조금씩 바꾸자 멈췄던 물레방아가 다시 돌기 시작했다.',
    workshop: {
      startStatus: '左邊的水還太少，右邊不用動。 왼쪽 수문을 조금씩 움직여 흐름을 보고, 오른쪽은 그대로 둬.',
      components: [
        {
          id: 'mainGate', labelZh: '左水門', labelKo: '왼쪽 수문', kind: 'level', initial: 0,
          target: 2, visual: 'gate'
        },
        {
          id: 'balanceGate', labelZh: '右水門', labelKo: '오른쪽 수문', kind: 'level', initial: 1,
          target: 1, visual: 'gate', trackUntouched: true
        }
      ],
      derived: [
        {
          id: 'wheelRunning', type: 'all',
          conditions: [
            { component: 'mainGate', eq: 2 },
            { component: 'balanceGate', eq: 1 }
          ]
        }
      ],
      predicates: [
        { component: 'mainGate', eq: 2 },
        { component: 'balanceGate', eq: 1 },
        { untouched: 'balanceGate', eq: true }
      ]
    }
  });
})();