const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const css = read('src/journey.css');
const runtime = read('src/journey-runtime.js');
const html = read('index.html');

test('journey filters render as text tabs instead of segmented cards', () => {
  assert.match(css, /\.journeyFilters button\{[^}]*border:0;[^}]*border-bottom:2px solid transparent;[^}]*border-radius:0;[^}]*background:transparent/s);
  assert.match(css, /button\[aria-pressed="true"\]\{[^}]*background:transparent;[^}]*border-bottom-color:var\(--accent\)/s);
});

test('journey regions and events are flat timeline records, not rounded cards', () => {
  assert.match(css, /\.journeyRegionSummary\{[^}]*border:0;[^}]*border-radius:0;[^}]*background:transparent/s);
  assert.match(css, /\.journeyNode\{[^}]*border:0;[^}]*border-radius:0;[^}]*background:transparent/s);
  assert.match(css, /\.journeyTimeline>li::before\{/);
  assert.match(css, /\.journeyNode::before\{/);
  assert.match(css, /\.journeyNode\[data-state="complete"\]::before/);
  assert.match(css, /\.journeyNode\[data-state="locked"\]::before/);
});

test('journey highlights the recommended current point without changing replay logic', () => {
  assert.match(runtime, /const recommendedId = recommended \? JourneyProgress\.nodeId\(recommended\) : null/);
  assert.match(runtime, /const id = JourneyProgress\.nodeId\(node\), current = id === recommendedId/);
  assert.match(runtime, /button\.dataset\.current = String\(current\)/);
  assert.match(runtime, /aria-current', 'step'/);
  assert.match(css, /\.journeyNode\[data-current="true"\]/);
});

test('journey reset is separated from the primary continue action', () => {
  assert.match(runtime, /resetRow\.id = 'journeyResetRow'/);
  assert.match(runtime, /root\.after\(resetRow\)/);
  assert.doesNotMatch(runtime, /actions\.append\(reset\)/);
  assert.match(css, /\.journeyResetRow\{/);
  assert.match(css, /\.journeyReset\{[^}]*border:0;[^}]*border-radius:0;[^}]*background:transparent/s);
});

test('browser loads the journey redesign assets with a fresh cache key', () => {
  assert.match(html, /journey\.css\?v=20260913-journey3/);
  assert.match(html, /journey-runtime\.js\?v=20260913-journey3/);
  assert.match(html, /flow-runtime\.js\?v=20260913-landing1/);
});
