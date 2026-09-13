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
      rule: '처음부터 알맞은 상태라면 괜히 바꾸지 않고 그대로 두는 것도 중요한 조작이야.'
    },
    '增加': {
      p: 'ㄗㄥ ㄐㄧㄚ',
      k: '늘리다, 증가시키다',
      ex: '風量增加了一點。',
      rule: '이 판에서는 바람의 세기를 실제로 한 단계 높이면 增加가 보여.'
    },
    '減少': {
      p: 'ㄐㄧㄢˇ ㄕㄠˇ',
      k: '줄이다, 감소시키다',
      ex: '火力減少了一點。',
      rule: '이 판에서는 너무 센 불을 실제로 한 단계 낮추면 減少가 보여.'
    },
    '調整': {
      p: 'ㄊㄧㄠˊ ㄓㄥˇ',
      k: '조절하다, 맞추다',
      ex: '把火力和風量調整好。',
      rule: '이 판에서는 무조건 크게 만드는 것이 아니라 불과 바람을 목표 상태에 함께 맞췄을 때 調整이 완성돼.'
    },
    '連接': {
      p: 'ㄌㄧㄢˊ ㄐㄧㄝ',
      k: '연결하다, 이어 붙이다',
      ex: '把磨輪和主軸連接起來。',
      rule: '이 판에서는 연결쇠를 맞물려 주축의 힘이 작업 장치까지 전달되게 하면 連接이 성립해. 연결된 장치는 함께 돌아.'
    },
    '分開': {
      p: 'ㄈㄣ ㄎㄞ',
      k: '분리하다, 떼어 놓다',
      ex: '把不用的吊輪分開。',
      rule: '이 판에서는 연결쇠를 풀어 주축과 장치를 떨어뜨리면 分開가 성립해. 분리된 장치는 더 이상 함께 돌지 않아.'
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
      scene: 'waterwheel',
      boardLabel: '물레방아 수문 조절 장치',
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
      ],
      goalMarks: [
        { word: '改變', conditions: [{ component: 'mainGate', eq: 2 }] },
        { word: '保持', afterAction: true, conditions: [{ component: 'balanceGate', eq: 1 }, { untouched: 'balanceGate', eq: true }] }
      ],
      feedback: {
        solved: { text: '一個改變了，一個保持原樣。水車開始轉了。 하나는 바꾸고, 하나는 그대로 뒀어. 물레방아가 돌기 시작했어.', type: 'good' },
        actions: {
          'balanceGate:step-up': { text: '這邊不用改變，要保持原樣。 이쪽은 바꾸지 않고 그대로 두어야 해. 되돌리면 다시 처음 상태로 돌아갈 수 있어.', type: 'info' },
          'balanceGate:step-down': { text: '這邊不用改變，要保持原樣。 이쪽은 바꾸지 않고 그대로 두어야 해. 되돌리면 다시 처음 상태로 돌아갈 수 있어.', type: 'info' },
          'mainGate:step-up': {
            values: {
              '1': { text: '水量增加了，但還不夠。 물은 늘었지만 물레방아를 돌리기엔 아직 부족해.', type: 'info' }
            }
          },
          'mainGate:step-down': {
            values: {
              '0': { text: '左邊的水還太少。 왼쪽 물이 아직 너무 적어.', type: 'info' },
              '1': { text: '水量減少了，又不夠了。 물이 줄어서 다시 부족해졌어.', type: 'info' }
            }
          }
        }
      }
    }
  });

  STAGES.push({
    id: 'workshop-stage-2',
    title: '增加・減少・調整',
    subtitle: '불씨 맞추기',
    kicker: '1장 · 장인골 2/7',
    grid: ['S'],
    goal: '減少火力，增加風量，調整到剛剛好。',
    rule: '火太大了。風太小了。',
    words: ['增加', '減少', '調整'],
    win: [],
    story: '불과 바람을 각각 알맞게 맞추자 화덕이 안정되었다.',
    workshop: {
      scene: 'forge',
      boardLabel: '화덕과 풀무 조절 장치',
      startStatus: '火太大了，風太小了。 불은 너무 세고 바람은 너무 약해. 하나씩 바꾼 뒤 두 상태를 같이 봐.',
      components: [
        {
          id: 'fire', labelZh: '火力', labelKo: '불의 세기', kind: 'level', initial: 2,
          target: 1, visual: 'fire', allowLimitPress: true
        },
        {
          id: 'air', labelZh: '風量', labelKo: '바람의 세기', kind: 'level', initial: 0,
          target: 1, visual: 'bellows', allowLimitPress: true
        }
      ],
      derived: [
        {
          id: 'balanced', type: 'all',
          conditions: [
            { component: 'fire', eq: 1 },
            { component: 'air', eq: 1 }
          ]
        }
      ],
      predicates: [
        { component: 'fire', eq: 1 },
        { component: 'air', eq: 1 }
      ],
      goalMarks: [
        { word: '減少', conditions: [{ component: 'fire', eq: 1 }] },
        { word: '增加', conditions: [{ component: 'air', eq: 1 }] },
        { word: '調整', conditions: [{ derived: 'balanced', eq: true }] }
      ],
      feedback: {
        solved: { text: '調整好了。火和風現在都剛剛好。 조절이 끝났어. 불과 바람이 이제 둘 다 딱 맞아.', type: 'good' },
        limit: {
          'fire:step-up': { text: '火已經太大了，不能再增加。 불은 이미 너무 세. 더 늘릴 필요 없어.', type: 'info' },
          'air:step-down': { text: '風已經太小了，不能再減少。 바람은 이미 너무 약해. 더 줄일 필요 없어.', type: 'info' }
        },
        actions: {
          'fire:step-down': {
            values: {
              '1': { text: '火力減少了。現在火剛剛好。 불의 세기를 줄였어. 지금 불은 알맞아.', type: 'good' },
              '0': { text: '火力減少太多了。 불을 너무 많이 줄였어.', type: 'info' }
            }
          },
          'fire:step-up': {
            values: {
              '1': { text: '火力增加了，回到剛剛好的位置。 불을 늘려서 다시 알맞게 맞췄어.', type: 'good' },
              '2': { text: '火力又太大了。 불이 다시 너무 세졌어.', type: 'info' }
            }
          },
          'air:step-up': {
            values: {
              '1': { text: '風量增加了。現在風剛剛好。 바람을 늘렸어. 지금 바람은 알맞아.', type: 'good' },
              '2': { text: '風量增加太多了。 바람을 너무 많이 늘렸어.', type: 'info' }
            }
          },
          'air:step-down': {
            values: {
              '0': { text: '風量又太小了。 바람이 다시 너무 약해졌어.', type: 'info' },
              '1': { text: '風量減少了，回到剛剛好的位置。 바람을 줄여서 다시 알맞게 맞췄어.', type: 'good' }
            }
          }
        }
      }
    }
  });

  STAGES.push({
    id: 'workshop-stage-3',
    title: '連接・分開',
    subtitle: '함께 도는 도르래',
    kicker: '1장 · 장인골 3/7',
    grid: ['S'],
    goal: '連接要用的磨輪，中央保持原樣，把不用的吊輪分開。',
    rule: '左邊要用。中央現在正常。右邊沒有掛東西。',
    words: ['連接', '分開', '保持'],
    win: [],
    story: '필요한 장치만 주축에 이어 두자 힘이 알맞은 곳으로 전달되었다.',
    workshop: {
      scene: 'couplings',
      boardLabel: '주축과 세 작업 장치의 연결 상태',
      startStatus: '左邊沒有連接，中央現在正常，右邊空著卻還在轉。 어느 장치가 같이 돌아야 하는지 연결 상태부터 봐.',
      components: [
        {
          id: 'grinderLink', labelZh: '左磨輪', labelKo: '왼쪽 숫돌', kind: 'toggle', initial: false,
          target: true, visual: 'coupling'
        },
        {
          id: 'workLink', labelZh: '中央木輪', labelKo: '가운데 작업바퀴', kind: 'toggle', initial: true,
          target: true, visual: 'coupling', trackUntouched: true
        },
        {
          id: 'hoistLink', labelZh: '右吊輪', labelKo: '오른쪽 빈 도르래', kind: 'toggle', initial: true,
          target: false, visual: 'coupling'
        }
      ],
      derived: [
        { id: 'grinderRunning', type: 'all', conditions: [{ component: 'grinderLink', eq: true }] },
        { id: 'workRunning', type: 'all', conditions: [{ component: 'workLink', eq: true }] },
        { id: 'hoistRunning', type: 'all', conditions: [{ component: 'hoistLink', eq: true }] },
        {
          id: 'overloaded', type: 'all',
          conditions: [
            { component: 'grinderLink', eq: true },
            { component: 'workLink', eq: true },
            { component: 'hoistLink', eq: true }
          ]
        }
      ],
      predicates: [
        { component: 'grinderLink', eq: true },
        { component: 'workLink', eq: true },
        { untouched: 'workLink', eq: true },
        { component: 'hoistLink', eq: false }
      ],
      goalMarks: [
        { word: '連接', conditions: [{ component: 'grinderLink', eq: true }] },
        { word: '保持', afterAction: true, conditions: [{ component: 'workLink', eq: true }, { untouched: 'workLink', eq: true }] },
        { word: '分開', conditions: [{ component: 'hoistLink', eq: false }] }
      ],
      feedback: {
        solved: { text: '該連接的連接，該分開的分開，中央也保持原樣。 필요한 곳만 이어 두자 세 장치의 움직임이 정리됐어.', type: 'good' },
        states: [
          {
            conditions: [{ derived: 'overloaded', eq: true }],
            text: '三個都連接時，主軸變慢了。 전부 연결하자 주축이 느려졌어. 연결이 많다고 항상 좋은 건 아니야.',
            type: 'info'
          }
        ],
        actions: {
          'grinderLink:toggle': {
            values: {
              'true': { text: '磨輪和主軸連接了，開始一起轉。 숫돌이 주축과 연결되어 같이 돌기 시작했어.', type: 'good' },
              'false': { text: '磨輪分開了，又停下來了。 숫돌이 분리되어 다시 멈췄어.', type: 'info' }
            }
          },
          'workLink:toggle': {
            values: {
              'false': { text: '中央本來就正常，不用分開。 가운데는 원래 정상이라 그대로 두어야 해. 되돌리면 조작 전으로 돌아갈 수 있어.', type: 'info' },
              'true': { text: '中央雖然又連接了，但已經不是保持原樣了。 다시 연결했지만 처음부터 그대로 둔 것은 아니야.', type: 'info' }
            }
          },
          'hoistLink:toggle': {
            values: {
              'false': { text: '不用的吊輪和主軸分開了，停了下來。 빈 도르래가 주축에서 분리되어 멈췄어.', type: 'good' },
              'true': { text: '吊輪又連接上了，開始一起轉。 빈 도르래가 다시 연결되어 같이 돌기 시작했어.', type: 'info' }
            }
          }
        }
      }
    }
  });
})();
