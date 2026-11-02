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
})();