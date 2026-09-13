/* Market vocabulary and M1-M4 stage data. */
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
      ex: '這批貨還剩下兩箱燈油。',
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
    },
    '買': {
      p: 'ㄇㄞˇ',
      k: '사다, 구입하다',
      ex: '我買了一份菜。',
      rule: '내가 돈을 내고 물건을 받는 쪽에서 보면 買야. 이 판에서는 구매가 확정되면 가격만큼 돈이 줄고 물건이 손에 들어와.'
    },
    '賣': {
      p: 'ㄇㄞˋ',
      k: '팔다',
      ex: '菜販賣出了一份菜。',
      rule: '같은 거래를 좌판 주인 쪽에서 보면 賣야. 소년이 買한 순간 좌판은 그 물건을 賣한 셈이야.'
    },
    '價格': {
      p: 'ㄐㄧㄚˋ ㄍㄜˊ',
      k: '가격',
      ex: '先看看麵包的價格。',
      rule: '물건을 사기 위해 내야 하는 돈의 양이야. 구매하기 전에 좌판의 상황 패널에서 확인할 수 있어.'
    }
  });

  const commonItems = {
    flour: { labelZh: '麵粉', labelKo: '밀가루', unitZh: '袋' },
    oil: { labelZh: '燈油', labelKo: '등잔기름', unitZh: '箱' },
    cloth: { labelZh: '布', labelKo: '천', unitZh: '捆' },
    rope: { labelZh: '繩子', labelKo: '밧줄', unitZh: '捆' },
    vegetable: { labelZh: '菜', labelKo: '채소', unitZh: '份' },
    bread: { labelZh: '麵包', labelKo: '빵', unitZh: '個' }
  };

  STAGES.push({
    id: 'market-stage-1',
    title: '需求・足夠・不足',
    subtitle: '모자란 자루',
    kicker: '1장 · 장터 1/8',
    grid: ['.....', '.....', '.....', '..S..', '.....'],
    goal: '先看兩個攤子的需求，把麵粉補到不足的地方。',
    rule: '需求과 현재 수량을 함께 봐. 이미 足夠한 곳과 不足한 곳이 달라.',
    words: ['需求', '足夠', '不足'],
    win: [],
    story: '두 좌판의 필요량을 확인하고, 행상 아주머니 곁에 있던 밀가루 한 자루를 모자란 곳에 채웠다.',
    market: {
      scene: 'stalls',
      boardLabel: '장터의 두 좌판과 행상 아주머니',
      capacity: 1,
      items: commonItems,
      startStatus: '先看看兩個攤子的需求。 아주머니가 짐을 정리하는 동안 두 좌판의 필요량을 확인해봐.',
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
          id: 'merchant', kind: 'npc', labelZh: '行商阿姨', labelKo: '행상 아주머니', icon: '👩‍🦱', pos: [4, 2],
          stock: { flour: 1 }, allowTake: true, allowPut: true, accepts: ['flour'], stockLabelZh: '手邊', stockLabelKo: '곁에 둔 짐'
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
    goal: '確認這批貨剩下的數量，把兩箱燈油送回倉庫。',
    rule: '처음 있던 양(原來數量)과 지금 남은 양(剩下)을 구분해. 이미 보낸 양(已送出)을 함께 보면 지금 남은 양을 알 수 있어.',
    words: ['數量', '剩下'],
    win: [],
    story: '행상 아주머니가 가져온 짐 가운데 실제로 남은 등잔기름 두 상자를 찾아 창고로 돌려보냈다.',
    market: {
      revision: 2,
      scene: 'merchant-goods',
      boardLabel: '행상 아주머니와 장터 창고',
      capacity: 2,
      items: commonItems,
      startStatus: '先看原來數量和已送出的數量。 원래 몇 개였고 이미 몇 개를 보냈는지부터 확인해봐.',
      remainingInference: {
        location: 'merchant',
        flag: 'remainingConfirmed',
        items: ['cloth', 'oil'],
        labelZh: '剩下',
        hiddenHintKo: '원래 수량과 이미 보낸 수량을 비교해봐.',
        confirmLabelZh: '確認剩下',
        confirmLabelKo: '남은 수량 확인하기',
        confirmStatus: '原來有三箱燈油，已經送出一箱，所以剩下兩箱。 원래 등잔기름은 3상자였고 1상자를 보냈어. 그래서 2상자가 남았어.'
      },
      locations: [
        {
          id: 'merchant', kind: 'npc', labelZh: '行商阿姨', labelKo: '행상 아주머니', icon: '👩‍🦱', pos: [0, 2],
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
        { type: 'flag', flag: 'remainingConfirmed', eq: true },
        { type: 'location-equals', location: 'merchant', item: 'oil', amount: 0 },
        { type: 'location-equals', location: 'warehouse', item: 'oil', amount: 2 }
      ],
      goalMarks: [
        { word: '數量', type: 'inspected', location: 'merchant' },
        { word: '剩下', type: 'flag', flag: 'remainingConfirmed', eq: true }
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
    goal: '用布交換繩子，把獲得的繩子帶回給阿姨。',
    rule: '交換은 서로 주고받는 방법이고, 獲得은 그 결과로 손에 넣는 일이야.',
    words: ['交換', '獲得'],
    win: [],
    story: '행상 아주머니가 건넨 천 한 묶음을 밧줄과 교환해, 다음 배달에 필요한 밧줄을 가져다주었다.',
    market: {
      scene: 'exchange',
      boardLabel: '행상 아주머니와 밧줄 좌판',
      capacity: 1,
      items: commonItems,
      initialInventory: { cloth: 1 },
      startStatus: '手上有一捆布。 밧줄 좌판에서 무엇과 바꿀 수 있는지 살펴봐.',
      locations: [
        {
          id: 'merchant', kind: 'npc', labelZh: '行商阿姨', labelKo: '행상 아주머니', icon: '👩‍🦱', pos: [0, 0],
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
        { type: 'location-at-least', location: 'merchant', item: 'rope', amount: 1 }
      ],
      goalMarks: [
        { word: '交換', type: 'flag', flag: 'exchanged', eq: true },
        { word: '獲得', type: 'flag', flag: 'exchanged', eq: true }
      ],
      feedback: {
        solved: '交換得到的繩子帶回來了。 교환해서 얻은 밧줄을 아주머니에게 가져왔어.'
      }
    }
  });

  STAGES.push({
    id: 'market-stage-4',
    title: '買・賣・價格',
    subtitle: '오늘 저녁거리',
    kicker: '1장 · 장터 4/8',
    grid: ['.....', '.....', '..S..', '.....', '.....'],
    goal: '看價格，買一份菜和一個麵包，帶回給客棧主人。',
    rule: '같은 거래를 소년은 買, 상인은 賣라고 해. 價格만큼 가진 동전이 줄어.',
    words: ['買', '賣', '價格'],
    win: [],
    milestone: 'inn-unlocked',
    story: '채소와 빵을 사서 여관 주인에게 가져다주었다. 장터 한쪽에 오늘 돌아갈 곳이 생겼다.',
    market: {
      scene: 'buying',
      boardLabel: '채소 좌판, 빵 좌판과 여관 주인',
      capacity: 2,
      coins: 10,
      items: commonItems,
      startStatus: '錢幣有十個。 먼저 두 좌판의 가격을 보고 채소와 빵을 하나씩 사 와.',
      locations: [
        {
          id: 'vegetable-stall', labelZh: '菜攤', labelKo: '채소 좌판', icon: '🥬', pos: [0, 0],
          stock: { vegetable: 1 }, sell: { item: 'vegetable', price: 3 }
        },
        {
          id: 'bread-shop', labelZh: '麵包攤', labelKo: '빵 좌판', icon: '🥖', pos: [0, 4],
          stock: { bread: 1 }, sell: { item: 'bread', price: 4 }
        },
        {
          id: 'innkeeper', kind: 'npc', labelZh: '客棧主人', labelKo: '여관 주인', icon: '🧑', pos: [4, 2],
          stock: { vegetable: 0, bread: 0 }, needs: { vegetable: 1, bread: 1 }, allowPut: true, accepts: ['vegetable', 'bread']
        }
      ],
      predicates: [
        { type: 'location-at-least', location: 'innkeeper', item: 'vegetable', amount: 1 },
        { type: 'location-at-least', location: 'innkeeper', item: 'bread', amount: 1 }
      ],
      goalMarks: [
        { word: '價格', type: 'inspected-all', locations: ['vegetable-stall', 'bread-shop'] },
        { word: '買', type: 'flag', flag: 'bought', eq: true },
        { word: '賣', type: 'flag', flag: 'sold', eq: true }
      ],
      feedback: {
        solved: '菜和麵包都買到了，也送回客棧主人手上了。 저녁에 필요한 두 가지를 모두 사서 가져왔어.'
      }
    }
  });
})();