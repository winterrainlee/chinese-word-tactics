const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/workshop-runtime.js');
const W = globalThis.WorkshopMechanic;

const w1 = {
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

const w2 = {
  components: [
    { id: 'fire', kind: 'level', initial: 2, target: 1 },
    { id: 'air', kind: 'level', initial: 0, target: 1 }
  ],
  derived: [{
    id: 'balanced', type: 'all', conditions: [
      { component: 'fire', eq: 1 },
      { component: 'air', eq: 1 }
    ]
  }],
  predicates: [
    { component: 'fire', eq: 1 },
    { component: 'air', eq: 1 }
  ]
};

test('W1 needs two left-gate changes while leaving the right gate untouched', () => {
  const initial = W.createState(w1);
  assert.equal(W.isSolved(w1, initial), false);

  const first = W.applyAction(w1, initial, { component: 'mainGate', type: 'step-up' });
  assert.equal(first.changed, true);
  assert.equal(first.state.values.mainGate, 1);
  assert.equal(first.state.derived.wheelRunning, false);
  assert.equal(W.isSolved(w1, first.state), false);

  const second = W.applyAction(w1, first.state, { component: 'mainGate', type: 'step-up' });
  assert.equal(second.state.values.mainGate, 2);
  assert.equal(second.state.untouched.balanceGate, true);
  assert.equal(second.state.derived.wheelRunning, true);
  assert.equal(W.isSolved(w1, second.state), true);
});

test('touching the keep gate breaks 保持 even when its numeric value can return to the start value', () => {
  const initial = W.createState(w1);
  const touched = W.applyAction(w1, initial, { component: 'balanceGate', type: 'step-up' }).state;
  const restoredValue = W.applyAction(w1, touched, { component: 'balanceGate', type: 'step-down' }).state;
  const leftOne = W.applyAction(w1, restoredValue, { component: 'mainGate', type: 'step-up' }).state;
  const leftTwo = W.applyAction(w1, leftOne, { component: 'mainGate', type: 'step-up' }).state;
  assert.equal(leftTwo.values.balanceGate, 1);
  assert.equal(leftTwo.untouched.balanceGate, false);
  assert.equal(W.isSolved(w1, leftTwo), false);
});

test('level actions stay inside the three workshop levels', () => {
  const initial = W.createState(w1);
  assert.equal(W.applyAction(w1, initial, { component: 'mainGate', type: 'step-down' }).changed, false);
  const one = W.applyAction(w1, initial, { component: 'mainGate', type: 'step-up' }).state;
  const two = W.applyAction(w1, one, { component: 'mainGate', type: 'step-up' }).state;
  assert.equal(two.values.mainGate, 2);
  assert.equal(W.applyAction(w1, two, { component: 'mainGate', type: 'step-up' }).changed, false);
});

test('W2 solves after decreasing fire and increasing air', () => {
  const initial = W.createState(w2);
  const fireAdjusted = W.applyAction(w2, initial, { component: 'fire', type: 'step-down' }).state;
  assert.equal(fireAdjusted.values.fire, 1);
  assert.equal(fireAdjusted.derived.balanced, false);
  assert.equal(W.isSolved(w2, fireAdjusted), false);

  const airAdjusted = W.applyAction(w2, fireAdjusted, { component: 'air', type: 'step-up' }).state;
  assert.equal(airAdjusted.values.air, 1);
  assert.equal(airAdjusted.derived.balanced, true);
  assert.equal(W.isSolved(w2, airAdjusted), true);
});

test('W2 also solves in the opposite adjustment order', () => {
  const initial = W.createState(w2);
  const airAdjusted = W.applyAction(w2, initial, { component: 'air', type: 'step-up' }).state;
  const fireAdjusted = W.applyAction(w2, airAdjusted, { component: 'fire', type: 'step-down' }).state;
  assert.equal(W.isSolved(w2, fireAdjusted), true);
});

test('W2 does not solve when one setting overshoots and recovers only after readjustment', () => {
  const initial = W.createState(w2);
  const fireOne = W.applyAction(w2, initial, { component: 'fire', type: 'step-down' }).state;
  const fireTooLow = W.applyAction(w2, fireOne, { component: 'fire', type: 'step-down' }).state;
  const airOne = W.applyAction(w2, fireTooLow, { component: 'air', type: 'step-up' }).state;
  assert.equal(fireTooLow.values.fire, 0);
  assert.equal(W.isSolved(w2, airOne), false);
  const corrected = W.applyAction(w2, airOne, { component: 'fire', type: 'step-up' }).state;
  assert.equal(corrected.values.fire, 1);
  assert.equal(W.isSolved(w2, corrected), true);
});