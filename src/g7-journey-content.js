/* G7 story extension. Loaded before JourneyProgress so the finale is part of the normal journey graph. */
(() => {
  const J = globalThis.JourneyContent;
  if (!J?.STORIES || !Array.isArray(J.JOURNEY)) return;

  J.STORIES['gate-convoy-task'] ||= {
    id: 'gate-convoy-task', chapterId: 'chapter-1-three-roads', titleKo: '첫 행렬이 출발한다',
    background: 'gate', placeZh: '車隊集合處', placeKo: '수레 집결지',
    beats: [
      { speaker: 'narrator', zh: '傍晚的鐘聲響了。車隊集合處還在鐘聲的範圍內，兩輛貨車和車夫已經在少年身後排好了隊。', ko: '저녁 종이 울렸다. 수레 집결지는 아직 종소리가 닿는 범위 안이었고, 수레 두 대와 수레꾼들이 소년 뒤에 줄을 맞춰 서 있었다.' },
      { speaker: 'gatekeeper', zh: '天快黑了，不過別急。把路看清楚比較重要。', ko: '곧 어두워지겠지만 서두르진 마. 길을 제대로 보는 게 더 중요해.' },
      { speaker: 'gatekeeper', zh: '車夫會照著你的指示走。選一條路線，經由一個哨站，在前面帶整支車隊到北路吧。', ko: '수레꾼들은 네 안내를 따라갈 거야. 경로 하나를 골라 초소 한 곳을 거친 다음, 행렬을 이끌고 북쪽 길까지 가 줘.' },
      { speaker: 'boy', zh: '好。這次我走在最前面。', ko: '좋아요. 이번엔 제가 맨 앞에 설게요.' }
    ]
  };

  J.STORIES['gate-after-convoy'] ||= {
    id: 'gate-after-convoy', chapterId: 'chapter-1-three-roads', titleKo: '북쪽 길에 닿은 행렬',
    background: 'gate', placeZh: '北路', placeKo: '북쪽 길',
    beats: [
      { speaker: 'narrator', zh: '少年走在車隊前方，帶著兩輛貨車經由哨站，平安抵達了北路。', ko: '소년은 행렬 앞에 서서 수레 두 대를 이끌고 초소를 거쳐 북쪽 길에 무사히 도착했다.' },
      { speaker: 'gatekeeper', zh: '很好。從看一塊路標開始，你現在已經能為整支車隊帶路了。', ko: '잘했어. 길표지 하나를 살피는 일부터 시작했는데, 이제는 수레 행렬 전체를 이끌 수 있게 됐구나.' },
      { speaker: 'driver', zh: '有你走在前面，這趟路走得安心多了。', ko: '네가 앞에서 안내해 주니 이번 길은 훨씬 마음이 놓였어.' },
      { speaker: 'narrator', zh: '少年回頭時，關口旁那塊舊路標上的字，像在暮色裡亮了一瞬。', ko: '소년이 뒤를 돌아보자 관문 옆 오래된 길표지의 글자가 저녁빛 속에서 잠깐 빛난 듯했다.' },
      { speaker: 'boy', zh: '又是那個光……', ko: '또 그 빛이야……' },
      { speaker: 'gatekeeper', zh: '往北再走下去，就是前往邊境村的方向。等你想再走遠一些，可以去看看。', ko: '여기서 더 북쪽으로 가면 끝마을 방면이야. 더 먼 곳으로 떠나고 싶을 때 가 보렴.' }
    ]
  };

  const gate = J.JOURNEY.flatMap(chapter => chapter.sections).find(section => section.id === 'gate-town');
  if (!gate || gate.sequence.some(node => node.id === 'gate-stage-7')) return;
  gate.sequence.push(
    { type: 'story', id: 'gate-convoy-task', requires: ['story:gate-after-leading'] },
    { type: 'stage', id: 'gate-stage-7', requires: ['story:gate-convoy-task'] },
    { type: 'story', id: 'gate-after-convoy', requires: ['stage:gate-stage-7'], returnToWorldAfter: true }
  );
})();
