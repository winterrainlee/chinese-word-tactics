const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const load = (ctx, file) => vm.runInContext(read(file), ctx, { filename: file });
const plain = val => JSON.parse(JSON.stringify(val));

test('rain intro is a hidden story after the intact 1st chapter', () => {
  const ctx = vm.createContext({});
  ['src/journey-content.js', 'src/chapter1-finale-content.js',
   'src/chapter2-rain-content.js', 'src/journey-progress.js'].forEach(f => load(ctx, f));
  const P = ctx.JourneyProgress;
  const node = P.getNode('story:chapter2-rain-opening');
  const room = P.getNode('story:chapter1-room-finale');
  const story = ctx.JourneyContent.STORIES['chapter2-rain-opening'];
  assert.equal(room.milestone, 'chapter1-complete');
  assert.equal(story.placeZh, '房間');
  assert.equal(story.beats.length, 4);
  assert.deepEqual(plain(node.requires), ['story:chapter1-room-finale']);
  assert.equal(node.milestone, 'chapter2-rain-passed');
  assert.equal(node.returnToWorldAfter, true);
  const chapter = ctx.JourneyContent.JOURNEY.find(ch => ch.id === 'chapter-2-after-rain');
  assert.equal(chapter.hiddenFromJourney, undefined);
  assert.equal(chapter.titleKo, '2장 · 비가 지나간 물길마을');
  assert.equal(chapter.tag, '三溪鎮 · 큰비가 그친 뒤');
  assert.equal(chapter.sections[0].hiddenFromJourney, undefined);
  assert.deepEqual(plain(chapter.sections[0].revealRequires), ['story:chapter1-room-finale']);
  assert.equal(node.hiddenFromJourney, false);
  assert.ok(!P.nodes(P.normalize({})).some(n => n.nodeId === node.nodeId));
  const afterChapter1 = P.normalize({ seenStories: ['chapter1-room-finale'] });
  assert.ok(P.nodes(afterChapter1).some(n => n.nodeId === node.nodeId));
  assert.equal(P.isAvailable(node, P.normalize({})), false);
  assert.equal(P.isAvailable(node, afterChapter1), true);
  const previousNodes = P.allNodes().filter(n => n.id !== story.id);
  const chapterComplete = P.normalize({
    seenStories: previousNodes.filter(n => n.type === 'story').map(n => n.id),
    completedStages: previousNodes.filter(n => n.type === 'stage').map(n => n.id),
    completedMilestones: ['chapter1-complete']
  });
  assert.equal(P.recommendedNode(chapterComplete), null,
    'the newly visible story must not autoplay through generic Continue');
  const disk = new Map();
  const store = P.createStore({
    getItem: k => disk.get(k) || null,
    setItem: (k,v) => disk.set(k,v)
  });
  store.complete(node);
  const done = store.get();
  assert.ok(done.seenStories.includes('chapter2-rain-opening'));
  assert.ok(done.completedMilestones.includes('chapter2-rain-passed'));
  assert.ok(JSON.parse(disk.get(P.KEY)).completedMilestones.includes('chapter2-rain-passed'));
  store.complete(node, 'replay');
  assert.deepEqual(plain(store.get()), plain(done));
});

function harness(state) {
  const listeners = {};
  const room = { hidden: false };
  const calls = [];
  const ctx = vm.createContext({
    document: {
      getElementById: id => id === 'innRoomView' ? room : null,
      addEventListener: (type, handler, capture) => (listeners[type] ||= []).push({ handler, capture })
    },
    setTimeout(callback) { calls.push('timer'); callback(); }
  });
  ctx.GameFlow = {
    progress: () => state,
    playStory(id) { calls.push('play:' + id); return true; },
    resume() { calls.push('resume'); return true; }
  };
  // Use the actual shared evidence classifier: optional Tower 01-05 is not
  // proof that this Chapter 2 rain has already happened.
  load(ctx, 'src/journey-progress.js');
  const hasPostRainEvidence = ctx.JourneyProgress.hasPostRainEvidence;
  ctx.JourneyProgress = {
    getNode: id => id === 'story:chapter2-rain-opening' ? { nodeId: id } : null,
    isAvailable: () => true,
    hasPostRainEvidence
  };
  ctx.TacticalGame = { closeSheet() { calls.push('close-sheet'); } };
  ctx.FirstFreeQuest = {
    needsOffer: () => true,
    openOfferSheet() { calls.push('offer'); }
  };
  ctx.StoryRuntime = {
    play(story, options) { calls.push('story-runtime'); options.onFinish(); return true; },
    stop() {}
  };
  load(ctx, 'src/chapter2-rain-runtime.js');
  return { ctx, listeners, calls, room };
}

test('door starts rain before C08, then C08 follows once the rain is complete', () => {
  const state = {
    completedMilestones: ['chapter1-complete'],
    seenStories: ['chapter1-room-finale'],
    lastLocation: { view: 'world' }
  };
  const { ctx, calls, listeners } = harness(state);
  assert.equal(ctx.Chapter2Rain.statusFor(state), 'pending');
  assert.equal(listeners.click[0].capture, true);
  const event = {
    target: { closest: sel => sel.includes('leave-room') ? {} : null },
    preventDefault() { calls.push('prevent'); },
    stopImmediatePropagation() { calls.push('stop'); }
  };
  listeners.click[0].handler(event);
  assert.deepEqual(calls, ['prevent','stop','close-sheet','play:chapter2-rain-opening']);
  calls.length = 0;
  ctx.StoryRuntime.play({ id:'chapter2-rain-opening' }, {
    mode:'first-play',
    onFinish() {
      calls.push('complete');
      state.completedMilestones.push('chapter2-rain-passed');
      state.seenStories.push('chapter2-rain-opening');
    }
  });
  assert.deepEqual(calls, ['story-runtime','complete','timer','offer']);
  assert.equal(ctx.Chapter2Rain.statusFor(state), 'complete');
  calls.length = 0;
  listeners.click[0].handler(event);
  assert.deepEqual(calls, []);
});

test('older post-chapter saves skip a second rain; partial rain resumes', () => {
  const { ctx, calls } = harness({});
  const base = { completedMilestones:['chapter1-complete'], seenStories:['chapter1-room-finale'] };
  for (const update of [
    { seenStories:[...base.seenStories,'academic-tower-er-intro'] },
    { completedStages:['academic-tower-turn-04a-er-family'] },
    { sideResearchProgress:{ 'academic-tower-turn-04a-er-family': { phase:'work' } } },
    { seenStories:[...base.seenStories,'first-free-quest-accepted'] },
    { completedMilestones:[...base.completedMilestones,'quest-board-unlocked'] },
    { lastLocation:{view:'story',nodeId:'story:north-forest-signs-accepted'} }
  ]) assert.equal(ctx.Chapter2Rain.statusFor({ ...base, ...update }), 'legacy');
  for (const earlier of [
    { completedStages:['academic-tower-turn-01-que'] },
    { completedStages:['academic-tower-turn-03b-ran-village'] },
    { seenStories:[...base.seenStories,'academic-tower-arrival','academic-tower-turn-result'] }
  ]) assert.equal(ctx.Chapter2Rain.statusFor({ ...base, ...earlier }), 'pending',
    'ordinary Tower work during Chapter 1 cannot skip the rain');
  assert.equal(ctx.Chapter2Rain.statusFor({ ...base, completedMilestones:[] }), 'locked');
  assert.equal(ctx.Chapter2Rain.statusFor({
    ...base, completedMilestones:['chapter1-complete','chapter2-rain-passed']
  }), 'complete');

  const playing = { ...base, lastLocation:{
    view:'story', nodeId:'story:chapter2-rain-opening', beat:2
  }};
  const resumed = harness(playing);
  assert.equal(resumed.ctx.Chapter2Rain.start(), true);
  assert.deepEqual(resumed.calls, ['resume']);
});