(() => {
  const $ = id => document.getElementById(id);
  let filter = 'all';
  const make = (tag, className, text) => {
    const el = document.createElement(tag); el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function render() {
    const progress = GameFlow.progress(), root = $('journeyList'); root.replaceChildren();
    const allNodes = JourneyProgress.nodes();
    const recommended = JourneyProgress.recommendedNode(progress);
    $('journeyContinue').textContent = recommended ? '이어서 여행하기' : '월드맵으로';
    $('journeySummary').textContent = `스테이지 ${allNodes.filter(n => n.type === 'stage' && JourneyProgress.isComplete(n, progress)).length}/6 · 이야기 ${Object.keys(JourneyContent.STORIES).filter(id => progress.seenStories.includes(id)).length}/${Object.keys(JourneyContent.STORIES).length}`;
    document.querySelectorAll('[data-journey-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.journeyFilter === filter));
    });
    for (const chapter of JourneyContent.JOURNEY) {
      const article = make('section', 'journeyChapter');
      article.append(make('h2', '', chapter.titleKo));
      for (const section of chapter.sections) {
        if (section.regionId) {
          const region = WORLD.regions.find(r => r.id === section.regionId);
          const placeholder = make('div', 'journeyRegion');
          placeholder.append(make('strong', '', region.nameKo), make('p', '', `의뢰 준비 중 · 스테이지 ${section.plannedStageCount}판 기획`));
          article.append(placeholder); continue;
        }
        const list = make('ol', 'journeyTimeline');
        for (const node of section.sequence) {
          if (filter !== 'all' && filter !== node.type) continue;
          const done = JourneyProgress.isComplete(node, progress), open = JourneyProgress.isAvailable(node, progress);
          const id = JourneyProgress.nodeId(node);
          const content = node.type === 'story' ? JourneyContent.STORIES[node.id] : STAGES.find(s => s.id === node.id);
          const title = node.type === 'story' ? content.titleKo : `${content.title} · ${content.subtitle}`;
          const button = make('button', 'journeyNode');
          button.type = 'button'; button.disabled = !open; button.dataset.nodeId = id;
          button.dataset.state = done ? 'complete' : open ? 'available' : 'locked';
          button.append(make('span', 'journeyType', node.type === 'story' ? '이야기' : '스테이지'),
            make('strong', 'journeyNodeTitle', open ? title : '???'),
            make('span', 'journeyNodeState', done ? '완료 · 다시 보기' : open ? (node.type === 'stage' ? '열림 · 연습하기' : '새 이야기') : '아직 잠김'));
          if (done && node.type === 'stage') button.lastChild.textContent = '완료 · 다시 플레이';
          button.onclick = () => node.type === 'stage' ? GameFlow.playStage(node.id, { mode: 'replay', returnTo: 'journey' }) :
            GameFlow.playStory(node.id, { mode: done ? 'replay' : 'first-play', returnTo: 'journey' });
          const item = make('li', ''); item.append(button); list.append(item);
        }
        if (list.children.length) article.append(list);
      }
      root.append(article);
    }
  }
  document.querySelectorAll('[data-journey-filter]').forEach(button => {
    button.onclick = () => { filter = button.dataset.journeyFilter; render(); };
  });
  $('journeyContinue').onclick = () => GameFlow.resume();
  globalThis.JourneyRuntime = Object.freeze({ render });
})();
