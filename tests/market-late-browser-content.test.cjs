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

test('M7 and M8 use six-column boards that the market renderer explicitly supports', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(read('src/market-content.js'), sandbox);
  vm.runInNewContext(read('src/market-late-content.js'), sandbox);
  assert.equal(sandbox.STAGES.find(stage => stage.id === 'market-stage-7').grid[0].length, 6);
  assert.equal(sandbox.STAGES.find(stage => stage.id === 'market-stage-8').grid[0].length, 6);
  assert.match(read('src/market-runtime.js'), /market-grid-wide/);
  assert.match(read('src/market-runtime.css'), /market-grid\.market-grid-wide/);
  assert.match(read('src/market-runtime.css'), /44px/);
});

test('index loads late market data, late journey, outcome resolver, and cache-busted runtime in dependency order', () => {
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
  const flowRuntime = html.indexOf('./src/flow-runtime.js');

  assert.ok(market < late && late < journey);
  assert.ok(marketJourney < lateJourney && lateJourney < progress);
  assert.ok(baseOutcome < marketOutcome && marketOutcome < storyRuntime);
  assert.ok(marketRuntime < flowRuntime);
  assert.match(html, /name="cwt-build" content="2026-09-12-marketm8r1"/);
  assert.match(html, /market-runtime\.js\?v=20260912-marketm8r1/);
  assert.match(html, /flow-runtime\.js\?v=20260912-marketm8r1/);
});

test('M8 keeps synthesis compact instead of adding a new target vocabulary family', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(read('src/market-content.js'), sandbox);
  vm.runInNewContext(read('src/market-late-content.js'), sandbox);
  const m8 = sandbox.STAGES.find(stage => stage.id === 'market-stage-8');
  assert.deepEqual(Array.from(m8.words), ['需求', '交換', '買', '分配']);
  assert.equal(m8.words.every(word => sandbox.WORDS[word]), true);
});
