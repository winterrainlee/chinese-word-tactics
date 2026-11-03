/* One post-Chapter-1 weather event. Three Chapter 2 branches remain independent. */
(() => {
  const stories = globalThis.JourneyContent?.STORIES;
  const journey = globalThis.JourneyContent?.JOURNEY;
  if (!stories || !Array.isArray(journey)) return;
  const STORY_ID = 'chapter2-rain-opening';
  if (!stories[STORY_ID]) stories[STORY_ID] = {
    id: STORY_ID, chapterId: 'chapter-2-after-rain',
    titleKo: '큰비가 내리던 밤', background: 'inn',
    placeZh: '房間', placeKo: '내 방',
    beats: [
      { speaker: 'narrator', zh: '少年把帶回來的東西放好，窗外的雨聲卻越來越大。', ko: '소년이 가져온 물건들을 정리하는 사이, 창밖의 빗소리가 점점 거세졌다.' },
      { speaker: 'boy', zh: '幸好，現在有地方可以躲雨了。', ko: '다행이다. 이제 비를 피할 곳이 있으니까.' },
      { speaker: 'narrator', zh: '雨下了一整夜。到了天亮，雨總算停了。', ko: '비는 밤새 내렸다. 날이 밝고서야 마침내 그쳤다.' },
      { speaker: 'narrator', zh: '少年打開房門，想出去看看。', ko: '소년은 밖이 어떻게 달라졌는지 보려고 방문을 열었다.' }
    ]
  };
  if (!journey.some(chapter => chapter.id === 'chapter-2-after-rain')) journey.push({
    id: 'chapter-2-after-rain', titleKo: '2장 · 비가 지나간 물길마을',
    tag: '三溪鎮 · 큰비가 그친 뒤',
    sections: [{
      id: 'chapter2-rain-intro', revealRequires: ['story:chapter1-room-finale'],
      sequence: [{ type: 'story', id: STORY_ID,
        requires: ['story:chapter1-room-finale'],
        milestone: 'chapter2-rain-passed', returnToWorldAfter: true }]
    }]
  });

  // P1: independent optional first sightings. These are read-only story scenes,
  // not replay of cleared Chapter 1 stages or mandatory Chapter 2 prerequisites.
  const firstSights = {
  "gate-town": {
    "id": "chapter2-gate-first-look",
    "title": "물길을 지나 남은 흔적",
    "background": "gate",
    "placeZh": "關口",
    "placeKo": "길목",
    "beats": [
      {
        "speaker": "narrator",
        "zh": "雨停後，少年又來到關口。原來的路標還在，路邊卻多了泥沙和碎石。",
        "ko": "비가 그친 뒤 소년은 길목으로 돌아왔다. 예전 길표지는 그대로였지만, 길가에는 진흙과 자잘한 돌이 더 쌓여 있었다."
      },
      {
        "speaker": "gatekeeper",
        "zh": "北口外的路還在，不過有些地方需要重新查看。",
        "ko": "북쪽 관문 밖의 길은 그대로 있지만, 몇몇 곳은 다시 살펴봐야 해."
      },
      {
        "speaker": "boy",
        "zh": "我看到了路邊的泥和石頭。可是貨車能不能照常經過，還不能確定。",
        "ko": "길가의 진흙과 돌은 봤어요. 하지만 짐수레가 평소처럼 지나갈 수 있는지는 아직 확실하지 않아요."
      },
      {
        "speaker": "gatekeeper",
        "zh": "對。先記下周圍的變化。通行條件要確認後才能告訴大家。",
        "ko": "그래. 우선 주변에서 달라진 점을 적자. 통행 조건은 확인한 다음에야 사람들에게 알릴 수 있지."
      }
    ]
  },
  "market-town": {
    "id": "chapter2-market-first-look",
    "title": "아직 오지 않은 짐",
    "background": "market",
    "placeZh": "市集",
    "placeKo": "장터",
    "beats": [
      {
        "speaker": "narrator",
        "zh": "雨停了，市集的攤位又熱鬧起來。少年看見商人們正整理貨物。",
        "ko": "비가 그치자 장터의 좌판에도 다시 활기가 돌았다. 소년은 상인들이 물건을 정리하는 모습을 보았다."
      },
      {
        "speaker": "marketkeeper",
        "zh": "上次的貨物已經分配好了，不過新一批貨還沒到。",
        "ko": "지난번 물건은 이미 분배를 끝냈어. 그런데 새로 올 물건이 아직 도착하지 않았네."
      },
      {
        "speaker": "boy",
        "zh": "所以這不是上次分配的問題，而是新貨還在路上？",
        "ko": "그러니까 지난번 분배 문제가 아니라, 새 물건이 아직 오지 않은 거군요?"
      },
      {
        "speaker": "marketkeeper",
        "zh": "新貨還沒到是事實，至於為什麼耽擱了，還得問問送貨的人。",
        "ko": "새 물건이 도착하지 않은 건 사실이야. 하지만 왜 늦는지는 운반하는 사람에게 물어봐야겠어."
      }
    ]
  },
  "workshop-town": {
    "id": "chapter2-workshop-first-look",
    "title": "돌아가는 수차, 남은 점검",
    "background": "workshop",
    "placeZh": "工坊谷",
    "placeKo": "장인골",
    "beats": [
      {
        "speaker": "narrator",
        "zh": "少年走到工坊谷，聽見熟悉的水聲。上次修好的水車還在轉動。",
        "ko": "소년은 장인골에서 익숙한 물소리를 들었다. 지난번 고쳤던 수차는 여전히 돌아가고 있었다."
      },
      {
        "speaker": "artisan",
        "zh": "水車運轉得很好。不過下過這場大雨，水道還是得重新檢查。",
        "ko": "수차는 잘 돌아가고 있어. 하지만 이번 큰비가 지나갔으니 수로는 다시 확인해야 해."
      },
      {
        "speaker": "boy",
        "zh": "水車保持運轉，不代表整條水道都沒有問題。",
        "ko": "수차가 계속 돌아간다고 해서 수로 전체에 아무 문제가 없다는 뜻은 아니군요."
      },
      {
        "speaker": "artisan",
        "zh": "沒錯。我們先把看見的情況記下來，其他地方要等管理人員確認。",
        "ko": "그렇지. 우리가 직접 확인한 내용을 먼저 적자. 다른 곳은 관리자가 확인하기 전까지 판단하지 말고."
      }
    ]
  }
};
  const marketNotice = {"speaker": "marketkeeper", "zh": "過幾天大家要在會議所開會。我也想談談這批還沒到的貨。", "ko": "조만간 회의소에서 다들 모이기로 했어. 나도 아직 안 온 이 짐 얘기를 꺼내려고 해."};
  const pastNotice = {"speaker": "marketkeeper", "zh": "這就是我在會議上說的那批貨。", "ko": "이게 회의에서 말했던 바로 그 짐이야."};
  firstSights['market-town'].beats.push({...marketNotice,councilNotice:true});
  globalThis.CouncilNoticePast = pastNotice;
  const chapter2 = journey.find(chapter => chapter.id === 'chapter-2-after-rain');
  if (chapter2) {
    for (const [regionId, scene] of Object.entries(firstSights)) {
      if (!stories[scene.id]) stories[scene.id] = {
        id: scene.id, chapterId: chapter2.id, titleKo: scene.title,
        background: scene.background, placeZh: scene.placeZh, placeKo: scene.placeKo,
        beats: scene.beats
      };
      if (!chapter2.sections.some(section => section.id === scene.id)) chapter2.sections.push({
        id: scene.id, regionId, revealAfterRain: true,
        sequence: [{
          type: 'story', id: scene.id, optionalFirstLook: true,
          requiresRainPassed: true, returnToWorldAfter: true
        }]
      });
    }
  }
})();