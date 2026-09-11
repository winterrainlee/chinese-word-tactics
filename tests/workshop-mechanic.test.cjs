const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/workshop-runtime.js');
const W = globalThis.WorkshopMechanic;

const cfg = {
  components: [
    { id: 'mainGate', kind: 'level', initial: 0 },
    { id: 'balanceGate', kind: 'level', initial: 1, trackUntouched: true }
  ],
  derived: [{
    id: 'wheelRunning', type: 'all', conditions: [
      { component: 'mainGate', eq: 1 },
      { component: 'balanceGate', eq: 1 }
    ]
  }],
  predicates: [
    { component: 'mainGate', eq: 1 },
    { component: 'balanceGate', eq: 1 },
    { untouched: 'balanceGate', eq: true }
  ]
};

test('W1 solves by changing the left gate and leaving the right gate untouched', () => {
  const initial = W.createState(cfg);
  assert.equal(W.isSolved(cfg, initial), false);
  const result = W.applyAction(cfg, initial, { component: 'mainGate', type: 'step-up' });
  assert.equal(result.changed, true);
  assert.equal(result.state.values.mainGate, 1);
  assert.equal(result.state.untouched.balanceGate, true);
  assert.equal(result.state.derived.wheelRunning, true);
  assert.equal(W.isSolved(cfg, result.state), true);
});

test('touching the keep gate breaks 保持 even when its numeric value can return to the start value', () => {
  const initial = W.createState(cfg);
  const touched = W.applyAction(cfg, initial, { component: 'balanceGate', type: 'step-up' }).state;
  const restoredValue = W.applyAction(cfg, touched, { component: 'balanceGate', type: 'step-down' }).state;
  const leftFixed = W.applyAction(cfg, restoredValue, { component: 'mainGate', type: 'step-up' }).state;
  assert.equal(leftFixed.values.balanceGate, 1);
  assert.equal(leftFixed.untouched.balanceGate, false);
  assert.equal(W.isSolved(cfg, leftFixed), false);
});

test('level actions stay inside the three workshop levels', () => {
  const initial = W.createState(cfg);
  assert.equal(W.applyAction(cfg, initial, { component: 'mainGate', type: 'step-down' }).changed, false);
  const one = W.applyAction(cfg, initial, { component: 'mainGate', type: 'step-up' }).state;
  const two = W.applyAction(cfg, one, { component: 'mainGate', type: 'step-up' }).state;
  assert.equal(two.values.mainGate, 2);
  assert.equal(W.applyAction(cfg, two, { component: 'mainGate', type: 'step-up' }).changed, false);
});