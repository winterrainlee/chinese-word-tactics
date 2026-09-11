/* v0.6 world migration layer: keep stable runtime ids, change the world they represent. */
(() => {
  const settlement = {
    name: '三溪鎮',
    nameKo: '물길마을',
    origin: '小村',
    originKo: '작은 마을',
    mapAsset: './images/world/three-streams-map.webp'
  };

  WORLD.title = settlement.nameKo;
  WORLD.origin = settlement.origin;
  WORLD.originNameKo = settlement.originKo;
  WORLD.settlement = settlement;

  const regionPatches = {
    'gate-town': {
      name: '關口', nameKo: '길목', mapNameKo: '길목',
      subtitle: '마을 밖 길과 이어지는 관문',
      note: '사람과 짐수레가 드나드는 물길마을의 관문 구역. 이 문을 지나면 다시 바깥길로 이어진다.',
      completionMilestone: 'gate-core',
      map: { x: 50, y: 78, branch: 'outward', kind: 'district' }
    },
    'workshop-town': {
      name: '工坊谷', nameKo: '장인골', mapNameKo: '장인골',
      subtitle: '물길을 쓰는 공방 골짜기',
      note: '수차와 공방이 물길을 따라 모여 있다. 물을 쓰는 장치와 상태를 살피는 일이 많다.',
      completionMilestone: 'workshop-core',
      map: { x: 22, y: 56, branch: 'workshop', kind: 'district' }
    },
    'market-town': {
      name: '市集', nameKo: '장터', mapNameKo: '장터',
      subtitle: '사람과 물건이 모이는 큰길',
      note: '물길과 큰길이 만나는 생활 중심지. 필요한 것을 사고팔고 나누는 일이 이곳에 모인다.',
      completionMilestone: 'market-core',
      map: { x: 69, y: 59, branch: 'market', kind: 'district' }
    },
    'border-village': {
      name: '邊境村', nameKo: '끝마을', mapNameKo: '끝마을 방면',
      subtitle: '물길마을 밖으로 이어지는 다음 길',
      note: '관문을 지나 계속 가면 닿는 다음 정착지다. 물길마을에서 익힌 길 읽기가 바깥여행으로 이어진다.',
      recommendationMilestone: 'gate-core',
      recommendation: '길목의 일을 먼저 마치고 오는 걸 권장해. 그러면 바깥길로 이어지는 이야기가 자연스럽게 연결돼.',
      map: { x: 50, y: 92, branch: 'outward', kind: 'outside' }
    },
    'council-town': {
      name: '會議所', nameKo: '회의소', mapNameKo: '회의소',
      subtitle: '마을 사람들이 모여 의논하는 곳',
      note: '장터에서 해결하지 못한 공동의 규칙과 의견을 다루는 회의 공간이다.',
      recommendationMilestone: 'market-core',
      recommendation: '장터의 일을 먼저 마치고 오는 걸 권장해. 물건을 나누는 문제가 왜 마을의 결정으로 이어지는지 알기 쉬워져.',
      map: { x: 80, y: 48, branch: 'market', kind: 'landmark' }
    },
    'research-city': {
      name: '學術塔', nameKo: '학술탑', mapNameKo: '학술탑',
      subtitle: '지식과 기록이 모이는 탑',
      note: '오래된 기술과 기록을 살피는 곳. 장인골에서 발견한 단서가 이곳으로 이어진다.',
      lockHint: '장인골의 핵심 의뢰를 끝내면 학술탑을 찾아갈 이유와 단서를 얻게 돼.',
      map: { x: 31, y: 46, branch: 'workshop', kind: 'landmark' }
    }
  };

  WORLD.regions.forEach(region => Object.assign(region, regionPatches[region.id] || {}));

  const stories = globalThis.JourneyContent?.STORIES;
  if (stories) {
    const origin = stories['prologue-departure'];
    if (origin) {
      origin.placeZh = settlement.origin;
      origin.placeKo = settlement.originKo;
    }

    const merchant = stories['chapter1-roadside-merchant'];
    if (merchant) {
      merchant.placeZh = '三岔路';
      merchant.placeKo = '물길마을 어귀';
      merchant.beats = [
        { speaker: 'merchant', zh: '剛才有狼！我急著躲開，結果車輪卡住了。', ko: '방금 늑대가 있었어! 급히 피하다가 수레바퀴가 끼고 말았지.' },
        { speaker: 'boy', zh: '別急。我來幫你推。', ko: '잠깐만요. 제가 밀어볼게요.' },
        { speaker: 'narrator', zh: '兩人一起用力，總算把車推回了路上。', ko: '둘이 함께 힘을 쓰자 마침내 수레가 길 위로 올라왔다.' },
        { speaker: 'merchant', zh: '謝謝你！你是第一次來這裡吧？', ko: '고맙구나! 이곳은 처음이지?' },
        { speaker: 'merchant', zh: '對了，你從哪裡來？', ko: '그러고 보니, 넌 어디서 왔니?' },
        { speaker: 'boy', zh: '森林那邊的一個小村。', ko: '숲 저편의 작은 마을에서 왔어요.' },
        { speaker: 'merchant', zh: '難怪。這裡叫三溪鎮。三條溪在這附近匯在一起，所以人也慢慢多了。', ko: '그렇구나. 여기는 물길마을이야. 세 물줄기가 이 근처에서 만나서, 사람도 차츰 모이게 됐지.' },
        { speaker: 'boy', zh: '這裡……都是同一個鎮嗎？', ko: '여기가…… 전부 한 마을이에요?' },
        { speaker: 'merchant', zh: '對。這三條路都通進三溪鎮。往關口走能出鎮，沿著水走有工坊谷，大路那邊是市集。', ko: '그래. 이 세 길은 모두 물길마을로 이어져. 길목으로 가면 마을 밖으로 나갈 수 있고, 물을 따라가면 장인골, 큰길 쪽은 장터야.' },
        { speaker: 'merchant', zh: '三條路都能走。先去哪裡，就看你了。', ko: '세 길 모두 갈 수 있어. 어디부터 가볼지는 네가 정하렴.' }
      ];
    }

    Object.values(stories).forEach(story => {
      if (story.placeZh === '關口鎮') story.placeZh = '關口';
      if (story.placeKo === '길목') story.placeKo = '길목';
    });

    const gateArrival = stories['gate-arrival'];
    if (gateArrival?.beats?.[0]) {
      gateArrival.beats[0] = {
        speaker: 'narrator',
        zh: '少年沿著行商說的路，來到了三溪鎮通往外地的關口。',
        ko: '소년은 행상인이 알려준 길을 따라 물길마을에서 바깥으로 이어지는 길목에 도착했다.'
      };
    }
  }

  globalThis.WorldV06 = Object.freeze({ settlement, regionPatches });
})();
