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
  assert.match(css, /market-deferred/);
  assert.match(runtime, /market-deferred/);
  assert.match(runtime, /aria-disabled/);
  assert.match(runtime, /放棄/);
});

test('M7 and M8 use six-column boards with varied replenishment quantities and surplus stock', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(read('src/market-content.js'), sandbox);
  vm.runInNewContext(read('src/market-late-content.js'), sandbox);
  for (const id of ['market-stage-7','market-stage-8']) {
    const stage = sandbox.STAGES.find(item => item.id === id);
    assert.equal(stage.grid[0].length, 6);
  }
  const m7 = sandbox.STAGES.find(item => item.id === 'market-stage-7');
  const bread = m7.market.locations.find(location => location.id === 'bakery');
  assert.equal(bread.needs.flour, 3);
  assert.ok(m7.market.locations.some(location => (location.stock?.flour || 0) > 0));
});

test('market state visuals keep inspected stock and need counts on the board and pulse changed locations', () => {
  const runtime = read('src/market-state-visuals.js');
  const css = read('src/market-state-visuals.css');
  assert.match(runtime, /market-stock-badge/);
  assert.match(runtime, /market-stock-full/);
  assert.match(runtime, /market-stock-short/);
  assert.match(runtime, /market-resource-changed/);
  assert.match(runtime, /inspected/);
  assert.match(css, /market-stock-short/);
  assert.match(css, /market-stock-full/);
  assert.match(css, /marketResourcePulse/);
});

test('index loads late market data, continuous flow, state visuals and UX layer in dependency order', () => {
  const html = read('index.html');
  const market = html.indexOf('./src/market-content.js');
  const late = html.indexOf('./src/market-late-content.js');
  const journey = html.indexOf('./src/journey-content.js');
  const marketJourney = html.indexOf('./src/market-journey-content.js');
  const lateJourney = html.indexOf('./src/market-late-journey-content.js');
  const continuous = html.indexOf('./src/continuous-region-flow.js');
  const progress = html.indexOf('./src/journey-progress.js');
  const baseOutcome = html.indexOf('./src/story-outcome-content.js');
  const marketOutcome = html.indexOf('./src/market-story-outcome-content.js');
  const storyRuntime = html.indexOf('./src/story-runtime.js');
  const marketRuntime = html.indexOf('./src/market-runtime.js');
  const marketVisuals = html.indexOf('./src/market-state-visuals.js');
  const flowRuntime = html.indexOf('./src/flow-runtime.js');
  const uxRuntime = html.indexOf('./src/ux-play-runtime.js');

  assert.ok(market < late && late < journey);
  assert.ok(marketJourney < lateJourney && lateJourney < continuous && continuous < progress);
  assert.ok(baseOutcome < marketOutcome && marketOutcome < storyRuntime);
  assert.ok(marketRuntime < marketVisuals && marketVisuals < flowRuntime && flowRuntime < uxRuntime);
  assert.match(html, /name="cwt-build" content="2026-09-12-uxflow1"/);
  assert.match(html, /market-late-content\.js\?v=20260912-marketm8r3/);
  assert.match(html, /market-runtime\.js\?v=20260912-marketm8r3/);
  assert.match(html, /market-state-visuals\.js\?v=20260912-marketm8r3/);
  assert.match(html, /market-state-visuals\.css\?v=20260912-marketm8r3/);
  assert.match(html, /continuous-region-flow\.js\?v=20260912-uxflow1/);
  assert.match(html, /ux-play-runtime\.js\?v=20260912-uxflow1/);
});

test('M8 keeps synthesis compact instead of adding a new target vocabulary family', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(read('src/market-content.js'), sandbox);
  vm.runInNewContext(read('src/market-late-content.js'), sandbox);
  const m8 = sandbox.STAGES.find(stage => stage.id === 'market-stage-8');
  assert.deepEqual(Array.from(m8.words), ['需求', '交換', '買', '分配']);
  assert.equal(m8.words.every(word => sandbox.WORDS[word]), true);
});