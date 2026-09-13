/* Gate-town reward story layer. The signpost badge is earned in-world only after the G7 epilogue is actually seen. */
(() => {
  const previous = globalThis.StoryOutcomeContent;
  if (!previous) return;

  const rewardBeats = [
    { speaker: 'gatekeeper', zh: '這個給你。貨車引路牌。以後要帶貨車走北路，拿這塊牌就行。', ko: '이건 네가 가져. 짐수레 길잡이패야. 앞으로 수레를 이끌고 북쪽 길을 갈 일이 있으면 이 패를 보여주면 돼.' },
    { speaker: 'narrator', zh: '守門人把一塊刻著小小路標記號的木牌交給少年。', ko: '길지기는 작은 길표지 모양이 새겨진 나무패를 소년에게 건넸다.' },
    { speaker: 'boy', zh: '貨車引路牌……我收下了。', ko: '짐수레 길잡이패……잘 간직할게요.' }
  ];

  function addReward(beats = []) {
    if (beats.some(beat => beat.zh?.includes('貨車引路牌'))) return beats;
    const anchor = beats.findIndex(beat => beat.speaker === 'driver' && beat.zh?.includes('安心多了'));
    const insertAt = anchor >= 0 ? anchor + 1 : Math.min(3, beats.length);
    return [...beats.slice(0, insertAt), ...rewardBeats, ...beats.slice(insertAt)];
  }

  function resolve(story, progress) {
    const base = previous.resolve(story, progress);
    if (story?.id !== 'gate-after-convoy') return base;
    return { ...base, beats: addReward(base?.beats || []) };
  }

  globalThis.StoryOutcomeContent = Object.freeze({ ...previous, resolve, gateRewardBeats: rewardBeats });
})();
