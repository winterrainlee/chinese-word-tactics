const { test } = require('node:test');
const assert = require('node:assert/strict');

globalThis.WORDS = {};
globalThis.STAGES = [];
globalThis.JourneyContent = { STORIES: {} };
require('../src/market-content.js');
require('../src/market-late-content.js');
require('../src/market-runtime.js');
require('../src/market-inference-runtime.js');

const M = globalThis.MarketMechanic;
const L = globalThis.MarketLearningScaffold;
const stage = id => STAGES.find(item => item.id === id);
const inspect = (cfg, state, ...ids) => ids.reduce((next, id) => M.inspectLocation(cfg, next, id).state, state);
const act = (cfg, state, action) => M.applyAction(cfg, state, action).state;

test('M4 requires comparing all three prices before the purchase UI unlocks', () => {
  const m4 = stage('market-stage-4');
  const cfg = m4.market;
  assert.equal(cfg.revision, 2);
  assert.equal(cfg.coins, 8);
  const sellers = cfg.locations.filter(location => location.sell);
  assert.deepEqual(sellers.map(location => location.sell.price).sort((a, b) => a - b), [3, 4, 6]);

  let state = M.createState(cfg);
  for (const seller of sellers) assert.equal(L.purchaseUnlocked(seller, state, cfg), false);
  state = inspect(cfg, state, 'vegetable-stall', 'bread-shop', 'bread-shop-premium');
  for (const seller of sellers) assert.equal(L.purchaseUnlocked(seller, state, cfg), true);
});

test('M4 expensive bread is a legal but losing first purchase, while the cheaper bread leaves enough for vegetables', () => {
  const cfg = stage('market-stage-4').market;
  let state = inspect(cfg, M.createState(cfg), 'vegetable-stall', 'bread-shop', 'bread-shop-premium');

  const expensive = M.applyAction(cfg, state, { type: 'buy', location: 'bread-shop-premium' });
  assert.equal(expensive.changed, true);
  assert.equal(expensive.state.coins, 2);
  const noVegetables = M.applyAction(cfg, expensive.state, { type: 'buy', location: 'vegetable-stall' });
  assert.equal(noVegetables.changed, false);
  assert.equal(noVegetables.reason, 'insufficient-coins');

  state = inspect(cfg, M.createState(cfg), 'vegetable-stall', 'bread-shop', 'bread-shop-premium');
  state = act(cfg, state, { type: 'buy', location: 'bread-shop' });
  state = act(cfg, state, { type: 'buy', location: 'vegetable-stall' });
  assert.equal(state.coins, 1);
  state = act(cfg, state, { type: 'put', location: 'innkeeper', item: 'bread' });
  state = act(cfg, state, { type: 'put', location: 'innkeeper', item: 'vegetable' });
  assert.equal(M.isSolved(cfg, state), true);
});

test('M7 splits the same flour supply across two destinations and leaves one bag behind', () => {
  const cfg = stage('market-stage-7').market;
  const initial = M.createState(cfg);
  assert.equal(cfg.revision, 5);
  assert.equal(M.needAt(cfg, 'bakery', 'flour') - M.stockAt(initial, 'bakery', 'flour'), 2);
  assert.equal(M.needAt(cfg, 'noodle-stall', 'flour') - M.stockAt(initial, 'noodle-stall', 'flour'), 1);
  assert.equal(M.stockAt(initial, 'late-goods', 'flour'), 4);
  assert.equal(cfg.locations.some(location => location.limitToNeed), false);
});

test('M7 allows overfilling, leaves the error visible, and lets the player recover the excess', () => {
  const cfg = stage('market-stage-7').market;
  let state = inspect(cfg, M.createState(cfg), 'bakery', 'noodle-stall', 'oil-stall', 'late-goods');

  state = act(cfg, state, { type: 'take', location: 'late-goods', item: 'flour', qty: 3 });
  state = act(cfg, state, { type: 'put', location: 'bakery', item: 'flour', qty: 3 });
  assert.equal(M.stockAt(state, 'bakery', 'flour'), 4);
  assert.equal(M.isSolved(cfg, state), false);

  const recover = M.applyAction(cfg, state, { type: 'take', location: 'bakery', item: 'flour' });
  assert.equal(recover.changed, true);
  state = recover.state;
  assert.equal(M.stockAt(state, 'bakery', 'flour'), 3);
  state = act(cfg, state, { type: 'put', location: 'noodle-stall', item: 'flour' });
  assert.equal(M.stockAt(state, 'noodle-stall', 'flour'), 2);
  assert.equal(M.stockAt(state, 'late-goods', 'flour'), 1);

  state = act(cfg, state, { type: 'take', location: 'late-goods', item: 'oil', qty: 3 });
  state = act(cfg, state, { type: 'put', location: 'oil-stall', item: 'oil', qty: 3 });
  state = act(cfg, state, { type: 'take', location: 'late-goods', item: 'cloth' });
  state = act(cfg, state, { type: 'put', location: 'warehouse', item: 'cloth' });

  assert.equal(M.stockAt(state, 'bakery', 'flour'), 3);
  assert.equal(M.stockAt(state, 'noodle-stall', 'flour'), 2);
  assert.equal(M.stockAt(state, 'oil-stall', 'oil'), 4);
  assert.equal(M.stockAt(state, 'warehouse', 'cloth'), 1);
  assert.equal(M.stockAt(state, 'late-goods', 'flour'), 1);
  assert.equal(M.isSolved(cfg, state), true);
});
