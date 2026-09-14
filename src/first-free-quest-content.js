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
        { speaker: 'boy', zh: '我也不太熟北邊那片森林……不過我可以去看看。', ko: '저도 북쪽 숲을 잘 아는 건 아닌데요…… 그래도 가서 찾아볼게요.' },
        { speaker: 'innkeeper', zh: '不用走太深。就在森林外圍找找看，月白菇三個就夠了。', ko: '깊이 들어갈 필요는 없어. 숲 바깥쪽을 찾아봐. 월백버섯 세 개면 충분해.' },
        { speaker: 'innkeeper', zh: '先看看種類和數量。夠了就回來，別為了多摘幾個往裡走。', ko: '종류랑 수량부터 잘 봐. 충분하면 돌아와. 더 따겠다고 안쪽까지 들어가지는 말고.' },
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
        { speaker: 'boy', zh: '原來北邊森林離這裡也沒有很遠。', ko: '북쪽 숲도 여기서 그렇게 멀지는 않네요.' }
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
