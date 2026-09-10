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
        { type: 'story', id: 'gate-after-entry', requires: ['stage:gate-stage-1'] }
      ] },
      ...['workshop-town', 'market-town'].map(regionId => ({ id: regionId, regionId, plannedStageCount: 7, sequence: [] }))
    ] }
  ];
  globalThis.JourneyContent = Object.freeze({ STORIES, JOURNEY,
    tier1CoreMilestones: ['gate-core', 'workshop-core', 'market-core'] });
})();
