const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../src/journey-content.js');
require('../src/g7-journey-content.js');
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
globalThis.STAGES = [{ id: 'gate-stage-7', milestone: 'gate-core', story: '' }];
globalThis.StoryRuntime = { stop() {}, play() {} };
globalThis.JourneyRuntime = { render() {} };
globalThis.TacticalGame = {
  hasSavedGame: false,
  showView() {}, showWorld() {}, closeSheet() {}, openSheet() {}, playStage() { return true; }
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
