const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/journey-content.js');
require('../src/journey-progress.js');
const P = globalThis.JourneyProgress;
const storage = seed => {
  const data = new Map(Object.entries(seed || {}));
  return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), data };
};
const legacyKey = 'chufa-tutorial-v03';
const legacyWorldKey = 'chinese-word-tactics-world-v1';
test('migrates six legacy stage IDs without marking new stories seen or changing old keys', () => {
  const raw = JSON.stringify({ completed: ['stage-0', 'stage-0', 'stage-5', 'unknown', 3] });
  const disk = storage({ [legacyKey]: raw }); const store = P.createStore(disk);
  assert.deepEqual(store.get().completedStages, ['stage-0', 'stage-5']);
  assert.deepEqual(store.get().seenStories, []);
  assert.equal(disk.getItem(legacyKey), raw);
  assert.deepEqual(P.createStore(disk).get(), store.get());
});
test('normalizes malformed fields and unknown locations without throwing', () => {
  const disk = storage({ [P.KEY]: JSON.stringify({ seenStories: 'bad', completedStages: {}, lastLocation: { view: 'story', nodeId: 'unknown' } }) });
  assert.deepEqual(P.createStore(disk).get(), P.normalize(null));
});
test('malformed JSON still allows independent legacy migration', () => {
  let errors = 0; const disk = storage({ [P.KEY]: '{', [legacyKey]: JSON.stringify({ completed: ['stage-2'] }) });
  const store = P.createStore(disk, () => errors++);
  assert.deepEqual(store.get().completedStages, ['stage-2']); assert.ok(errors);
});
test('migrates legacy world milestones without changing the old save and merges canonically', () => {
  const raw = JSON.stringify({ visited: ['gate-town'], completedMilestones: ['gate-core', 'gate-core', 3] });
  const disk = storage({
    [P.KEY]: JSON.stringify({ completedMilestones: ['workshop-core'] }),
    [legacyWorldKey]: raw
  });
  const store = P.createStore(disk);
  assert.deepEqual(store.get().completedMilestones, ['workshop-core', 'gate-core']);
  assert.equal(disk.getItem(legacyWorldKey), raw);
  assert.deepEqual(P.createStore(disk).get(), store.get());
});
test('blocked storage continues in memory and reports failure', () => {
  let errors = 0; const store = P.createStore({ getItem() { throw Error('denied'); }, setItem() { throw Error('full'); } }, () => errors++);
  store.complete(P.getNode('stage:stage-0'));
  assert.deepEqual(store.get().completedStages, ['stage-0']); assert.ok(errors >= 3);
});
test('first story does not block stage 0; later stages need preceding completion', () => {
  const p = P.normalize(null);
  assert.ok(P.isAvailable(P.getNode('stage:stage-0'), p));
  assert.equal(P.isAvailable(P.getNode('stage:stage-1'), p), false);
  p.completedStages.push('stage-0'); assert.ok(P.isAvailable(P.getNode('stage:stage-1'), p));
});
test('replay writes neither completion, acknowledgements nor main checkpoint', () => {
  const disk = storage(), store = P.createStore(disk);
  store.locate({ view: 'story', nodeId: 'story:prologue-departure', beat: 2 });
  const before = disk.getItem(P.KEY);
  store.complete(P.getNode('story:prologue-departure'), 'replay');
  store.complete(P.getNode('stage:stage-0'), 'replay', null, 'gate-core');
  store.locate({ view: 'world' }, 'replay');
  assert.equal(disk.getItem(P.KEY), before);
});
test('first-play stage milestone is persisted idempotently in journey progress', () => {
  const disk = storage(), store = P.createStore(disk);
  const node = P.getNode('stage:stage-0');
  store.complete(node, 'first-play', null, 'gate-core');
  store.complete(node, 'first-play', null, 'gate-core');
  assert.deepEqual(store.get().completedMilestones, ['gate-core']);
  assert.deepEqual(JSON.parse(disk.getItem(P.KEY)).completedMilestones, ['gate-core']);
});
test('duplicate completion is idempotent and get() cannot mutate the store', () => {
  const store = P.createStore(storage()), node = P.getNode('stage:stage-0');
  store.complete(node); store.complete(node);
  const result = store.get(); result.completedStages.push('stage-5');
  assert.deepEqual(store.get().completedStages, ['stage-0']);
  assert.deepEqual(store.get().acknowledgedNodes, ['stage:stage-0']);
});
test('legacy graduate continues into epilogue and never repeats completed stages', () => {
  const p = P.normalize({ completedStages: Array.from({ length: 6 }, (_, i) => `stage-${i}`) });
  assert.equal(P.recommendedNode(p).id, 'prologue-forest-edge');
  assert.equal(P.nextNode('story:prologue-departure', p).id, 'prologue-forest-edge');
  p.seenStories.push('prologue-forest-edge');
  assert.equal(P.nextNode('story:prologue-forest-edge', p).id, 'chapter1-roadside-merchant');
});
test('checkpoint takes precedence and view/type mismatch is rejected', () => {
  const p = P.normalize({ lastLocation: { view: 'story', nodeId: 'story:prologue-departure', beat: 2 } });
  assert.equal(P.recommendedNode(p).id, 'prologue-departure');
  assert.equal(P.normalize({ lastLocation: { view: 'story', nodeId: 'stage:stage-0' } }).lastLocation, null);
});
test('all node IDs and story/stage references are unique and prerequisites resolve', () => {
  const nodes = P.nodes(); assert.equal(new Set(nodes.map(n => n.nodeId)).size, nodes.length);
  for (const node of nodes) {
    for (const requirement of node.requires || []) assert.ok(P.getNode(requirement));
    if (node.type === 'story') assert.ok(JourneyContent.STORIES[node.id]?.beats.length);
  }
});
test('hero role needs all three core milestones, not visits or tutorial completion', () => {
  assert.equal(P.getHeroRole([]), 'boy');
  assert.equal(P.getHeroRole(['gate-town', 'workshop-town', 'market-town']), 'boy');
  assert.equal(P.getHeroRole(['gate-core', 'workshop-core']), 'boy');
  assert.equal(P.getHeroRole(['gate-core', 'workshop-core', 'market-core']), 'hero');
  assert.equal(P.getHeroRole(null), 'boy');
});

test('parallel region sections never automatically advance to another region', () => {
  const [gate, workshop] = JourneyContent.JOURNEY[1].sections.slice(1, 3);
  gate.sequence.push({ type: 'story', id: 'gate-test', requires: [] });
  workshop.sequence.push({ type: 'story', id: 'workshop-test', requires: [] });
  try { assert.equal(P.nextNode('story:gate-test', P.normalize({ seenStories: ['gate-test'] })), null); }
  finally { gate.sequence.pop(); workshop.sequence.pop(); }
});

test('gate-town G1 through G3 unlock in order and hand off to G4 after each world pause', () => {
  const base = P.normalize({ seenStories: ['prologue-departure', 'prologue-forest-edge'] });
  const arrival = P.getNode('story:gate-arrival');
  assert.equal(P.isAvailable(arrival, base), false);
  base.seenStories.push('chapter1-roadside-merchant');
  assert.equal(P.isAvailable(arrival, base), true);

  base.seenStories.push('gate-arrival');
  assert.equal(P.nextNode('story:gate-arrival', base).id, 'gate-stage-1');
  base.completedStages.push('gate-stage-1');
  assert.equal(P.nextNode('stage:gate-stage-1', base).id, 'gate-after-entry');

  base.seenStories.push('gate-after-entry');
  const afterEntry = P.getNode('story:gate-after-entry');
  assert.equal(afterEntry.returnToWorldAfter, true);
  assert.equal(P.nextNode(afterEntry.nodeId, base).id, 'gate-bell-task');

  base.seenStories.push('gate-bell-task');
  assert.equal(P.nextNode('story:gate-bell-task', base).id, 'gate-stage-2');
  base.completedStages.push('gate-stage-2');
  assert.equal(P.nextNode('stage:gate-stage-2', base).id, 'gate-after-bell');

  base.seenStories.push('gate-after-bell');
  const afterBell = P.getNode('story:gate-after-bell');
  assert.equal(afterBell.returnToWorldAfter, true);
  assert.equal(P.nextNode(afterBell.nodeId, base).id, 'gate-route-task');

  base.seenStories.push('gate-route-task');
  assert.equal(P.nextNode('story:gate-route-task', base).id, 'gate-stage-3');
  base.completedStages.push('gate-stage-3');
  assert.equal(P.nextNode('stage:gate-stage-3', base).id, 'gate-after-route');
  base.seenStories.push('gate-after-route');
  assert.equal(P.getNode('story:gate-after-route').returnToWorldAfter, true);
  assert.equal(P.nextNode('story:gate-after-route', base).id, 'gate-cart-task');
});

test('every journey stage node resolves to an implemented tactical stage', () => {
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/content.js'), 'utf8');
  for (const node of P.nodes().filter(node => node.type === 'stage')) {
    assert.ok(source.includes(`id:'${node.id}'`), `missing tactical stage ${node.id}`);
  }
});
