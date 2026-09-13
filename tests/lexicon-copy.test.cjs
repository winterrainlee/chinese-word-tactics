const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/lexicon-sheet-bridge.js'), 'utf8');

test('lexicon copy uses learner-facing questions and suggestions', () => {
  assert.match(source, /link\.textContent = '어떻게 다를까\?'/);
  assert.match(source, /heading\.textContent = '어떻게 다를까\?'/);
  assert.match(source, /heading\.textContent = '이것도 참고하자'/);
  assert.doesNotMatch(source, /link\.textContent = '단어장에서 비교하기'/);
});