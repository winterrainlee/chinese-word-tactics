const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../src/journey-content.js');
require('../src/workshop-journey-content.js');
require('../src/workshop-late-journey-content.js');
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
  textContent: '',
  dataset: {},
  addEventListener() {},
  setAttribute() {},
  querySelector() { return { textContent: '' }; }
}).get(id);
globalThis.document = { getElementById: element, querySelectorAll: () => [] };
globalThis.STAGES = [{ id: 'workshop-stage-7', milestone: 'workshop-core', story: '' }];
globalThis.StoryRuntime = { stop() {}, play() {} };
globalThis.JourneyRuntime = { render() {} };
globalThis.TacticalGame = {
  hasSavedGame: false,
  showView() {}, showWorld() {}, closeSheet() {}, openSheet() {}, playStage() { return true; }
};
globalThis.scrollTo = () => {};

require('../src/flow-runtime.js');

test('W7 records workshop-core only on first-play completion and remains idempotent', () => {
  GameFlow.recordStageComplete('workshop-stage-7', { mode: 'replay' });
  assert.deepEqual(GameFlow.progress().completedMilestones, []);

  GameFlow.recordStageComplete('workshop-stage-7', { mode: 'first-play' });
  GameFlow.recordStageComplete('workshop-stage-7', { mode: 'first-play' });
  assert.deepEqual(GameFlow.progress().completedStages, ['workshop-stage-7']);
  assert.deepEqual(GameFlow.progress().completedMilestones, ['workshop-core']);
  const saved = JSON.parse(data.get(JourneyProgress.KEY));
  assert.deepEqual(saved.completedMilestones, ['workshop-core']);
});