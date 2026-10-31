/* Room departure → one rain story → the unchanged optional C08 innkeeper request. */
(() => {
  const STORY_ID = 'chapter2-rain-opening';
  const STORY_NODE = 'story:' + STORY_ID;
  const MILESTONE = 'chapter2-rain-passed';
  const strings = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  const progress = () => globalThis.GameFlow?.progress?.() || {};

  // Before this story existed, players might already have explored 04A and
  // the forest. The same great rain must not occur twice for old saves.
  const hasLaterPlay = value => globalThis.JourneyProgress?.hasPostRainEvidence?.(value) === true;

  function statusFor(value) {
    if (!strings(value?.completedMilestones).includes('chapter1-complete')) return 'locked';
    if (strings(value?.seenStories).includes(STORY_ID) ||
        strings(value?.completedMilestones).includes(MILESTONE)) return 'complete';
    if (hasLaterPlay(value)) return 'legacy';
    return 'pending';
  }
  const needsIntro = (value = progress()) => statusFor(value) === 'pending';
  const roomVisible = () => {
    const room = document.getElementById('innRoomView');
    return !!room && !room.hidden;
  };
  function start() {
    const value = progress();
    if (!needsIntro(value)) return false;
    const node = globalThis.JourneyProgress?.getNode?.(STORY_NODE);
    if (!node || !globalThis.JourneyProgress?.isAvailable?.(node, value)) return false;
    if (value?.lastLocation?.nodeId === STORY_NODE) return globalThis.GameFlow?.resume?.() === true;
    return globalThis.GameFlow?.playStory?.(STORY_ID) === true;
  }
  function leavingRoom(event) {
    return roomVisible() && needsIntro() &&
      !!event.target?.closest?.(
        '#innRoomHotspots [data-action="leave-room"], #innRoomBack, #flowWorld, #flowJourney, #flowResume');
  }
  function intercept(event) {
    if (!leavingRoom(event)) return;
    const node = globalThis.JourneyProgress?.getNode?.(STORY_NODE);
    if (!node || !globalThis.JourneyProgress?.isAvailable?.(node, progress())) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    globalThis.TacticalGame?.closeSheet?.();
    start();
  }
  // Register before FirstFreeQuest's capture handler; otherwise C08 can put
  // a quest prompt over this scene.
  document.addEventListener('click', intercept, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') intercept(event);
  }, true);

  const previousStory = globalThis.StoryRuntime;
  if (previousStory?.play) globalThis.StoryRuntime = Object.freeze({
    ...previousStory,
    play(story, options = {}) {
      if (story?.id !== STORY_ID || options.mode === 'replay') {
        return previousStory.play(story, options);
      }
      return previousStory.play(story, {
        ...options,
        onFinish() {
          options.onFinish?.();
          if (globalThis.FirstFreeQuest?.needsOffer?.(progress())) {
            setTimeout(() => globalThis.FirstFreeQuest?.openOfferSheet?.(), 0);
          }
        }
      });
    }
  });

  globalThis.Chapter2Rain = Object.freeze({
    STORY_ID, STORY_NODE, MILESTONE, hasLaterPlay, statusFor, needsIntro, start, leavingRoom
  });
})();