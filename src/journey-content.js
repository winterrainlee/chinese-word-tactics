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
      ...['gate-town', 'workshop-town', 'market-town'].map(regionId => ({ id: regionId, regionId, plannedStageCount: 7, sequence: [] }))
    ] }
  ];
  globalThis.JourneyContent = Object.freeze({ STORIES, JOURNEY,
    tier1CoreMilestones: ['gate-core', 'workshop-core', 'market-core'] });
})();
