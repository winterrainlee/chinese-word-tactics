const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('late market content defines M5-M8 and keeps M8 as the market core milestone', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(read('src/market-content.js'), sandbox);
  vm.runInNewContext(read('src/market-late-content.js'), sandbox);
  assert.deepEqual(Array.from(sandbox.STAGES.slice(-4), stage => stage.id), [
    'market-stage-5', 'market-stage-6', 'market-stage-7', 'market-stage-8'
  ]);
  for (const word of ['價值', '選擇', '放棄', '分配', '補充']) assert.ok(sandbox.WORDS[word]);
  assert.equal(sandbox.STAGES.find(stage => stage.id === 'market-stage-8').milestone, 'market-core');
  assert.deepEqual(
    Object.fromEntries(Object.entries(sandbox.STAGES.find(stage => stage.id === 'market-stage-5').market.outcomeDecisions)),
    { choice: 'tool' }
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(sandbox.STAGES.find(stage => stage.id === 'market-stage-6').market.outcomeDecisions)),
    { chosenCargo: 'cargo', deferredCargo: 'deferredCargo' }
  );
});

test('M7 and M8 use six-column boards with varied replenishment quantities', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(read('src/market-content.js'), sandbox);
  vm.runInNewContext(read('src/market-late-content.js'), sandbox);
  const m7 = sandbox.STAGES.find(stage => stage.id === 'market-stage-7');
  const m8 = sandbox.STAGES.find(stage => stage.id === 'market-stage-8');
  assert.equal(m7.grid[0].length, 6);
  assert.equal(m8.grid[0].length, 6);
  assert.equal(m7.market.capacity, 3);
  assert.equal(m7.market.locations.find(location => location.id === 'bakery').needs.flour, 3);
  assert.equal(m7.market.locations.find(location => location.id === 'bakery').stock.flour, 1);
  assert.equal(m7.market.locations.find(location => location.id === 'oil-stall').needs.oil, 4);
  assert.equal(m7.market.locations.find(location => location.id === 'oil-stall').stock.oil, 1);
  assert.equal(m7.market.locations.find(location => location.id === 'late-goods').stock.flour, 2);
  assert.equal(m7.market.locations.find(location => location.id === 'late-goods').stock.oil, 3);
  assert.equal(m8.market.locations.find(location => location.id === 'bakery').needs.flour, 2);
  assert.equal(m8.market.locations.find(location => location.id === 'late-goods').stock.flour, 2);
  assert.match(read('src/market-runtime.js'), /market-grid-wide/);
  assert.match(read('src/market-runtime.css'), /market-grid\.market-grid-wide/);
  assert.match(read('src/market-runtime.css'), /44px/);
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

test('index loads late market data and state visuals in dependency order', () => {
  const html = read('index.html');
  const market = html.indexOf('./src/market-content.js');
  const late = html.indexOf('./src/market-late-content.js');
  const journey = html.indexOf('./src/journey-content.js');
  const marketJourney = html.indexOf('./src/market-journey-content.js');
  const lateJourney = html.indexOf('./src/market-late-journey-content.js');
  const progress = html.indexOf('./src/journey-progress.js');
  const baseOutcome = html.indexOf('./src/story-outcome-content.js');
  const marketOutcome = html.indexOf('./src/market-story-outcome-content.js');
  const storyRuntime = html.indexOf('./src/story-runtime.js');
  const marketRuntime = html.indexOf('./src/market-runtime.js');
  const marketVisuals = html.indexOf('./src/market-state-visuals.js');
  const flowRuntime = html.indexOf('./src/flow-runtime.js');

  assert.ok(market < late && late < journey);
  assert.ok(marketJourney < lateJourney && lateJourney < progress);
  assert.ok(baseOutcome < marketOutcome && marketOutcome < storyRuntime);
  assert.ok(marketRuntime < marketVisuals && marketVisuals < flowRuntime);
  assert.match(html, /name="cwt-build" content="\d{4}-\d{2}-\d{2}-marketm8r\d+"/);
  assert.match(html, /market-late-content\.js\?v=20260912-marketm8r2/);
  assert.match(html, /market-state-visuals\.js\?v=20260912-marketm8r2/);
  assert.match(html, /market-state-visuals\.css\?v=20260912-marketm8r2/);
});

test('M8 keeps synthesis compact instead of adding a new target vocabulary family', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(read('src/market-content.js'), sandbox);
  vm.runInNewContext(read('src/market-late-content.js'), sandbox);
  const m8 = sandbox.STAGES.find(stage => stage.id === 'market-stage-8');
  assert.deepEqual(Array.from(m8.words), ['需求', '交換', '買', '分配']);
  assert.equal(m8.words.every(word => sandbox.WORDS[word]), true);
});
