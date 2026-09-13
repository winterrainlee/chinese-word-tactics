(() => {
  const $ = id => document.getElementById(id);
  let filter = 'all';
  const collapsedChapters = new Set();
  const collapsedRegions = new Set();

  const make = (tag, className, text) => {
    const el = document.createElement(tag); el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  function rememberDisclosure(details, key, collapsedSet, forceOpen = false) {
    if (forceOpen) collapsedSet.delete(key);
    details.open = forceOpen || !collapsedSet.has(key);
    details.addEventListener('toggle', () => {
      if (details.open) collapsedSet.delete(key);
      else collapsedSet.add(key);
    });
  }

  function ensureActions() {
    const continueButton = $('journeyContinue');
    const root = $('journeyList');

    const legacyActions = $('journeyActions');
    if (legacyActions) {
      legacyActions.before(continueButton);
      legacyActions.remove();
    }

    let reset = $('journeyReset');
    if (!reset) {
      reset = make('button', 'journeyReset', '여정 초기화');
      reset.id = 'journeyReset'; reset.type = 'button'; reset.onclick = () => GameFlow.resetJourney();
    }

    let resetRow = $('journeyResetRow');
    if (!resetRow) {
      resetRow = make('div', 'journeyResetRow');
      resetRow.id = 'journeyResetRow';
    }
    if (reset.parentElement !== resetRow) resetRow.append(reset);
    if (root.nextElementSibling !== resetRow) root.after(resetRow);
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

  function currentLocation(recommendedId) {
    if (!recommendedId) return { chapterId: null, sectionId: null };
    for (const chapter of JourneyContent.JOURNEY) {
      for (const section of chapter.sections) {
        if (section.sequence.some(node => JourneyProgress.nodeId(node) === recommendedId)) {
          return { chapterId: chapter.id, sectionId: section.id };
        }
      }
    }
    return { chapterId: null, sectionId: null };
  }

  function appendTimeline(container, section, progress, recommendedId) {
    const list = make('ol', 'journeyTimeline');
    for (const node of section.sequence) {
      if (filter !== 'all' && filter !== node.type) continue;
      const done = JourneyProgress.isComplete(node, progress), open = JourneyProgress.isAvailable(node, progress);
      const id = JourneyProgress.nodeId(node), current = id === recommendedId;
      const content = node.type === 'story' ? JourneyContent.STORIES[node.id] : STAGES.find(s => s.id === node.id);
      if (!content) continue;
      const title = node.type === 'story' ? content.titleKo : content.subtitle;
      const button = make('button', 'journeyNode');
      button.type = 'button'; button.disabled = !open; button.dataset.nodeId = id;
      button.dataset.state = done ? 'complete' : open ? 'available' : 'locked';
      button.dataset.current = String(current);
      if (current) button.setAttribute('aria-current', 'step');
      const typeLabel = current ? `${node.type === 'story' ? '이야기' : '스테이지'} · 진행 중` : (node.type === 'story' ? '이야기' : '스테이지');
      const labels = [make('span', 'journeyType', typeLabel),
        make('strong', 'journeyNodeTitle', open ? title : '???')];
      if (open && node.type === 'stage') labels.push(make('span', 'journeyNodeTerms', content.title.replaceAll('・', ' · ')));
      const stateLabel = current
        ? (node.type === 'stage' ? '이어서 플레이' : '이어서 보기')
        : done ? '완료 · 다시 보기' : open ? (node.type === 'stage' ? '열림 · 연습하기' : '새 이야기') : '아직 잠김';
      labels.push(make('span', 'journeyNodeState', stateLabel));
      button.append(...labels);
      if (done && node.type === 'stage') button.lastChild.textContent = '완료 · 다시 플레이';
      button.onclick = () => node.type === 'stage' ? GameFlow.playStage(node.id, { mode: 'replay', returnTo: 'journey' }) :
        GameFlow.playStory(node.id, { mode: done ? 'replay' : 'first-play', returnTo: 'journey' });
      const item = make('li', ''); item.append(button); list.append(item);
    }
    if (list.children.length) container.append(list);
  }

  function appendRegion(chapterBody, chapter, section, progress, recommendedId, current) {
    const region = WORLD.regions.find(r => r.id === section.regionId);
    if (!region) return;

    const stageNodes = section.sequence.filter(node => node.type === 'stage');
    const storyNodes = section.sequence.filter(node => node.type === 'story');
    const doneStages = stageNodes.filter(node => JourneyProgress.isComplete(node, progress)).length;
    const doneStories = storyNodes.filter(node => JourneyProgress.isComplete(node, progress)).length;

    const regionDetails = make('details', 'journeyRegion');
    const regionKey = `${chapter.id}:${section.id}`;
    rememberDisclosure(regionDetails, regionKey, collapsedRegions, current.sectionId === section.id);

    const summary = make('summary', 'journeyRegionSummary');
    const names = make('span', 'journeyRegionHead');
    names.append(make('strong', 'journeyRegionKo', region.nameKo));
    if (region.name) names.append(make('span', 'journeyRegionZh', region.name));
    summary.append(names);

    const progressText = !section.sequence.length
      ? `준비 중 · ${section.plannedStageCount}판`
      : `스테이지 ${doneStages}/${section.plannedStageCount} · 이야기 ${doneStories}/${storyNodes.length}`;
    summary.append(make('span', 'journeyRegionProgress', progressText));
    regionDetails.append(summary);

    const regionBody = make('div', 'journeyRegionBody');
    if (!section.sequence.length) {
      regionBody.append(make('p', 'journeyRegionEmpty', '의뢰 준비 중'));
    } else {
      appendTimeline(regionBody, section, progress, recommendedId);
    }
    regionDetails.append(regionBody);
    chapterBody.append(regionDetails);
  }

  function focusCurrentNode() {
    const node = document.querySelector('.journeyNode[data-current="true"]');
    if (!node) return;
    requestAnimationFrame(() => {
      const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  function render(options = {}) {
    ensureActions();
    const progress = GameFlow.progress(), root = $('journeyList'); root.replaceChildren();
    const allNodes = JourneyProgress.nodes();
    const implementedStages = allNodes.filter(n => n.type === 'stage');
    const recommended = JourneyProgress.recommendedNode(progress);
    const recommendedId = recommended ? JourneyProgress.nodeId(recommended) : null;
    const current = currentLocation(recommendedId);
    $('journeyContinue').textContent = recommended ? '이어서 여행하기' : '월드맵으로';
    $('journeySummary').textContent = `스테이지 ${implementedStages.filter(n => JourneyProgress.isComplete(n, progress)).length}/${implementedStages.length} · 이야기 ${Object.keys(JourneyContent.STORIES).filter(id => progress.seenStories.includes(id)).length}/${Object.keys(JourneyContent.STORIES).length}`;
    document.querySelectorAll('[data-journey-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.journeyFilter === filter));
    });

    for (const chapter of JourneyContent.JOURNEY) {
      const chapterDetails = make('details', 'journeyChapter');
      chapterDetails.dataset.chapterId = chapter.id;
      rememberDisclosure(chapterDetails, chapter.id, collapsedChapters, current.chapterId === chapter.id);

      const display = chapterDisplay(chapter);
      const summary = make('summary', 'journeyChapterSummary');
      const heading = make('span', 'journeyChapterHeading');
      heading.append(make('strong', 'journeyChapterTitle', display.title));
      if (display.meta) heading.append(make('span', 'journeyChapterMeta', display.meta));
      summary.append(heading);
      chapterDetails.append(summary);

      const chapterBody = make('div', 'journeyChapterBody');
      for (const section of chapter.sections) {
        if (section.regionId) {
          appendRegion(chapterBody, chapter, section, progress, recommendedId, current);
          continue;
        }
        const directSection = make('div', 'journeySection journeySectionDirect');
        appendTimeline(directSection, section, progress, recommendedId);
        if (directSection.children.length) chapterBody.append(directSection);
      }
      chapterDetails.append(chapterBody);
      root.append(chapterDetails);
    }
    if (options.focusCurrent && recommendedId) focusCurrentNode();
  }

  document.querySelectorAll('[data-journey-filter]').forEach(button => {
    button.onclick = () => { filter = button.dataset.journeyFilter; render(); };
  });
  $('journeyContinue').onclick = () => GameFlow.resume();
  globalThis.JourneyRuntime = Object.freeze({ render });
})();
