const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/interaction-runtime.js');
const C = globalThis.ContextActionLogic;

const stage = {
  grid: ['...', '.CO', '...'],
  contextActions: [
    { target: 'C', label: '수레 살펴보기', action: 'inspect-cart' },
    { target: 'O', label: '돌 살펴보기', action: 'inspect-rock', unless: 'obstacleIdentified' },
    { target: 'O', label: '돌 치우기', action: 'clear-rock', priority: 100, requires: 'obstacleIdentified', unless: 'obstacleCleared' }
  ]
};

test('context action requires orthogonal adjacency', () => {
  assert.equal(C.primaryActionForPosition(stage, [1, 1], { hero: [2, 1] }).action, 'inspect-cart');
  assert.equal(C.primaryActionForPosition(stage, [1, 2], { hero: [2, 1] }), null);
});

test('requires and unless swap an investigation action without stage-specific code', () => {
  const hero = [2, 2];
  assert.equal(C.primaryActionForPosition(stage, [1, 2], { hero, obstacleIdentified: false }).action, 'inspect-rock');
  assert.equal(C.primaryActionForPosition(stage, [1, 2], { hero, obstacleIdentified: true }).action, 'clear-rock');
  assert.equal(C.primaryActionForPosition(stage, [1, 2], { hero, obstacleIdentified: true, obstacleCleared: true }), null);
});

test('multiple requirements are all respected', () => {
  const s = { a: true, b: false };
  assert.equal(C.enabled({ requires: ['a', 'b'] }, s), false);
  s.b = true;
  assert.equal(C.enabled({ requires: ['a', 'b'] }, s), true);
});

test('higher-priority decisive action suppresses nearby lower-priority inspections', () => {
  const candidates = [
    { pos: [2, 2], action: { label: '짐상자 살펴보기' } },
    { pos: [1, 1], action: { label: '돌 치우기', priority: 100 } }
  ];
  const result = C.highestPriorityActions(candidates);
  assert.equal(result.length, 1);
  assert.equal(result[0].action.label, '돌 치우기');
});

test('equal-priority actions remain together so the player can choose', () => {
  const candidates = [
    { pos: [1, 0], action: { label: '왼쪽 살펴보기' } },
    { pos: [1, 2], action: { label: '오른쪽 살펴보기' } }
  ];
  assert.equal(C.highestPriorityActions(candidates).length, 2);
});
