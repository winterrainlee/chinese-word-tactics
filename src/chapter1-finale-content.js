/* C06: three-route convergence and Chapter 1 ending. Loaded after continuous-region-flow.js. */
(() => {
  const stories = globalThis.JourneyContent?.STORIES;
  const journey = globalThis.JourneyContent?.JOURNEY;
  if (!stories || !Array.isArray(journey)) return;

  Object.assign(stories, {
    'chapter1-inn-convergence': {
      id: 'chapter1-inn-convergence',
      chapterId: 'chapter-1-three-roads',
      titleKo: '돌아와서 할 이야기',
      background: 'inn', placeZh: '客棧', placeKo: '여관 1층',
      beats: [
        { speaker: 'innkeeper', zh: '回來了。這次又去了哪裡？', ko: '왔네. 이번에는 어디 다녀왔어?' },
        { speaker: 'boy', zh: '北邊的路口、工匠那邊，還有市場……我都去過了。', ko: '북쪽 길목이랑 장인골, 장터까지요. 다 가봤어요.' },
        { speaker: 'innkeeper', zh: '三邊都走過了？', ko: '세 군데를 다?' },
        { speaker: 'boy', zh: '嗯。不知不覺就都走過了。', ko: '네. 어쩌다 보니 다 돌아봤네요.' },
        { speaker: 'innkeeper', zh: '剛來的時候，你連鎮裡的路都不熟。', ko: '처음 왔을 때는 마을 길도 잘 몰랐는데.' },
        { speaker: 'boy', zh: '現在至少不太會迷路了。', ko: '이제 적어도 길을 잃지는 않을 것 같아요.' },
        { speaker: 'innkeeper', zh: '你的東西也多了。放回房裡吧。', ko: '가지고 온 것도 많아졌네. 방에 두고 와.' }
      ]
    },
    'chapter1-room-finale': {
      id: 'chapter1-room-finale',
      chapterId: 'chapter-1-three-roads',
      titleKo: '돌아올 곳',
      background: 'inn', placeZh: '房間', placeKo: '내 방',
      beats: [
        { speaker: 'narrator', zh: '少年把帶回來的東西一一放好。', ko: '소년은 가져온 것들을 하나씩 제자리에 두었다.' },
        { speaker: 'narrator', zh: '通行牌放在箱子上，修繕牌留在桌邊。牆上還掛著貨車引路牌。', ko: '통행패는 상자 위에 두고, 수선패는 책상 곁에 놓았다. 벽에는 짐수레 길잡이패도 걸려 있었다.' },
        { speaker: 'narrator', zh: '房間還是原來的房間，卻不像剛來時那麼空了。', ko: '방은 그대로였지만, 처음 왔을 때만큼 비어 보이지는 않았다.' },
        { speaker: 'boy', zh: '我只是想出去冒險而已。', ko: '난 그냥 모험을 떠나고 싶었을 뿐인데.' },
        { speaker: 'narrator', zh: '一路上，他幫了不少忙，也收下了不少東西。', ko: '길을 걷는 동안 이런저런 일을 도왔고, 이런저런 것들을 받았다.' },
        { speaker: 'boy', zh: '……也有可以回來的地方了。', ko: '……돌아올 곳도 생겼네.' },
        { speaker: 'boy', zh: '接下來，要往哪裡走呢？', ko: '다음엔 어디로 가볼까?' }
      ]
    }
  });

  const chapter = journey.find(item => item.id === 'chapter-1-three-roads');
  if (!chapter || chapter.sections.some(section => section.id === 'chapter1-finale')) return;

  chapter.sections.push({
    id: 'chapter1-finale',
    regionId: 'inn',
    hiddenFromJourney: true,
    sequence: [
      {
        type: 'story', id: 'chapter1-inn-convergence',
        requires: ['story:gate-after-convoy', 'story:workshop-finale', 'story:market-after-m8']
      },
      {
        type: 'story', id: 'chapter1-room-finale',
        requires: ['story:chapter1-inn-convergence'],
        milestone: 'chapter1-complete',
        returnToWorldAfter: true
      }
    ]
  });
})();
