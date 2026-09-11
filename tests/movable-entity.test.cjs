const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/movable-entity-runtime.js');
const M = globalThis.MovableEntityMechanic;

const grid = ['##E##','#.D.#','#.C.#','#...#','#...#','#.S.#','#####'];

test('north-facing cart maps physical steps to forward and backward', () => {
  assert.equal(M.directionForStep([2,2],[1,2],'north'), 'forward');
  assert.equal(M.directionForStep([2,2],[3,2],'north'), 'backward');
  assert.equal(M.directionForStep([2,2],[2,1],'north'), null);
});

test('closed door blocks forward movement while backward movement remains available', () => {
  const forward = M.movementCheck({ grid, from:[2,2], to:[1,2], hero:[5,2], facing:'north', doorChar:'D', doorOpen:false });
  const backward = M.movementCheck({ grid, from:[2,2], to:[3,2], hero:[5,2], facing:'north', doorChar:'D', doorOpen:false });
  assert.equal(forward.allowed, false);
  assert.equal(forward.reason, 'door');
  assert.equal(backward.allowed, true);
  assert.equal(backward.direction, 'backward');
});

test('opening the door makes the same physical forward step legal', () => {
  const result = M.movementCheck({ grid, from:[2,2], to:[1,2], hero:[5,2], facing:'north', doorChar:'D', doorOpen:true });
  assert.equal(result.allowed, true);
  assert.equal(result.direction, 'forward');
});

test('cart cannot move onto the hero and reaches the goal only on E', () => {
  const blocked = M.movementCheck({ grid, from:[4,2], to:[5,2], hero:[5,2], facing:'north', doorChar:'D', doorOpen:true });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'hero');
  assert.equal(M.isAtGoal([0,2], grid, 'E'), true);
  assert.equal(M.isAtGoal([1,2], grid, 'E'), false);
});
