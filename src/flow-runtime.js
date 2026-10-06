/* The only coordinator between story/journey renderers and the tactical adapter. */
(() => {
  const P = JourneyProgress, $ = id => document.getElementById(id);
  const PENDING_COMPLETION_KEY = 'chinese-word-tactics-pending-completion-v1';
  const LEXICON_KEY = globalThis.LexiconRuntime?.KEY || 'chinese-word-tactics-lexicon-v1';
  const RESET_KEYS = [P.KEY, 'chufa-tutorial-v03', 'chinese-word-tactics-world-v1', PENDING_COMPLETION_KEY, LEXICON_KEY];
  const store = P.createStore({ getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) }, () => {
    $('flowNotice').hidden = false;
    $('flowNotice').textContent = '진행 기록을 읽거나 저장하지 못했어. 이 탭에서는 계속할 수 있지만, 새로고침하면 기록을 잃을 수 있어.';
  });
  let active = null;
  let worldReturnContext = null;
  let journeyReturnContext = null;
  const dataAttribute = key => `data-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
  const currentView = () => [...document.querySelectorAll('.appView')].find(view => !view.hidden) || null;
  function focusToken(element = document.activeElement) {
    const view = currentView();
    if (!view || !element || !view.contains(element)) return null;
    if (element.id) return { kind: 'id', value: element.id };
    if (element.tagName === 'SUMMARY' && element.parentElement?.dataset.journeyStateKey) {
      return { kind: 'journey-summary', value: element.parentElement.dataset.journeyStateKey };
    }
    for (const key of ['nodeId', 'regionId', 'flow', 'journeyFilter']) {
      const owner = element.closest?.(`[${dataAttribute(key)}]`);
      if (owner) return { kind: 'data', key, value: owner.dataset[key] };
    }
    return null;
  }
  function captureViewContext() {
    const view = currentView();
    if (!view) return null;
    return {
      viewId: view.id,
      scrollY: window.scrollY,
      focus: focusToken(),
      journey: view.id === 'journeyView' ? globalThis.JourneyRuntime?.captureContext?.() || null : null,
      navigationReturn: view.id === 'worldView' ? worldReturnContext :
        view.id === 'journeyView' ? journeyReturnContext : null
    };
  }
  function restoreDomContext(context) {
    requestAnimationFrame(() => {
      const root = document.getElementById(context?.viewId);
      let target = null;
      if (root && context?.focus?.kind === 'id') target = root.querySelector(`#${context.focus.value}`);
      if (root && context?.focus?.kind === 'journey-summary') {
        target = [...root.querySelectorAll('details[data-journey-state-key]')]
          .find(item => item.dataset.journeyStateKey === context.focus.value)?.querySelector(':scope > summary') || null;
      }
      if (root && context?.focus?.kind === 'data') {
        target = [...root.querySelectorAll(`[${dataAttribute(context.focus.key)}]`)]
          .find(item => item.dataset[context.focus.key] === context.focus.value) || null;
      }
      target?.focus?.({ preventScroll: true });
      window.scrollTo({ top: Number.isFinite(context?.scrollY) ? context.scrollY : 0, left: 0, behavior: 'auto' });
    });
  }
  const returnViewFor = returnTo => returnTo === 'world' ? 'worldView' :
    returnTo === globalThis.AcademicTowerRuntime?.REGION_ID ? 'academicTowerView' : 'journeyView';
  function returnContextFor(options, normalized) {
    if (options.returnContext?.viewId) return options.returnContext;
    const captured = captureViewContext();
    return captured?.viewId === returnViewFor(normalized.returnTo) ? captured : null;
  }
  const validOptions = options => ({
    mode: options.mode === 'replay' ? 'replay' : 'first-play',
    returnTo: options.returnTo === 'world' || options.returnTo === globalThis.AcademicTowerRuntime?.REGION_ID
      ? options.returnTo : 'journey'
  });
  const canVisitWorld = () => store.get().completedStages.includes('stage-5');
  const recordWordEncounter = id => globalThis.LexiconRuntime?.visitStage(id);
  const nodeRegionId = node => node?.entryRegionId || null;
  const returnTargetFor = node => node?.returnToRegionHubAfter || 'journey';
  const readPendingCompletion = () => {
    try {
      const value = JSON.parse(localStorage.getItem(PENDING_COMPLETION_KEY) || 'null');
      return value && typeof value.stageId === 'string' ? value : null;
    } catch { return null; }
  };
  const clearPendingCompletion = () => { try { localStorage.removeItem(PENDING_COMPLETION_KEY); } catch {} };
  const hasJourneyProgress = progress => Boolean(
    progress?.lastLocation ||
    progress?.completedStages?.length ||
    progress?.seenStories?.length ||
    TacticalGame.hasSavedGame
  );
  function showLanding(options = {}) {
    active = null; StoryRuntime.stop(); TacticalGame.closeSheet(); TacticalGame.showView('landing');
    const progress = store.get(), started = hasJourneyProgress(progress);
    const lexicon = globalThis.LexiconRuntime?.snapshot?.();
    const hasWords = !!lexicon?.discovered?.length;
    const primary = $('landingPrimary'), secondary = $('landingSecondary');
    primary.textContent = started ? '이어서 여행하기' : '여행 시작';
    primary.onclick = () => started ? resume() : playStory('prologue-departure');
    secondary.hidden = !started;
    $('landingJourney').hidden = !started;
    $('landingWords').hidden = !hasWords;
    $('landingJourney').onclick = () => showJourney({ returnContext: captureViewContext(), preserveActive: true });
    $('landingWords').onclick = showWords;
    if (options.restoreContext) restoreDomContext(options.restoreContext);
    else window.scrollTo(0, 0);
    return true;
  }
  function showJourney(options = {}) {
    const focusRegionId = typeof options?.focusRegionId === 'string' ? options.focusRegionId : null;
    journeyReturnContext = options.restoreContext ? options.restoreContext.navigationReturn || null :
      options.returnContext?.viewId && options.returnContext.viewId !== 'journeyView' ? options.returnContext : null;
    if (!options.preserveActive) { active = null; StoryRuntime.stop(); }
    TacticalGame.showView('journey');
    if (options.restoreContext?.journey) JourneyRuntime.restoreContext(options.restoreContext.journey);
    JourneyRuntime.render(options.restoreContext ? {} : focusRegionId ? { focusRegionId } : { focusCurrent: true });
    if (options.restoreContext) restoreDomContext(options.restoreContext);
    else window.scrollTo(0, 0);
    return true;
  }
  function showRegionPractice(regionId) { return showJourney({ focusRegionId: regionId }); }
  function showWorld(options = {}) {
    if (!canVisitWorld()) { showJourney(); return false; }
    worldReturnContext = options.restoreContext ? options.restoreContext.navigationReturn || null :
      options.returnContext?.viewId && options.returnContext.viewId !== 'worldView' ? options.returnContext : null;
    if (!options.preserveActive) { active = null; StoryRuntime.stop(); }
    TacticalGame.showWorld();
    const next = P.recommendedNode(store.get());
    $('worldContinue').hidden = !next || !!nodeRegionId(next);
    if (options.restoreContext) restoreDomContext(options.restoreContext);
    else window.scrollTo(0, 0);
    return true;
  }
  function showRegionHub(regionId) {
    if (regionId === globalThis.AcademicTowerRuntime?.REGION_ID) return AcademicTowerRuntime.showHub();
    return false;
  }
  function returnFromReplay(options) {
    if (options.returnContext && restoreViewContext(options.returnContext)) return true;
    if (options.returnTo === 'world') return showWorld();
    if (showRegionHub(options.returnTo)) return true;
    return showJourney();
  }
  function continueFromNode(id) {
    const finished = P.getNode(id);
    const node = P.nextNode(id, store.get());
    if (finished?.returnToRegionHubAfter && node?.type === 'story') return playNode(node);
    if (finished?.returnToRegionHubAfter && showRegionHub(finished.returnToRegionHubAfter)) return true;
    if (finished?.returnToWorldAfter && canVisitWorld()) {
      store.locate({ view: 'world' });
      return showWorld();
    }
    if (node) return playNode(node);
    if (canVisitWorld()) { store.locate({ view: 'world' }); return showWorld(); }
    return showJourney();
  }
  function playStory(id, options = {}) {
    const baseStory = JourneyContent.STORIES[id], node = P.getNode(`story:${id}`), progress = store.get();
    const story = globalThis.StoryOutcomeContent?.resolve(baseStory, progress) || baseStory;
    if (!story || !node || !P.isAvailable(node, progress)) return false;
    const normalized = validOptions(options), returnContext = returnContextFor(options, normalized);
    const context = { ...normalized, ...(returnContext ? { returnContext } : {}), nodeId: node.nodeId, type: 'story' };
    active = context; TacticalGame.showView('story');
    const next = P.nextNode(node.nodeId, { ...progress, seenStories: [...progress.seenStories, id] });
    const endLabel = context.mode === 'replay'
      ? (context.returnTo === 'world' ? '월드맵으로' : context.returnTo === globalThis.AcademicTowerRuntime?.REGION_ID ? '연구실로' : '여정으로')
      : node.returnToRegionHubAfter ? '연구실로' : node.returnToWorldAfter ? '월드맵으로'
        : next?.type === 'stage' ? '스테이지 시작' : next?.type === 'story' ? '이야기 계속' : '월드맵으로';
    StoryRuntime.play(story, { ...context, seen: progress.seenStories.includes(id), beat: options.beat || 0, endLabel,
      onPosition(beat) { store.locate({ view: 'story', nodeId: node.nodeId, beat }, context.mode); },
      onFinish() {
        if (active !== context) return;
        store.complete(node, context.mode);
        if (context.mode === 'replay') returnFromReplay(context);
        else continueFromNode(node.nodeId);
      }
    });
    window.scrollTo(0, 0); return true;
  }
  function playStage(id, options = {}) {
    const node = P.getNode(`stage:${id}`);
    if (!node || !P.isAvailable(node, store.get())) return false;
    const normalized = validOptions(options), returnContext = returnContextFor(options, normalized);
    const context = { ...normalized, ...(returnContext ? { returnContext } : {}), nodeId: node.nodeId, type: 'stage' };
    if (!TacticalGame.playStage(id, context)) return false;
    recordWordEncounter(id);
    active = context; StoryRuntime.stop();
    store.locate({ view: 'tactical', nodeId: node.nodeId }, context.mode);
    window.scrollTo(0, 0); return true;
  }
  function playNode(node) { return node.type === 'story' ? playStory(node.id) : playStage(node.id); }
  function openQuestPicker(regionId, candidates) {
    const section = JourneyContent.JOURNEY.flatMap(chapter => chapter.sections || [])
      .find(item => item.regionId === regionId && Array.isArray(item.quests));
    if (!section) return false;
    const firstByQuest = new Map();
    for (const node of candidates) {
      if (node.questId && !firstByQuest.has(node.questId)) firstByQuest.set(node.questId, node);
    }
    const choices = section.quests.filter(quest => firstByQuest.has(quest.id));
    if (choices.length < 2) return false;

    TacticalGame.openSheet('<h2>이어갈 의뢰</h2><p class="flowNote">이 장소에서 진행할 의뢰를 골라줘.</p><div id="flowQuestChoices" class="flowMenu"></div><div class="sheetactions"><button id="flowQuestPickerClose" class="secondary">닫기</button></div>');
    const list = $('flowQuestChoices');
    for (const quest of choices) {
      const node = firstByQuest.get(quest.id);
      const content = node.type === 'story' ? JourneyContent.STORIES[node.id] : STAGES.find(stage => stage.id === node.id);
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'flowQuestChoice';
      const title = document.createElement('strong'); title.textContent = quest.titleKo;
      const detail = document.createElement('small');
      detail.textContent = [quest.titleZh, content?.titleKo || content?.subtitle].filter(Boolean).join(' · ');
      button.append(title, detail);
      button.onclick = () => { TacticalGame.closeSheet(); playNode(node); };
      list.append(button);
    }
    $('flowQuestPickerClose').onclick = () => TacticalGame.closeSheet();
    return true;
  }
  function enterRegion(regionId) {
    const progress = store.get();
    if (globalThis.AcademicTowerRuntime?.enter?.(regionId, progress)) return true;
    const candidates = P.allNodes().filter(item => item.entryRegionId === regionId &&
      P.isAvailable(item, progress) && !P.isComplete(item, progress));
    const activeQuestIds = new Set(candidates.filter(item => item.questId).map(item => item.questId));
    if (activeQuestIds.size > 1) return openQuestPicker(regionId, candidates);
    const node = candidates[0];
    if (!node) return false;
    return playNode(node);
  }
  function continueCampaign() {
    const action = P.continueAction(store.get());
    if (action.kind === 'world') return showWorld();
    if (action.kind === 'resume') return resume();
    return playNode(action.node);
  }
  function resume() {
    const progress = store.get(), location = progress.lastLocation, node = P.resumeNode(progress);
    const saved = P.getNode(location?.nodeId), pending = readPendingCompletion();
    if (!location && TacticalGame.hasSavedGame) {
      const stageId = TacticalGame.stageId(), stageNode = P.getNode(`stage:${stageId}`);
      if (stageNode && P.isAvailable(stageNode, progress) && !P.isComplete(stageNode, progress)) {
        const context = { mode: 'first-play', returnTo: returnTargetFor(stageNode), nodeId: stageNode.nodeId, type: 'stage' };
        if (TacticalGame.resumeStage(stageId, context)) {
          recordWordEncounter(stageId);
          active = context; StoryRuntime.stop(); store.locate({ view: 'tactical', nodeId: stageNode.nodeId }); return true;
        }
      }
    }
    if (saved && P.isComplete(saved, progress)) {
      if (pending?.stageId === saved.id && saved.type === 'stage' && location?.view === 'tactical') {
        const context = { mode: 'first-play', returnTo: returnTargetFor(saved), nodeId: saved.nodeId, type: 'stage' };
        if (TacticalGame.resumeStage(saved.id, context)) {
          recordWordEncounter(saved.id);
          active = context; StoryRuntime.stop(); store.locate({ view: 'tactical', nodeId: saved.nodeId });
          globalThis.__CWT_PENDING_COMPLETION__ = { id: saved.id, context };
          const completion = globalThis.GameFlow?.showStageComplete;
          if (typeof completion === 'function' && completion !== showStageComplete) {
            completion(saved.id, context);
            delete globalThis.__CWT_PENDING_COMPLETION__;
          }
          return true;
        }
      }
      if (pending) clearPendingCompletion();
      return continueFromNode(saved.nodeId);
    }
    if (pending) clearPendingCompletion();
    if (!node) return showWorld();
    if (nodeRegionId(node) && location?.nodeId !== node.nodeId) return showWorld();
    if (node.type === 'story') return playStory(node.id, { beat: location?.nodeId === node.nodeId ? location.beat : 0 });
    const context = { mode: 'first-play', returnTo: returnTargetFor(node), nodeId: node.nodeId, type: 'stage' };
    if (TacticalGame.resumeStage(node.id, context)) {
      recordWordEncounter(node.id);
      active = context; StoryRuntime.stop(); store.locate({ view: 'tactical', nodeId: node.nodeId }); return true;
    }
    return playStage(node.id);
  }
  function recordStageComplete(id, context) {
    const node = P.getNode(`stage:${id}`);
    const stage = STAGES.find(item => item.id === id);
    const outcome = globalThis.RouteMechanic?.currentOutcome?.(id) || TacticalGame.stageOutcome?.(id) || null;
    if (node) store.complete(node, context.mode, outcome, stage?.milestone);
  }
  function showStageComplete(id, context) {
    const replay = context.mode === 'replay', stage = STAGES.find(s => s.id === id);
    const node = P.getNode(`stage:${id}`);
    const next = P.nextNode(`stage:${id}`, store.get());
    TacticalGame.openSheet(`<div class="completeMark">✓</div><h2>${replay ? '다시 플레이 완료' : '스테이지 완료'}</h2><div class="story"></div><div class="sheetactions"><button id="flowRetry" class="secondary">다시 해보기</button><button id="flowNext"></button></div>`);
    // The stage-5 narrative now lives in P-02. Do not repeat 救命 twice.
    $('sheet').querySelector('.story').textContent = replay ? '연습은 여기에 남겨두고, 본편의 여행은 그대로 이어갈 수 있어.' : id === 'stage-5' ? '숲을 빠져나왔다. 길 너머에서 목소리가 들린다.' : stage.story;
    $('flowNext').textContent = replay
      ? (context.returnTo === 'world' ? '월드맵으로' : context.returnTo === globalThis.AcademicTowerRuntime?.REGION_ID ? '연구실로' : '여정으로')
      : next?.type === 'story' ? '이야기 계속' : node?.returnToRegionHubAfter ? '연구실로' : next ? '다음 스테이지' : '월드맵으로';
    $('flowNext').onclick = () => { TacticalGame.closeSheet(); replay ? returnFromReplay(context) : continueFromNode(`stage:${id}`); };
    $('flowRetry').onclick = () => playStage(id, context);
  }
  function showWords(options = {}) {
    if (!globalThis.LexiconRuntime) {
      TacticalGame.openSheet('<h2>단어장</h2><p class="flowNote">단어장을 불러오지 못했어. 지금은 빠른 단어 목록으로 열게.</p><div id="flowWordList" class="flowMenu"></div><div class="sheetactions"><button id="flowWordsClose">닫기</button></div>');
      for (const [word, detail] of Object.entries(WORDS)) {
        const button = document.createElement('button'); button.textContent = `${word} · ${detail.k}`;
        button.onclick = () => TacticalGame.showWord(word); $('flowWordList').append(button);
      }
      $('flowWordsClose').onclick = () => TacticalGame.closeSheet();
      return false;
    }
    const progress = store.get();
    TacticalGame.closeSheet();
    return LexiconRuntime.open({ progress, returnContext: options.returnContext });
  }
  function returnFromTravelRoot(view) {
    const context = view === 'world' ? worldReturnContext : journeyReturnContext;
    if (view === 'world') worldReturnContext = null;
    else journeyReturnContext = null;
    if (context && restoreViewContext(context)) return true;
    return showLanding();
  }
  function restoreViewContext(context) {
    if (!context?.viewId) return false;
    if (context.viewId === 'landingView') return showLanding({ restoreContext: context });
    if (context.viewId === 'worldView') return showWorld({ restoreContext: context, preserveActive: true });
    if (context.viewId === 'journeyView') return showJourney({ restoreContext: context, preserveActive: true });
    const viewName = ({ tutorialView: 'tutorial', storyView: 'story', academicTowerView: 'academicTower', settingsView: 'settings', innRoomView: 'innRoom', wordsView: 'words' })[context.viewId];
    if (!viewName) return false;
    TacticalGame.showView(viewName);
    restoreDomContext(context);
    return true;
  }
  function resetJourney() {
    TacticalGame.openSheet('<h2>여정 초기화</h2><p class="resetWarning">이 브라우저에 저장된 이야기, 튜토리얼 스테이지, 월드 진행을 모두 지우고 <strong>고향을 떠나다</strong>부터 다시 시작해.</p><p class="flowNote">게임의 단어와 콘텐츠 자체는 지워지지 않아.</p><div class="sheetactions"><button id="flowResetCancel" class="secondary">취소</button><button id="flowResetConfirm" class="dangerAction">처음부터 시작</button></div>');
    $('flowResetCancel').onclick = () => TacticalGame.closeSheet();
    $('flowResetConfirm').onclick = () => {
      try {
        RESET_KEYS.forEach(key => localStorage.removeItem(key));
        location.reload();
      } catch {
        TacticalGame.closeSheet();
        $('flowNotice').hidden = false;
        $('flowNotice').textContent = '진행 기록을 초기화하지 못했어. 브라우저의 사이트 데이터 저장 권한을 확인해줘.';
      }
    };
  }
  function showSettings(options = {}) { return globalThis.SettingsRuntime?.open?.(options) || false; }
  function showMenu() {
    const origin = captureViewContext(), progress = store.get(), started = hasJourneyProgress(progress);
    const hasWords = Boolean(globalThis.LexiconRuntime?.snapshot?.()?.discovered?.length);
    TacticalGame.openSheet('<h2>여행 메뉴</h2><div class="flowMenu flowTravelMenu"><button id="flowResume"></button><button id="flowWorld">월드맵</button><button id="flowJourney">여정 · 이야기와 스테이지</button><button id="flowWords">단어장</button><button id="flowSettings">설정 · 저장과 복원</button><button id="flowTitle">첫 화면</button></div><div class="sheetactions"><button id="flowMenuClose" data-action-role="close">닫기</button></div>');
    $('flowResume').textContent = started ? '본편 이어가기' : '여행 시작';
    $('flowResume').onclick = () => started ? resume() : playStory('prologue-departure');
    $('flowWorld').disabled = !canVisitWorld();
    if (!canVisitWorld()) $('flowWorld').textContent = '월드맵 · 숲을 빠져나오면 열려';
    $('flowJourney').disabled = !started;
    if (!started) $('flowJourney').textContent = '여정 · 여행을 시작하면 열려';
    $('flowWords').disabled = !hasWords;
    if (!hasWords) $('flowWords').textContent = '단어장 · 단어를 만나면 열려';
    $('flowWorld').onclick = () => origin?.viewId === 'worldView'
      ? restoreViewContext(origin) : showWorld({ returnContext: origin, preserveActive: true });
    $('flowJourney').onclick = () => origin?.viewId === 'journeyView'
      ? restoreViewContext(origin) : showJourney({ returnContext: origin, preserveActive: true });
    $('flowWords').onclick = () => showWords({ returnContext: origin });
    $('flowSettings').onclick = () => showSettings({ returnContext: origin });
    $('flowTitle').onclick = showLanding;
    const currentId = ({ landingView: 'flowTitle', worldView: 'flowWorld', journeyView: 'flowJourney', wordsView: 'flowWords', settingsView: 'flowSettings' })[origin?.viewId];
    if (currentId) $(currentId)?.setAttribute('aria-current', 'page');
    $('flowMenuClose').onclick = () => { TacticalGame.closeSheet(); if (origin) restoreDomContext(origin); };
    requestAnimationFrame(() => $('flowResume')?.focus());
  }
  globalThis.GameFlow = Object.freeze({ showLanding, showWorld, showJourney, showRegionPractice, showRegionHub, playStory, playStage, continueFromNode, enterRegion,
    continueCampaign, resume, returnFromReplay, showMenu, showWords, showSettings, resetJourney, recordStageComplete, showStageComplete,
    captureViewContext, restoreViewContext, progress: () => store.get() });
  document.querySelectorAll('[data-flow-menu]').forEach(button => { button.onclick = showMenu; });
  $('worldBack').onclick = () => returnFromTravelRoot('world');
  $('journeyBack').onclick = () => returnFromTravelRoot('journey');
  $('journeyReset')?.addEventListener('click', resetJourney);
  $('worldContinue').onclick = resume;
  showLanding();
})();
