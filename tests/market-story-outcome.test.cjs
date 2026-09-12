const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../src/journey-content.js');
require('../src/market-journey-content.js');
require('../src/market-late-journey-content.js');
require('../src/story-outcome-content.js');
require('../src/market-story-outcome-content.js');

const resolve = (id, stageOutcomes) => StoryOutcomeContent.resolve(
  JourneyContent.STORIES[id], { stageOutcomes }
);

test('M5 after-story reflects the first basket choice', () => {
  const story = resolve('market-after-m5', { 'market-stage-5': { choice: 'basket' } });
  const text = story.beats.map(beat => beat.zh).join('\n');
  assert.match(text, /小籃子/);
  assert.match(text, /分兩趟搬/);
  assert.match(text, /價格/);
  assert.match(text, /價值/);
});

test('M5 after-story reflects the first crate choice', () => {
  const story = resolve('market-after-m5', { 'market-stage-5': { choice: 'crate' } });
  const text = story.beats.map(beat => beat.zh).join('\n');
  assert.match(text, /大木箱/);
  assert.match(text, /一次就搬完/);
});

test('M6 after-story preserves which cargo was chosen and which was deferred', () => {
  const flour = resolve('market-after-m6', { 'market-stage-6': { chosenCargo: 'flour', deferredCargo: 'oil' } });
  const oil = resolve('market-after-m6', { 'market-stage-6': { chosenCargo: 'oil', deferredCargo: 'flour' } });
  assert.match(flour.beats.map(beat => beat.zh).join('\n'), /麵粉先送到/);
  assert.match(flour.beats.map(beat => beat.zh).join('\n'), /燈油還留在原地/);
  assert.match(oil.beats.map(beat => beat.zh).join('\n'), /燈油先送到/);
  assert.match(oil.beats.map(beat => beat.zh).join('\n'), /麵粉還留在原地/);
});

test('missing market outcomes keep the authored fallback story', () => {
  const base = JourneyContent.STORIES['market-after-m5'];
  const resolved = resolve('market-after-m5', {});
  assert.equal(resolved, base);
});
