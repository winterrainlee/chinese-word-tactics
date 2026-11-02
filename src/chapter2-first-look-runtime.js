/* Optional Chapter 2 first sightings: no stage, navigation, save or unlock override. */
(() => {
  const storyByRegion = Object.freeze({
    'gate-town':'chapter2-gate-first-look',
    'market-town':'chapter2-market-first-look',
    'workshop-town':'chapter2-workshop-first-look'
  });
  const byRegion = regionId => Object.hasOwn(storyByRegion, regionId) ? storyByRegion[regionId] : null;
  function statusFor(regionId, progress = globalThis.GameFlow?.progress?.() || {}) {
    const storyId = byRegion(regionId);
    const P = globalThis.JourneyProgress;
    if (!storyId || !P?.hasRainPassed?.(progress)) return null;
    const node = P.getNode('story:' + storyId);
    if (!node || !P.isAvailable(node, progress) || !P.isJourneyVisible(node, progress)) return null;
    return Object.freeze({ regionId, storyId, seen: Array.isArray(progress.seenStories) &&
      progress.seenStories.includes(storyId) });
  }
  function open(regionId) {
    const state = statusFor(regionId);
    if (!state) return false;
    return globalThis.GameFlow?.playStory?.(state.storyId, {
      mode: state.seen ? 'replay' : 'first-play', returnTo: 'world'
    }) === true;
  }
  globalThis.Chapter2FirstLook = Object.freeze({ storyByRegion, statusFor, open });
})();
