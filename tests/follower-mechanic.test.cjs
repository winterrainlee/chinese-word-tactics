const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/follower-runtime.js');
const F = globalThis.FollowerMechanic;
const grid = ['##E##','#...#','#.=.#','#...#','#.X.#','#...#','#.C.#'];

test('follower steps into the leader previous tile when adjacent and passable', () => {
  const r = F.followerStep({ grid, follower:[6,2], leaderFrom:[5,2] });
  assert.deepEqual(r.pos,[5,2]); assert.equal(r.moved,true);
});

test('narrow road blocks the cart without blocking the leader trail itself', () => {
  const r = F.followerStep({ grid, follower:[3,2], leaderFrom:[2,2] });
  assert.deepEqual(r.pos,[3,2]); assert.equal(r.moved,false); assert.equal(r.reason,'blocked'); assert.equal(r.tile,'=');
});

test('disconnected follower never teleports to a distant previous tile', () => {
  const r = F.followerStep({ grid, follower:[3,2], leaderFrom:[1,2] });
  assert.deepEqual(r.pos,[3,2]); assert.equal(r.reason,'disconnected');
});

test('follower can reconnect when a new adjacent passable trail is made', () => {
  const r = F.followerStep({ grid, follower:[3,2], leaderFrom:[3,1] });
  assert.deepEqual(r.pos,[3,1]); assert.equal(r.moved,true);
});

test('formation requires leader at exit and follower in the arrival cell behind it', () => {
  assert.equal(F.formationAtGoal({grid,leader:[0,2],follower:[1,2],followerGoal:[1,2]}),true);
  assert.equal(F.formationAtGoal({grid,leader:[0,2],follower:[1,1],followerGoal:[1,2]}),false);
});
