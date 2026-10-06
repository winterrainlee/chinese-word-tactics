const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const flow = read('src/flow-runtime.js');
const journey = read('src/journey-runtime.js');
const lexicon = read('src/lexicon-runtime.js');
const ux = read('src/ux-play-runtime.js');
const html = read('index.html');

test('A05 captures the actual source view without introducing a router or changing campaign saves', () => {
  assert.match(flow, /function captureViewContext\(\)/);
  assert.match(flow, /viewId: view\.id/);
  assert.match(flow, /scrollY: window\.scrollY/);
  assert.match(flow, /function restoreViewContext\(context\)/);
  assert.match(flow, /context\.viewId === 'landingView'/);
  assert.match(flow, /context\.viewId === 'worldView'/);
  assert.match(flow, /context\.viewId === 'journeyView'/);
  assert.doesNotMatch(flow, /pushState|replaceState|popstate/);
});

test('A05 keeps journey filter and disclosure state with scroll and focus', () => {
  assert.match(journey, /function captureContext\(\)/);
  assert.match(journey, /return \{ filter, disclosures \}/);
  assert.match(journey, /function restoreContext\(context\)/);
  assert.match(journey, /lockedOpenStates/);
  assert.match(journey, /dataset\.journeyStateKey/);
  assert.match(flow, /JourneyRuntime\.restoreContext\(options\.restoreContext\.journey\)/);
  assert.match(flow, /target\?\.focus\?\.\(\{ preventScroll: true \}\)/);
  assert.match(flow, /window\.scrollTo\(\{ top:/);
});

test('A05 lexicon history restores list/search state, query, position, and selected row focus', () => {
  assert.match(lexicon, /function capturePosition\(\)/);
  assert.match(lexicon, /history\.push\(capturePosition\(\)\)/);
  assert.match(lexicon, /state = previous\.state/);
  assert.match(lexicon, /render\(\{ restore: previous \}\)/);
  assert.match(lexicon, /value="\$\{esc\(state\.query\)\}"/);
  assert.match(lexicon, /target\?\.focus\?\.\(\{ preventScroll: true \}\)/);
  assert.match(lexicon, /GameFlow\.restoreViewContext\?\.\(returnContext\)/);
});

test('A05 replay completion uses the same context-aware return path', () => {
  assert.match(flow, /function returnFromReplay\(options\)/);
  assert.match(flow, /options\.returnContext && restoreViewContext\(options\.returnContext\)/);
  assert.match(ux, /advanced = baseFlow\.returnFromReplay\(context\)/);
});

test('A05 changed browser assets share a fresh cache key', () => {
  assert.match(html, /name="cwt-build" content="2026-10-06-a042"/);
  assert.match(html, /journey-runtime\.js\?v=20261006-a042/);
  for (const asset of ['lexicon-runtime.js', 'ux-play-runtime.js']) {
    assert.match(html, new RegExp(`${asset.replace('.', '\\.') }\\?v=20261006-a051`));
  }
  assert.match(html, /flow-runtime\.js\?v=20261006-a041/);
});
