/* Market vocabulary and M1-M3 stage data. */
(() => {
  Object.assign(WORDS, {
    '需求': {
      p: 'ㄒㄩ ㄑㄧㄡˊ',
      k: '필요, 수요; 필요한 것',
      ex: '先看看每個攤子的需求。',
      rule: '이 판에서는 각 장소가 무엇을 몇 개 필요로 하는지 보여주는 기준이야. 현재 수량과 비교해야 足夠인지 不足인지 알 수 있어.'
    },
    '足夠': {
      p: 'ㄗㄨˊ ㄍㄡˋ',
      k: '충분하다, 모자라지 않다',
      ex: '這裡的麵粉已經足夠了。',
      rule: '현재 가진 양이 需求과 같거나 더 많으면 足夠이야. 이미 충분한 곳에 무조건 더 넣는 것이 목표는 아니야.'
    },
    '不足': {
      p: 'ㄅㄨˋ ㄗㄨˊ',
      k: '부족하다, 충분하지 않다',
      ex: '這個攤子的麵粉不足一袋。',
      rule: '현재 가진 양이 需求보다 적을 때 不足이야. 얼마나 부족한지는 필요량과 현재량을 함께 보면 돼.'
    },
    '數量': {
      p: 'ㄕㄨˋ ㄌㄧㄤˋ',
      k: '수량, 개수',
      ex: '先確認箱子的數量。',
      rule: '물건이 몇 개 있는지를 나타내는 정보야. 원래 수량과 지금 남은 수량이 같다고 생각하지 않도록 실제 상태를 함께 봐.'
    },
    '剩下': {
      p: 'ㄕㄥˋ ㄒㄧㄚˋ',
      k: '남다, 남아 있다',
      ex: '車上還剩下兩箱燈油。',
      rule: '이미 보내거나 사용한 것을 빼고 지금 실제로 남아 있는 양을 말해. 처음 몇 개였는지만 보고 고르면 안 돼.'
    },
    '交換': {
      p: 'ㄐㄧㄠ ㄏㄨㄢˋ',
      k: '교환하다, 서로 바꾸다',
      ex: '用一捆布交換一捆繩子。',
      rule: '내가 가진 물건을 상대에게 주고 다른 물건을 받으면 交換이 성립해. 그냥 공짜로 얻는 행동과는 달라.'
    },
    '獲得': {
      p: 'ㄏㄨㄛˋ ㄉㄜˊ',
      k: '얻다, 획득하다',
      ex: '交換以後，獲得了一捆繩子。',
      rule: '獲得은 물건을 얻은 결과야. 이 판에서는 交換을 한 결과로 필요한 밧줄을 손에 넣게 돼.'
    }
  });

  const commonItems = {
    flour: { labelZh: '麵粉', labelKo: '밀가루', unitZh: '袋' },
    oil: { labelZh: '燈油', labelKo: '등잔기름', unitZh: '箱' },
    cloth: { labelZh: '布', labelKo: '천', unitZh: '捆' },
    rope: { labelZh: '繩子', labelKo: '밧줄', unitZh: '捆' }
  };

  STAGES.push({
    id: 'market-stage-1',
    title: '需求・足夠・不足',
    subtitle: '모자란 자루',
    kicker: '1장 · 장터 1/8',
    grid: ['.....', '.....', '..S..', '.....', '.....'],
    goal: '先看兩個攤子的需求，把麵粉補到不足的地方。',
    rule: '需求과 현재 수량을 함께 봐. 이미 足夠한 곳과 不足한 곳이 달라.',
    words: ['需求', '足夠', '不足'],
    win: [],
    story: '두 좌판의 필요량을 확인하고, 모자란 곳에 밀가루 한 자루를 채웠다.',
    market: {
      scene: 'stalls',
      boardLabel: '장터의 두 좌판과 배달수레',
      capacity: 1,
      items: commonItems,
      startStatus: '先看看兩個攤子的需求。 먼저 두 좌판에 무엇이 얼마나 필요한지 살펴봐.',
      locations: [
        {
          id: 'bread-stall', labelZh: '麵包攤', labelKo: '빵 좌판', icon: '🥖', pos: [0, 0],
          stock: { flour: 2 }, needs: { flour: 3 }, allowTake: true, allowPut: true, accepts: ['flour']
        },
        {
          id: 'noodle-stall', labelZh: '麵攤', labelKo: '국수 좌판', icon: '🍜', pos: [0, 4],
          stock: { flour: 2 }, needs: { flour: 2 }, allowTake: true, allowPut: true, accepts: ['flour']
        },
        {
          id: 'delivery-cart', labelZh: '送貨車', labelKo: '배달수레', icon: '🛒', pos: [4, 2],
          stock: { flour: 1 }, allowTake: true, allowPut: true, accepts: ['flour'], stockLabelZh: '還有', stockLabelKo: '남아 있음'
        }
      ],
      predicates: [
        { type: 'inspected-all', locations: ['bread-stall', 'noodle-stall'] },
        { type: 'location-at-least', location: 'bread-stall', item: 'flour', amount: 3 },
        { type: 'location-at-least', location: 'noodle-stall', item: 'flour', amount: 2 }
      ],
      goalMarks: [
        { word: '需求', type: 'inspected-all', locations: ['bread-stall', 'noodle-stall'] },
        { word: '不足', type: 'inspected', location: 'bread-stall' },
        { word: '足夠', type: 'all-needs-met' }
      ],
      feedback: {
        solved: '不足的地方補上了。現在兩邊都足夠。 부족한 곳을 채워서 이제 두 좌판 모두 충분해.'
      }
    }
  });

  STAGES.push({
    id: 'market-stage-2',
    title: '數量・剩下',
    subtitle: '남은 상자',
    kicker: '1장 · 장터 2/8',
    grid: ['.....', '.....', '..S..', '.....', '.....'],
    goal: '確認貨車上剩下的數量，把兩箱燈油送回倉庫。',
    rule: '原來有多少와 지금 剩下은 얼마나 다른지 구분해.',
    words: ['數量', '剩下'],
    win: [],
    story: '행상인의 수레에 실제로 남은 등잔기름 두 상자를 찾아 창고로 돌려보냈다.',
    market: {
      scene: 'merchant-cart',
      boardLabel: '행상인의 수레와 장터 창고',
      capacity: 2,
      items: commonItems,
      startStatus: '先看看車上還剩下什麼。 행상인의 수레에 지금 실제로 무엇이 남았는지 확인해봐.',
      locations: [
        {
          id: 'merchant-cart', labelZh: '行商的貨車', labelKo: '행상인의 수레', icon: '🛒', pos: [0, 2],
          stock: { cloth: 0, oil: 2 }, allowTake: true, allowPut: true, accepts: ['oil'], stockLabelZh: '剩下', stockLabelKo: '현재 남은 것',
          facts: [
            { labelZh: '原來數量', labelKo: '원래 수량', textZh: '布 ×2', textKo: '천 2묶음' },
            { labelZh: '已送出', labelKo: '이미 배달', textZh: '布 ×2', textKo: '천 2묶음' },
            { labelZh: '原來數量', labelKo: '원래 수량', textZh: '燈油 ×3', textKo: '등잔기름 3상자' },
            { labelZh: '已送出', labelKo: '이미 배달', textZh: '燈油 ×1', textKo: '등잔기름 1상자' }
          ]
        },
        {
          id: 'warehouse', labelZh: '倉庫', labelKo: '창고', icon: '📦', pos: [4, 2],
          stock: { oil: 0 }, needs: { oil: 2 }, allowPut: true, accepts: ['oil']
        }
      ],
      predicates: [
        { type: 'location-equals', location: 'merchant-cart', item: 'oil', amount: 0 },
        { type: 'location-at-least', location: 'warehouse', item: 'oil', amount: 2 }
      ],
      goalMarks: [
        { word: '數量', type: 'inspected', location: 'merchant-cart' },
        { word: '剩下', type: 'inspected', location: 'merchant-cart' }
      ],
      feedback: {
        solved: '剩下的兩箱燈油都送回倉庫了。 남아 있던 등잔기름 두 상자를 모두 창고로 돌려보냈어.'
      }
    }
  });

  STAGES.push({
    id: 'market-stage-3',
    title: '交換・獲得',
    subtitle: '바꿔 온 물건',
    kicker: '1장 · 장터 3/8',
    grid: ['.....', '.....', '..S..', '.....', '.....'],
    goal: '用布交換繩子，把獲得的繩子帶回給行商。',
    rule: '交換은 서로 주고받는 방법이고, 獲得은 그 결과로 손에 넣는 일이야.',
    words: ['交換', '獲得'],
    win: [],
    story: '행상인이 남긴 천 한 묶음을 밧줄과 교환해, 다음 배달에 필요한 밧줄을 가져다주었다.',
    market: {
      scene: 'exchange',
      boardLabel: '행상인의 수레와 밧줄 좌판',
      capacity: 1,
      items: commonItems,
      initialInventory: { cloth: 1 },
      startStatus: '手上有一捆布。 밧줄 좌판에서 무엇과 바꿀 수 있는지 살펴봐.',
      locations: [
        {
          id: 'merchant-cart', labelZh: '行商的貨車', labelKo: '행상인의 수레', icon: '🛒', pos: [0, 0],
          stock: { rope: 0 }, needs: { rope: 1 }, allowPut: true, accepts: ['rope']
        },
        {
          id: 'rope-stall', labelZh: '繩子攤', labelKo: '밧줄 좌판', icon: '🧵', pos: [0, 4],
          stock: { rope: 1, cloth: 0 },
          exchange: { give: 'cloth', giveQty: 1, receive: 'rope', receiveQty: 1, flag: 'exchanged' }
        }
      ],
      predicates: [
        { type: 'flag', flag: 'exchanged', eq: true },
        { type: 'location-at-least', location: 'merchant-cart', item: 'rope', amount: 1 }
      ],
      goalMarks: [
        { word: '交換', type: 'flag', flag: 'exchanged', eq: true },
        { word: '獲得', type: 'flag', flag: 'exchanged', eq: true }
      ],
      feedback: {
        solved: '交換得到的繩子帶回來了。 교환해서 얻은 밧줄을 행상인에게 가져왔어.'
      }
    }
  });
})();
