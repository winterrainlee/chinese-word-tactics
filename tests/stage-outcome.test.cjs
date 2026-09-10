const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/journey-content.js');
require('../src/journey-progress.js');
const P = globalThis.JourneyProgress;
const storage = seed => {
  const data = new Map(Object.entries(seed || {}));
  return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), data };
};

test('first-play G3 outcome is saved once and replay cannot overwrite it', () => {
  const disk = storage(), store = P.createStore(disk), node = P.getNode('stage:gate-stage-3');
  store.complete(node, 'first-play', { routeChoices: ['west'], viaIds: ['west-post'] });
  assert.deepEqual(store.get().stageOutcomes['gate-stage-3'], { routeChoices: ['west'], viaIds: ['west-post'] });

  const before = disk.getItem(P.KEY);
  store.complete(node, 'replay', { routeChoices: ['east'], viaIds: ['east-post'] });
  assert.equal(disk.getItem(P.KEY), before);
  assert.deepEqual(store.get().stageOutcomes['gate-stage-3'].viaIds, ['west-post']);

  store.complete(node, 'first-play', { routeChoices: ['east'], viaIds: ['east-post'] });
  assert.deepEqual(store.get().stageOutcomes['gate-stage-3'].viaIds, ['west-post']);
});

test('G3 outcome can recover from the tactical save created before outcome persistence existed', () => {
  const progress = JSON.stringify({ completedStages: ['gate-stage-3'] });
  const legacy = JSON.stringify({
    completed: ['gate-stage-3'],
    state: { routeChoices: ['east'], viaIds: ['east-post'] }
  });
  const store = P.createStore(storage({ [P.KEY]: progress, 'chufa-tutorial-v03': legacy }));
  assert.deepEqual(store.get().stageOutcomes['gate-stage-3'], {
    viaIds: ['east-post'], routeChoices: ['east']
  });
});

test('stage outcomes normalize to small JSON-safe records', () => {
  const p = P.normalize({ stageOutcomes: {
    'gate-stage-3': { viaIds: ['west-post', 'west-post', 3], routeChoices: ['west'], nested: { bad: true } },
    bad: 'not-an-object'
  }});
  assert.deepEqual(p.stageOutcomes, {
    'gate-stage-3': { viaIds: ['west-post'], routeChoices: ['west'] }
  });
});
