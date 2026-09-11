const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/workshop-runtime.js');
const W = globalThis.WorkshopMechanic;

const cfg = {
  components: [
    { id: 'mainGate', kind: 'level', initial: 0, target: 2 },
    { id: 'balanceGate', kind: 'level', initial: 1, target: 1, trackUntouched: true }
  ],
  derived: [{
    id: 'wheelRunning', type: 'all', conditions: [
      { component: 'mainGate', eq: 2 },
      { component: 'balanceGate', eq: 1 }
    ]
  }],
  predicates: [
    { component: 'mainGate', eq: 2 },
    { component: 'balanceGate', eq: 1 },
    { untouched: 'balanceGate', eq: true }
  ]
};

test('W1 needs two left-gate changes while leaving the right gate untouched', () => {
  const initial = W.createState(cfg);
  assert.equal(W.isSolved(cfg, initial), false);

  const first = W.applyAction(cfg, initial, { component: 'mainGate', type: 'step-up' });
  assert.equal(first.changed, true);
  assert.equal(first.state.values.mainGate, 1);
  assert.equal(first.state.derived.wheelRunning, false);
  assert.equal(W.isSolved(cfg, first.state), false);

  const second = W.applyAction(cfg, first.state, { component: 'mainGate', type: 'step-up' });
  assert.equal(second.state.values.mainGate, 2);
  assert.equal(second.state.untouched.balanceGate, true);
  assert.equal(second.state.derived.wheelRunning, true);
  assert.equal(W.isSolved(cfg, second.state), true);
});

test('touching the keep gate breaks 保持 even when its numeric value can return to the start value', () => {
  const initial = W.createState(cfg);
  const touched = W.applyAction(cfg, initial, { component: 'balanceGate', type: 'step-up' }).state;
  const restoredValue = W.applyAction(cfg, touched, { component: 'balanceGate', type: 'step-down' }).state;
  const leftOne = W.applyAction(cfg, restoredValue, { component: 'mainGate', type: 'step-up' }).state;
  const leftTwo = W.applyAction(cfg, leftOne, { component: 'mainGate', type: 'step-up' }).state;
  assert.equal(leftTwo.values.balanceGate, 1);
  assert.equal(leftTwo.untouched.balanceGate, false);
  assert.equal(W.isSolved(cfg, leftTwo), false);
});

test('level actions stay inside the three workshop levels', () => {
  const initial = W.createState(cfg);
  assert.equal(W.applyAction(cfg, initial, { component: 'mainGate', type: 'step-down' }).changed, false);
  const one = W.applyAction(cfg, initial, { component: 'mainGate', type: 'step-up' }).state;
  const two = W.applyAction(cfg, one, { component: 'mainGate', type: 'step-up' }).state;
  assert.equal(two.values.mainGate, 2);
  assert.equal(W.applyAction(cfg, two, { component: 'mainGate', type: 'step-up' }).changed, false);
});