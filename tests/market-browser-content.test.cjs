const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

test('market content defines M1-M4 and the new target words', () => {
  const sandbox = { WORDS: {}, STAGES: [] };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'src/market-content.js'), 'utf8'), sandbox);
  assert.deepEqual(Array.from(sandbox.STAGES, stage => stage.id), ['market-stage-1', 'market-stage-2', 'market-stage-3', 'market-stage-4']);
  for (const word of ['需求', '足夠', '不足', '數量', '剩下', '交換', '獲得', '買', '賣', '價格']) assert.ok(sandbox.WORDS[word]);
  assert.equal(sandbox.STAGES[0].market.capacity, 1);
  assert.deepEqual(Array.from(sandbox.STAGES[0].grid), ['.....', '.....', '.....', '..S..', '.....']);
  const m1Merchant = sandbox.STAGES[0].market.locations.find(location => location.id === 'merchant');
  const m2Merchant = sandbox.STAGES[1].market.locations.find(location => location.id === 'merchant');
  const m4 = sandbox.STAGES[3];
  assert.equal(m1Merchant.kind, 'npc');
  assert.equal(m1Merchant.labelZh, '行商阿姨');
  assert.equal(m1Merchant.icon, '👩‍🦱');
  assert.equal(m2Merchant.stock.oil, 2);
  assert.equal(sandbox.STAGES[2].market.initialInventory.cloth, 1);
  assert.equal(m4.market.coins, 10);
  assert.equal(m4.milestone, 'inn-unlocked');
  assert.equal(m4.market.locations.find(location => location.id === 'vegetable-stall').sell.price, 3);
  assert.equal(m4.market.locations.find(location => location.id === 'bread-shop').sell.price, 4);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'src/market-content.js'), 'utf8'), /🛒|送貨車|行商的貨車/);
});

test('market renderer centers the hero, distinguishes NPCs, versions stage-local state, and exposes price buying UI', () => {
  const runtime = fs.readFileSync(path.join(root, 'src/market-runtime.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/market-runtime.css'), 'utf8');
  assert.match(runtime, /hero-here/);
  assert.match(runtime, /market-\$\{location\.kind\}/);
  assert.match(runtime, /configKey/);
  assert.match(runtime, /state\.market\.configKey !== M\.configKey\(cfg\)/);
  assert.match(runtime, /action\.type === 'buy'/);
  assert.match(runtime, /<span>價格<\/span>/);
  assert.match(runtime, /錢幣 \$\{state\.market\.coins\}/);
  assert.match(css, /market-floor\.hero-here/);
  assert.match(css, /market-npc/);
  assert.match(css, /market-hero\{[^}]*left:50%[^}]*top:50%[^}]*translate\(-50%,-50%\)/);
});

test('main page preserves old stage order while loading market and inn support in safe order', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const g7Content = html.indexOf('./src/g7-content.js');
  const marketContent = html.indexOf('./src/market-content.js');
  const journeyContent = html.indexOf('./src/journey-content.js');
  const marketJourney = html.indexOf('./src/market-journey-content.js');
  const progress = html.indexOf('./src/journey-progress.js');
  const app = html.indexOf('./src/app.js');
  const marketRuntime = html.indexOf('./src/market-runtime.js');
  const flow = html.indexOf('./src/flow-runtime.js');
  const worldRuntime = html.indexOf('./src/world-runtime.js');
  const innRuntime = html.indexOf('./src/world-inn-runtime.js');
  assert.ok(g7Content > 0 && g7Content < marketContent, 'new market stages must be appended after existing G7 content');
  assert.ok(marketContent < journeyContent);
  assert.ok(marketJourney > journeyContent && marketJourney < progress);
  assert.ok(marketRuntime > app && marketRuntime < flow);
  assert.ok(innRuntime > worldRuntime, 'inn marker should layer on top of the existing world renderer');
  assert.match(html, /market-runtime\.css\?v=\d{8}-[^"<]+/);
  assert.match(html, /market-runtime\.js\?v=\d{8}-[^"<]+/);
  assert.match(html, /market-content\.js\?v=\d{8}-[^"<]+/);
  assert.match(html, /world-inn\.css\?v=\d{8}-[^"<]+/);
  assert.match(html, /world-inn-runtime\.js\?v=\d{8}-[^"<]+/);
});
