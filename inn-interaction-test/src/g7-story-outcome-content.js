/* G7 finale story variants keyed by the first-play route outcome saved for gate-stage-7. */
(() => {
  const previous = globalThis.StoryOutcomeContent;
  if (!previous) return;

  const tail = [
    { speaker: 'gatekeeper', zh: '很好。從看一塊路標開始，你現在已經能為整支車隊帶路了。', ko: '잘했어. 길표지 하나를 살피는 일부터 시작했는데, 이제는 수레 행렬 전체를 이끌 수 있게 됐구나.' },
    { speaker: 'driver', zh: '有你走在前面，這趟路走得安心多了。', ko: '네가 앞에서 안내해 주니 이번 길은 훨씬 마음이 놓였어.' },
    { speaker: 'narrator', zh: '少年回頭時，關口旁那塊舊路標上的字，像在暮色裡亮了一瞬。', ko: '소년이 뒤를 돌아보자 관문 옆 오래된 길표지의 글자가 저녁빛 속에서 잠깐 빛난 듯했다.' },
    { speaker: 'boy', zh: '又是那個光……', ko: '또 그 빛이야……' },
    { speaker: 'gatekeeper', zh: '往北再走下去，就是前往邊境村的方向。等你想再走遠一些，可以去看看。', ko: '여기서 더 북쪽으로 가면 끝마을 방면이야. 더 먼 곳으로 떠나고 싶을 때 가 보렴.' }
  ];

  const variants = {
    'west-post': [
      { speaker: 'narrator', zh: '少年帶著兩輛貨車走西路，經由西哨站後，整隊一起到了北路。', ko: '소년은 수레 두 대를 이끌고 서쪽 길로 가서 서쪽 초소를 경유한 뒤 행렬 전체와 함께 북쪽 길에 도착했다.' },
      { speaker: 'gatekeeper', zh: '西路走得很穩。看來你已經掌握帶隊的要領了。', ko: '서쪽 길로 안정적으로 이끌고 왔구나. 이제 행렬을 이끄는 요령을 익힌 모양이야.' },
      ...tail
    ],
    'east-post': [
      { speaker: 'narrator', zh: '少年帶著兩輛貨車走東路，經由東哨站後，整隊一起到了北路。', ko: '소년은 수레 두 대를 이끌고 동쪽 길로 가서 동쪽 초소를 경유한 뒤 행렬 전체와 함께 북쪽 길에 도착했다.' },
      { speaker: 'gatekeeper', zh: '東路走得很穩。看來你已經掌握帶隊的要領了。', ko: '동쪽 길로 안정적으로 이끌고 왔구나. 이제 행렬을 이끄는 요령을 익힌 모양이야.' },
      ...tail
    ],
    'east-post+west-post': [
      { speaker: 'narrator', zh: '少年依次經過兩座哨站，最後把兩輛貨車一起帶到了北路。', ko: '소년은 두 초소를 차례로 거친 뒤 수레 두 대를 이끌고 북쪽 길에 도착했다.' },
      { speaker: 'gatekeeper', zh: '兩邊都確認過了？雖然多走了一些路，整支車隊平安到達就好。', ko: '양쪽 길을 모두 확인했구나. 조금 더 돌아왔지만 행렬 전체가 무사히 도착했으니 됐어.' },
      ...tail
    ]
  };

  const keyFor = progress => {
    const ids = progress?.stageOutcomes?.['gate-stage-7']?.viaIds;
    return Array.isArray(ids) ? [...new Set(ids.filter(id => typeof id === 'string'))].sort().join('+') : '';
  };

  function resolve(story, progress) {
    const base = previous.resolve(story, progress);
    if (story?.id !== 'gate-after-convoy') return base;
    const beats = variants[keyFor(progress)];
    return beats ? { ...base, beats } : base;
  }

  globalThis.StoryOutcomeContent = Object.freeze({ ...previous, resolve, g7Variants: variants });
})();
