const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

require('../src/market-runtime.js');
require('../src/market-inference-runtime.js');

const M = globalThis.MarketMechanic;
const I = globalThis.MarketInferenceMechanic;

function loadMarketStages() {
  const source = fs.readFileSync(require.resolve('../src/market-content.js'), 'utf8');
  const context = { WORDS: {}, STAGES: [] };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.STAGES;
}

const stages = loadMarketStages();
const m2 = stages.find(stage => stage.id === 'market-stage-2');
const m3 = stages.find(stage => stage.id === 'market-stage-3');

test('M2 defines a one-time remaining quantity inference scaffold', () => {
  assert.ok(m2);
  assert.equal(m2.market.revision, 2);
  assert.deepEqual(Array.from(m2.market.remainingInference.items), ['cloth', 'oil']);
  assert.equal(m2.market.remainingInference.location, 'merchant');
  assert.equal(m2.market.remainingInference.flag, 'remainingConfirmed');
  assert.ok(m2.market.predicates.some(predicate => predicate.type === 'flag' && predicate.flag === 'remainingConfirmed'));
  assert.ok(m2.market.goalMarks.some(mark => mark.word === '剩下' && mark.type === 'flag' && mark.flag === 'remainingConfirmed'));
});

test('M2 stock stays pedagogically hidden until remaining quantity is confirmed', () => {
  const state = M.createState(m2.market);
  assert.equal(I.shouldHideStock(m2, state, 'merchant'), true);
  assert.equal(I.shouldHideStock(m2, state, 'warehouse'), false);
  state.flags.remainingConfirmed = true;
  assert.equal(I.shouldHideStock(m2, state, 'merchant'), false);
});

test('M2 cannot complete by blindly moving both boxes without confirming 剩下', () => {
  let state = M.createState(m2.market);
  state = M.applyAction(m2.market, state, { type: 'take', location: 'merchant', item: 'oil' }).state;
  state = M.applyAction(m2.market, state, { type: 'take', location: 'merchant', item: 'oil' }).state;
  state = M.applyAction(m2.market, state, { type: 'put', location: 'warehouse', item: 'oil' }).state;
  state = M.applyAction(m2.market, state, { type: 'put', location: 'warehouse', item: 'oil' }).state;
  assert.equal(M.isSolved(m2.market, state), false);

  state.flags.remainingConfirmed = true;
  assert.equal(M.isSolved(m2.market, state), true);
});

test('M3 and later market stages are not affected by the M2 hiding rule', () => {
  assert.ok(m3);
  const state = M.createState(m3.market);
  assert.equal(I.inferenceFor(m3), null);
  assert.equal(I.shouldHideStock(m3, state, 'merchant'), false);
});

test('page loads inference scaffold after market state badges so hidden counts cannot leak', () => {
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  const stateVisuals = html.indexOf('market-state-visuals.js');
  const inference = html.indexOf('market-inference-runtime.js');
  assert.ok(stateVisuals >= 0);
  assert.ok(inference > stateVisuals);
});
