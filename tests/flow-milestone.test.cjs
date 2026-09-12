const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../src/journey-content.js');
require('../src/g7-journey-content.js');
require('../src/market-journey-content.js');
require('../src/market-late-journey-content.js');
require('../src/journey-progress.js');

const data = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: key => data.get(key) || null,
  setItem: (key, value) => data.set(key, value),
  removeItem: key => data.delete(key)
};
const elements = new Map();
const element = id => elements.get(id) || elements.set(id, {
  hidden: false,
  dataset: {},
  addEventListener() {},
  setAttribute() {},
  querySelector() { return { textContent: '' }; }
}).get(id);
globalThis.document = { getElementById: element, querySelectorAll: () => [] };
globalThis.STAGES = [
  { id: 'gate-stage-7', milestone: 'gate-core', story: '' },
  { id: 'market-stage-4', milestone: 'inn-unlocked', story: '' },
  { id: 'market-stage-5', story: '' },
  { id: 'market-stage-6', story: '' },
  { id: 'market-stage-8', milestone: 'market-core', story: '' }
];
globalThis.StoryRuntime = { stop() {}, play() {} };
globalThis.JourneyRuntime = { render() {} };
const outcomes = {
  'market-stage-5': { choice: 'basket' },
  'market-stage-6': { chosenCargo: 'flour', deferredCargo: 'oil' }
};
globalThis.TacticalGame = {
  hasSavedGame: false,
  showView() {}, showWorld() {}, closeSheet() {}, openSheet() {}, playStage() { return true; },
  stageOutcome(id) { return outcomes[id] || null; }
};
globalThis.scrollTo = () => {};

require('../src/flow-runtime.js');

test('flow records the tactical stage milestone only for first-play completion', () => {
  GameFlow.recordStageComplete('gate-stage-7', { mode: 'replay' });
  assert.deepEqual(GameFlow.progress().completedMilestones, []);

  GameFlow.recordStageComplete('gate-stage-7', { mode: 'first-play' });
  assert.deepEqual(GameFlow.progress().completedStages, ['gate-stage-7']);
  assert.deepEqual(GameFlow.progress().completedMilestones, ['gate-core']);
  assert.deepEqual(JSON.parse(data.get(JourneyProgress.KEY)).completedMilestones, ['gate-core']);
});

test('M4 unlocks the inn only on the first campaign clear', () => {
  GameFlow.recordStageComplete('market-stage-4', { mode: 'replay' });
  assert.deepEqual(GameFlow.progress().completedMilestones, ['gate-core']);

  GameFlow.recordStageComplete('market-stage-4', { mode: 'first-play' });
  assert.ok(GameFlow.progress().completedStages.includes('market-stage-4'));
  assert.deepEqual(GameFlow.progress().completedMilestones, ['gate-core', 'inn-unlocked']);

  GameFlow.recordStageComplete('market-stage-4', { mode: 'first-play' });
  assert.deepEqual(GameFlow.progress().completedMilestones, ['gate-core', 'inn-unlocked']);
});

test('M5 and M6 save their first campaign choices and replay cannot overwrite them', () => {
  GameFlow.recordStageComplete('market-stage-5', { mode: 'first-play' });
  GameFlow.recordStageComplete('market-stage-6', { mode: 'first-play' });
  assert.deepEqual(GameFlow.progress().stageOutcomes['market-stage-5'], { choice: 'basket' });
  assert.deepEqual(GameFlow.progress().stageOutcomes['market-stage-6'], { chosenCargo: 'flour', deferredCargo: 'oil' });

  outcomes['market-stage-5'] = { choice: 'crate' };
  outcomes['market-stage-6'] = { chosenCargo: 'oil', deferredCargo: 'flour' };
  GameFlow.recordStageComplete('market-stage-5', { mode: 'replay' });
  GameFlow.recordStageComplete('market-stage-6', { mode: 'replay' });
  assert.deepEqual(GameFlow.progress().stageOutcomes['market-stage-5'], { choice: 'basket' });
  assert.deepEqual(GameFlow.progress().stageOutcomes['market-stage-6'], { chosenCargo: 'flour', deferredCargo: 'oil' });
});

test('M8 awards market-core only on first campaign completion', () => {
  GameFlow.recordStageComplete('market-stage-8', { mode: 'replay' });
  assert.equal(GameFlow.progress().completedMilestones.includes('market-core'), false);

  GameFlow.recordStageComplete('market-stage-8', { mode: 'first-play' });
  assert.equal(GameFlow.progress().completedMilestones.includes('market-core'), true);
  assert.ok(GameFlow.progress().completedStages.includes('market-stage-8'));
});
