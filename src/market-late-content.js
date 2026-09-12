/* Market M5-M8 vocabulary and stage data. */
(() => {
  Object.assign(WORDS, {
    '價值': {
      p: 'ㄐㄧㄚˋ ㄓˊ',
      k: '가치; 지금 상황에서 얼마나 쓸모 있는가',
      ex: '價格不同，價值也要看現在需要什麼。',
      rule: '價格은 얼마를 내는지이고, 價值는 지금 상황에서 무엇을 얻는지가 얼마나 쓸모 있는지야. 더 싸다고 언제나 더 가치 있는 것은 아니야.'
    },
    '選擇': {
      p: 'ㄒㄩㄢˇ ㄗㄜˊ',
      k: '선택하다; 선택',
      ex: '看完兩個工具，再做選擇。',
      rule: '여러 가능한 방법 가운데 하나를 고르는 일이야. 이 장터에서는 둘 다 정답일 수 있고, 무엇을 중요하게 보는지에 따라 선택이 달라져.'
    },
    '放棄': {
      p: 'ㄈㄤˋ ㄑㄧˋ',
      k: '포기하다, 내려놓다',
      ex: '這一趟先放棄燈油，下一趟再送。',
      rule: '이 판의 放棄는 영원히 버린다는 뜻이 아니야. 짐칸이 하나뿐이라 이번 차례에는 하나를 먼저 보내고, 다른 하나는 다음 차례로 미루는 뜻으로 써.'
    },
    '分配': {
      p: 'ㄈㄣ ㄆㄟˋ',
      k: '나누어 배치하다, 분배하다',
      ex: '先看每個地方缺什麼，再分配貨物。',
      rule: '한곳에 몰아두지 않고 필요한 곳마다 맞는 물건을 보내는 일이야. 여기서는 공정성 판단이 아니라 생활 물류의 배치를 뜻해.'
    },
    '補充': {
      p: 'ㄅㄨˇ ㄔㄨㄥ',
      k: '보충하다, 채우다',
      ex: '把缺的兩份補充進去。',
      rule: '이미 있는 것에 모자란 만큼을 더해서 필요한 상태로 만드는 일이야. 부족량이 한 개가 아닐 수도 있으니 현재 수량과 필요 수량을 함께 봐.'
    }
  });

  const baseItems = STAGES.find(stage => stage.id === 'market-stage-4')?.market?.items || {};
  const items = {
    ...baseItems,
    package: { labelZh: '貨物', labelKo: '짐', unitZh: '包' }
  };

  STAGES.push({
    id: 'market-stage-5',
    title: '價值・選擇',
    subtitle: '어느 것이 나을까',
    kicker: '1장 · 장터 5/8',
    grid: ['.....', '.....', 'S....', '.....', '.....'],
    goal: '先看兩個搬運工具的價格和容量，選擇一個，把三包貨送到收貨處。',
    rule: '價格은 지불하는 양이고, 價值는 지금 필요한 일을 얼마나 잘 해결하는지까지 함께 봐.',
    words: ['價值', '選擇', '價格'],
    win: [],
    story: '두 운반 도구 중 하나를 골라 짐 세 꾸러미를 모두 옮겼다. 둘 다 해결책이 될 수 있었다.',
    market: {
      revision: 1,
      scene: 'choice-tools',
      boardLabel: '두 운반 도구와 세 꾸러미 짐',
      capacity: 0,
      coins: 8,
      items,
      outcomeDecisions: { choice: 'tool' },
      startStatus: '先看看兩個工具。 가격과 한 번에 실을 수 있는 양을 모두 보고 선택해봐.',
      locations: [
        {
          id: 'small-basket', kind: 'tool', labelZh: '小籃子', labelKo: '작은 바구니', icon: '🧺', pos: [0, 0],
          stock: {},
          facts: [
            { labelZh: '價格', labelKo: '가격', textZh: '3', textKo: '동전 3' },
            { labelZh: '容量', labelKo: '한 번에', textZh: '貨物 ×2', textKo: '짐 2개' }
          ],
          choose: {
            decisionKey: 'tool', value: 'basket', cost: 3, capacity: 2,
            requires: { type: 'inspected-all', locations: ['small-basket', 'large-crate'] },
            whenChosenZh: '已選擇', whenChosenKo: '선택함',
            whenOtherZh: '這次不選', whenOtherKo: '이번에는 선택하지 않음'
          }
        },
        {
          id: 'large-crate', kind: 'tool', labelZh: '大木箱', labelKo: '큰 나무상자', icon: '📦', pos: [0, 4],
          stock: {},
          facts: [
            { labelZh: '價格', labelKo: '가격', textZh: '6', textKo: '동전 6' },
            { labelZh: '容量', labelKo: '한 번에', textZh: '貨物 ×3', textKo: '짐 3개' }
          ],
          choose: {
            decisionKey: 'tool', value: 'crate', cost: 6, capacity: 3,
            requires: { type: 'inspected-all', locations: ['small-basket', 'large-crate'] },
            whenChosenZh: '已選擇', whenChosenKo: '선택함',
            whenOtherZh: '這次不選', whenOtherKo: '이번에는 선택하지 않음'
          }
        },
        {
          id: 'cargo', labelZh: '待搬貨物', labelKo: '옮길 짐', icon: '📦', pos: [2, 2],
          stock: { package: 3 }, allowTake: true, allowPut: true, accepts: ['package'],
          takeRequiresDecision: { key: 'tool' }, stockLabelZh: '數量', stockLabelKo: '남은 짐'
        },
        {
          id: 'destination', labelZh: '收貨處', labelKo: '받는 곳', icon: '🏠', pos: [4, 2],
          stock: { package: 0 }, needs: { package: 3 }, allowPut: true, accepts: ['package']
        }
      ],
      predicates: [
        { type: 'inspected-all', locations: ['small-basket', 'large-crate'] },
        { type: 'decision-set', key: 'tool' },
        { type: 'location-at-least', location: 'destination', item: 'package', amount: 3 }
      ],
      goalMarks: [
        { word: '價格', type: 'inspected-all', locations: ['small-basket', 'large-crate'] },
        { word: '選擇', type: 'decision-set', key: 'tool' },
        { word: '價值', type: 'location-at-least', location: 'destination', item: 'package', amount: 3 }
      ],
      feedback: {
        solved: '三包貨都送到了。 선택한 도구로 필요한 일을 끝냈어. 이제 가격과 가치가 꼭 같은 말은 아니라는 걸 볼 수 있어.'
      }
    }
  });

  STAGES.push({
    id: 'market-stage-6',
    title: '放棄・選擇',
    subtitle: '짐칸은 하나뿐',
    kicker: '1장 · 장터 6/8',
    grid: ['.....', '.....', '..S..', '.....', '.....'],
    goal: '只能帶一件。選擇一件先送，另一件這一趟先放棄。',
    rule: '放棄는 여기서 버린다는 뜻이 아니라, 이번 차례에는 가져가지 않고 다음 차례로 미루는 뜻이야.',
    words: ['放棄', '選擇'],
    win: [],
    story: '짐칸 하나에 무엇을 먼저 실을지 골랐다. 나머지 물건은 사라지지 않고 다음 차례를 기다렸다.',
    market: {
      revision: 1,
      scene: 'defer-cargo',
      boardLabel: '밀가루와 등잔기름 중 하나를 먼저 보내는 장터 길',
      capacity: 1,
      items,
      outcomeDecisions: { chosenCargo: 'cargo', deferredCargo: 'deferredCargo' },
      startStatus: '짐칸은 하나뿐이야. 두 물건을 보고 이번에 먼저 가져갈 하나를 선택해.',
      locations: [
        {
          id: 'flour-load', labelZh: '麵粉', labelKo: '밀가루', icon: '🌾', pos: [0, 0],
          stock: { flour: 1 }, allowTake: true, allowPut: true, accepts: ['flour'],
          takeRequiresDecision: { key: 'cargo', value: 'flour' },
          choose: {
            decisionKey: 'cargo', value: 'flour', deferredKey: 'deferredCargo', deferredValue: 'oil',
            whenChosenZh: '選擇 · 先送', whenChosenKo: '이번에 먼저 보냄',
            whenOtherZh: '放棄 · 下一趟', whenOtherKo: '이번에는 미루고 다음 차례'
          }
        },
        {
          id: 'oil-load', labelZh: '燈油', labelKo: '등잔기름', icon: '🏺', pos: [0, 4],
          stock: { oil: 1 }, allowTake: true, allowPut: true, accepts: ['oil'],
          takeRequiresDecision: { key: 'cargo', value: 'oil' },
          choose: {
            decisionKey: 'cargo', value: 'oil', deferredKey: 'deferredCargo', deferredValue: 'flour',
            whenChosenZh: '選擇 · 先送', whenChosenKo: '이번에 먼저 보냄',
            whenOtherZh: '放棄 · 下一趟', whenOtherKo: '이번에는 미루고 다음 차례'
          }
        },
        {
          id: 'bakery', labelZh: '麵包坊', labelKo: '빵집', icon: '🥖', pos: [4, 0],
          stock: { flour: 0 }, needs: { flour: 1 }, allowPut: true, accepts: ['flour']
        },
        {
          id: 'oil-stall', labelZh: '燈油攤', labelKo: '등잔기름 좌판', icon: '🪔', pos: [4, 4],
          stock: { oil: 0 }, needs: { oil: 1 }, allowPut: true, accepts: ['oil']
        }
      ],
      predicates: [
        { type: 'decision-set', key: 'cargo' },
        { type: 'decision-set', key: 'deferredCargo' },
        { type: 'any', conditions: [
          { type: 'location-at-least', location: 'bakery', item: 'flour', amount: 1 },
          { type: 'location-at-least', location: 'oil-stall', item: 'oil', amount: 1 }
        ] }
      ],
      goalMarks: [
        { word: '選擇', type: 'decision-set', key: 'cargo' },
        { word: '放棄', type: 'decision-set', key: 'deferredCargo' }
      ],
      feedback: {
        solved: '一件先送到了，另一件還留在原處等下一趟。 하나를 먼저 보냈고, 다른 하나는 없어지지 않고 다음 차례를 기다려.'
      }
    }
  });

  STAGES.push({
    id: 'market-stage-7',
    title: '分配・補充',
    subtitle: '제자리로 돌아갈 물건',
    kicker: '1장 · 장터 7/8',
    grid: ['......', '......', '..S...', '......', '......'],
    goal: '看每個地方缺多少，把晚到的貨分配到需要的位置。',
    rule: '부족량은 장소마다 달라. 현재/필요 수량을 보고 필요한 만큼 補充하고, 남는 물건까지 맞는 곳에 分配해.',
    words: ['分配', '補充', '需求', '數量', '剩下'],
    win: [],
    story: '늦게 도착한 물건을 각 장소의 필요량에 맞게 여러 번 나누어 보냈다. 남은 천도 창고 제자리로 돌아갔다.',
    market: {
      revision: 2,
      scene: 'distribution',
      boardLabel: '부족량이 서로 다른 곳에 늦게 온 짐을 나누는 장터',
      capacity: 2,
      items,
      startStatus: '先看每個地方缺多少。 부족한 양이 서로 달라. 현재/필요 수량을 보고 짐을 나누어 보내.',
      locations: [
        {
          id: 'bakery', labelZh: '麵包坊', labelKo: '빵집', icon: '🥖', pos: [0, 0],
          stock: { flour: 1 }, needs: { flour: 3 }, allowPut: true, accepts: ['flour']
        },
        {
          id: 'inn', kind: 'npc', labelZh: '客棧', labelKo: '여관', icon: '🏮', pos: [0, 5],
          stock: { vegetable: 0 }, needs: { vegetable: 1 }, allowPut: true, accepts: ['vegetable']
        },
        {
          id: 'late-goods', labelZh: '晚到的貨', labelKo: '늦게 온 짐', icon: '📦', pos: [2, 3],
          stock: { flour: 2, vegetable: 1, oil: 2, cloth: 1 }, allowTake: true, allowPut: true,
          accepts: ['flour', 'vegetable', 'oil', 'cloth'], stockLabelZh: '剩下', stockLabelKo: '현재 남은 것'
        },
        {
          id: 'oil-stall', labelZh: '燈油攤', labelKo: '등잔기름 좌판', icon: '🪔', pos: [4, 0],
          stock: { oil: 1 }, needs: { oil: 3 }, allowPut: true, accepts: ['oil']
        },
        {
          id: 'warehouse', labelZh: '倉庫', labelKo: '창고', icon: '🏚️', pos: [4, 5],
          stock: { cloth: 0 }, allowPut: true, accepts: ['cloth']
        }
      ],
      predicates: [
        { type: 'location-at-least', location: 'bakery', item: 'flour', amount: 3 },
        { type: 'location-at-least', location: 'inn', item: 'vegetable', amount: 1 },
        { type: 'location-at-least', location: 'oil-stall', item: 'oil', amount: 3 },
        { type: 'location-at-least', location: 'warehouse', item: 'cloth', amount: 1 }
      ],
      goalMarks: [
        { word: '需求', type: 'inspected-all', locations: ['bakery', 'inn', 'oil-stall'] },
        { word: '數量', type: 'inspected', location: 'late-goods' },
        { word: '剩下', type: 'inspected', location: 'late-goods' },
        { word: '補充', type: 'flag', flag: 'replenished', eq: true },
        { word: '分配', type: 'all', conditions: [
          { type: 'location-at-least', location: 'bakery', item: 'flour', amount: 3 },
          { type: 'location-at-least', location: 'inn', item: 'vegetable', amount: 1 },
          { type: 'location-at-least', location: 'oil-stall', item: 'oil', amount: 3 },
          { type: 'location-at-least', location: 'warehouse', item: 'cloth', amount: 1 }
        ] }
      ],
      feedback: {
        solved: '每樣東西都到了需要的位置。 두 개씩 모자라던 곳까지 필요한 양만큼 채우고, 남은 물건도 제자리로 분배했어.'
      }
    }
  });

  STAGES.push({
    id: 'market-stage-8',
    title: '장터 종합',
    subtitle: '장날이 열리기 전에',
    kicker: '1장 · 장터 8/8',
    grid: ['......', '......', '..S...', '......', '......'],
    goal: '開市以前，把缺的東西補好：能分配的分配、能交換的交換、需要買的就買。',
    rule: '새 규칙은 없어. 需求과 剩下을 보고, 한 곳에 여러 개가 필요할 때도 交換·買·分配를 필요한 순서대로 조합해.',
    words: ['需求', '交換', '買', '分配'],
    win: [],
    milestone: 'market-core',
    story: '장날이 열리기 전 마지막 부족분을 모두 정리했다. 장터는 각자의 자리에서 다시 움직이기 시작했다.',
    market: {
      revision: 2,
      scene: 'market-finale',
      boardLabel: '장날 전 마지막 물류를 정리하는 장터',
      capacity: 2,
      coins: 5,
      items,
      startStatus: '장터가 열리기 전 네 곳이 아직 준비 중이야. 같은 물건이 두 개 필요한 곳도 있으니 수량을 보고 순서를 정해봐.',
      locations: [
        {
          id: 'bakery', labelZh: '麵包坊', labelKo: '빵집', icon: '🥖', pos: [0, 0],
          stock: { flour: 0 }, needs: { flour: 2 }, allowPut: true, accepts: ['flour']
        },
        {
          id: 'rope-stall', labelZh: '繩子攤', labelKo: '밧줄 좌판', icon: '🧵', pos: [0, 2],
          stock: { rope: 1, cloth: 0 },
          exchange: { give: 'cloth', giveQty: 1, receive: 'rope', receiveQty: 1, flag: 'exchanged' }
        },
        {
          id: 'market-tent', labelZh: '市集棚', labelKo: '장터 천막', icon: '⛺', pos: [0, 4],
          stock: { rope: 0 }, needs: { rope: 1 }, allowPut: true, accepts: ['rope']
        },
        {
          id: 'vegetable-stall', labelZh: '菜攤', labelKo: '채소 좌판', icon: '🥬', pos: [1, 5],
          stock: { vegetable: 1 }, sell: { item: 'vegetable', price: 3 }
        },
        {
          id: 'late-goods', labelZh: '晚到的貨', labelKo: '늦게 온 짐', icon: '📦', pos: [2, 0],
          stock: { flour: 2, oil: 1, cloth: 1 }, allowTake: true, allowPut: true,
          accepts: ['flour', 'oil', 'cloth'], stockLabelZh: '剩下', stockLabelKo: '현재 남은 것'
        },
        {
          id: 'inn', kind: 'npc', labelZh: '客棧', labelKo: '여관', icon: '🏮', pos: [2, 5],
          stock: { vegetable: 0 }, needs: { vegetable: 1 }, allowPut: true, accepts: ['vegetable']
        },
        {
          id: 'oil-stall', labelZh: '燈油攤', labelKo: '등잔기름 좌판', icon: '🪔', pos: [4, 0],
          stock: { oil: 0 }, needs: { oil: 1 }, allowPut: true, accepts: ['oil']
        }
      ],
      predicates: [
        { type: 'location-at-least', location: 'bakery', item: 'flour', amount: 2 },
        { type: 'location-at-least', location: 'oil-stall', item: 'oil', amount: 1 },
        { type: 'location-at-least', location: 'market-tent', item: 'rope', amount: 1 },
        { type: 'location-at-least', location: 'inn', item: 'vegetable', amount: 1 }
      ],
      goalMarks: [
        { word: '需求', type: 'inspected-all', locations: ['bakery', 'oil-stall', 'market-tent', 'inn'] },
        { word: '交換', type: 'flag', flag: 'exchanged', eq: true },
        { word: '買', type: 'flag', flag: 'bought', eq: true },
        { word: '分配', type: 'all', conditions: [
          { type: 'location-at-least', location: 'bakery', item: 'flour', amount: 2 },
          { type: 'location-at-least', location: 'oil-stall', item: 'oil', amount: 1 },
          { type: 'location-at-least', location: 'market-tent', item: 'rope', amount: 1 },
          { type: 'location-at-least', location: 'inn', item: 'vegetable', amount: 1 }
        ] }
      ],
      feedback: {
        solved: '開市前的準備都完成了。 여러 개 필요한 곳까지 수량을 맞추고, 교환하고 사고 나누면서 장터의 흐름을 모두 이어냈어.'
      }
    }
  });
})();
