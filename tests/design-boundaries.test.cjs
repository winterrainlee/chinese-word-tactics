const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const html = read('index.html');
const journey = read('src/journey.css');
const settings = read('src/settings.css');
const flow = read('src/flow-runtime.js');

test('A09a scopes the open-list treatment to the travel menu', () => {
  assert.match(flow, /class="flowMenu flowTravelMenu"/);
  assert.match(journey, /\.flowTravelMenu\{gap:0\}/);
  assert.match(journey, /\.flowTravelMenu button\{[^}]*min-height:48px;[^}]*border:0;border-radius:0;background:transparent/s);
  assert.match(journey, /\.flowTravelMenu button\+button\{border-top:1px solid/);
  assert.match(journey, /\.flowTravelMenu button:focus-visible,#flowMenuClose:focus-visible\{outline:3px solid var\(--blue\)/);
  assert.match(flow, /id="flowQuestChoices" class="flowMenu"/);
});

test('A09a settings use headings, spacing, and one-sided rules before closed boxes', () => {
  assert.match(settings, /\.settingsSection\{background:transparent;border:0;border-radius:0;[^}]*box-shadow:none/);
  assert.match(settings, /\.settingsSection\+\.settingsSection\{border-top:1px solid/);
  assert.match(settings, /\.settingsAction\{[^}]*min-height:52px;[^}]*border:0;border-radius:0;background:transparent/s);
  assert.match(settings, /\.settingsAction\+\.settingsAction\{border-top:1px solid/);
  assert.match(settings, /\.settingsToggle\{[^}]*min-height:52px;[^}]*border:0;border-radius:0;background:transparent/s);
});

test('A09a preserves meaningful state and work-surface boundaries', () => {
  assert.match(settings, /\.settingsToggle input\{[^}]*border:1px solid[^}]*border-radius:999px/s);
  assert.match(settings, /\.settingsDanger\{[^}]*border-left:2px solid[^}]*background:/s);
  assert.match(settings, /\.settingsRestorePreview\{[^}]*border:1px solid[^}]*border-radius:14px[^}]*background:var\(--accent-soft\)/s);
  assert.match(settings, /\.settingsAction:focus-visible[^}]*outline:3px solid var\(--blue\)/s);
});

test('A09a settings stay cached while later navigation work refreshes only changed assets', () => {
  assert.match(html, /name="cwt-build" content="2026-10-06-a051"/);
  assert.match(html, /settings\.css\?v=20261005-a09a1/);
  assert.match(html, /journey\.css\?v=20261006-a10a061/);
  assert.match(html, /flow-runtime\.js\?v=20261006-a051/);
});
