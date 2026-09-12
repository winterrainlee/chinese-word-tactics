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
  assert.deepEqual(Array.from(sandbox.STAGES[0].grid), ['.....', '.....', '.....', '..S..', '.....']);
  const m1Merchant = sandbox.STAGES[0].market.locations.find(location => location.id === 'merchant');
  const m2Merchant = sandbox.STAGES[1].market.locations.find(location => location.id === 'merchant');
  assert.equal(m1Merchant.kind, 'npc');
  assert.equal(m1Merchant.labelZh, '行商阿姨');
  assert.equal(m1Merchant.icon, '👩‍🦱');
  assert.equal(m2Merchant.stock.oil, 2);
  assert.equal(sandbox.STAGES[2].market.initialInventory.cloth, 1);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'src/market-content.js'), 'utf8'), /🛒|送貨車|行商的貨車/);
});

test('market renderer centers the hero and distinguishes a visible NPC tile', () => {
  const runtime = fs.readFileSync(path.join(root, 'src/market-runtime.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/market-runtime.css'), 'utf8');
  assert.match(runtime, /hero-here/);
  assert.match(runtime, /market-\$\{location\.kind\}/);
  assert.match(css, /market-floor\.hero-here/);
  assert.match(css, /market-npc/);
  assert.match(css, /market-hero\{[^}]*left:50%[^}]*top:50%[^}]*translate\(-50%,-50%\)/);
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
  assert.match(html, /market-runtime\.css\?v=20260912-marketnpc1/);
  assert.match(html, /market-content\.js\?v=20260912-marketnpc1/);
});
