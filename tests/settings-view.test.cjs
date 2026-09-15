const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('src/settings.css');
const runtime = read('src/settings-runtime.js');
const save = read('src/save-data.js');
const flow = read('src/flow-runtime.js');

test('settings is reachable before a journey exists and from the in-game menu', () => {
  assert.match(html, /id="landingSettings"[^>]*aria-label="설정"/);
  assert.doesNotMatch(html, /id="landingSettings"[^>]*hidden/);
  assert.match(html, /id="settingsView" class="settingsShell appView" hidden/);
  assert.match(runtime, /landingSettings.*addEventListener\('click', open\)/);
  assert.match(flow, /id=\"flowSettings\"/);
  assert.match(flow, /설정 · 저장과 복원/);
});

test('settings exposes export, validated restore preview, reset, and build information', () => {
  for (const id of ['settingsExport', 'settingsImport', 'settingsRestorePreview', 'settingsRestoreConfirm', 'settingsReset', 'settingsBuild']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(runtime, /SaveData\.createBackup\(localStorage/);
  assert.match(runtime, /SaveData\.validateBackup\(parsed\)/);
  assert.match(runtime, /SaveData\.restoreBackup\(localStorage, restoreCandidate\)/);
  assert.match(runtime, /GameFlow\.resetJourney\(\)/);
});

test('backup format owns an exact allowlist rather than exporting arbitrary same-origin storage', () => {
  assert.match(save, /const STORAGE_KEYS = Object\.freeze/);
  assert.match(save, /chinese-word-tactics-journey-v1/);
  assert.match(save, /chufa-tutorial-v03/);
  assert.match(save, /chinese-word-tactics-world-v1/);
  assert.match(save, /chinese-word-tactics-pending-completion-v1/);
  assert.match(save, /chinese-word-tactics-lexicon-v1/);
  assert.match(save, /supplied\.some\(key => !KEY_LIST\.includes\(key\)\)/);
});

test('settings actions keep mobile touch targets and restore is never applied before confirmation', () => {
  assert.match(css, /\.settingsAction\{[^}]*min-height:52px/s);
  assert.match(css, /\.settingsRestoreButton\{[^}]*min-height:48px/s);
  const inspectStart = runtime.indexOf('async function inspectFile');
  const restoreStart = runtime.indexOf('function restoreProgress');
  assert.ok(inspectStart >= 0 && restoreStart > inspectStart);
  assert.doesNotMatch(runtime.slice(inspectStart, restoreStart), /restoreBackup/);
});
