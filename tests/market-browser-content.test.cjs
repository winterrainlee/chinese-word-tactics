const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

test('market content defines M1-M3 and the new target words', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'src/market-content.js'), 'utf8'), sandbox);
  assert.deepEqual(Array.from(sandbox.STAGES, stage => stage.id), ['market-stage-1', 'market-stage-2', 'market-stage-3']);
  for (const word of ['需求', '足夠', '不足', '數量', '剩下', '交換', '獲得']) assert.ok(sandbox.WORDS[word]);
  assert.equal(sandbox.STAGES[0].market.capacity, 1);
  assert.equal(sandbox.STAGES[1].market.locations.find(location => location.id === 'merchant-cart').stock.oil, 2);
  assert.equal(sandbox.STAGES[2].market.initialInventory.cloth, 1);
});

test('main page preserves old stage order while loading market data before journey helpers', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const g7Content = html.indexOf('./src/g7-content.js');
  const marketContent = html.indexOf('./src/market-content.js');
  const journeyContent = html.indexOf('./src/journey-content.js');
  const marketJourney = html.indexOf('./src/market-journey-content.js');
  const progress = html.indexOf('./src/journey-progress.js');
  const app = html.indexOf('./src/app.js');
  const marketRuntime = html.indexOf('./src/market-runtime.js');
  const flow = html.indexOf('./src/flow-runtime.js');
  assert.ok(g7Content > 0 && g7Content < marketContent, 'new market stages must be appended after existing G7 content');
  assert.ok(marketContent < journeyContent);
  assert.ok(marketJourney > journeyContent && marketJourney < progress);
  assert.ok(marketRuntime > app && marketRuntime < flow);
});
