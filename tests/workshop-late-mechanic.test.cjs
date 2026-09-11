const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/workshop-runtime.js');
const W = globalThis.WorkshopMechanic;

const w4 = {
  components: [
    { id: 'conditionWater', kind: 'level', initial: 2 },
    { id: 'conditionShaft', kind: 'toggle', initial: false },
    { id: 'conditionFurnace', kind: 'toggle', initial: false }
  ],
  derived: [{
    id: 'benchUnlocked', type: 'all', conditions: [
      { component: 'conditionWater', eq: 1 },
      { component: 'conditionShaft', eq: true },
      { component: 'conditionFurnace', eq: false }
    ]
  }],
  predicates: [{ derived: 'benchUnlocked', eq: true }]
};

const w5 = {
  components: [
    { id: 'flameFire', kind: 'level', initial: 1, trackUntouched: true },
    { id: 'flameAir', kind: 'level', initial: 0 }
  ],
  derived: [
    { id: 'blueFlameVisible', type: 'all', conditions: [{ component: 'flameFire', eq: 1 }, { component: 'flameAir', eq: 2 }] },
    { id: 'blackSmokeGone', type: 'all', conditions: [{ component: 'flameFire', eq: 1 }, { component: 'flameAir', eq: 2 }] }
  ],
  predicates: [
    { component: 'flameFire', eq: 1 },
    { untouched: 'flameFire', eq: true },
    { component: 'flameAir', eq: 2 }
  ]
};

const w6 = {
  components: [
    { id: 'gearA', kind: 'damage', initial: false },
    { id: 'gearB', kind: 'damage', initial: true },
    { id: 'gearC', kind: 'damage', initial: false }
  ],
  derived: [{ id: 'machineRecovered', type: 'all', conditions: [{ component: 'gearB', eq: false }] }],
  predicates: [{ derived: 'machineRecovered', eq: true }]
};

const w7 = {
  components: [
    { id: 'regulatorGate', kind: 'level', initial: 0 },
    { id: 'regulatorBalance', kind: 'level', initial: 1, trackUntouched: true },
    { id: 'regulatorMainLink', kind: 'toggle', initial: false },
    { id: 'regulatorIdleLink', kind: 'toggle', initial: true },
    { id: 'regulatorGear', kind: 'damage', initial: true }
  ],
  derived: [{
    id: 'systemRecovered', type: 'all', conditions: [
      { component: 'regulatorGate', eq: 1 },
      { component: 'regulatorBalance', eq: 1 },
      { untouched: 'regulatorBalance', eq: true },
      { component: 'regulatorMainLink', eq: true },
      { component: 'regulatorIdleLink', eq: false },
      { component: 'regulatorGear', eq: false }
    ]
  }],
  predicates: [{ derived: 'systemRecovered', eq: true }]
};

const act = (cfg, state, component, type) => W.applyAction(cfg, state, { component, type }).state;

test('W4 unlocks only when all three conditions match', () => {
  const initial = W.createState(w4);
  assert.equal(initial.derived.benchUnlocked, false);
  const water = act(w4, initial, 'conditionWater', 'step-down');
  assert.equal(W.isSolved(w4, water), false);
  const solved = act(w4, water, 'conditionShaft', 'toggle');
  assert.equal(solved.values.conditionFurnace, false);
  assert.equal(solved.derived.benchUnlocked, true);
  assert.equal(W.isSolved(w4, solved), true);

  const brokenAgain = act(w4, solved, 'conditionFurnace', 'toggle');
  assert.equal(brokenAgain.derived.benchUnlocked, false);
  assert.equal(W.isSolved(w4, brokenAgain), false);
});

test('W5 needs two air increases while the already-correct fire remains untouched', () => {
  const initial = W.createState(w5);
  const one = act(w5, initial, 'flameAir', 'step-up');
  assert.equal(one.values.flameAir, 1);
  assert.equal(one.derived.blueFlameVisible, false);
  const two = act(w5, one, 'flameAir', 'step-up');
  assert.equal(two.derived.blueFlameVisible, true);
  assert.equal(two.derived.blackSmokeGone, true);
  assert.equal(W.isSolved(w5, two), true);
});

test('W5 does not accept touching the fire and restoring only its numeric value', () => {
  const initial = W.createState(w5);
  const fireUp = act(w5, initial, 'flameFire', 'step-up');
  const fireBack = act(w5, fireUp, 'flameFire', 'step-down');
  const airOne = act(w5, fireBack, 'flameAir', 'step-up');
  const airTwo = act(w5, airOne, 'flameAir', 'step-up');
  assert.equal(airTwo.values.flameFire, 1);
  assert.equal(airTwo.untouched.flameFire, false);
  assert.equal(W.isSolved(w5, airTwo), false);
});

test('W6 repairs only an actually damaged gear and derives functional recovery', () => {
  const initial = W.createState(w6);
  assert.equal(W.applyAction(w6, initial, { component: 'gearA', type: 'repair' }).changed, false);
  const repaired = W.applyAction(w6, initial, { component: 'gearB', type: 'repair' });
  assert.equal(repaired.changed, true);
  assert.equal(repaired.state.values.gearB, false);
  assert.equal(repaired.state.derived.machineRecovered, true);
  assert.equal(W.isSolved(w6, repaired.state), true);
});

test('W7 allows different action orders and completes only the combined final state', () => {
  let a = W.createState(w7);
  a = act(w7, a, 'regulatorGear', 'repair');
  a = act(w7, a, 'regulatorIdleLink', 'toggle');
  a = act(w7, a, 'regulatorGate', 'step-up');
  a = act(w7, a, 'regulatorMainLink', 'toggle');
  assert.equal(a.untouched.regulatorBalance, true);
  assert.equal(W.isSolved(w7, a), true);

  let b = W.createState(w7);
  b = act(w7, b, 'regulatorMainLink', 'toggle');
  b = act(w7, b, 'regulatorGate', 'step-up');
  b = act(w7, b, 'regulatorGear', 'repair');
  b = act(w7, b, 'regulatorIdleLink', 'toggle');
  assert.equal(W.isSolved(w7, b), true);
});

test('W7 strict keep condition survives value restoration only through undo, not retoggling', () => {
  let state = W.createState(w7);
  state = act(w7, state, 'regulatorBalance', 'step-up');
  state = act(w7, state, 'regulatorBalance', 'step-down');
  state = act(w7, state, 'regulatorGate', 'step-up');
  state = act(w7, state, 'regulatorMainLink', 'toggle');
  state = act(w7, state, 'regulatorIdleLink', 'toggle');
  state = act(w7, state, 'regulatorGear', 'repair');
  assert.equal(state.values.regulatorBalance, 1);
  assert.equal(state.untouched.regulatorBalance, false);
  assert.equal(W.isSolved(w7, state), false);
});