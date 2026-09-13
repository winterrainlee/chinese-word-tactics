const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('late market content defines M5-M8 and keeps M8 as the market core milestone', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(read('src/market-content.js'), sandbox);
  vm.runInNewContext(read('src/market-late-content.js'), sandbox);
  const late = sandbox.STAGES.filter(stage => /^market-stage-[5-8]$/.test(stage.id));
  assert.deepEqual(Array.from(late, stage => stage.id), ['market-stage-5','market-stage-6','market-stage-7','market-stage-8']);
  assert.equal(late.at(-1).milestone, 'market-core');
});

test('M6 visibly deactivates the deferred cargo after a choice', () => {
  const css = read('src/market-state-visuals.css');
  const runtime = read('src/market-runtime.js');
  assert.match(css, /market-deferred/); assert.match(runtime, /market-deferred/); assert.match(runtime, /aria-disabled/); assert.match(runtime, /放棄/);
});

test('M7 and M8 use six-column boards with varied replenishment quantities and surplus stock', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(read('src/market-content.js'), sandbox); vm.runInNewContext(read('src/market-late-content.js'), sandbox);
  for (const id of ['market-stage-7','market-stage-8']) assert.equal(sandbox.STAGES.find(item => item.id === id).grid[0].length, 6);
  const m7 = sandbox.STAGES.find(item => item.id === 'market-stage-7');
  assert.equal(m7.market.locations.find(location => location.id === 'bakery').needs.flour, 3);
  assert.ok(m7.market.locations.some(location => (location.stock?.flour || 0) > 0));
});

test('market state visuals keep inspected stock and need counts on the board and pulse changed locations', () => {
  const runtime = read('src/market-state-visuals.js'), css = read('src/market-state-visuals.css');
  assert.match(runtime, /market-stock-badge/); assert.match(runtime, /market-stock-full/); assert.match(runtime, /market-stock-short/); assert.match(runtime, /market-resource-changed/); assert.match(runtime, /inspected/); assert.match(css, /market-stock-short/); assert.match(css, /market-stock-full/); assert.match(css, /marketResourcePulse/);
});

test('index loads market, lexicon, continuous flow, state visuals and UX layers in dependency order', () => {
  const html = read('index.html');
  const market = html.indexOf('./src/market-content.js'), late = html.indexOf('./src/market-late-content.js'), lexiconContent = html.indexOf('./src/lexicon-content.js'), journey = html.indexOf('./src/journey-content.js'), marketJourney = html.indexOf('./src/market-journey-content.js'), lateJourney = html.indexOf('./src/market-late-journey-content.js'), continuous = html.indexOf('./src/continuous-region-flow.js'), progress = html.indexOf('./src/journey-progress.js'), baseOutcome = html.indexOf('./src/story-outcome-content.js'), marketOutcome = html.indexOf('./src/market-story-outcome-content.js'), storyRuntime = html.indexOf('./src/story-runtime.js'), appRuntime = html.indexOf('./src/app.js'), lexiconRuntime = html.indexOf('./src/lexicon-runtime.js'), marketRuntime = html.indexOf('./src/market-runtime.js'), marketVisuals = html.indexOf('./src/market-state-visuals.js'), flowRuntime = html.indexOf('./src/flow-runtime.js'), uxRuntime = html.indexOf('./src/ux-play-runtime.js');
  assert.ok(market < late && late < lexiconContent && lexiconContent < journey);
  assert.ok(marketJourney < lateJourney && lateJourney < continuous && continuous < progress);
  assert.ok(baseOutcome < marketOutcome && marketOutcome < storyRuntime);
  assert.ok(appRuntime < lexiconRuntime && lexiconRuntime < marketRuntime);
  assert.ok(marketRuntime < marketVisuals && marketVisuals < flowRuntime && flowRuntime < uxRuntime);
  assert.match(html, /name="cwt-build" content="2026-09-13-landing1"/);
  assert.match(html, /lexicon-content\.js\?v=20260913-lexicon1/); assert.match(html, /lexicon-runtime\.js\?v=20260913-lexicon1/); assert.match(html, /lexicon\.css\?v=20260913-lexicon2/);
  assert.match(html, /market-late-content\.js\?v=20260912-marketm8r3/); assert.match(html, /market-runtime\.js\?v=20260912-marketm8r3/); assert.match(html, /market-state-visuals\.js\?v=20260912-marketm8r3/); assert.match(html, /market-state-visuals\.css\?v=20260912-marketm8r3/); assert.match(html, /continuous-region-flow\.js\?v=20260912-uxflow1/); assert.match(html, /ux-play-runtime\.js\?v=20260912-uxflow3/);
});

test('M8 keeps synthesis compact instead of adding a new target vocabulary family', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(read('src/market-content.js'), sandbox); vm.runInNewContext(read('src/market-late-content.js'), sandbox);
  const m8 = sandbox.STAGES.find(stage => stage.id === 'market-stage-8');
  assert.deepEqual(Array.from(m8.words), ['需求', '交換', '買', '分配']); assert.equal(m8.words.every(word => sandbox.WORDS[word]), true);
});