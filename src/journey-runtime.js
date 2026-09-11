(() => {
  const $ = id => document.getElementById(id);
  let filter = 'all';
  const make = (tag, className, text) => {
    const el = document.createElement(tag); el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function ensureActions() {
    const continueButton = $('journeyContinue');
    let actions = $('journeyActions');
    if (!actions) {
      actions = make('div', 'journeyActions'); actions.id = 'journeyActions';
      continueButton.before(actions); actions.append(continueButton);
    }
    let reset = $('journeyReset');
    if (!reset) {
      reset = make('button', 'journeyReset', '여정 초기화');
      reset.id = 'journeyReset'; reset.type = 'button'; reset.onclick = () => GameFlow.resetJourney();
    }
    if (reset.parentElement !== actions) actions.append(reset);
  }
  function chapterDisplay(chapter) {
    if (chapter.id === 'prologue') {
      return {
        title: `프롤로그 · ${WORLD.originNameKo || '작은 마을'}`,
        meta: `${WORLD.origin || '小村'} · 튜토리얼`
      };
    }
    if (chapter.id === 'chapter-1-three-roads') {
      const settlement = WORLD.settlement || {};
      return {
        title: `1장 · ${settlement.nameKo || WORLD.title || '물길마을'}`,
        meta: `${settlement.name || '三溪鎮'} · 세 갈래 길`
      };
    }
    return { title: chapter.titleKo, meta: chapter.tag || '' };
  }
  function appendTimeline(article, section, progress) {
    const list = make('ol', 'journeyTimeline');
    for (const node of section.sequence) {
      if (filter !== 'all' && filter !== node.type) continue;
      const done = JourneyProgress.isComplete(node, progress), open = JourneyProgress.isAvailable(node, progress);
      const id = JourneyProgress.nodeId(node);
      const content = node.type === 'story' ? JourneyContent.STORIES[node.id] : STAGES.find(s => s.id === node.id);
      if (!content) continue;
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
  function render() {
    ensureActions();
    const progress = GameFlow.progress(), root = $('journeyList'); root.replaceChildren();
    const allNodes = JourneyProgress.nodes();
    const implementedStages = allNodes.filter(n => n.type === 'stage');
    const recommended = JourneyProgress.recommendedNode(progress);
    $('journeyContinue').textContent = recommended ? '이어서 여행하기' : '월드맵으로';
    $('journeySummary').textContent = `스테이지 ${implementedStages.filter(n => JourneyProgress.isComplete(n, progress)).length}/${implementedStages.length} · 이야기 ${Object.keys(JourneyContent.STORIES).filter(id => progress.seenStories.includes(id)).length}/${Object.keys(JourneyContent.STORIES).length}`;
    document.querySelectorAll('[data-journey-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.journeyFilter === filter));
    });
    for (const chapter of JourneyContent.JOURNEY) {
      const article = make('section', 'journeyChapter');
      const display = chapterDisplay(chapter);
      article.append(make('h2', '', display.title));
      if (display.meta) article.append(make('p', 'journeyChapterMeta', display.meta));
      for (const section of chapter.sections) {
        if (section.regionId) {
          const region = WORLD.regions.find(r => r.id === section.regionId);
          const stageNodes = section.sequence.filter(node => node.type === 'stage');
          const storyNodes = section.sequence.filter(node => node.type === 'story');
          const regionBox = make('div', 'journeyRegion');
          const regionHead = make('div', 'journeyRegionHead');
          regionHead.append(make('strong', 'journeyRegionKo', region.nameKo));
          if (region.name) regionHead.append(make('span', 'journeyRegionZh', region.name));
          regionBox.append(regionHead);
          if (!section.sequence.length) {
            regionBox.append(make('p', '', `의뢰 준비 중 · 스테이지 ${section.plannedStageCount}판 기획`));
            article.append(regionBox); continue;
          }
          const doneStages = stageNodes.filter(node => JourneyProgress.isComplete(node, progress)).length;
          const doneStories = storyNodes.filter(node => JourneyProgress.isComplete(node, progress)).length;
          regionBox.append(make('p', '', `스테이지 ${doneStages}/${section.plannedStageCount} · 이야기 ${doneStories}/${storyNodes.length}`));
          article.append(regionBox);
        }
        appendTimeline(article, section, progress);
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