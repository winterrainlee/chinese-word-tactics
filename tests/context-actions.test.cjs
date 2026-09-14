const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('../src/interaction-runtime.js');
const C = globalThis.ContextActionLogic;
const index = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const app = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'app.js'), 'utf8');
const interactionRuntime = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'interaction-runtime.js'), 'utf8');

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

test('useful information targets can be tapped directly without a global inspect mode', () => {
  const wolfStage = { grid: ['.W.'], wolf: { cycle: [[0, 1], [0, 2]] } };
  assert.equal(C.isDirectInformationTarget(wolfStage, [0, 1], { hero: [0, 0], phase: 0 }), true);

  const rangeStage = { grid: ['BP.'], rangeSource: { source: 'B', pointChar: 'P' } };
  assert.equal(C.isDirectInformationTarget(rangeStage, [0, 0], { hero: [0, 2] }), true);
  assert.equal(C.isDirectInformationTarget(rangeStage, [0, 1], { hero: [0, 2] }), false, 'an adjacent passable marker remains a movement target');
  assert.equal(C.isDirectInformationTarget(rangeStage, [0, 1], { hero: [0, 3] }), true);
});

test('ordinary floor and walls never become direct information targets', () => {
  const plain = { grid: ['.#.'] };
  assert.equal(C.isDirectInformationTarget(plain, [0, 0], { hero: [0, 2] }), false);
  assert.equal(C.isDirectInformationTarget(plain, [0, 1], { hero: [0, 2] }), false);
  assert.equal(C.isDirectInformationTarget(plain, [0, 0]), false);
});

test('the shared tactical runtime has no global inspect-mode toggle or mode prompt', () => {
  const sharedRuntime = `${app}\n${interactionRuntime}`;
  assert.doesNotMatch(sharedRuntime, /inspect\s*=\s*!inspect/);
  assert.doesNotMatch(sharedRuntime, /살펴보기 모드|살펴볼 대상을 눌러봐|이동으로/);
  assert.match(interactionRuntime, /button\.hidden = actions\.length === 0/);
});

test('wolf inspection states the movement rule without revealing the next action', () => {
  assert.match(app, /늑대는 행동할 때마다 순찰 경로를 따라 한 칸 움직여/);
  assert.doesNotMatch(app, /다음 행동:|여기서 기다림/);
});

test('an adjacent thorn remains a rejected move while a distant thorn can be read', () => {
  const hazard = { grid: ['X..'] };
  assert.equal(C.isDirectInformationTarget(hazard, [0, 0], { hero: [0, 1] }), false);
  assert.equal(C.isDirectInformationTarget(hazard, [0, 0], { hero: [0, 2] }), true);
});

test('changed direct-inspection runtimes use a shared cache version', () => {
  assert.match(index, /app\.js\?v=20260914-wolfobserve1/);
  for (const file of ['interaction-runtime', 'first-free-quest-runtime', 'range-runtime', 'follower-runtime', 'follower-chain-runtime', 'market-runtime']) {
    assert.match(index, new RegExp(`${file}\\.js\\?v=20260914-directinspect1`), file);
  }
  assert.match(index, /first-free-quest-content\.js\?v=20260914-directinspect1/);
});
