/* C08: the innkeeper's first direct request, using the existing northern forest on the world map. */
(() => {
  if (typeof STAGES === 'undefined' || !globalThis.JourneyContent?.STORIES || !Array.isArray(globalThis.JourneyContent?.JOURNEY)) return;

  const STAGE_ID = 'first-free-quest-forest';
  if (!STAGES.some(stage => stage.id === STAGE_ID)) {
    STAGES.push({
      id: STAGE_ID,
      title: '範圍・數量・足夠',
      subtitle: '북쪽 숲의 버섯',
      kicker: '자유 의뢰 · 북쪽 숲',
      grid: [
        '#######',
        '#A...C#',
        '#.....#',
        '#..B..#',
        '#.....#',
        '#..S..#',
        '###E###'
      ],
      goal: '在指定範圍內找月白菇，確認數量足夠，再退出森林。',
      rule: '버섯이 있는 곳에 가까이 가서 종류와 數量을 확인해. 月白菇 세 개면 足夠해.',
      words: ['範圍', '數量', '不足', '足夠', '獲得', '退出'],
      wordContext: {
        '範圍': {
          ex: '淺色標出的地方是這次採集的範圍。',
          rule: '연하게 표시된 채집 구역이 이번 판의 範圍야. 그 안에서 버섯 자리를 찾아봐.'
        },
        '數量': {
          ex: '先看看每處蘑菇的種類和數量。',
          rule: '버섯을 살펴보면 몇 개인지 확인할 수 있어. 종류와 數量을 함께 봐야 해.'
        },
        '不足': {
          ex: '月白菇不到三個，數量還不足。',
          rule: '목표인 月白菇가 세 개보다 적으면 不足이야. 다른 종류 버섯은 목표 수량에 포함되지 않아.'
        },
        '足夠': {
          ex: '月白菇有三個就足夠了。',
          rule: '月白菇가 세 개가 되면 足夠해. 더 많이 모을 필요는 없어.'
        },
        '獲得': {
          ex: '收下確認過的月白菇，持有的數量就增加了。',
          rule: '확인한 月白菇를 챙기면 실제 보유 수량이 늘어나.'
        },
        '退出': {
          ex: '收集好月白菇後，回到入口退出森林。',
          rule: '필요한 버섯을 모은 뒤 입구로 돌아와 숲 밖으로 나오면 退出이야.'
        }
      },
      win: ['forest_collected', 'at_exit'],
      forestQuest: {
        required: 3,
        targetNameZh: '月白菇',
        targetNameKo: '월백버섯',
        range: { rowMin: 1, rowMax: 4, colMin: 1, colMax: 5 },
        patches: {
          A: { id: 'a', nameZh: '月白菇', nameKo: '월백버섯', quantity: 2, target: true },
          B: { id: 'b', nameZh: '灰帽菇', nameKo: '회색갓버섯', quantity: 1, target: false },
          C: { id: 'c', nameZh: '月白菇', nameKo: '월백버섯', quantity: 1, target: true }
        }
      },
      contextActions: [
        { target: 'A', label: '버섯 살펴보기', action: 'forest-inspect-a', unless: 'forestPatchAObserved', priority: 10 },
        { target: 'A', label: '월백버섯 챙기기', action: 'forest-collect-a', requires: 'forestPatchAObserved', unless: 'forestPatchACollected', priority: 10 },
        { target: 'B', label: '버섯 살펴보기', action: 'forest-inspect-b', unless: 'forestPatchBObserved', priority: 10 },
        { target: 'C', label: '버섯 살펴보기', action: 'forest-inspect-c', unless: 'forestPatchCObserved', priority: 10 },
        { target: 'C', label: '월백버섯 챙기기', action: 'forest-collect-c', requires: 'forestPatchCObserved', unless: 'forestPatchCCollected', priority: 10 }
      ],
      story: '필요한 월백버섯을 세 개 찾았다. 이제 여관으로 가져가면 된다.'
    });
  }

  const stories = globalThis.JourneyContent.STORIES;
  Object.assign(stories, {
    'first-free-quest-accepted': {
      id: 'first-free-quest-accepted',
      chapterId: 'chapter-1-three-roads',
      titleKo: '북쪽 숲으로',
      background: 'inn', placeZh: '客棧', placeKo: '여관 1층',
      beats: [
        { speaker: 'innkeeper', zh: '可以幫我到北邊森林外圍找三個月白菇嗎？', ko: '북쪽 숲 바깥쪽에서 월백버섯 세 개를 찾아줄래?' },
        { speaker: 'boy', zh: '北邊森林嗎？我來三溪鎮的時候走過那裡。', ko: '북쪽 숲이요? 물길마을에 올 때 그쪽을 지나오긴 했어요.' },
        { speaker: 'boy', zh: '不過那時只是沿著路走，森林裡其他地方我就不熟了。', ko: '하지만 그때는 길만 따라와서 숲의 다른 곳들은 잘 몰라요.' },
        { speaker: 'innkeeper', zh: '不用走遠，也不用往深處去。靠近鎮子的森林外圍也找得到。', ko: '멀리 가거나 깊이 들어갈 필요는 없어. 마을 가까운 숲 바깥쪽에서도 찾을 수 있어.' },
        { speaker: 'innkeeper', zh: '先看清楚種類和數量。找到三個月白菇就回來。', ko: '종류와 수량을 잘 확인해. 월백버섯 세 개를 찾으면 돌아오면 돼.' },
        { speaker: 'boy', zh: '好。找到三個我就回來。', ko: '네. 세 개 찾으면 바로 돌아올게요.' }
      ]
    },
    'first-free-quest-report': {
      id: 'first-free-quest-report',
      chapterId: 'chapter-1-three-roads',
      titleKo: '버섯을 가져오다',
      background: 'inn', placeZh: '客棧', placeKo: '여관 1층',
      beats: [
        { speaker: 'innkeeper', zh: '回來了？找到了嗎？', ko: '돌아왔네. 찾았어?' },
        { speaker: 'boy', zh: '找到了。月白菇三個。', ko: '찾았어요. 월백버섯 세 개요.' },
        { speaker: 'innkeeper', zh: '正好夠。謝啦，晚點可以煮湯了。', ko: '딱 충분하네. 고마워. 이따 수프를 끓일 수 있겠어.' },
        { speaker: 'boy', zh: '明明是來時走過的森林，離開原來那條路一點，看到的東西就不一樣了。', ko: '분명 올 때 지나온 숲인데, 원래 길에서 조금만 벗어나도 보이는 게 달라지네요.' }
      ]
    },
    'quest-board-installed': {
      id: 'quest-board-installed',
      chapterId: 'chapter-1-three-roads',
      titleKo: '부탁을 적어 두는 곳',
      background: 'inn', placeZh: '客棧', placeKo: '여관 1층',
      beats: [
        { speaker: 'innkeeper', zh: '以後可能還會有這種小事。', ko: '앞으로도 가끔 이런 부탁이 생길 것 같네.' },
        { speaker: 'innkeeper', zh: '我不在櫃檯的時候，就把要做的事寫在這塊板上吧。', ko: '내가 카운터에 없을 때도 볼 수 있게, 할 일을 이 판에 적어둘게.' },
        { speaker: 'narrator', zh: '老闆在牆邊掛上一塊小木板，先把剛才的採菇委託留在上面。', ko: '여관 주인은 벽 한쪽에 작은 나무판을 걸고, 방금 마친 버섯 부탁을 첫 기록으로 남겨 두었다.' },
        { speaker: 'innkeeper', zh: '現在沒有別的事。下次有新的，我就寫在這裡。', ko: '지금은 다른 부탁은 없어. 새로 생기면 여기에 적어둘게.' }
      ]
    }
  });

  const chapter = globalThis.JourneyContent.JOURNEY.find(item => item.id === 'chapter-1-three-roads');
  if (!chapter) return;

  const addSection = section => {
    if (!chapter.sections.some(item => item.id === section.id)) chapter.sections.push(section);
  };

  addSection({
    id: 'first-free-quest-offer',
    regionId: 'inn-first-quest',
    hiddenFromJourney: true,
    sequence: [{
      type: 'story', id: 'first-free-quest-accepted',
      requires: ['story:chapter1-room-finale'],
      returnToWorldAfter: true
    }]
  });

  addSection({
    id: 'first-free-quest-forest',
    regionId: 'north-forest',
    hiddenFromJourney: true,
    sequence: [{
      type: 'stage', id: STAGE_ID,
      requires: ['story:first-free-quest-accepted'],
      returnToWorldAfter: true
    }]
  });

  addSection({
    id: 'first-free-quest-report',
    regionId: 'inn-first-quest-report',
    hiddenFromJourney: true,
    sequence: [
      {
        type: 'story', id: 'first-free-quest-report',
        requires: ['stage:first-free-quest-forest'],
        milestone: 'first-free-quest-completed'
      },
      {
        type: 'story', id: 'quest-board-installed',
        requires: ['story:first-free-quest-report'],
        milestone: 'quest-board-unlocked',
        returnToWorldAfter: true
      }
    ]
  });

  globalThis.FirstFreeQuestContent = Object.freeze({
    STAGE_ID,
    OFFER_STORY_ID: 'first-free-quest-accepted',
    REPORT_STORY_ID: 'first-free-quest-report',
    BOARD_STORY_ID: 'quest-board-installed',
    COMPLETE_MILESTONE: 'first-free-quest-completed',
    BOARD_MILESTONE: 'quest-board-unlocked'
  });
})();
