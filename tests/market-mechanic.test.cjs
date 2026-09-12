const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/market-runtime.js');
const M = globalThis.MarketMechanic;

const m1 = { capacity: 1, locations: [
  { id: 'bread', stock: { flour: 2 }, needs: { flour: 3 }, allowTake: true, allowPut: true, accepts: ['flour'] },
  { id: 'noodle', stock: { flour: 2 }, needs: { flour: 2 }, allowTake: true, allowPut: true, accepts: ['flour'] },
  { id: 'cart', stock: { flour: 1 }, allowTake: true, allowPut: true, accepts: ['flour'] }
], predicates: [
  { type: 'inspected-all', locations: ['bread', 'noodle'] },
  { type: 'location-at-least', location: 'bread', item: 'flour', amount: 3 },
  { type: 'location-at-least', location: 'noodle', item: 'flour', amount: 2 }
] };

const inspectBothM1Stalls = state => {
  state = M.inspectLocation(m1, state, 'bread').state;
  return M.inspectLocation(m1, state, 'noodle').state;
};

test('M1 requires reading both stall needs before completion', () => {
  let state = M.createState(m1);
  state = M.applyAction(m1, state, { type: 'take', location: 'cart', item: 'flour' }).state;
  state = M.applyAction(m1, state, { type: 'put', location: 'bread', item: 'flour' }).state;
  assert.equal(M.allNeedsMet(m1, state), true);
  assert.equal(M.isSolved(m1, state), false);
  state = inspectBothM1Stalls(state);
  assert.equal(M.isSolved(m1, state), true);
});

test('M1 overfilling the already sufficient stall can be recovered', () => {
  let state = inspectBothM1Stalls(M.createState(m1));
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

const m4 = { capacity: 2, coins: 10, locations: [
  { id: 'vegetable', stock: { vegetable: 1 }, sell: { item: 'vegetable', price: 3 } },
  { id: 'bread', stock: { bread: 1 }, sell: { item: 'bread', price: 4 } },
  { id: 'innkeeper', stock: { vegetable: 0, bread: 0 }, needs: { vegetable: 1, bread: 1 }, allowPut: true, accepts: ['vegetable', 'bread'] }
], predicates: [
  { type: 'location-at-least', location: 'innkeeper', item: 'vegetable', amount: 1 },
  { type: 'location-at-least', location: 'innkeeper', item: 'bread', amount: 1 }
] };

test('M4 purchase atomically changes money, seller stock, inventory, and buy/sell flags', () => {
  const initial = M.createState(m4);
  const bought = M.applyAction(m4, initial, { type: 'buy', location: 'vegetable' });
  assert.equal(bought.changed, true);
  assert.equal(bought.reason, 'bought');
  assert.equal(bought.state.coins, 7);
  assert.equal(bought.state.locations.vegetable.stock.vegetable, 0);
  assert.equal(bought.state.inventory.vegetable, 1);
  assert.equal(bought.state.flags.bought, true);
  assert.equal(bought.state.flags.sold, true);
  assert.equal(bought.state.flags['bought:vegetable'], true);
});

test('M4 can buy in either order and completes only after both goods reach the innkeeper', () => {
  for (const order of [['vegetable', 'bread'], ['bread', 'vegetable']]) {
    let state = M.createState(m4);
    for (const location of order) state = M.applyAction(m4, state, { type: 'buy', location }).state;
    assert.equal(state.coins, 3);
    assert.equal(M.isSolved(m4, state), false);
    state = M.applyAction(m4, state, { type: 'put', location: 'innkeeper', item: 'vegetable' }).state;
    assert.equal(M.isSolved(m4, state), false);
    state = M.applyAction(m4, state, { type: 'put', location: 'innkeeper', item: 'bread' }).state;
    assert.equal(M.isSolved(m4, state), true);
  }
});

test('M4 insufficient money leaves every transaction state unchanged', () => {
  const poor = { ...m4, coins: 2 };
  const initial = M.createState(poor);
  const result = M.applyAction(poor, initial, { type: 'buy', location: 'vegetable' });
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'insufficient-coins');
  assert.equal(result.state.coins, 2);
  assert.equal(result.state.locations.vegetable.stock.vegetable, 1);
  assert.equal(result.state.inventory.vegetable, undefined);
});
