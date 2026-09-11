const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('current Korean game copy consistently calls 石碑 a 비석', () => {
  const currentCopy = ['src/content.js', 'src/app.js', 'src/journey-content.js'].map(read).join('\n');
  assert.doesNotMatch(currentCopy, /석비/);
  assert.match(currentCopy, /낡은 비석/);
  assert.match(currentCopy, /아까 비석의 글자/);
  assert.match(currentCopy, /비석이 빛나며 길이 열렸어/);
});
