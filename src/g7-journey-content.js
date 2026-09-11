/* G7 story extension. Loaded before JourneyProgress so the finale is part of the normal journey graph. */
(() => {
  const J = globalThis.JourneyContent;
  if (!J?.STORIES || !Array.isArray(J.JOURNEY)) return;

  J.STORIES['gate-convoy-task'] ||= {
    id: 'gate-convoy-task', chapterId: 'chapter-1-three-roads', titleKo: '첫 행렬이 출발한다',
    background: 'gate', placeZh: '待車場', placeKo: '수레 대기장',
    beats: [
      { speaker: 'narrator', zh: '傍晚的鐘聲響了。待車場還在鐘聲能傳到的範圍內，兩輛貨車已經排在少年身後。', ko: '저녁 종이 울렸다. 대기장은 아직 종소리가 닿는 범위 안이었고, 수레 두 대가 소년 뒤에 줄을 맞춰 서 있었다.' },
      { speaker: 'gatekeeper', zh: '天快黑了，不過別急。把路看清楚比較重要。', ko: '곧 어두워지겠지만 서두르진 마. 길을 제대로 보는 게 더 중요해.' },
      { speaker: 'gatekeeper', zh: '西路和東路都能到北邊。選一條路線，經由一個哨站，把整隊帶過去。', ko: '서쪽 길과 동쪽 길 모두 북쪽으로 이어져. 경로 하나를 골라 초소 한 곳을 거쳐 행렬 전체를 데려가 줘.' },
      { speaker: 'boy', zh: '好。這次我走在最前面。', ko: '좋아요. 이번엔 제가 맨 앞에 설게요.' }
    ]
  };

  J.STORIES['gate-after-convoy'] ||= {
    id: 'gate-after-convoy', chapterId: 'chapter-1-three-roads', titleKo: '북쪽 길에 선 행렬',
    background: 'gate', placeZh: '北路', placeKo: '북쪽 길',
    beats: [
      { speaker: 'narrator', zh: '少年帶著兩輛貨車經過哨站，整隊一起到了北路。', ko: '소년은 수레 두 대를 이끌고 초소를 거쳐 행렬 전체와 함께 북쪽 길에 도착했다.' },
      { speaker: 'gatekeeper', zh: '很好。從看一塊路標開始，你現在已經能帶著別人的車一起走了。', ko: '잘했어. 길표지 하나를 보는 일부터 시작했는데, 이제는 다른 사람의 수레까지 함께 데리고 갈 수 있게 됐네.' },
      { speaker: 'driver', zh: '有你走在前面，這趟路安心多了。', ko: '네가 앞에서 가주니까 이번 길은 훨씬 마음이 놓였어.' },
      { speaker: 'narrator', zh: '少年回頭時，關口旁那塊舊路標上的字，像在暮色裡亮了一瞬。', ko: '소년이 뒤를 돌아보자 관문 옆 오래된 길표지의 글자가 저녁빛 속에서 잠깐 빛난 듯했다.' },
      { speaker: 'boy', zh: '又是那個光……', ko: '또 그 빛이야……' },
      { speaker: 'gatekeeper', zh: '北邊再走下去，就是往邊境村的方向。等你想走遠一點時，可以去看看。', ko: '북쪽으로 더 가면 끝마을 방면이야. 좀 더 멀리 가보고 싶어질 때 한번 가봐.' }
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
