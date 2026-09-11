/* Workshop W4-W7 vocabulary and stage data. Loaded after workshop-content.js. */
(() => {
  Object.assign(WORDS, {
    '條件': {
      p: 'ㄊㄧㄠˊ ㄐㄧㄢˋ',
      k: '조건',
      ex: '有三個條件。',
      rule: '장치가 움직이기 전에 맞아야 하는 각각의 상태가 條件이야. 한 조건만 맞아도 충분한지는 판을 보고 확인해야 해.'
    },
    '符合': {
      p: 'ㄈㄨˊ ㄏㄜˊ',
      k: '부합하다, 조건에 맞다',
      ex: '三個條件都符合了。',
      rule: '각 상태가 요구된 조건과 맞으면 符合해. W4에서는 세 조건이 모두 맞아야 작업대가 열린다.'
    },
    '出現': {
      p: 'ㄔㄨ ㄒㄧㄢˋ',
      k: '나타나다, 출현하다',
      ex: '藍色的火焰出現了。',
      rule: '出現은 누르는 행동이 아니야. 다른 상태를 맞춘 결과로 없던 현상이 실제로 나타나는 것을 봐.'
    },
    '消失': {
      p: 'ㄒㄧㄠ ㄕ',
      k: '사라지다',
      ex: '黑煙消失了。',
      rule: '消失도 직접 누르는 행동이 아니야. 조건이 맞아 필요 없어진 현상이 화면에서 사라지는 결과야.'
    },
    '損壞': {
      p: 'ㄙㄨㄣˇ ㄏㄨㄞˋ',
      k: '손상되다, 망가지다',
      ex: '這個齒輪損壞了。',
      rule: '설정이 틀린 것과 부품 자체가 망가진 것은 달라. 금이 가고 멈춘 부품을 찾아 損壞 상태를 확인해.'
    },
    '修復': {
      p: 'ㄒㄧㄡ ㄈㄨˋ',
      k: '수리하다, 복구하다',
      ex: '把損壞的齒輪修復。',
      rule: '손상된 부품을 직접 고치는 행동이 修復이야. 정상인 부품에는 수리가 필요하지 않아.'
    },
    '恢復': {
      p: 'ㄏㄨㄟ ㄈㄨˋ',
      k: '회복하다, 원래 기능을 되찾다',
      ex: '機器的功能恢復了。',
      rule: '修復이 수리 행동이라면 恢復는 그 결과야. 고친 뒤 장치가 다시 제 기능을 하는지 확인해.'
    }
  });

  if (STAGES.some(stage => stage.id === 'workshop-stage-4')) return;

  STAGES.push({
    id: 'workshop-stage-4',
    title: '條件・符合',
    subtitle: '잠긴 작업대',
    kicker: '1장 · 장인골 4/7',
    grid: ['S'],
    goal: '讓三個條件都符合，打開工作臺。',
    rule: '水量要剛剛好。工作軸要連接。火爐要關掉。',
    words: ['條件', '符合'],
    win: [],
    story: '서로 다른 세 조건이 모두 맞자 잠겨 있던 작업대가 열렸다.',
    workshop: {
      scene: 'conditions',
      boardLabel: '세 조건으로 잠긴 작업대',
      startStatus: '有三個條件。水太多，工作軸沒連接，火爐已經關了。 세 상태를 하나씩 비교해봐.',
      components: [
        { id: 'conditionWater', labelZh: '水量', labelKo: '물의 양', kind: 'level', initial: 2, target: 1, visual: 'water' },
        { id: 'conditionShaft', labelZh: '工作軸', labelKo: '작업축', kind: 'toggle', initial: false, target: true, visual: 'coupling' },
        { id: 'conditionFurnace', labelZh: '火爐', labelKo: '화덕', kind: 'toggle', initial: false, target: false, visual: 'switch' }
      ],
      derived: [
        {
          id: 'benchUnlocked', type: 'all', conditions: [
            { component: 'conditionWater', eq: 1 },
            { component: 'conditionShaft', eq: true },
            { component: 'conditionFurnace', eq: false }
          ]
        }
      ],
      predicates: [{ derived: 'benchUnlocked', eq: true }],
      goalMarks: [
        { word: '符合', conditions: [{ derived: 'benchUnlocked', eq: true }] }
      ],
      feedback: {
        solved: { text: '三個條件都符合了。工作臺打開了。 세 조건이 모두 맞아서 작업대가 열렸어.', type: 'good' },
        actions: {
          'conditionWater:step-down': { values: {
            '1': { text: '水量這個條件符合了。 물의 양 조건이 맞았어. 다른 조건도 확인해봐.', type: 'good' },
            '0': { text: '水量太少了。 물을 너무 줄였어. 이 조건은 다시 맞지 않아.', type: 'info' }
          } },
          'conditionWater:step-up': { values: {
            '1': { text: '水量回到剛剛好。 물의 양이 다시 알맞아졌어.', type: 'good' },
            '2': { text: '水量太多了。 물이 너무 많아. 이 조건은 맞지 않아.', type: 'info' }
          } },
          'conditionShaft:toggle': { values: {
            'true': { text: '工作軸連接了，第二個條件符合。 작업축을 연결해서 이 조건이 맞았어.', type: 'good' },
            'false': { text: '工作軸又分開了。 작업축이 다시 분리되어 조건이 맞지 않아.', type: 'info' }
          } },
          'conditionFurnace:toggle': { values: {
            'true': { text: '火爐打開了，可是條件要求關掉。 화덕을 켜서 원래 맞던 조건이 어긋났어.', type: 'info' },
            'false': { text: '火爐關掉了，這個條件又符合。 화덕을 꺼서 조건이 다시 맞았어.', type: 'good' }
          } }
        }
      }
    }
  });

  STAGES.push({
    id: 'workshop-stage-5',
    title: '出現・消失',
    subtitle: '푸른 불꽃',
    kicker: '1장 · 장인골 5/7',
    grid: ['S'],
    goal: '保持火力，調整風量，讓藍色火焰出現、黑煙消失。',
    rule: '火力剛剛好，不要動。風還太小。',
    words: ['出現', '消失', '保持', '調整'],
    win: [],
    story: '불은 그대로 두고 바람만 맞추자 푸른 불꽃이 나타나고 검은 연기가 사라졌다.',
    workshop: {
      scene: 'blue-flame',
      boardLabel: '불과 바람에 따라 달라지는 불꽃',
      startStatus: '火力已經剛剛好，不要動。風太小，黑煙還很多。 결과가 어떻게 달라지는지 보면서 바람을 조절해.',
      components: [
        { id: 'flameFire', labelZh: '火力', labelKo: '불의 세기', kind: 'level', initial: 1, target: 1, visual: 'fire', trackUntouched: true },
        { id: 'flameAir', labelZh: '風量', labelKo: '바람의 세기', kind: 'level', initial: 0, target: 2, visual: 'bellows' }
      ],
      derived: [
        { id: 'blueFlameVisible', type: 'all', conditions: [{ component: 'flameFire', eq: 1 }, { component: 'flameAir', eq: 2 }] },
        { id: 'blackSmokeGone', type: 'all', conditions: [{ component: 'flameFire', eq: 1 }, { component: 'flameAir', eq: 2 }] }
      ],
      predicates: [
        { component: 'flameFire', eq: 1 },
        { untouched: 'flameFire', eq: true },
        { component: 'flameAir', eq: 2 }
      ],
      goalMarks: [
        { word: '保持', afterAction: true, conditions: [{ component: 'flameFire', eq: 1 }, { untouched: 'flameFire', eq: true }] },
        { word: '調整', conditions: [{ component: 'flameAir', eq: 2 }] },
        { word: '出現', conditions: [{ derived: 'blueFlameVisible', eq: true }] },
        { word: '消失', conditions: [{ derived: 'blackSmokeGone', eq: true }] }
      ],
      feedback: {
        solved: { text: '藍色的火焰出現了，黑煙消失了。 푸른 불꽃이 나타나고 검은 연기가 사라졌어.', type: 'good' },
        actions: {
          'flameFire:step-up': { text: '火力本來剛剛好，要保持原樣。 불은 원래 알맞았어. 그대로 유지해야 해.', type: 'info' },
          'flameFire:step-down': { text: '火力本來剛剛好，要保持原樣。 불은 원래 알맞았어. 그대로 유지해야 해.', type: 'info' },
          'flameAir:step-up': { values: {
            '1': { text: '風量增加了。黑煙少了一些，但還沒有消失。 바람이 늘어 연기가 줄었지만 아직 남아 있어.', type: 'info' }
          } },
          'flameAir:step-down': { values: {
            '0': { text: '風又太小了，黑煙變多了。 바람이 다시 약해져 검은 연기가 많아졌어.', type: 'info' },
            '1': { text: '風量減少了，黑煙又出現了一些。 바람을 줄이자 검은 연기가 다시 늘었어.', type: 'info' }
          } }
        }
      }
    }
  });

  STAGES.push({
    id: 'workshop-stage-6',
    title: '損壞・修復・恢復',
    subtitle: '깨진 톱니',
    kicker: '1장 · 장인골 6/7',
    grid: ['S'],
    goal: '找出損壞的齒輪，把它修復，讓機器恢復。',
    rule: '這次不是調整。三個齒輪裡有一個真的壞了。',
    words: ['損壞', '修復', '恢復'],
    win: [],
    story: '손상된 톱니를 찾아 수리하자 멈췄던 장치의 기능이 회복되었다.',
    workshop: {
      scene: 'gears',
      boardLabel: '세 톱니와 멈춘 장치',
      startStatus: '三個齒輪裡有一個損壞了。 이번에는 설정을 바꾸기 전에 어느 부품이 실제로 망가졌는지 먼저 찾아봐.',
      components: [
        { id: 'gearA', labelZh: '左齒輪', labelKo: '왼쪽 톱니', kind: 'damage', initial: false, target: false, visual: 'gear' },
        { id: 'gearB', labelZh: '中央齒輪', labelKo: '가운데 톱니', kind: 'damage', initial: true, target: false, visual: 'gear' },
        { id: 'gearC', labelZh: '右齒輪', labelKo: '오른쪽 톱니', kind: 'damage', initial: false, target: false, visual: 'gear' }
      ],
      repairTargets: ['gearB'],
      derived: [
        { id: 'machineRecovered', type: 'all', conditions: [{ component: 'gearB', eq: false }] }
      ],
      predicates: [{ derived: 'machineRecovered', eq: true }],
      goalMarks: [
        { word: '損壞', identified: 'gearB' },
        { word: '修復', conditions: [{ component: 'gearB', eq: false }] },
        { word: '恢復', conditions: [{ derived: 'machineRecovered', eq: true }] }
      ],
      feedback: {
        solved: { text: '齒輪修復了，機器的功能恢復了。 톱니를 수리하자 장치가 다시 제 기능을 하기 시작했어.', type: 'good' }
      }
    }
  });

  STAGES.push({
    id: 'workshop-stage-7',
    title: '保持・調整・連接・分開・修復',
    subtitle: '오래된 조절기',
    kicker: '1장 · 장인골 7/7',
    grid: ['S'],
    goal: '調整舊裝置，讓它恢復正常。',
    rule: '先別急著修。看看動了這個，哪裡會跟著變。',
    words: ['保持', '調整', '連接', '分開', '修復'],
    win: [],
    milestone: 'workshop-core',
    story: '소년은 필요한 곳만 조절하고 연결하고 수리해 오래된 중심 장치를 안정시켰다.',
    workshop: {
      scene: 'regulator',
      boardLabel: '장인골의 오래된 중심 조절기',
      startStatus: '舊裝置有好幾個地方不對。 필요한 곳만 바꾸고, 이미 맞는 곳은 그대로 두면서 전체 상태를 맞춰봐.',
      components: [
        { id: 'regulatorGate', labelZh: '主水門', labelKo: '주 수문', kind: 'level', initial: 0, target: 1, visual: 'gate', allowLimitPress: true },
        { id: 'regulatorBalance', labelZh: '平衡水門', labelKo: '균형 수문', kind: 'level', initial: 1, target: 1, visual: 'gate', trackUntouched: true },
        { id: 'regulatorMainLink', labelZh: '工作連接', labelKo: '작업 연결쇠', kind: 'toggle', initial: false, target: true, visual: 'coupling' },
        { id: 'regulatorIdleLink', labelZh: '空輪連接', labelKo: '빈 바퀴 연결쇠', kind: 'toggle', initial: true, target: false, visual: 'coupling' },
        { id: 'regulatorGear', labelZh: '調節齒輪', labelKo: '조절 톱니', kind: 'damage', initial: true, target: false, visual: 'gear' }
      ],
      derived: [
        {
          id: 'systemRecovered', type: 'all', conditions: [
            { component: 'regulatorGate', eq: 1 },
            { component: 'regulatorBalance', eq: 1 },
            { untouched: 'regulatorBalance', eq: true },
            { component: 'regulatorMainLink', eq: true },
            { component: 'regulatorIdleLink', eq: false },
            { component: 'regulatorGear', eq: false }
          ]
        },
        {
          id: 'oldIndicatorVisible', type: 'all', conditions: [
            { component: 'regulatorGate', eq: 1 },
            { component: 'regulatorBalance', eq: 1 },
            { untouched: 'regulatorBalance', eq: true },
            { component: 'regulatorMainLink', eq: true },
            { component: 'regulatorIdleLink', eq: false },
            { component: 'regulatorGear', eq: false }
          ]
        },
        {
          id: 'knockingGone', type: 'all', conditions: [
            { component: 'regulatorGate', eq: 1 },
            { component: 'regulatorMainLink', eq: true },
            { component: 'regulatorIdleLink', eq: false },
            { component: 'regulatorGear', eq: false }
          ]
        }
      ],
      predicates: [{ derived: 'systemRecovered', eq: true }],
      goalMarks: [
        { word: '調整', conditions: [{ component: 'regulatorGate', eq: 1 }] },
        { word: '保持', afterAction: true, conditions: [{ component: 'regulatorBalance', eq: 1 }, { untouched: 'regulatorBalance', eq: true }] },
        { word: '連接', conditions: [{ component: 'regulatorMainLink', eq: true }] },
        { word: '分開', conditions: [{ component: 'regulatorIdleLink', eq: false }] },
        { word: '修復', conditions: [{ component: 'regulatorGear', eq: false }] }
      ],
      feedback: {
        solved: { text: '條件都符合了。舊裝置恢復正常。 모든 상태가 맞았어. 오래된 조절기가 정상으로 돌아왔어.', type: 'good' },
        actions: {
          'regulatorGate:step-up': { values: {
            '1': { text: '主水門調整到合適的位置。 주 수문이 알맞은 위치로 조절됐어.', type: 'good' },
            '2': { text: '主水門開得太大了。 주 수문을 너무 많이 열었어.', type: 'info' }
          } },
          'regulatorGate:step-down': { values: {
            '0': { text: '主水門又太低了。 주 수문이 다시 너무 낮아졌어.', type: 'info' },
            '1': { text: '主水門回到合適的位置。 주 수문이 다시 알맞아졌어.', type: 'good' }
          } },
          'regulatorBalance:step-up': { text: '這裡本來就平衡，要保持原樣。 균형 수문은 처음 상태를 유지해야 해.', type: 'info' },
          'regulatorBalance:step-down': { text: '這裡本來就平衡，要保持原樣。 균형 수문은 처음 상태를 유지해야 해.', type: 'info' },
          'regulatorMainLink:toggle': { values: {
            'true': { text: '工作連接接上了。 필요한 작업축에 힘이 전달되기 시작했어.', type: 'good' },
            'false': { text: '工作連接又分開了。 필요한 작업축이 다시 끊겼어.', type: 'info' }
          } },
          'regulatorIdleLink:toggle': { values: {
            'false': { text: '空輪分開了。 불필요한 빈 바퀴를 주축에서 떼어냈어.', type: 'good' },
            'true': { text: '空輪又連接了。 빈 바퀴가 다시 힘을 가져가고 있어.', type: 'info' }
          } }
        }
      }
    }
  });
})();