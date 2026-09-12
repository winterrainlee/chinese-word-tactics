const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/market-runtime.js');
const M = globalThis.MarketMechanic;

const m1 = { capacity: 1, locations: [
  { id: 'bread', stock: { flour: 2 }, needs: { flour: 3 }, allowTake: true, allowPut: true, accepts: ['flour'] },
  { id: 'noodle', stock: { flour: 2 }, needs: { flour: 2 }, allowTake: true, allowPut: true, accepts: ['flour'] },
  { id: 'cart', stock: { flour: 1 }, allowTake: true, allowPut: true, accepts: ['flour'] }
], predicates: [
  { type: 'location-at-least', location: 'bread', item: 'flour', amount: 3 },
  { type: 'location-at-least', location: 'noodle', item: 'flour', amount: 2 }
] };

test('M1 fills the deficient stall', () => {
  let state = M.createState(m1);
  state = M.applyAction(m1, state, { type: 'take', location: 'cart', item: 'flour' }).state;
  state = M.applyAction(m1, state, { type: 'put', location: 'bread', item: 'flour' }).state;
  assert.equal(M.isSolved(m1, state), true);
});

test('M1 overfilling the already sufficient stall can be recovered', () => {
  let state = M.createState(m1);
  state = M.applyAction(m1, state, { type: 'take', location: 'cart', item: 'flour' }).state;
  state = M.applyAction(m1, state, { type: 'put', location: 'noodle', item: 'flour' }).state;
  const recovered = M.applyAction(m1, state, { type: 'take', location: 'noodle', item: 'flour' });
  assert.equal(recovered.changed, true);
  state = M.applyAction(m1, recovered.state, { type: 'put', location: 'bread', item: 'flour' }).state;
  assert.equal(M.isSolved(m1, state), true);
});

test('needed stock cannot be taken below need', () => {
  const state = M.createState(m1);
  const result = M.applyAction(m1, state, { type: 'take', location: 'noodle', item: 'flour' });
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'needed-here');
});

const m2 = { capacity: 2, locations: [
  { id: 'cart', stock: { oil: 2 }, allowTake: true, allowPut: true, accepts: ['oil'] },
  { id: 'warehouse', stock: { oil: 0 }, needs: { oil: 2 }, allowPut: true, accepts: ['oil'] }
], predicates: [
  { type: 'location-equals', location: 'cart', item: 'oil', amount: 0 },
  { type: 'location-at-least', location: 'warehouse', item: 'oil', amount: 2 }
] };

test('M2 moves both remaining boxes to the warehouse', () => {
  let state = M.createState(m2);
  state = M.applyAction(m2, state, { type: 'take', location: 'cart', item: 'oil' }).state;
  state = M.applyAction(m2, state, { type: 'take', location: 'cart', item: 'oil' }).state;
  state = M.applyAction(m2, state, { type: 'put', location: 'warehouse', item: 'oil' }).state;
  state = M.applyAction(m2, state, { type: 'put', location: 'warehouse', item: 'oil' }).state;
  assert.equal(M.isSolved(m2, state), true);
});

const m3 = { capacity: 1, initialInventory: { cloth: 1 }, locations: [
  { id: 'merchant', stock: { rope: 0 }, needs: { rope: 1 }, allowPut: true, accepts: ['rope'] },
  { id: 'rope', stock: { rope: 1, cloth: 0 }, exchange: { give: 'cloth', giveQty: 1, receive: 'rope', receiveQty: 1, flag: 'exchanged' } }
], predicates: [
  { type: 'flag', flag: 'exchanged', eq: true },
  { type: 'location-at-least', location: 'merchant', item: 'rope', amount: 1 }
] };

test('M3 exchange is atomic and the acquired rope can be delivered', () => {
  let state = M.createState(m3);
  const exchanged = M.applyAction(m3, state, { type: 'exchange', location: 'rope' });
  assert.equal(exchanged.changed, true);
  assert.equal(exchanged.state.inventory.cloth, 0);
  assert.equal(exchanged.state.inventory.rope, 1);
  assert.equal(exchanged.state.locations.rope.stock.cloth, 1);
  assert.equal(exchanged.state.locations.rope.stock.rope, 0);
  assert.equal(exchanged.state.flags.exchanged, true);
  state = M.applyAction(m3, exchanged.state, { type: 'put', location: 'merchant', item: 'rope' }).state;
  assert.equal(M.isSolved(m3, state), true);
});
