const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('quiet auxiliary actions keep a 44px component-level touch contract', () => {
  const landing = read('src/landing.css');
  const quest = read('src/first-free-quest.css');
  assert.match(landing, /\.landingSecondary button\{[^}]*min-width:44px;min-height:44px/);
  assert.match(quest, /\.firstQuestMeaningToggle\{[^}]*min-width:44px;min-height:44px/);
  assert.match(quest, /\.questBoardAction\{[^}]*min-width:44px;min-height:44px/);
});

test('board and menu close actions declare their role without changing every sheet default', () => {
  const styles = read('src/styles.css');
  const board = read('src/north-forest-world-runtime.js');
  const flow = read('src/flow-runtime.js');
  assert.match(styles, /\.sheetactions button\.secondary,\.sheetactions button\[data-action-role="close"\]/);
  assert.match(board, /questBoardAction" data-action-role="secondary"/);
  assert.match(board, /id="questBoardClose" data-action-role="close"/);
  assert.match(flow, /id="flowMenuClose" data-action-role="close"/);
  assert.match(styles, /\.sheetactions button\{[^}]*background:var\(--accent\)/);
  assert.match(styles, /\.sheetactions button:disabled\{[^}]*background:#d9ded9;[^}]*cursor:default/);
});

test('changed action-contract assets use the same deployment cache key', () => {
  const html = read('index.html');
  for (const asset of [
    'styles.css', 'landing.css', 'first-free-quest.css', 'world-runtime.js',
    'north-forest-world-runtime.js', 'first-free-quest-world-runtime.js',
  ]) {
    assert.match(html, new RegExp(`${asset.replace('.', '\\.') }\\?v=20261005-actioncontract1`));
  }
  assert.match(html, /flow-runtime\.js\?v=20261006-a051/);
});
