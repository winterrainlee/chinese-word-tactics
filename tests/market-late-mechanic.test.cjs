const { test } = require('node:test');
const assert = require('node:assert/strict');

globalThis.WORDS = {};
globalThis.STAGES = [];
require('../src/market-content.js');
require('../src/market-late-content.js');
require('../src/market-runtime.js');
const M = globalThis.MarketMechanic;
const stage = id => STAGES.find(item => item.id === id).market;

const inspect = (cfg, state, ...ids) => ids.reduce((next, id) => M.inspectLocation(cfg, next, id).state, state);
const act = (cfg, state, action) => M.applyAction(cfg, state, action).state;

test('M5 requires comparing both tools and accepts the cheaper two-trip choice', () => {
  const cfg = stage('market-stage-5');
  let state = M.createState(cfg);
  const early = M.applyAction(cfg, state, { type: 'choose', location: 'small-basket' });
  assert.equal(early.changed, false);
  assert.equal(early.reason, 'choice-requires');

  state = inspect(cfg, state, 'small-basket', 'large-crate');
  state = act(cfg, state, { type: 'choose', location: 'small-basket' });
  assert.equal(state.decisions.tool, 'basket');
  assert.equal(state.coins, 5);
  assert.equal(M.capacityLimit(cfg, state), 2);

  state = act(cfg, state, { type: 'take', location: 'cargo', item: 'package' });
  state = act(cfg, state, { type: 'take', location: 'cargo', item: 'package' });
  state = act(cfg, state, { type: 'put', location: 'destination', item: 'package' });
  state = act(cfg, state, { type: 'put', location: 'destination', item: 'package' });
  state = act(cfg, state, { type: 'take', location: 'cargo', item: 'package' });
  state = act(cfg, state, { type: 'put', location: 'destination', item: 'package' });
  assert.equal(M.isSolved(cfg, state), true);
});

test('M5 also accepts the expensive one-trip crate choice', () => {
  const cfg = stage('market-stage-5');
  let state = inspect(cfg, M.createState(cfg), 'small-basket', 'large-crate');
  state = act(cfg, state, { type: 'choose', location: 'large-crate' });
  assert.equal(state.decisions.tool, 'crate');
  assert.equal(state.coins, 2);
  assert.equal(M.capacityLimit(cfg, state), 3);
  state = act(cfg, state, { type: 'take', location: 'cargo', item: 'package', qty: 3 });
  state = act(cfg, state, { type: 'put', location: 'destination', item: 'package', qty: 3 });
  assert.equal(M.isSolved(cfg, state), true);
});

test('M6 choosing flour defers oil without deleting it', () => {
  const cfg = stage('market-stage-6');
  let state = M.createState(cfg);
  state = act(cfg, state, { type: 'choose', location: 'flour-load' });
  assert.equal(state.decisions.cargo, 'flour');
  assert.equal(state.decisions.deferredCargo, 'oil');
  assert.equal(M.stockAt(state, 'oil-load', 'oil'), 1);

  const blocked = M.applyAction(cfg, state, { type: 'take', location: 'oil-load', item: 'oil' });
  assert.equal(blocked.changed, false);
  assert.equal(blocked.reason, 'choice-required');

  state = act(cfg, state, { type: 'take', location: 'flour-load', item: 'flour' });
  state = act(cfg, state, { type: 'put', location: 'bakery', item: 'flour' });
  assert.equal(M.isSolved(cfg, state), true);
  assert.equal(M.stockAt(state, 'oil-load', 'oil'), 1);
});

test('M6 choosing oil is equally valid and leaves flour for the next trip', () => {
  const cfg = stage('market-stage-6');
  let state = M.createState(cfg);
  state = act(cfg, state, { type: 'choose', location: 'oil-load' });
  state = act(cfg, state, { type: 'take', location: 'oil-load', item: 'oil' });
  state = act(cfg, state, { type: 'put', location: 'oil-stall', item: 'oil' });
  assert.equal(M.isSolved(cfg, state), true);
  assert.equal(state.decisions.deferredCargo, 'flour');
  assert.equal(M.stockAt(state, 'flour-load', 'flour'), 1);
});

test('M7 mixes one-, two-, and three-unit shortages across three carrying trips', () => {
  const cfg = stage('market-stage-7');
  const initial = M.createState(cfg);
  assert.equal(M.capacityLimit(cfg, initial), 3);
  assert.equal(M.needAt(cfg, 'bakery', 'flour') - M.stockAt(initial, 'bakery', 'flour'), 2);
  assert.equal(M.needAt(cfg, 'oil-stall', 'oil') - M.stockAt(initial, 'oil-stall', 'oil'), 3);

  let state = initial;
  state = act(cfg, state, { type: 'take', location: 'late-goods', item: 'flour' });
  state = act(cfg, state, { type: 'take', location: 'late-goods', item: 'vegetable' });
  state = act(cfg, state, { type: 'take', location: 'late-goods', item: 'oil' });
  const wrong = M.applyAction(cfg, state, { type: 'put', location: 'bakery', item: 'vegetable' });
  assert.equal(wrong.changed, false);
  assert.equal(wrong.reason, 'wrong-destination');
  assert.deepEqual(wrong.state, state);
  state = act(cfg, state, { type: 'put', location: 'bakery', item: 'flour' });
  state = act(cfg, state, { type: 'put', location: 'inn', item: 'vegetable' });
  state = act(cfg, state, { type: 'put', location: 'oil-stall', item: 'oil' });

  state = act(cfg, state, { type: 'take', location: 'late-goods', item: 'flour' });
  state = act(cfg, state, { type: 'take', location: 'late-goods', item: 'oil' });
  state = act(cfg, state, { type: 'take', location: 'late-goods', item: 'cloth' });
  state = act(cfg, state, { type: 'put', location: 'bakery', item: 'flour' });
  state = act(cfg, state, { type: 'put', location: 'oil-stall', item: 'oil' });
  state = act(cfg, state, { type: 'put', location: 'warehouse', item: 'cloth' });

  state = act(cfg, state, { type: 'take', location: 'late-goods', item: 'oil' });
  state = act(cfg, state, { type: 'put', location: 'oil-stall', item: 'oil' });

  assert.equal(M.stockAt(state, 'bakery', 'flour'), 3);
  assert.equal(M.stockAt(state, 'oil-stall', 'oil'), 4);
  assert.equal(M.stockAt(state, 'late-goods', 'flour'), 0);
  assert.equal(M.stockAt(state, 'late-goods', 'oil'), 0);
  assert.equal(state.flags.replenished, true);
  assert.equal(M.isSolved(cfg, state), true);
});

function solveM8(order) {
  const cfg = stage('market-stage-8');
  let state = M.createState(cfg);
  const doAction = action => { state = act(cfg, state, action); };
  const actions = {
    takeFlour: { type: 'take', location: 'late-goods', item: 'flour' },
    takeOil: { type: 'take', location: 'late-goods', item: 'oil' },
    takeCloth: { type: 'take', location: 'late-goods', item: 'cloth' },
    flour: { type: 'put', location: 'bakery', item: 'flour' },
    oil: { type: 'put', location: 'oil-stall', item: 'oil' },
    exchange: { type: 'exchange', location: 'rope-stall' },
    rope: { type: 'put', location: 'market-tent', item: 'rope' },
    buyVeg: { type: 'buy', location: 'vegetable-stall' },
    veg: { type: 'put', location: 'inn', item: 'vegetable' }
  };
  order.forEach(key => doAction(actions[key]));
  return { cfg, state };
}

test('M8 requires two flour units but still clears with three distinct valid resolution orders', () => {
  const cfg = stage('market-stage-8');
  assert.equal(M.needAt(cfg, 'bakery', 'flour'), 2);
  assert.equal(M.stockAt(M.createState(cfg), 'late-goods', 'flour'), 2);

  const orders = [
    ['takeFlour', 'takeFlour', 'flour', 'flour', 'takeOil', 'takeCloth', 'oil', 'exchange', 'rope', 'buyVeg', 'veg'],
    ['takeCloth', 'takeFlour', 'exchange', 'rope', 'flour', 'takeFlour', 'takeOil', 'flour', 'oil', 'buyVeg', 'veg'],
    ['buyVeg', 'veg', 'takeCloth', 'takeOil', 'exchange', 'rope', 'oil', 'takeFlour', 'takeFlour', 'flour', 'flour']
  ];
  for (const order of orders) {
    const { state } = solveM8(order);
    assert.equal(M.isSolved(cfg, state), true, order.join(' > '));
    assert.equal(state.flags.exchanged, true);
    assert.equal(state.flags.bought, true);
    assert.equal(M.stockAt(state, 'bakery', 'flour'), 2);
  }
});
