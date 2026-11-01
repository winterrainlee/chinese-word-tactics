/* G1 review-only world-grid prototype: geometry and regression contracts. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('data/world-spatial-illustration-trace-v0.1.json'));
const context = vm.createContext({});
vm.runInContext(read('src/world-spatial-prototype.js'), context, { filename: 'world-spatial-prototype.js' });
const geometry = context.WorldSpatialPrototype;

test('prototype is illustration tracing, not authoritative terrain, with three comparable grid presets', () => {
  assert.equal(data.status, 'review-only');
  assert.equal(data.authority, 'illustration-reference-not-world-geography');
  assert.deepEqual(data.grids.map(g => g.cols * g.rows), [720, 1824, 2840]);
  assert.deepEqual(data.source.referenceSize, { width: 430, height: 764 });
  assert.equal(data.source.chunkCount, 8);
  for (const preset of data.grids) {
    assert.ok(Math.abs(preset.cols / preset.rows - 430 / 764) < 0.012);
    assert.ok(geometry.gridFor(data, preset.id));
  }
  assert.equal(data.grids.some(preset => preset.id === 'medium'), true);
});

test('candidate traces have stable names, in-bounds geometry, and no fabricated flow or flood topology', () => {
  const ids = data.features.map(feature => feature.id);
  assert.equal(new Set(ids).size, ids.length);
  const categories = new Set();
  for (const feature of data.features) {
    assert.match(feature.id, /^trace:/);
    assert.ok(['water', 'road', 'bridge'].includes(feature.type));
    categories.add(feature.type);
    assert.ok(Number.isFinite(feature.radiusPx) && feature.radiusPx > 0);
    const points = feature.point ? [feature.point] : feature.points;
    assert.ok(points.length > 0);
    for (const [x, y] of points) {
      assert.ok(x >= 0 && x <= 430, feature.id + ': x bound');
      assert.ok(y >= 0 && y <= 764, feature.id + ': y bound');
    }
    assert.equal(Object.hasOwn(feature, 'flowDirection'), false);
    assert.equal(Object.hasOwn(feature, 'worldCoordinate'), false);
    assert.equal(Object.hasOwn(feature, 'floodDepth'), false);
  }
  assert.deepEqual([...categories].sort(), ['bridge', 'road', 'water']);
  assert.equal(data.features.some(feature => feature.id.includes('04a') || feature.id.includes('side-channel')), false);
});

test('grid lookup detects nearby illustration candidates without classifying unmarked cells as land', () => {
  const upperBridge = geometry.cellAt(data, 'medium', 211, 237);
  assert.ok(upperBridge.candidates.some(feature => feature.id === 'trace:bridge-upper'));
  const unknown = geometry.cellAt(data, 'medium', 350, 42);
  assert.equal(unknown.candidates.length, 0);
  assert.equal(Object.hasOwn(unknown, 'terrain'), false);
  for (const preset of data.grids) {
    const last = geometry.cellAt(data, preset.id, 430, 764);
    assert.equal(last.col, preset.cols - 1);
    assert.equal(last.row, preset.rows - 1);
    assert.ok(last.bounds.width > 0 && last.bounds.height > 0);
  }
  assert.equal(geometry.cellAt(data, 'unknown', 10, 20), null);
});

test('six places are projected at unchanged v0.6 icon coordinates, not used as geographic centers', () => {
  const src = read('src/world-v06-content.js');
  assert.equal(data.placeAnchors.length, 6);
  for (const anchor of data.placeAnchors) {
    const section = src.match(new RegExp("'" + anchor.id + "':\\s*\\{([\\s\\S]*?)\\n\\s*\\},"));
    assert.ok(section, anchor.id + ' must remain in map patches');
    const xy = section[1].match(/map:\s*\{\s*x:\s*(\d+),\s*y:\s*(\d+)/);
    assert.ok(xy, anchor.id + ' must have a presentation anchor');
    assert.equal(anchor.xPct, Number(xy[1]));
    assert.equal(anchor.yPct, Number(xy[2]));
    assert.equal(geometry.getAnchor(data, anchor.id).label, anchor.label);
  }
  assert.equal(geometry.getAnchor(data, 'border-village').role, 'outside-direction');
  const html = read('world-grid-test/index.html');
  assert.match(html, /src\/world-spatial-prototype\.js/);
  assert.match(html, /world-grid-test|지형 격자 시험판/);
  assert.match(html, /gridSize/);
  assert.match(read('world-grid-test/app.js'), /world-spatial-illustration-trace-v0\.1\.json/);
});
