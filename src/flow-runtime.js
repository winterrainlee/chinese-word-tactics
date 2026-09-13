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
  const validOptions = options => ({ mode: options.mode === 'replay' ? 'replay' : 'first-play', returnTo: options.returnTo === 'world' ? 'world' : 'journey' });
  const canVisitWorld = () => store.get().completedStages.includes('stage-5');
  const recordWordEncounter = id => globalThis.LexiconRuntime?.visitStage(id);
  const nodeRegionId = node => JourneyContent.JOURNEY.flatMap(chapter => chapter.sections).find(section => section.id === node?.sectionId)?.regionId || null;
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
  function showLanding() {
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
    $('landingJourney').onclick = showJourney;
    $('landingWords').onclick = showWords;
    window.scrollTo(0, 0); return true;
  }
  function showJourney() {
    active = null; StoryRuntime.stop(); TacticalGame.showView('journey'); JourneyRuntime.render({ focusCurrent: true });
    document.querySelectorAll('[data-flow="world"]').forEach(button => { button.disabled = !canVisitWorld(); });
    window.scrollTo(0, 0);
  }
  function showWorld() {
    if (!canVisitWorld()) { showJourney(); return false; }
    active = null; StoryRuntime.stop(); TacticalGame.showWorld();
    const next = P.recommendedNode(store.get());
    $('worldContinue').hidden = !next || !!nodeRegionId(next);
    window.scrollTo(0, 0); return true;
  }
  function returnFromReplay(options) { options.returnTo === 'world' ? showWorld() : showJourney(); }
  function continueFromNode(id) {
    const finished = P.getNode(id);
    if (finished?.returnToWorldAfter && canVisitWorld()) {
      store.locate({ view: 'world' });
      return showWorld();
    }
    const node = P.nextNode(id, store.get());
    if (node) return playNode(node);
    if (canVisitWorld()) { store.locate({ view: 'world' }); return showWorld(); }
    return showJourney();
  }
  function playStory(id, options = {}) {
    const baseStory = JourneyContent.STORIES[id], node = P.getNode(`story:${id}`), progress = store.get();
    const story = globalThis.StoryOutcomeContent?.resolve(baseStory, progress) || baseStory;
    if (!story || !node || !P.isAvailable(node, progress)) return false;
    const context = { ...validOptions(options), nodeId: node.nodeId, type: 'story' };
    active = context; TacticalGame.showView('story');
    const next = P.nextNode(node.nodeId, { ...progress, seenStories: [...progress.seenStories, id] });
    const endLabel = context.mode === 'replay' ? (context.returnTo === 'world' ? '월드맵으로' : '여정으로') :
      node.returnToWorldAfter ? '월드맵으로' : next?.type === 'stage' ? '스테이지 시작' : next?.type === 'story' ? '이야기 계속' : '월드맵으로';
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
    const context = { ...validOptions(options), nodeId: node.nodeId, type: 'stage' };
    if (!TacticalGame.playStage(id, context)) return false;
    recordWordEncounter(id);
    active = context; StoryRuntime.stop();
    store.locate({ view: 'tactical', nodeId: node.nodeId }, context.mode);
    window.scrollTo(0, 0); return true;
  }
  function playNode(node) { return node.type === 'story' ? playStory(node.id) : playStage(node.id); }
  function enterRegion(regionId) {
    const section = JourneyContent.JOURNEY.flatMap(chapter => chapter.sections).find(item => item.regionId === regionId);
    if (!section) return false;
    const progress = store.get();
    const node = section.sequence.map(item => P.getNode(P.nodeId(item))).find(item => item && P.isAvailable(item, progress) && !P.isComplete(item, progress));
    if (!node) return false;
    return playNode(node);
  }
  function resume() {
    const progress = store.get(), location = progress.lastLocation, node = P.recommendedNode(progress);
    const saved = P.getNode(location?.nodeId), pending = readPendingCompletion();
    if (!location && TacticalGame.hasSavedGame) {
      const stageId = TacticalGame.stageId(), stageNode = P.getNode(`stage:${stageId}`);
      if (stageNode && P.isAvailable(stageNode, progress) && !P.isComplete(stageNode, progress)) {
        const context = { mode: 'first-play', returnTo: 'journey', nodeId: stageNode.nodeId, type: 'stage' };
        if (TacticalGame.resumeStage(stageId, context)) {
          recordWordEncounter(stageId);
          active = context; StoryRuntime.stop(); store.locate({ view: 'tactical', nodeId: stageNode.nodeId }); return true;
        }
      }
    }
    if (saved && P.isComplete(saved, progress)) {
      if (pending?.stageId === saved.id && saved.type === 'stage' && location?.view === 'tactical') {
        const context = { mode: 'first-play', returnTo: 'journey', nodeId: saved.nodeId, type: 'stage' };
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
    const context = { mode: 'first-play', returnTo: 'journey', nodeId: node.nodeId, type: 'stage' };
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
    const next = P.nextNode(`stage:${id}`, store.get());
    TacticalGame.openSheet(`<div class="completeMark">✓</div><h2>${replay ? '다시 플레이 완료' : '스테이지 완료'}</h2><div class="story"></div><div class="sheetactions"><button id="flowRetry" class="secondary">다시 해보기</button><button id="flowNext"></button></div>`);
    // The stage-5 narrative now lives in P-02. Do not repeat 救命 twice.
    $('sheet').querySelector('.story').textContent = replay ? '연습은 여기에 남겨두고, 본편의 여행은 그대로 이어갈 수 있어.' : id === 'stage-5' ? '숲을 빠져나왔다. 길 너머에서 목소리가 들린다.' : stage.story;
    $('flowNext').textContent = replay ? (context.returnTo === 'world' ? '월드맵으로' : '여정으로') : next?.type === 'story' ? '이야기 계속' : next ? '다음 스테이지' : '월드맵으로';
    $('flowNext').onclick = () => { TacticalGame.closeSheet(); replay ? returnFromReplay(context) : continueFromNode(`stage:${id}`); };
    $('flowRetry').onclick = () => playStage(id, context);
  }
  function showWords() {
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
    active = null; StoryRuntime.stop(); TacticalGame.closeSheet();
    document.querySelectorAll('[data-flow="world"]').forEach(button => { button.disabled = !canVisitWorld(); });
    return LexiconRuntime.open({ progress });
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
  function showMenu() {
    TacticalGame.openSheet('<h2>여행 메뉴</h2><div class="flowMenu"><button id="flowResume">본편 이어가기</button><button id="flowWorld">월드맵</button><button id="flowJourney">여정 · 이야기와 스테이지</button><button id="flowWords">단어장</button><button id="flowTitle">타이틀 화면</button></div><div class="sheetactions"><button id="flowMenuClose">닫기</button></div>');
    $('flowResume').onclick = () => resume();
    $('flowWorld').disabled = !canVisitWorld();
    if (!canVisitWorld()) $('flowWorld').textContent = '월드맵 · 숲을 빠져나오면 열려';
    $('flowWorld').onclick = showWorld; $('flowJourney').onclick = showJourney;
    $('flowWords').onclick = showWords; $('flowTitle').onclick = showLanding; $('flowMenuClose').onclick = () => TacticalGame.closeSheet();
  }
  globalThis.GameFlow = Object.freeze({ showLanding, showWorld, showJourney, playStory, playStage, continueFromNode, enterRegion,
    resume, showMenu, showWords, resetJourney, recordStageComplete, showStageComplete, progress: () => store.get() });
  document.querySelectorAll('[data-flow]').forEach(button => { button.onclick = () => ({ world: showWorld, journey: showJourney, words: showWords })[button.dataset.flow](); });
  $('journeyReset')?.addEventListener('click', resetJourney);
  $('worldContinue').onclick = resume;
  $('worldBackBtn').onclick = showJourney; $('worldBackBtn').setAttribute('aria-label', '여정으로');
  showLanding();
})();
