(() => {
  const $ = id => document.getElementById(id);
  let filter = 'all';
  const chapterOpenStates = new Map();
  const regionOpenStates = new Map();

  const make = (tag, className, text) => {
    const el = document.createElement(tag); el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  function rememberDisclosure(details, key, openStates, defaultOpen = false, forceOpen = false) {
    details.open = forceOpen || (openStates.has(key) ? openStates.get(key) : defaultOpen);
    let userTogglePending = false;
    details.addEventListener('click', event => {
      const summary = event.target.closest('summary');
      if (summary?.parentElement === details) userTogglePending = true;
    });
    details.addEventListener('toggle', () => {
      if (!userTogglePending) return;
      userTogglePending = false;
      openStates.set(key, details.open);
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

  function makeTimelineItem(node, content, progress, recommendedId) {
    const done = JourneyProgress.isComplete(node, progress), open = JourneyProgress.isAvailable(node, progress);
    const id = JourneyProgress.nodeId(node), current = id === recommendedId;
    const title = node.type === 'story' ? content.titleKo : content.subtitle;
    const typeLabel = node.type === 'story' ? '이야기' : '스테이지';
    const terms = open && node.type === 'stage' ? content.title.replaceAll('・', ' · ') : '';
    const stateLabel = current
      ? (node.type === 'stage' ? '진행 중 · 이어서 플레이' : '진행 중 · 이어서 보기')
      : done ? (node.type === 'stage' ? '완료 · 다시 플레이' : '완료 · 다시 보기')
        : open ? (node.type === 'stage' ? '열림 · 연습하기' : '새 이야기 · 보기') : '아직 잠김';
    const actionLabel = current ? '계속' : done ? '다시' : open ? (node.type === 'stage' ? '연습' : '보기') : '잠김';
    const button = make('button', 'journeyNode');
    button.type = 'button'; button.disabled = !open; button.dataset.nodeId = id;
    button.dataset.state = done ? 'complete' : open ? 'available' : 'locked';
    button.dataset.current = String(current);
    if (current) button.setAttribute('aria-current', 'step');
    button.setAttribute('aria-label', [stateLabel, typeLabel, open ? title : '제목 비공개', terms].filter(Boolean).join(' · '));

    const meta = make('span', 'journeyNodeMeta');
    meta.append(make('span', 'journeyType', typeLabel));
    if (terms) meta.append(make('span', 'journeyNodeTerms', terms));
    const state = make('span', 'journeyNodeState');
    const action = make('span', 'journeyNodeAction', current || done ? undefined : actionLabel);
    if (current || done) {
      action.dataset.icon = current ? 'continue' : 'replay';
      action.setAttribute('aria-hidden', 'true');
    }
    state.append(action);
    button.append(make('strong', 'journeyNodeTitle', open ? title : '???'), meta, state);
    button.onclick = () => node.type === 'stage' ? GameFlow.playStage(node.id, { mode: 'replay', returnTo: 'journey' }) :
      GameFlow.playStory(node.id, { mode: done ? 'replay' : 'first-play', returnTo: 'journey' });
    const item = make('li', ''); item.append(button);
    return { item, open };
  }

  function appendTimeline(container, section, progress, recommendedId) {
    const list = make('ol', 'journeyTimeline');
    let firstLockedSeen = false;
    let lockedDetails = null;
    let lockedList = null;
    let lockedSummary = null;
    let lockedCount = 0;

    for (const node of section.sequence) {
      if (filter !== 'all' && filter !== node.type) continue;
      const content = node.type === 'story' ? JourneyContent.STORIES[node.id] : STAGES.find(s => s.id === node.id);
      if (!content) continue;
      const entry = makeTimelineItem(node, content, progress, recommendedId);
      if (!entry.open && firstLockedSeen) {
        if (!lockedDetails) {
          const groupItem = make('li', 'journeyLockedGroupItem');
          lockedDetails = make('details', 'journeyLockedGroup');
          lockedSummary = make('summary', 'journeyLockedSummary');
          lockedList = make('ol', 'journeyTimeline journeyLockedTimeline');
          lockedDetails.append(lockedSummary, lockedList);
          groupItem.append(lockedDetails); list.append(groupItem);
        }
        lockedList.append(entry.item); lockedCount += 1;
        continue;
      }
      if (!entry.open) firstLockedSeen = true;
      list.append(entry.item);
    }
    if (lockedSummary) lockedSummary.textContent = `잠긴 항목 ${lockedCount}개`;
    if (list.children.length) container.append(list);
  }

  function appendRegion(chapterBody, chapter, section, progress, recommendedId, forceOpen) {
    const region = WORLD.regions.find(r => r.id === section.regionId);
    if (!region) return;

    const stageNodes = section.sequence.filter(node => node.type === 'stage');
    const storyNodes = section.sequence.filter(node => node.type === 'story');
    const doneStages = stageNodes.filter(node => JourneyProgress.isComplete(node, progress)).length;
    const doneStories = storyNodes.filter(node => JourneyProgress.isComplete(node, progress)).length;

    const regionDetails = make('details', 'journeyRegion');
    regionDetails.dataset.journeyRegionId = section.regionId;
    const regionKey = `${chapter.id}:${section.id}`;
    const defaultOpen = section.sequence.some(node => JourneyProgress.nodeId(node) === recommendedId);
    rememberDisclosure(regionDetails, regionKey, regionOpenStates, defaultOpen, forceOpen);

    const summary = make('summary', 'journeyRegionSummary');
    const names = make('span', 'journeyRegionHead');
    names.append(make('strong', 'journeyRegionKo', region.nameKo));
    if (region.name) names.append(make('span', 'journeyRegionZh', region.name));
    summary.append(names);

    const progressText = !section.sequence.length
      ? `준비 중 · 스테이지 ${section.plannedStageCount}개`
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

  function focusRegion(regionId) {
    const region = document.querySelector(`.journeyRegion[data-journey-region-id="${regionId}"]`);
    if (!region) return;
    requestAnimationFrame(() => region.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' }));
  }

  function render(options = {}) {
    ensureActions();
    const progress = GameFlow.progress(), root = $('journeyList'); root.replaceChildren();
    const allNodes = JourneyProgress.nodes();
    const implementedStages = allNodes.filter(n => n.type === 'stage');
    const recommended = JourneyProgress.recommendedNode(progress);
    const recommendedId = recommended ? JourneyProgress.nodeId(recommended) : null;
    const current = currentLocation(recommendedId);
    const forceCurrentOpen = Boolean(options.focusCurrent && recommendedId);
    const focusRegionId = typeof options.focusRegionId === 'string' ? options.focusRegionId : null;
    if (focusRegionId) filter = 'stage';
    $('journeyContinue').textContent = recommended ? '이어서 여행하기' : '월드맵으로';
    $('journeySummary').textContent = `스테이지 ${implementedStages.filter(n => JourneyProgress.isComplete(n, progress)).length}/${implementedStages.length} · 이야기 ${Object.keys(JourneyContent.STORIES).filter(id => progress.seenStories.includes(id)).length}/${Object.keys(JourneyContent.STORIES).length}`;
    document.querySelectorAll('[data-journey-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.journeyFilter === filter));
    });

    for (const chapter of JourneyContent.JOURNEY) {
      const chapterDetails = make('details', 'journeyChapter');
      chapterDetails.dataset.chapterId = chapter.id;
      const containsFocusedRegion = chapter.sections.some(section => section.regionId === focusRegionId);
      const forceChapterOpen = (forceCurrentOpen && current.chapterId === chapter.id) || containsFocusedRegion;
      rememberDisclosure(chapterDetails, chapter.id, chapterOpenStates,
        current.chapterId === chapter.id, forceChapterOpen);

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
          const forceRegionOpen = (forceCurrentOpen && current.sectionId === section.id) || focusRegionId === section.regionId;
          appendRegion(chapterBody, chapter, section, progress, recommendedId, forceRegionOpen);
          continue;
        }
        const directSection = make('div', 'journeySection journeySectionDirect');
        appendTimeline(directSection, section, progress, recommendedId);
        if (directSection.children.length) chapterBody.append(directSection);
      }
      chapterDetails.append(chapterBody);
      root.append(chapterDetails);
    }
    if (focusRegionId) focusRegion(focusRegionId);
    else if (forceCurrentOpen) focusCurrentNode();
  }

  document.querySelectorAll('[data-journey-filter]').forEach(button => {
    button.onclick = () => { filter = button.dataset.journeyFilter; render(); };
  });
  $('journeyContinue').onclick = () => GameFlow.resume();
  globalThis.JourneyRuntime = Object.freeze({ render });
})();
