/* C06 runtime: reveal the inn convergence only after all three region finales, then end in the actual room. */
(() => {
  const CORE_IDS = Object.freeze(['gate-core', 'workshop-core', 'market-core']);
  const REGION_FINALE_STORIES = Object.freeze(['gate-after-convoy', 'workshop-finale', 'market-after-m8']);
  const COMPLETE_MILESTONE = 'chapter1-complete';
  const CONVERGENCE_STORY_ID = 'chapter1-inn-convergence';
  const ROOM_STORY_ID = 'chapter1-room-finale';
  const $ = id => document.getElementById(id);

  const progress = () => globalThis.GameFlow?.progress?.() || {};
  const strings = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];

  function isReady(value = progress()) {
    const milestones = strings(value.completedMilestones);
    const stories = strings(value.seenStories);
    return CORE_IDS.every(id => milestones.includes(id)) &&
      REGION_FINALE_STORIES.every(id => stories.includes(id)) &&
      !milestones.includes(COMPLETE_MILESTONE) &&
      !stories.includes(ROOM_STORY_ID);
  }

  function openFinaleInnSheet() {
    if (!isReady()) return false;
    globalThis.WorldInn?.preloadRoomBackground?.();
    globalThis.TacticalGame?.openSheet?.(`
      <h2>여관</h2>
      <div class="regionSheetNameZh" lang="zh-Hant">客棧</div>
      <div class="meaning">돌아와서 할 이야기가 생겼다.</div>
      <div class="worldInnPlaceState">세 갈래 길을 모두 돌아본 뒤</div>
      <div class="gamerule">길목과 장인골, 장터에서 있었던 일을 여관 주인에게 아직 이야기하지 않았다.</div>
      <div class="sheetactions"><button class="secondary" id="chapter1FinaleClose">닫기</button><button id="chapter1FinaleEnter">들어가기</button></div>
    `);
    const close = $('chapter1FinaleClose');
    if (close) close.onclick = () => globalThis.TacticalGame?.closeSheet?.();
    const enter = $('chapter1FinaleEnter');
    if (enter) enter.onclick = () => {
      globalThis.TacticalGame?.closeSheet?.();
      globalThis.GameFlow?.enterRegion?.('inn');
    };
    return true;
  }

  function syncWorldContinue() {
    const button = $('worldContinue');
    if (!button) return;
    if (isReady()) {
      button.hidden = false;
      button.textContent = '여관으로 돌아가기';
      button.onclick = openFinaleInnSheet;
      return;
    }
    button.textContent = '이어서 여행하기';
    button.onclick = () => globalThis.GameFlow?.resume?.();
  }

  const map = $('worldRegions');
  if (map) {
    map.addEventListener('click', event => {
      const marker = event.target?.closest?.('.worldInnMarker');
      if (!marker || !isReady()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openFinaleInnSheet();
    }, true);
  }

  const world = $('worldView');
  if (world) {
    new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes' && record.target === world)) syncWorldContinue();
    }).observe(world, { attributes: true, attributeFilter: ['hidden'] });
  }

  const storyRuntime = globalThis.StoryRuntime;
  if (storyRuntime?.play) {
    globalThis.StoryRuntime = Object.freeze({
      ...storyRuntime,
      play(story, options = {}) {
        if (story?.id !== ROOM_STORY_ID || options.mode === 'replay') return storyRuntime.play(story, options);
        const onFinish = options.onFinish;
        return storyRuntime.play(story, {
          ...options,
          onFinish() {
            onFinish?.();
            syncWorldContinue();
            globalThis.WorldInn?.openRoom?.();
          }
        });
      }
    });
  }

  window.addEventListener('pageshow', syncWorldContinue);
  setTimeout(syncWorldContinue, 0);

  globalThis.Chapter1Finale = Object.freeze({
    CORE_IDS, REGION_FINALE_STORIES, COMPLETE_MILESTONE, CONVERGENCE_STORY_ID, ROOM_STORY_ID,
    isReady, openFinaleInnSheet, syncWorldContinue
  });
})();
