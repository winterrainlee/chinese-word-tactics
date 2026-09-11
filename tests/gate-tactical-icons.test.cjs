const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

require('../src/icons-runtime.js');
const icons = globalThis.GATE_TACTICAL_ICONS;

test('gate-town tactical asset mapping is complete, relative, optimized, and transparent', () => {
  assert.deepEqual(Object.keys(icons).sort(), [
    'bellTower', 'cart', 'crate', 'gate', 'narrowPass', 'obstacle', 'outpost', 'signpost'
  ]);
  for (const asset of Object.values(icons)) {
    assert.match(asset, /^\.\/icons\/tactical\/gate-town\/[a-z-]+\.png$/);
    const bytes = fs.readFileSync(path.join(root, asset));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.ok(bytes.readUInt32BE(16) <= 384);
    assert.ok(bytes.readUInt32BE(20) <= 384);
    assert.equal(bytes[25], 6, `${asset} must use RGBA color type`);
  }
});

test('G1-G4 static object marks use the shared tactical assets', () => {
  const css = read('src/icons-runtime.css');
  assert.match(css, /\.cell\.sign::before[\s\S]*var\(--gate-icon-signpost\)/);
  assert.match(css, /\.range-bell[\s\S]*var\(--gate-icon-bell-tower\)/);
  assert.match(css, /\.route-waypoint-mark[\s\S]*var\(--gate-icon-outpost\)/);
  assert.match(css, /\.investigation-cart-mark[\s\S]*var\(--gate-icon-cart\)/);
  assert.match(css, /\.investigation-crate-mark[\s\S]*var\(--gate-icon-crate\)/);
  assert.match(css, /\.investigation-rock-mark[\s\S]*var\(--gate-icon-obstacle\)/);

  const context = vm.createContext({});
  vm.runInContext(read('src/content.js'), context);
  const g4 = vm.runInContext("STAGES.find(stage => stage.id === 'gate-stage-4')", context);
  assert.equal(g4.investigation.cartChar, 'C');
  assert.deepEqual(Array.from(g4.investigation.nearbyChars), ['Q']);
  assert.equal(g4.investigation.obstacleChar, 'O');
});

test('G5 and G6 carts render from live state positions, not their grid characters', () => {
  const movable = read('src/movable-entity-runtime.js');
  const follower = read('src/follower-runtime.js');
  assert.match(movable, /const \[r, c\] = currentCart\(\)/);
  assert.match(movable, /cartCell\.querySelector\('\.movable-cart-mark'\)/);
  assert.match(follower, /const \[r, c\] = currentFollower\(\)/);
  assert.match(follower, /cell\.querySelector\('\.follower-cart-mark'\)/);
  assert.match(read('src/icons-runtime.css'), /\.follower-narrow-mark[\s\S]*var\(--gate-icon-narrow-pass\)/);
});

test('G7 carts follow followerPositions, preserve number badges, and clear the rock art', () => {
  const chain = read('src/follower-chain-runtime.js');
  const g7 = read('src/g7-runtime.js');
  assert.match(chain, /state\?\.followerPositions/);
  assert.match(chain, /positions\(\)\.forEach\(\(pos, index\)/);
  assert.match(chain, /badge\.textContent = String\(index \+ 1\)/);
  assert.match(g7, /if \(!state\.g7ObstacleCleared && !cell\.querySelector\('\.g7-obstacle-mark'\)\)/);
  assert.match(read('src/icons-runtime.css'), /\.g7-obstacle-mark[\s\S]*var\(--gate-icon-obstacle\)/);
});

test('G3 and G7 reuse the same route outpost renderer and asset', () => {
  const context = vm.createContext({});
  vm.runInContext(read('src/content.js'), context);
  vm.runInContext(read('src/g7-content.js'), context);
  const stages = vm.runInContext("STAGES.filter(stage => ['gate-stage-3','gate-stage-7'].includes(stage.id))", context);
  assert.equal(stages.length, 2);
  for (const stage of stages) assert.deepEqual(Object.keys(stage.route.waypoints).sort(), ['A', 'B']);
  assert.match(read('src/route-runtime.js'), /mark\.className = 'route-waypoint-mark'/);
  assert.equal(icons.outpost, './icons/tactical/gate-town/outpost.png');
});
