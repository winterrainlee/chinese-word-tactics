/* Story text is a game-authored layer, separate from official vocabulary data. */
(() => {
  const STORIES = {
    'prologue-departure': {
      id: 'prologue-departure', chapterId: 'prologue', titleKo: '고향을 떠나다',
      background: 'origin', placeZh: '出發', placeKo: '고향 마을',
      beats: [
        { speaker: 'narrator', zh: '天亮了。少年站在村口，背上是小小的行李。', ko: '날이 밝았다. 소년은 작은 짐을 메고 마을 어귀에 서 있었다.' },
        { speaker: 'boy', zh: '村子外面，會是什麼樣子呢？', ko: '마을 밖은 어떤 모습일까?' },
        { speaker: 'narrator', zh: '熟悉的小路一直通向森林。', ko: '익숙한 오솔길이 숲까지 이어져 있었다.' },
        { speaker: 'boy', zh: '好，出發吧。', ko: '좋아, 출발하자.' }
      ]
    },
    'prologue-forest-edge': {
      id: 'prologue-forest-edge', chapterId: 'prologue', titleKo: '숲 너머의 목소리',
      background: 'forest', placeZh: '森林邊', placeKo: '숲 어귀',
      beats: [
        { speaker: 'narrator', zh: '少年走出了森林。前面的路，漸漸寬了起來。', ko: '소년은 숲을 빠져나왔다. 앞에 놓인 길이 조금씩 넓어졌다.' },
        { speaker: 'boy', zh: '剛才石碑上的字……真的亮了嗎？', ko: '아까 석비의 글자…… 정말 빛났던 걸까?' },
        { speaker: 'narrator', zh: '他還沒想明白，路旁就傳來一個聲音。', ko: '미처 생각을 정리하기도 전에 길가에서 목소리가 들려왔다.' },
        { speaker: 'unknown', zh: '救命！有人在嗎？', ko: '사람 살려! 누구 없어요?' }
      ]
    },
    'chapter1-roadside-merchant': {
      id: 'chapter1-roadside-merchant', chapterId: 'chapter-1-three-roads', titleKo: '길가의 행상인',
      background: 'roadside', placeZh: '三岔路', placeKo: '세 갈래 길',
      beats: [
        { speaker: 'merchant', zh: '剛才有狼！我急著躲開，結果車輪卡住了。', ko: '방금 늑대가 있었어! 급히 피하다가 수레바퀴가 끼고 말았지.' },
        { speaker: 'boy', zh: '別急。我來幫你推。', ko: '잠깐만요. 제가 밀어볼게요.' },
        { speaker: 'narrator', zh: '兩人一起用力，總算把車推回了路上。', ko: '둘이 함께 힘을 쓰자 마침내 수레가 길 위로 올라왔다.' },
        { speaker: 'merchant', zh: '謝謝你！你是第一次來這裡吧？', ko: '고맙구나! 이곳은 처음이지?' },
        { speaker: 'merchant', zh: '關口鎮來往的人多，工坊村有各種工匠，市集鎮則是買賣東西的地方。', ko: '길목에는 오가는 사람이 많고, 장인골에는 여러 장인이 있어. 장터는 물건을 사고파는 곳이지.' },
        { speaker: 'merchant', zh: '三條路都能走。先去哪裡，就看你了。', ko: '세 길 모두 갈 수 있어. 어디부터 갈지는 네가 정하렴.' }
      ]
    },
    'gate-arrival': {
      id: 'gate-arrival', chapterId: 'chapter-1-three-roads', titleKo: '관문에 도착하다',
      background: 'gate', placeZh: '關口鎮', placeKo: '길목',
      beats: [
        { speaker: 'narrator', zh: '少年沿著行商說的路，來到了關口鎮。', ko: '소년은 행상인이 알려준 길을 따라 길목에 도착했다.' },
        { speaker: 'gatekeeper', zh: '第一次來嗎？北邊的路最近不太好走。', ko: '처음 왔나? 요즘 북쪽 길이 좀 좋지 않아.' },
        { speaker: 'gatekeeper', zh: '關口裡有一塊舊路標，字有點看不清楚。', ko: '관문 안쪽에 오래된 길표지가 있는데, 글자가 좀 잘 안 보여.' },
        { speaker: 'gatekeeper', zh: '可以進去幫我看一下嗎？看完後再退出關口。', ko: '안으로 들어가서 한번 봐줄래? 확인한 뒤 다시 관문 밖으로 나오면 돼.' },
        { speaker: 'boy', zh: '好，我去看看。', ko: '좋아요. 가서 볼게요.' }
      ]
    },
    'gate-after-entry': {
      id: 'gate-after-entry', chapterId: 'chapter-1-three-roads', titleKo: '안팎은 잘 보네',
      background: 'gate', placeZh: '關口鎮', placeKo: '길목',
      beats: [
        { speaker: 'gatekeeper', zh: '回來了？裡面的路標怎麼樣？', ko: '돌아왔네. 안쪽 길표지는 어땠어?' },
        { speaker: 'boy', zh: '字有一點模糊。可是我靠近的時候，好像突然看清楚了。', ko: '글자가 조금 흐렸어요. 그런데 가까이 가니까 갑자기 또렷하게 보인 것 같아요.' },
        { speaker: 'gatekeeper', zh: '是嗎？也許只是光線吧。至少你進出關口都很順。', ko: '그래? 빛 때문일지도 모르지. 그래도 관문 안팎은 잘 오가네.' },
        { speaker: 'narrator', zh: '這時，塔上的鐘響了。幾個人抬頭看向遠處。', ko: '그때 감시탑의 종이 울렸다. 몇 사람이 고개를 들어 먼 곳을 바라봤다.' },
        { speaker: 'gatekeeper', zh: '正好。下一件事，跟鐘聲能傳多遠有關。', ko: '잘됐네. 다음 일은 종소리가 어디까지 닿는지와 관계가 있어.' }
      ]
    },
    'gate-bell-task': {
      id: 'gate-bell-task', chapterId: 'chapter-1-three-roads', titleKo: '종소리를 확인해 줘',
      background: 'gate', placeZh: '關口鎮', placeKo: '길목',
      beats: [
        { speaker: 'gatekeeper', zh: '北邊新開的路上，鐘聲到底能傳到哪裡，我們還不確定。', ko: '북쪽에 새로 난 길까지 종소리가 정확히 어디까지 닿는지 아직 확실하지 않아.' },
        { speaker: 'gatekeeper', zh: '我在路上插了幾個標記。站到標記上，就能比較跟鐘樓的距離。', ko: '길에 확인 표식을 몇 개 꽂아뒀어. 표식에 서면 종탑과 얼마나 떨어져 있는지 비교할 수 있지.' },
        { speaker: 'gatekeeper', zh: '請找出還聽得到鐘聲、而且離鐘樓最遠的標記。', ko: '종소리가 아직 들리면서 종탑에서 가장 먼 표식을 찾아줘.' },
        { speaker: 'boy', zh: '好。我一路聽聽看。', ko: '좋아요. 움직이면서 들어볼게요.' }
      ]
    },
    'gate-after-bell': {
      id: 'gate-after-bell', chapterId: 'chapter-1-three-roads', titleKo: '종소리의 가장자리',
      background: 'gate', placeZh: '關口鎮', placeKo: '길목',
      beats: [
        { speaker: 'boy', zh: '找到了。再往外一點，就聽不到了。', ko: '찾았어요. 여기서 조금만 더 멀어지면 들리지 않아요.' },
        { speaker: 'gatekeeper', zh: '那裡就是鐘聲能到的範圍邊緣。', ko: '그곳이 종소리가 닿는 범위의 가장자리구나.' },
        { speaker: 'boy', zh: '每個標記跟鐘樓的距離不一樣。把聽得到的地方放在一起，就看得出鐘聲的範圍了。', ko: '표식마다 종탑과의 거리는 달랐어요. 들리는 곳들을 함께 보면 종소리의 범위가 보이네요.' },
        { speaker: 'gatekeeper', zh: '很好。接下來得看看北邊的兩條路，哪一條比較合適。', ko: '좋아. 다음에는 북쪽의 두 길 중 어느 쪽이 더 알맞은지 봐야겠군.' }
      ]
    },
    'gate-route-task': {
      id: 'gate-route-task', chapterId: 'chapter-1-three-roads', titleKo: '두 길 중 하나로',
      background: 'gate', placeZh: '關口鎮', placeKo: '길목',
      beats: [
        { speaker: 'gatekeeper', zh: '北口前面的路分成兩條，西路和東路最後都能到北口。', ko: '북쪽 출구 앞에서 길이 둘로 갈라져. 서쪽 길과 동쪽 길 모두 결국 북쪽 출구로 이어져.' },
        { speaker: 'gatekeeper', zh: '鐘聲的結果也得告訴哨站。你選一條路線，經由一個哨站再往北走吧。', ko: '종소리 조사 결과도 초소에 알려야 해. 네가 경로 하나를 골라 초소 한 곳을 거쳐 북쪽으로 가줘.' },
        { speaker: 'gatekeeper', zh: '不用特地走哪一邊。哪條路順手，就走哪條。', ko: '어느 쪽으로 가야 하는 건 아니야. 네가 가기 편한 길을 택하면 돼.' },
        { speaker: 'boy', zh: '明白了。我會先經過哨站。', ko: '알겠어요. 초소를 거쳐서 갈게요.' }
      ]
    },
    'gate-after-route': {
      id: 'gate-after-route', chapterId: 'chapter-1-three-roads', titleKo: '길은 다시 만난다',
      background: 'gate', placeZh: '北口', placeKo: '북쪽 출구',
      beats: [
        { speaker: 'narrator', zh: '少年經過哨站，從自己選的路線來到了北口。', ko: '소년은 초소를 거쳐 자신이 고른 길을 따라 북쪽 출구에 도착했다.' },
        { speaker: 'boy', zh: '走哪一條路都能到這裡。重要的是路上要經過哪裡。', ko: '어느 길로 와도 여기에 도착할 수 있네. 중요한 건 가는 동안 어디를 거치느냐구나.' },
        { speaker: 'narrator', zh: '前方不遠處，一輛貨車停在路邊，車夫正繞著車子查看。', ko: '조금 앞쪽 길가에는 짐수레 한 대가 멈춰 있었고, 마부가 수레 주위를 돌며 살펴보고 있었다.' },
        { speaker: 'boy', zh: '那輛車……是不是又卡住了？', ko: '저 수레…… 또 어디 걸린 건가?' }
      ]
    },
    'gate-cart-task': {
      id: 'gate-cart-task', chapterId: 'chapter-1-three-roads', titleKo: '바퀴가 걸린 자리',
      background: 'gate', placeZh: '北口外', placeKo: '북쪽 출구 밖',
      beats: [
        { speaker: 'driver', zh: '奇怪，車輪又不動了。怎麼推都推不動。', ko: '이상하네. 바퀴가 또 안 움직여. 아무리 밀어도 꼼짝을 안 해.' },
        { speaker: 'boy', zh: '先別推。我看看貨車現在的位置和周圍。', ko: '일단 밀지 마세요. 수레가 지금 어디 있는지랑 주변부터 볼게요.' },
        { speaker: 'driver', zh: '旁邊有箱子，也有石頭。可我看不出是哪一個在礙事。', ko: '옆에는 상자도 있고 돌도 있어. 그런데 뭐가 방해하는 건지는 모르겠어.' },
        { speaker: 'boy', zh: '一個一個看就知道了。', ko: '하나씩 보면 알 수 있을 거예요.' }
      ]
    },
    'gate-after-obstacle': {
      id: 'gate-after-obstacle', chapterId: 'chapter-1-three-roads', titleKo: '다시 움직이는 수레',
      background: 'gate', placeZh: '北口外', placeKo: '북쪽 출구 밖',
      beats: [
        { speaker: 'driver', zh: '原來是那塊石頭卡住前輪。難怪一直推不動。', ko: '앞바퀴를 막은 게 그 돌이었구나. 어쩐지 아무리 밀어도 안 되더라.' },
        { speaker: 'narrator', zh: '障礙移開後，貨車慢慢往前走了。', ko: '장애물을 치우자 수레가 천천히 다시 움직이기 시작했다.' },
        { speaker: 'narrator', zh: '可是沒走多遠，貨車又停在一扇狹窄的門前。', ko: '하지만 얼마 가지 않아 수레는 좁은 문 앞에서 다시 멈췄다.' },
        { speaker: 'driver', zh: '這扇門往裡開。車停得太近，好像打不開。', ko: '이 문은 안쪽으로 열려. 수레가 너무 가까이 있어서 문을 못 열겠는데.' },
        { speaker: 'boy', zh: '那就先看看，車要怎麼移動。', ko: '그럼 이번엔 수레를 어떻게 움직여야 할지 봐야겠네요.' }
      ]
    }
  };
  const JOURNEY = [
    { id: 'prologue', titleKo: '프롤로그 · 고향 마을', tag: '튜토리얼', sections: [
      { id: 'origin', nextSectionId: 'shared-intro', sequence: [
        { type: 'story', id: 'prologue-departure', requires: [] },
        ...Array.from({ length: 6 }, (_, i) => ({ type: 'stage', id: `stage-${i}`, requires: i ? [`stage:stage-${i - 1}`] : [] })),
        { type: 'story', id: 'prologue-forest-edge', requires: ['stage:stage-5'] }
      ] }
    ] },
    { id: 'chapter-1-three-roads', titleKo: '1장 · 세 갈래 길', sections: [
      { id: 'shared-intro', sequence: [
        { type: 'story', id: 'chapter1-roadside-merchant', requires: ['story:prologue-forest-edge'] }
      ] },
      { id: 'gate-town', regionId: 'gate-town', plannedStageCount: 7, sequence: [
        { type: 'story', id: 'gate-arrival', requires: ['story:chapter1-roadside-merchant'] },
        { type: 'stage', id: 'gate-stage-1', requires: ['story:gate-arrival'] },
        { type: 'story', id: 'gate-after-entry', requires: ['stage:gate-stage-1'], returnToWorldAfter: true },
        { type: 'story', id: 'gate-bell-task', requires: ['story:gate-after-entry'] },
        { type: 'stage', id: 'gate-stage-2', requires: ['story:gate-bell-task'] },
        { type: 'story', id: 'gate-after-bell', requires: ['stage:gate-stage-2'], returnToWorldAfter: true },
        { type: 'story', id: 'gate-route-task', requires: ['story:gate-after-bell'] },
        { type: 'stage', id: 'gate-stage-3', requires: ['story:gate-route-task'] },
        { type: 'story', id: 'gate-after-route', requires: ['stage:gate-stage-3'], returnToWorldAfter: true },
        { type: 'story', id: 'gate-cart-task', requires: ['story:gate-after-route'] },
        { type: 'stage', id: 'gate-stage-4', requires: ['story:gate-cart-task'] },
        { type: 'story', id: 'gate-after-obstacle', requires: ['stage:gate-stage-4'], returnToWorldAfter: true }
      ] },
      ...['workshop-town', 'market-town'].map(regionId => ({ id: regionId, regionId, plannedStageCount: 7, sequence: [] }))
    ] }
  ];
  globalThis.JourneyContent = Object.freeze({ STORIES, JOURNEY,
    tier1CoreMilestones: ['gate-core', 'workshop-core', 'market-core'] });
})();
