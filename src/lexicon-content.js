/* Comparison-first lexicon content. Vocabulary facts stay in WORDS; this file only describes learning relationships. */
(() => {
  const CHAPTERS = [
    {
      id: 'journey-start',
      titleKo: '여행의 시작',
      subtitleKo: '숲길에서 처음 만난 말',
      regions: ['forest-road']
    },
    {
      id: 'chapter-1',
      titleKo: '1장 · 물길마을',
      subtitleKo: '지역에서 겪은 일을 단어 관계로 다시 본다.',
      regions: ['gate-town', 'workshop-town', 'market-town']
    }
  ];

  const REGIONS = [
    {
      id: 'forest-road', chapterId: 'journey-start', nameKo: '숲길', nameZh: '森林路',
      axisKo: '거리 · 길 · 도착', descriptionKo: '마을을 떠나 처음 길을 읽으며 만난 말.',
      stagePrefixes: ['stage-']
    },
    {
      id: 'gate-town', chapterId: 'chapter-1', nameKo: '길목', nameZh: '關口',
      axisKo: '경로 · 위치 · 이동', descriptionKo: '길과 경계를 읽고, 위치와 움직임의 차이를 살펴본다.',
      stagePrefixes: ['gate-stage-']
    },
    {
      id: 'workshop-town', chapterId: 'chapter-1', nameKo: '장인골', nameZh: '工坊谷',
      axisKo: '변화 · 조건 · 상태', descriptionKo: '상태를 읽고 필요한 곳만 바꾸며 원인과 결과를 연결한다.',
      stagePrefixes: ['workshop-stage-']
    },
    {
      id: 'market-town', chapterId: 'chapter-1', nameKo: '장터', nameZh: '市集',
      axisKo: '필요 · 거래 · 선택 · 분배', descriptionKo: '필요한 양을 보고 사고팔고 나누며 선택의 결과를 살펴본다.',
      stagePrefixes: ['market-stage-']
    }
  ];

  const GROUPS = [
    {
      id: 'forest-distance', chapterId: 'journey-start', regionId: 'forest-road',
      titleKo: '가까워지고 멀어지기', type: 'contrast', displayZh: '接近 ↔ 遠離',
      words: ['接近', '遠離'],
      noteKo: '둘 다 대상과의 거리를 말하지만 방향이 반대다.',
      gameNoteKo: '비석에는 接近했고, 늑대에게서는 遠離했다.'
    },
    {
      id: 'forest-path-actions', chapterId: 'journey-start', regionId: 'forest-road',
      titleKo: '길에서 일어나는 일', type: 'related', displayZh: '避開 · 通過 · 到達',
      words: ['避開', '通過', '到達'], related: ['經由', '進入', '退出'],
      noteKo: '피해서 가는 것, 어떤 구간을 지나가는 것, 목적지에 닿는 것은 서로 다른 사건이다.',
      gameNoteKo: '가시를 避開하고 유적을 通過한 뒤 출구에 到達했다.'
    },
    {
      id: 'gate-boundary', chapterId: 'chapter-1', regionId: 'gate-town',
      titleKo: '경계를 드나들기', type: 'contrast', displayZh: '進入 ↔ 退出',
      words: ['進入', '退出'], related: ['通過'],
      noteKo: '進入와 退出은 경계를 기준으로 안쪽과 바깥쪽의 방향을 말한다. 通過는 공간을 지나 반대편까지 가는 데 초점이 있다.',
      gameNoteKo: '관문 안으로 進入해 길표지를 본 뒤 다시 退出했다.'
    },
    {
      id: 'gate-distance-range', chapterId: 'chapter-1', regionId: 'gate-town',
      titleKo: '거리와 범위', type: 'related', displayZh: '距離 · 範圍',
      words: ['距離', '範圍'],
      noteKo: '距離는 두 대상 사이가 얼마나 떨어졌는지, 範圍는 어떤 영향이나 조건이 미치는 영역을 말한다.',
      gameNoteKo: '종루까지의 距離를 비교하면서 종소리의 範圍 안에 있는 표식을 찾았다.'
    },
    {
      id: 'gate-route-via', chapterId: 'chapter-1', regionId: 'gate-town',
      titleKo: '길과 경유', type: 'related', displayZh: '路線 · 經由',
      words: ['路線', '經由'], related: ['通過', '到達'],
      noteKo: '路線은 출발점에서 목적지까지 이어지는 전체 길이고, 經由는 그 길에서 실제로 거친 지점에 초점이 있다.',
      gameNoteKo: '동쪽이나 서쪽 路線을 고르고 초소 한 곳을 經由해 북쪽 출구로 갔다.'
    },
    {
      id: 'gate-position-context', chapterId: 'chapter-1', regionId: 'gate-town',
      titleKo: '위치와 주변', type: 'scope', displayZh: '位置 · 周圍 · 障礙',
      words: ['位置', '周圍', '障礙'],
      noteKo: '位置는 대상의 자리, 周圍는 그 가까이에 있는 여러 요소, 障礙는 그중 실제 진행을 막는 것을 가리킨다.',
      gameNoteKo: '수레의 位置와 周圍를 살핀 뒤 실제 길을 막는 돌이 障礙라는 것을 확인했다.'
    },
    {
      id: 'gate-movement-direction', chapterId: 'chapter-1', regionId: 'gate-town',
      titleKo: '움직임과 방향', type: 'scope', displayZh: '移動 ⊃ 前進 / 後退',
      words: ['移動', '前進', '後退'],
      noteKo: '移動은 위치가 바뀌는 넓은 개념이다. 바라보는 방향으로 움직이면 前進, 반대로 움직이면 後退다.',
      gameNoteKo: '수레를 後退시켜 문이 열릴 자리를 만든 뒤 다시 前進했다. 두 행동 모두 移動이다.'
    },
    {
      id: 'gate-follow-lead', chapterId: 'chapter-1', regionId: 'gate-town',
      titleKo: '같은 행렬, 두 관점', type: 'perspective', displayZh: '跟隨 ⇄ 帶領',
      words: ['跟隨', '帶領'],
      noteKo: '같은 움직임을 뒤의 대상에서 보면 跟隨, 앞에서 이끄는 대상에서 보면 帶領이다.',
      gameNoteKo: '소년이 앞에서 수레를 帶領했고, 수레는 소년을 跟隨했다.'
    },
    {
      id: 'workshop-change-hold', chapterId: 'chapter-1', regionId: 'workshop-town',
      titleKo: '바꾸기와 유지하기', type: 'contrast', displayZh: '改變 ↔ 保持',
      words: ['改變', '保持'],
      noteKo: '필요한 것은 改變하고 이미 맞는 것은 保持한다. 모든 것을 건드리는 것이 조절은 아니다.',
      gameNoteKo: '왼쪽 수문은 改變하고 오른쪽 수문은 원래 상태를 保持했다.'
    },
    {
      id: 'workshop-adjust', chapterId: 'chapter-1', regionId: 'workshop-town',
      titleKo: '늘리고 줄여 맞추기', type: 'sequence', displayZh: '增加 ↔ 減少 → 調整',
      words: ['增加', '減少', '調整'],
      noteKo: '增加와 減少는 한 값의 변화 방향이고, 調整은 필요한 상태에 맞추는 전체 과정이다.',
      gameNoteKo: '불은 減少하고 바람은 增加했다. 두 상태가 모두 알맞아졌을 때 調整이 완성됐다.'
    },
    {
      id: 'workshop-connect', chapterId: 'chapter-1', regionId: 'workshop-town',
      titleKo: '연결하고 떼기', type: 'contrast', displayZh: '連接 ↔ 分開',
      words: ['連接', '分開'],
      noteKo: '장치가 함께 작동할 관계를 만들면 連接, 그 관계를 끊으면 分開다.',
      gameNoteKo: '필요한 숫돌은 주축에 連接하고 쓰지 않는 도르래는 分開했다.'
    },
    {
      id: 'workshop-condition', chapterId: 'chapter-1', regionId: 'workshop-town',
      titleKo: '조건과 맞음', type: 'condition', displayZh: '條件 → 符合',
      words: ['條件', '符合'],
      noteKo: '條件은 요구되는 기준이고, 符合는 현재 상태가 그 기준에 맞는다는 판단이다.',
      gameNoteKo: '세 가지 條件을 하나씩 맞춰 모두 符合하자 작업대가 열렸다.'
    },
    {
      id: 'workshop-appear', chapterId: 'chapter-1', regionId: 'workshop-town',
      titleKo: '나타나고 사라지기', type: 'contrast', displayZh: '出現 ↔ 消失',
      words: ['出現', '消失'],
      noteKo: '둘 다 직접 누르는 조작이 아니라 다른 조건 변화의 결과로 관찰되는 현상이다.',
      gameNoteKo: '바람을 맞추자 푸른 불꽃이 出現하고 검은 연기가 消失했다.'
    },
    {
      id: 'workshop-repair', chapterId: 'chapter-1', regionId: 'workshop-town',
      titleKo: '고장에서 회복까지', type: 'sequence', displayZh: '損壞 → 修復 → 恢復',
      words: ['損壞', '修復', '恢復'],
      noteKo: '損壞는 손상된 상태, 修復는 고치는 행동, 恢復는 기능을 되찾은 결과다.',
      gameNoteKo: '損壞된 톱니를 찾아 修復하자 기계 기능이 恢復했다.'
    },
    {
      id: 'market-need', chapterId: 'chapter-1', regionId: 'market-town',
      titleKo: '필요에서 충분까지', type: 'condition', displayZh: '需求 → 不足 → 補充 → 足夠',
      words: ['需求', '不足', '補充', '足夠'],
      noteKo: '需求이 기준이 되고 현재량이 모자라면 不足하다. 부족한 만큼 補充해서 기준을 채우면 足夠해진다.',
      gameNoteKo: '각 장소의 需求과 현재량을 비교해 不足한 곳만 補充했고, 필요한 양이 채워지자 足夠해졌다.'
    },
    {
      id: 'market-quantity', chapterId: 'chapter-1', regionId: 'market-town',
      titleKo: '수량과 남은 것', type: 'related', displayZh: '數量 · 剩下',
      words: ['數量', '剩下'],
      noteKo: '數量은 어떤 시점의 개수이고, 剩下는 사용하거나 보낸 뒤 지금 실제로 남아 있는 것을 말한다.',
      gameNoteKo: '처음 數量만 보지 않고 이미 보낸 것을 제외해 지금 剩下 있는 등잔기름을 확인했다.'
    },
    {
      id: 'market-exchange', chapterId: 'chapter-1', regionId: 'market-town',
      titleKo: '교환해서 얻기', type: 'sequence', displayZh: '交換 → 獲得',
      words: ['交換', '獲得'],
      noteKo: '交換은 서로 주고받는 방법이고, 獲得은 그 결과 손에 들어온 것을 말한다.',
      gameNoteKo: '천을 밧줄과 交換한 결과 필요한 밧줄을 獲得했다.'
    },
    {
      id: 'market-buy-sell', chapterId: 'chapter-1', regionId: 'market-town',
      titleKo: '같은 거래, 두 관점', type: 'perspective', displayZh: '買 ⇄ 賣',
      words: ['買', '賣'], related: ['價格'],
      noteKo: '같은 거래를 구매자 쪽에서 보면 買, 판매자 쪽에서 보면 賣다.',
      gameNoteKo: '소년이 채소를 買한 순간 좌판 주인은 같은 채소를 賣한 셈이다.'
    },
    {
      id: 'market-price-value', chapterId: 'chapter-1', regionId: 'market-town',
      titleKo: '가격과 가치', type: 'contrast', displayZh: '價格 ↔ 價值',
      words: ['價格', '價值'], related: ['選擇'],
      noteKo: '價格은 지불해야 하는 양이고, 價值는 지금 필요한 일을 얼마나 잘 해결하는지까지 포함해 판단한다.',
      gameNoteKo: '더 싼 도구와 더 많이 나르는 도구를 비교했다. 價格만으로 價值가 자동으로 정해지지는 않았다.'
    },
    {
      id: 'market-choice', chapterId: 'chapter-1', regionId: 'market-town',
      titleKo: '선택과 이번 차례의 포기', type: 'perspective', displayZh: '選擇 ⇄ 放棄',
      words: ['選擇', '放棄'],
      noteKo: '이 장터에서 放棄는 영구히 버린다는 뜻이 아니라, 제한 때문에 이번 차례에는 고르지 않고 미루는 맥락이다.',
      gameNoteKo: '짐칸 하나에 먼저 보낼 것을 選擇했고 다른 하나는 이번 차례에만 放棄했다.'
    },
    {
      id: 'market-distribute', chapterId: 'chapter-1', regionId: 'market-town',
      titleKo: '나누고 채우기', type: 'related', displayZh: '分配 · 補充',
      words: ['分配', '補充'], related: ['需求', '不足', '剩下'],
      noteKo: '分配는 여러 목적지에 필요한 자원을 나누어 보내는 일이고, 補充은 한 목적지의 부족분을 채우는 일이다.',
      gameNoteKo: '도착한 물건을 필요한 곳마다 分配하고 실제로 모자란 만큼만 補充했다.'
    }
  ];

  const WORD_META = {
    '接近': { exampleKo: '나는 천천히 비석에 가까이 갔다.' },
    '遠離': { exampleKo: '위험한 곳에서 멀리 떨어져 줘.' },
    '通過': { exampleKo: '우리는 이 유적을 지나가야 한다.', usageKo: '공간이나 구간을 지나가는 데 초점이 있다.' },
    '到達': { exampleKo: '마지막으로 출구에 도착한다.', usageKo: '이동 과정이 아니라 목적지에 닿은 결과를 말한다.' },
    '避開': { exampleKo: '위험을 피해 계속 앞으로 간다.' },
    '進入': { exampleKo: '관문 안으로 들어가 줘.', usageKo: '경계의 바깥에서 안으로 들어가는 방향을 말한다.' },
    '退出': { exampleKo: '길표지를 본 뒤 관문에서 나간다.', usageKo: '안쪽에서 바깥쪽으로 나오는 방향을 말한다.' },
    '距離': { exampleKo: '이 표식은 종루에서 비교적 멀리 떨어져 있다.' },
    '範圍': { exampleKo: '여기는 아직 종소리가 닿는 범위 안이다.' },
    '路線': { exampleKo: '두 노선 모두 북쪽 출구로 갈 수 있다.' },
    '經由': { exampleKo: '우리는 초소를 거쳐 북쪽 출구로 간다.', usageKo: '목적지로 가는 도중 어떤 장소나 지점을 거친다는 뜻이다.' },
    '位置': { exampleKo: '먼저 수레가 지금 어디 있는지 보자.' },
    '周圍': { exampleKo: '수레 주변에는 상자와 돌이 있다.' },
    '障礙': { exampleKo: '돌이 수레 앞의 장애물이 되었다.' },
    '移動': { exampleKo: '먼저 수레를 안전한 위치로 옮긴다.', usageKo: '방향과 상관없이 위치가 바뀌는 넓은 개념이다.' },
    '前進': { exampleKo: '문이 열린 뒤 수레가 앞으로 갈 수 있다.' },
    '後退': { exampleKo: '수레를 먼저 조금 뒤로 물린다.' },
    '跟隨': { exampleKo: '수레가 소년을 따라 새 길로 간다.' },
    '帶領': { exampleKo: '소년이 수레를 이끌고 북쪽 출구로 간다.' },
    '改變': { exampleKo: '물의 양이 바뀌었다.' },
    '保持': { exampleKo: '오른쪽은 원래 상태를 유지한다.' },
    '增加': { exampleKo: '바람의 양이 조금 늘었다.' },
    '減少': { exampleKo: '화력이 조금 줄었다.' },
    '調整': { exampleKo: '화력과 바람의 양을 알맞게 조절한다.', usageKo: '단순히 늘리거나 줄이는 한 방향보다 목표 상태에 맞추는 과정 전체에 초점이 있다.' },
    '連接': { exampleKo: '숫돌과 주축을 연결한다.' },
    '分開': { exampleKo: '쓰지 않는 도르래를 분리한다.' },
    '條件': { exampleKo: '조건이 세 가지 있다.' },
    '符合': { exampleKo: '세 조건이 모두 맞았다.' },
    '出現': { exampleKo: '푸른 불꽃이 나타났다.' },
    '消失': { exampleKo: '검은 연기가 사라졌다.' },
    '損壞': { exampleKo: '이 톱니바퀴가 손상되었다.' },
    '修復': { exampleKo: '손상된 톱니바퀴를 수리한다.', usageKo: '망가진 대상에 손을 대어 고치는 행동을 가리킨다.' },
    '恢復': { exampleKo: '기계의 기능이 회복되었다.', usageKo: '수리 같은 원인 뒤에 기능이나 상태가 다시 돌아온 결과를 가리킨다.' },
    '需求': { exampleKo: '먼저 각 좌판에 무엇이 필요한지 보자.' },
    '足夠': { exampleKo: '이곳의 밀가루는 이미 충분하다.' },
    '不足': { exampleKo: '이 좌판은 밀가루가 한 자루 부족하다.' },
    '數量': { exampleKo: '먼저 상자의 수량을 확인한다.' },
    '剩下': { exampleKo: '이 화물에는 등잔기름 두 상자가 남아 있다.' },
    '交換': { exampleKo: '천 한 묶음을 밧줄 한 묶음과 교환한다.' },
    '獲得': { exampleKo: '교환한 뒤 밧줄 한 묶음을 얻었다.' },
    '買': { exampleKo: '나는 채소 한 몫을 샀다.', usageKo: '같은 거래를 돈을 내고 물건을 받는 쪽에서 표현한다.' },
    '賣': { exampleKo: '채소 상인이 채소 한 몫을 팔았다.', usageKo: '같은 거래를 물건을 내주고 돈을 받는 쪽에서 표현한다.' },
    '價格': { exampleKo: '먼저 빵의 가격을 보자.', usageKo: '물건을 얻기 위해 지불해야 하는 양을 말한다.' },
    '價值': { exampleKo: '가격이 달라도 가치는 지금 무엇이 필요한지에 따라 봐야 한다.', usageKo: '가격과 같지 않다. 상황에서 얻는 쓸모나 중요성까지 함께 판단한다.' },
    '選擇': { exampleKo: '두 도구를 다 본 뒤 선택한다.' },
    '放棄': { exampleKo: '이번에는 등잔기름을 미루고 다음에 보낸다.', usageKo: '일반적으로는 포기하거나 내려놓는 뜻이다. 현재 장터 판에서는 이번 차례에 고르지 않는 맥락으로 좁혀 쓴다.' },
    '分配': { exampleKo: '각 곳에 무엇이 모자란지 본 뒤 물건을 나누어 보낸다.', usageKo: '여러 대상이나 목적지에 자원을 나누어 배치하는 데 초점이 있다.' },
    '補充': { exampleKo: '모자란 두 몫을 더 채운다.', usageKo: '이미 있는 것에 부족한 만큼을 더해서 필요한 상태를 만든다.' }
  };

  const stageRegionId = stageId => {
    const region = REGIONS.find(item => item.stagePrefixes.some(prefix => stageId.startsWith(prefix)));
    return region?.id || null;
  };

  globalThis.LexiconContent = Object.freeze({ CHAPTERS, REGIONS, GROUPS, WORD_META, stageRegionId });
})();
