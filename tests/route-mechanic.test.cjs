const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/route-runtime.js');
const R = globalThis.RouteMechanic;

test('samePosition compares row and column pairs', () => {
  assert.equal(R.samePosition([2, 1], [2, 1]), true);
  assert.equal(R.samePosition([2, 1], [1, 2]), false);
  assert.equal(R.samePosition(null, [1, 2]), false);
});

test('routeForPosition resolves either branch and leaves shared cells unassigned', () => {
  const routes = [
    { id: 'west', cells: [[5, 1], [4, 1], [3, 1], [2, 1], [1, 1]] },
    { id: 'east', cells: [[5, 3], [4, 3], [3, 3], [2, 3], [1, 3]] }
  ];
  assert.equal(R.routeForPosition([4, 1], routes).id, 'west');
  assert.equal(R.routeForPosition([2, 3], routes).id, 'east');
  assert.equal(R.routeForPosition([5, 2], routes), null);
  assert.equal(R.routeForPosition([1, 2], routes), null);
});

test('waypointForTile resolves named stop metadata without treating ordinary road as a stop', () => {
  const waypoints = {
    A: { id: 'west-post', nameZh: '西哨站' },
    B: { id: 'east-post', nameZh: '東哨站' }
  };
  assert.equal(R.waypointForTile('A', waypoints).id, 'west-post');
  assert.equal(R.waypointForTile('B', waypoints).nameZh, '東哨站');
  assert.equal(R.waypointForTile('.', waypoints), null);
});
