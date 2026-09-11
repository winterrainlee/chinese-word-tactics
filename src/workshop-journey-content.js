/* First workshop story/stage sequence. Mutates the shallow-frozen JourneyContent children before progress helpers read them. */
(() => {
  const stories = JourneyContent.STORIES;
  Object.assign(stories, {
    'workshop-arrival': {
      id: 'workshop-arrival', chapterId: 'chapter-1-three-roads', titleKo: '물소리를 따라 장인골로',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '少年沿著溪流往上走。水聲裡混著木輪轉動和敲打工具的聲音。', ko: '소년은 물길을 따라 위쪽으로 걸었다. 물소리 사이로 나무 바퀴 도는 소리와 공구 두드리는 소리가 섞여 들렸다.' },
        { speaker: 'narrator', zh: '幾間工坊沿著水道排開，一座小水車卻停著不動。', ko: '수로를 따라 작은 공방들이 늘어서 있었지만, 그중 한 물레방아는 멈춘 채 움직이지 않았다.' },
        { speaker: 'artisan', zh: '先別急著修。看看動了這個，哪裡會跟著變。', ko: '서둘러 고치지 마. 이걸 움직였을 때 어디가 같이 변하는지 먼저 봐.' },
        { speaker: 'artisan', zh: '左邊的水門太低了。右邊現在剛剛好，不用動。', ko: '왼쪽 수문은 너무 낮아. 오른쪽은 지금 딱 맞으니 건드릴 필요 없어.' },
        { speaker: 'artisan', zh: '只改需要改的地方。右邊保持原樣。', ko: '필요한 곳만 바꿔. 오른쪽은 그대로 유지하면 돼.' },
        { speaker: 'boy', zh: '好。我先看看現在的狀態。', ko: '좋아요. 먼저 지금 상태부터 볼게요.' }
      ]
    },
    'workshop-after-w1': {
      id: 'workshop-after-w1', chapterId: 'chapter-1-three-roads', titleKo: '손대지 않는 것도 기술',
      background: 'workshop', placeZh: '工坊谷', placeKo: '장인골',
      beats: [
        { speaker: 'narrator', zh: '左邊的水量一變，水車慢慢轉了起來。右邊的水門從頭到尾都沒有動。', ko: '왼쪽 물의 양이 달라지자 물레방아가 천천히 돌기 시작했다. 오른쪽 수문은 처음부터 끝까지 그대로였다.' },
        { speaker: 'artisan', zh: '嗯，這樣就對了。要改的地方改了，不該動的地方保持原樣。', ko: '그래, 그거야. 바꿀 곳은 바꾸고, 건드리지 않을 곳은 그대로 뒀네.' },
        { speaker: 'artisan', zh: '手動得快不重要。先看清楚哪裡不該動，才重要。', ko: '손이 빠른 건 중요하지 않아. 먼저 어디를 건드리지 말아야 하는지 보는 게 중요하지.' },
        { speaker: 'boy', zh: '原來修東西，不是每個地方都要動。', ko: '고친다고 해서 모든 곳을 움직여야 하는 건 아니구나.' },
        { speaker: 'artisan', zh: '工坊裡還有幾處怪怪的。你願意的話，等等再來幫我看看。', ko: '공방 안에 이상한 곳이 몇 군데 더 있어. 괜찮다면 나중에 다시 와서 좀 봐 줘.' }
      ]
    }
  });

  const section = JourneyContent.JOURNEY
    .flatMap(chapter => chapter.sections)
    .find(item => item.id === 'workshop-town');
  if (!section) return;
  section.sequence.splice(0, section.sequence.length,
    { type: 'story', id: 'workshop-arrival', requires: ['story:chapter1-roadside-merchant'] },
    { type: 'stage', id: 'workshop-stage-1', requires: ['story:workshop-arrival'] },
    { type: 'story', id: 'workshop-after-w1', requires: ['stage:workshop-stage-1'], returnToWorldAfter: true }
  );
})();