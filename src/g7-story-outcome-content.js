/* G7 finale story variants keyed by the first-play route outcome saved for gate-stage-7. */
(() => {
  const previous = globalThis.StoryOutcomeContent;
  if (!previous) return;

  const tail = [
    { speaker: 'gatekeeper', zh: '很好。從看一塊路標開始，你現在已經能帶著別人的車一起走了。', ko: '잘했어. 길표지 하나를 보는 일부터 시작했는데, 이제는 다른 사람의 수레까지 함께 데리고 갈 수 있게 됐네.' },
    { speaker: 'driver', zh: '有你走在前面，這趟路安心多了。', ko: '네가 앞에서 가주니까 이번 길은 훨씬 마음이 놓였어.' },
    { speaker: 'narrator', zh: '少年回頭時，關口旁那塊舊路標上的字，像在暮色裡亮了一瞬。', ko: '소년이 뒤를 돌아보자 관문 옆 오래된 길표지의 글자가 저녁빛 속에서 잠깐 빛난 듯했다.' },
    { speaker: 'boy', zh: '又是那個光……', ko: '또 그 빛이야……' },
    { speaker: 'gatekeeper', zh: '北邊再走下去，就是往邊境村的方向。等你想走遠一點時，可以去看看。', ko: '북쪽으로 더 가면 끝마을 방면이야. 좀 더 멀리 가보고 싶어질 때 한번 가봐.' }
  ];

  const variants = {
    'west-post': [
      { speaker: 'narrator', zh: '少年帶著兩輛貨車走西路，經由西哨站後，整隊一起到了北路。', ko: '소년은 수레 두 대를 이끌고 서쪽 길로 가서 서쪽 초소를 경유한 뒤 행렬 전체와 함께 북쪽 길에 도착했다.' },
      { speaker: 'gatekeeper', zh: '這次還是走西路啊。你已經很熟這條路了。', ko: '이번에도 서쪽 길로 왔구나. 이제 이 길은 꽤 익숙하겠어.' },
      ...tail
    ],
    'east-post': [
      { speaker: 'narrator', zh: '少年帶著兩輛貨車走東路，經由東哨站後，整隊一起到了北路。', ko: '소년은 수레 두 대를 이끌고 동쪽 길로 가서 동쪽 초소를 경유한 뒤 행렬 전체와 함께 북쪽 길에 도착했다.' },
      { speaker: 'gatekeeper', zh: '東路也帶得很穩。兩條路你都知道怎麼看了。', ko: '동쪽 길도 안정적으로 데려왔네. 이제 어느 길이든 어떻게 봐야 하는지 아는군.' },
      ...tail
    ],
    'east-post+west-post': [
      { speaker: 'narrator', zh: '少年繞過兩個哨站，最後還是把兩輛貨車一起帶到了北路。', ko: '소년은 두 초소를 모두 거쳐 돌아간 끝에 수레 두 대를 함께 북쪽 길까지 데려왔다.' },
      { speaker: 'gatekeeper', zh: '兩邊都走了一遍？只要整隊平安到就好。', ko: '양쪽을 다 돌아봤어? 그래도 행렬 전체가 무사히 왔으면 됐지.' },
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
