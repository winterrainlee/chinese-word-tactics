const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/g4-runtime.js');
const G = globalThis.G4Mechanic;

test('G4 uses orthogonal spatial distance for nearby objects', () => {
  assert.equal(G.manhattan([3,2],[2,2]), 1);
  assert.equal(G.isAround([3,1],[3,2]), true);
  assert.equal(G.isAround([2,1],[3,2]), false);
});

test('larger investigation radius remains possible without changing the helper', () => {
  assert.equal(G.isAround([1,2],[3,2],2), true);
  assert.equal(G.isAround([0,2],[3,2],2), false);
});
