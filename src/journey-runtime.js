(() => {
  const $ = id => document.getElementById(id);
  let filter = 'all';
  const chapterOpenStates = new Map();
  const regionOpenStates = new Map();
  const questOpenStates = new Map();
  const lockedOpenStates = new Map();

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
    const node = recommendedId ? JourneyProgress.getNode(recommendedId) : null;
    return { chapterId: node?.chapterId || null, sectionId: node?.sectionId || null, questId: node?.questId || null };
  }

  const resolvedSequence = sequence => (sequence || []).map(node => JourneyProgress.getNode(JourneyProgress.nodeId(node))).filter(Boolean);
  const matchesFilter = node => filter === 'all' || filter === node.type;
  const visibleSequence = (sequence, progress) => resolvedSequence(sequence)
    .filter(node => JourneyProgress.isJourneyVisible(node, progress));

  function makeTimelineItem(node, content, progress, recommendedId, questCurrentId = null) {
    const done = JourneyProgress.isComplete(node, progress), open = JourneyProgress.isAvailable(node, progress);
    const id = JourneyProgress.nodeId(node), campaignCurrent = id === recommendedId;
    const questCurrent = id === questCurrentId;
    const current = campaignCurrent || questCurrent;
    const reference = node.stageReference;
    const title = node.type === 'story' ? content.titleKo : content.subtitle;
    const typeLabel = node.type === 'story' ? '이야기' : reference?.optional ? '선택 연구' :
      reference?.groupId === 'academic-tower-turning-directions' ? '연구' : '스테이지';
    const terms = open && node.type === 'stage' ? content.title.replaceAll('・', ' · ') : '';
    const stateLabel = current
      ? `${questCurrent ? '의뢰 ' : ''}진행 중 · ${node.type === 'stage' ? '이어서 플레이' : '이어서 보기'}`
      : done ? (node.type === 'stage' ? '완료 · 다시 플레이' : '완료 · 다시 보기')
        : open ? (node.type === 'stage' ? '열림 · 연습하기' : '새 이야기 · 보기') : '아직 잠김';
    const actionLabel = current ? '계속' : done ? '다시' : open ? (node.type === 'stage' ? '연습' : '보기') : '잠김';
    const button = make('button', 'journeyNode');
    button.type = 'button'; button.disabled = !open; button.dataset.nodeId = id;
    button.dataset.state = done ? 'complete' : open ? 'available' : 'locked';
    button.dataset.current = String(campaignCurrent);
    button.dataset.questCurrent = String(questCurrent);
    if (reference) button.dataset.stageNumber = reference.number;
    if (campaignCurrent) button.setAttribute('aria-current', 'step');
    const referenceLabel = reference ? `${reference.groupLabel} ${reference.number}` : '';
    button.setAttribute('aria-label', [stateLabel, referenceLabel, typeLabel, open ? title : '제목 비공개', terms].filter(Boolean).join(' · '));

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
    if (reference) {
      const number = make('span', 'journeyNodeNumber', reference.number);
      number.setAttribute('aria-hidden', 'true');
      button.append(number);
    }
    button.append(make('strong', 'journeyNodeTitle', open ? title : '???'), meta, state);
    button.onclick = () => {
      const mode = done ? 'replay' : (questCurrent || node.type === 'story') ? 'first-play' : 'replay';
      return node.type === 'stage' ? GameFlow.playStage(node.id, { mode, returnTo: 'journey' }) :
        GameFlow.playStory(node.id, { mode, returnTo: 'journey' });
    };
    const item = make('li', ''); item.append(button);
    return { item, open };
  }

  function appendTimeline(container, sequence, progress, recommendedId, questCurrentId = null, timelineKey = '') {
    const list = make('ol', 'journeyTimeline');
    let firstLockedSeen = false;
    let lockedDetails = null;
    let lockedList = null;
    let lockedSummary = null;
    let lockedCount = 0;

    for (const node of visibleSequence(sequence, progress)) {
      if (!matchesFilter(node)) continue;
      const content = node.type === 'story' ? JourneyContent.STORIES[node.id] : STAGES.find(s => s.id === node.id);
      if (!content) continue;
      if (node.timelineHeading) {
        const heading = make('li', 'journeyResearchHeading');
        heading.append(make('strong', '', node.timelineHeading));
        if (node.timelineNote) heading.append(make('p', '', node.timelineNote));
        list.append(heading);
      }
      const entry = makeTimelineItem(node, content, progress, recommendedId, questCurrentId);
      if (!entry.open && firstLockedSeen) {
        if (!lockedDetails) {
          const groupItem = make('li', 'journeyLockedGroupItem');
          lockedDetails = make('details', 'journeyLockedGroup');
          lockedDetails.dataset.journeyDisclosure = 'locked';
          lockedDetails.dataset.journeyStateKey = timelineKey;
          rememberDisclosure(lockedDetails, timelineKey, lockedOpenStates);
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
    if (section.sequence?.length && !visibleSequence(section.sequence, progress).some(matchesFilter)) return;
    const region = WORLD.regions.find(r => r.id === section.regionId);
    if (!region) return;

    const sectionNodes = resolvedSequence(section.sequence);
    const stageNodes = sectionNodes.filter(node => node.type === 'stage');
    const storyNodes = sectionNodes.filter(node => node.type === 'story');
    const doneStages = stageNodes.filter(node => JourneyProgress.isComplete(node, progress)).length;
    const doneStories = storyNodes.filter(node => JourneyProgress.isComplete(node, progress)).length;

    const regionDetails = make('details', 'journeyRegion');
    regionDetails.dataset.journeyRegionId = section.regionId;
    const regionKey = `${chapter.id}:${section.id}`;
    regionDetails.dataset.journeyDisclosure = 'region';
    regionDetails.dataset.journeyStateKey = regionKey;
    const defaultOpen = sectionNodes.some(node => JourneyProgress.nodeId(node) === recommendedId);
    rememberDisclosure(regionDetails, regionKey, regionOpenStates, defaultOpen, forceOpen);

    const summary = make('summary', 'journeyRegionSummary');
    const names = make('span', 'journeyRegionHead');
    names.append(make('strong', 'journeyRegionKo', section.nameKo || region.nameKo));
    if (!section.nameKo && region.name) names.append(make('span', 'journeyRegionZh', region.name));
    summary.append(names);

    const progressText = !section.sequence.length
      ? `준비 중 · 스테이지 ${section.plannedStageCount}개`
      : `${section.stageLabel || '스테이지'} ${doneStages}/${section.plannedStageCount} · 이야기 ${doneStories}/${storyNodes.length}`;
    summary.append(make('span', 'journeyRegionProgress', progressText));
    regionDetails.append(summary);

    const regionBody = make('div', 'journeyRegionBody');
    if (!section.sequence.length) {
      regionBody.append(make('p', 'journeyRegionEmpty', '의뢰 준비 중'));
    } else {
      appendTimeline(regionBody, section.sequence, progress, recommendedId, null, regionKey);
    }
    regionDetails.append(regionBody);
    chapterBody.append(regionDetails);
  }

  function questEntry(quest, progress) {
    const nodes = visibleSequence(quest.sequence, progress);
    const current = nodes.find(node => JourneyProgress.isAvailable(node, progress) && !JourneyProgress.isComplete(node, progress)) || null;
    const started = nodes.some(node => JourneyProgress.isComplete(node, progress) || progress.lastLocation?.nodeId === node.nodeId);
    return { quest, nodes, current, started, done: nodes.length > 0 && nodes.every(node => JourneyProgress.isComplete(node, progress)) };
  }

  function appendQuestLocation(chapterBody, chapter, section, progress, recommendedId, forceOpen) {
    const entries = (section.quests || []).map(quest => questEntry(quest, progress)).filter(entry => entry.nodes.length);
    const displayed = entries.filter(entry => entry.nodes.some(matchesFilter));
    if (!displayed.length) return;

    const locationDetails = make('details', 'journeyRegion journeyQuestLocation');
    locationDetails.dataset.journeyRegionId = section.regionId || section.id;
    const regionKey = `${chapter.id}:${section.id}`;
    locationDetails.dataset.journeyDisclosure = 'region';
    locationDetails.dataset.journeyStateKey = regionKey;
    const defaultOpen = entries.some(entry => entry.current);
    rememberDisclosure(locationDetails, regionKey, regionOpenStates, defaultOpen, forceOpen);

    const summary = make('summary', 'journeyRegionSummary');
    const names = make('span', 'journeyRegionHead');
    names.append(make('strong', 'journeyRegionKo', section.nameKo));
    if (section.nameZh) names.append(make('span', 'journeyRegionZh', section.nameZh));
    summary.append(names, make('span', 'journeyRegionProgress', `의뢰 ${entries.filter(entry => entry.done).length}/${entries.length}`));
    locationDetails.append(summary);

    const locationBody = make('div', 'journeyRegionBody journeyQuestLocationBody');
    for (const entry of displayed) {
      const questDetails = make('details', 'journeyQuest');
      questDetails.dataset.journeyQuestId = entry.quest.id;
      const questKey = `${chapter.id}:${section.id}:${entry.quest.id}`;
      questDetails.dataset.journeyDisclosure = 'quest';
      questDetails.dataset.journeyStateKey = questKey;
      const questForceOpen = forceOpen && Boolean(entry.current);
      rememberDisclosure(questDetails, questKey, questOpenStates, Boolean(entry.current), questForceOpen);

      const questSummary = make('summary', 'journeyQuestSummary');
      const questNames = make('span', 'journeyQuestHead');
      questNames.append(make('strong', 'journeyQuestKo', entry.quest.titleKo));
      if (entry.quest.titleZh) questNames.append(make('span', 'journeyQuestZh', entry.quest.titleZh));
      questSummary.append(questNames, make('span', 'journeyQuestState', entry.done ? '완료' : entry.started ? '진행 중' : '열림'));
      questDetails.append(questSummary);

      const questBody = make('div', 'journeyQuestBody');
      appendTimeline(questBody, entry.quest.sequence, progress, recommendedId,
        entry.current ? JourneyProgress.nodeId(entry.current) : null, questKey);
      questDetails.append(questBody);
      locationBody.append(questDetails);
    }
    locationDetails.append(locationBody);
    chapterBody.append(locationDetails);
  }

  function chapterHasVisibleContent(chapter, progress) {
    return chapter.sections.some(section => {
      if (Array.isArray(section.quests)) {
        return section.quests.some(quest => visibleSequence(quest.sequence, progress).some(matchesFilter));
      }
      if (!section.sequence?.length) return true;
      return visibleSequence(section.sequence, progress).some(matchesFilter);
    });
  }

  function firstActiveQuestNode(chapter, progress) {
    if (chapter.kind !== 'quest-collection') return null;
    for (const section of chapter.sections) {
      for (const quest of section.quests || []) {
        const entry = questEntry(quest, progress);
        if (entry.started && entry.current) return entry.current;
      }
    }
    return null;
  }

  function guidanceFor(progress, action, activeQuest) {
    const milestones = progress.completedMilestones || [];
    const towerReferences = globalThis.JourneyStageReference?.all().filter(reference =>
      reference.groupId === 'academic-tower-turning-directions' && !reference.optional) || [];
    const towerDone = towerReferences.filter(reference => progress.completedStages.includes(reference.stageId)).length;
    const towerStarted = milestones.includes('academic-tower-entered') || towerDone > 0 ||
      progress.seenStories.some(id => id.startsWith('academic-tower-'));
    const chapterComplete = milestones.includes('chapter1-complete');
    const chapterStarted = progress.seenStories.includes('chapter1-roadside-merchant') ||
      progress.completedStages.some(id => /^(gate|workshop|market)-stage-/.test(id));
    const mainAction = action.kind === 'world' ? '' : '본편은 위 버튼으로 이어갈 수 있어.';
    const withMainAction = text => [mainAction, text].filter(Boolean).join(' ');

    if (activeQuest && towerStarted) {
      return withMainAction('진행 중인 자유 의뢰와 학술탑 연구는 아래 각 기록의 ‘계속’에서 이어갈 수 있어.');
    }
    if (activeQuest) {
      return withMainAction('진행 중인 자유 의뢰는 아래 의뢰의 ‘계속’에서 이어갈 수 있어.');
    }
    if (towerStarted) {
      const towerState = milestones.includes('academic-tower-turn-foundation')
        ? '학술탑의 첫 연구 묶음을 마쳤어.'
        : towerDone > 0 ? `학술탑 본선 연구 ${towerDone}/5를 마쳤어.` : '학술탑 연구가 시작됐어.';
      return withMainAction(`${towerState} 아래 현재 연구의 ‘계속’에서 이어갈 수 있어.`);
    }
    if (chapterComplete) {
      return '1장의 여행을 마쳤어. 새 의뢰와 연구는 월드맵에서 장소를 골라 시작할 수 있어.';
    }
    if (chapterStarted) {
      return action.kind === 'world' ? '다음 본편은 월드맵에서 장소를 골라 이어가.' : '진행 중인 1장 본편을 위 버튼으로 이어갈 수 있어.';
    }
    return '위 버튼으로 고향을 떠나는 여정을 이어갈 수 있어.';
  }

  function focusCurrentNode() {
    const node = document.querySelector('.journeyNode[data-current="true"],.journeyNode[data-quest-current="true"]');
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

  function captureContext() {
    const disclosures = [...document.querySelectorAll('#journeyList details[data-journey-state-key]')].map(details => ({
      kind: details.dataset.journeyDisclosure,
      key: details.dataset.journeyStateKey,
      open: details.open
    }));
    return { filter, disclosures };
  }

  function restoreContext(context) {
    if (!context || typeof context !== 'object') return;
    if (['all', 'story', 'stage'].includes(context.filter)) filter = context.filter;
    chapterOpenStates.clear(); regionOpenStates.clear(); questOpenStates.clear(); lockedOpenStates.clear();
    const stores = { chapter: chapterOpenStates, region: regionOpenStates, quest: questOpenStates, locked: lockedOpenStates };
    for (const item of Array.isArray(context.disclosures) ? context.disclosures : []) {
      if (stores[item?.kind] && typeof item.key === 'string') stores[item.kind].set(item.key, item.open === true);
    }
  }

  function render(options = {}) {
    ensureActions();
    const progress = GameFlow.progress(), root = $('journeyList'); root.replaceChildren();
    const allNodes = JourneyProgress.nodes(progress);
    const implementedStages = allNodes.filter(n => n.type === 'stage');
    const implementedStories = allNodes.filter(n => n.type === 'story');
    const recommended = JourneyProgress.recommendedNode(progress);
    const recommendedId = recommended ? JourneyProgress.nodeId(recommended) : null;
    const activeQuest = JourneyContent.JOURNEY.map(chapter => firstActiveQuestNode(chapter, progress)).find(Boolean) || null;
    const focusNodeId = recommendedId || (activeQuest ? JourneyProgress.nodeId(activeQuest) : null);
    const current = currentLocation(focusNodeId);
    const forceCurrentOpen = Boolean(options.focusCurrent && focusNodeId);
    const focusRegionId = typeof options.focusRegionId === 'string' ? options.focusRegionId : null;
    if (focusRegionId) filter = focusRegionId === 'academic-tower' ? 'all' : 'stage';
    const continueAction = JourneyProgress.continueAction(progress);
    const continueButton = $('journeyContinue');
    const showContinue = continueAction.kind !== 'world';
    continueButton.hidden = !showContinue;
    continueButton.textContent = showContinue ? continueAction.label : '';
    if (showContinue) {
      continueButton.dataset.destination = continueAction.kind;
      continueButton.onclick = () => GameFlow.continueCampaign();
    } else {
      delete continueButton.dataset.destination;
      continueButton.onclick = null;
    }
    $('journeyGuidance').textContent = guidanceFor(progress, continueAction, activeQuest);
    const replayGuidance = $('journeyReplayGuidance');
    replayGuidance.hidden = filter !== 'stage' || !progress.completedStages.length;
    $('journeySummary').textContent = `스테이지 ${implementedStages.filter(n => JourneyProgress.isComplete(n, progress)).length}/${implementedStages.length} · 이야기 ${implementedStories.filter(n => JourneyProgress.isComplete(n, progress)).length}/${implementedStories.length}`;
    document.querySelectorAll('[data-journey-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.journeyFilter === filter));
    });

    for (const chapter of JourneyContent.JOURNEY) {
      if (!chapterHasVisibleContent(chapter, progress)) continue;
      const chapterDetails = make('details', 'journeyChapter');
      chapterDetails.dataset.chapterId = chapter.id;
      chapterDetails.dataset.journeyDisclosure = 'chapter';
      chapterDetails.dataset.journeyStateKey = chapter.id;
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
        if (Array.isArray(section.quests)) {
          const forceRegionOpen = (forceCurrentOpen && current.sectionId === section.id) || focusRegionId === section.regionId;
          appendQuestLocation(chapterBody, chapter, section, progress, recommendedId, forceRegionOpen);
          continue;
        }
        if (section.regionId) {
          const forceRegionOpen = (forceCurrentOpen && current.sectionId === section.id) || focusRegionId === section.regionId;
          appendRegion(chapterBody, chapter, section, progress, recommendedId, forceRegionOpen);
          continue;
        }
        const directSection = make('div', 'journeySection journeySectionDirect');
        appendTimeline(directSection, section.sequence, progress, recommendedId, null, `${chapter.id}:${section.id}`);
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
  globalThis.JourneyRuntime = Object.freeze({ render, captureContext, restoreContext });
})();
