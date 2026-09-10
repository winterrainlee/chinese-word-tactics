const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

require('../src/range-runtime.js');
const R = globalThis.RangeMechanic;

function loadContent() {
  const source = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf8');
  const sandbox = { globalThis: {} };
  vm.runInNewContext(`${source}\nglobalThis.__stages = STAGES; globalThis.__words = WORDS;`, sandbox);
  return { stages: sandbox.globalThis.__stages, words: sandbox.globalThis.__words };
}

const locateAll = (grid, ch) => {
  const found = [];
  grid.forEach((row, r) => [...row].forEach((cell, c) => { if (cell === ch) found.push([r, c]); }));
  return found;
};

test('range helper uses Manhattan distance and exposes boundary separately from inside', () => {
  assert.equal(R.distanceBetween([1, 2], [4, 3]), 4);
  assert.equal(R.isWithinRange([4, 2], [1, 2], 3), true);
  assert.equal(R.isRangeBoundary([4, 2], [1, 2], 3), true);
  assert.equal(R.isWithinRange([4, 1], [1, 2], 3), false);
});

test('G2 has one fixed bell source and five markers spanning inside, edge and outside', () => {
  const { stages } = loadContent();
  const stage = stages.find(stage => stage.id === 'gate-stage-2');
  assert.ok(stage, 'gate-stage-2 must exist');
  assert.deepEqual(Array.from(stage.words), ['距離', '範圍']);
  assert.equal(stage.rangeSource.source, 'B');
  assert.equal(stage.rangeSource.pointChar, 'P');
  assert.equal(stage.rangeSource.radius, 3);
  assert.equal(stage.rangeSource.revealOnFirstClear, true);

  const source = locateAll(Array.from(stage.grid), 'B');
  const points = locateAll(Array.from(stage.grid), 'P');
  assert.equal(source.length, 1);
  assert.equal(points.length, 5);
  const distances = points.map(point => R.distanceBetween(point, source[0])).sort((a, b) => a - b);
  assert.deepEqual(distances, [1, 3, 3, 4, 4]);
  assert.equal(points.filter(point => R.isRangeBoundary(point, source[0], 3)).length, 2);
  assert.ok(points.some(point => R.isWithinRange(point, source[0], 3) && !R.isRangeBoundary(point, source[0], 3)));
  assert.ok(points.some(point => !R.isWithinRange(point, source[0], 3)));
});

test('range reveal happens only on the first campaign clear, never on replay or a retry', () => {
  assert.equal(R.shouldRevealAfterClear('first-play', false, true), true);
  assert.equal(R.shouldRevealAfterClear('replay', false, true), false);
  assert.equal(R.shouldRevealAfterClear('first-play', true, true), false);
  assert.equal(R.shouldRevealAfterClear('first-play', false, false), false);
});

test('G2 vocabulary cards exist in the authored word layer', () => {
  const { words } = loadContent();
  for (const word of ['距離', '範圍']) {
    assert.ok(words[word]);
    assert.ok(words[word].p);
    assert.ok(words[word].k);
    assert.ok(words[word].rule);
  }
});
