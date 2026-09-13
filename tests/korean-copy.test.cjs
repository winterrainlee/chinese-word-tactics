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

test('reviewed Korean copy uses the approved workshop and sign terms', () => {
  const currentCopy = [
    'src/workshop-content.js',
    'src/workshop-journey-content.js',
    'src/workshop-late-content.js',
    'src/workshop-late-journey-content.js',
    'src/world-reward-runtime.js',
    'src/gate-reward-story-content.js'
  ].map(read).join('\n');
  assert.doesNotMatch(currentCopy, /권양기|수선패|W4에서는|작은 푯말 기호/);
  assert.match(currentCopy, /오른쪽 빈 도르래/);
  assert.match(currentCopy, /공방 수리패/);
  assert.match(currentCopy, /작은 길표지 모양/);
});

test('reviewed market rules do not splice Korean particles onto Chinese phrases', () => {
  const currentCopy = read('src/market-content.js');
  assert.doesNotMatch(currentCopy, /原來有多少와|剩下은|錢幣가/);
  assert.match(currentCopy, /처음 있던 양\(原來數量\)과 지금 남은 양\(剩下\)을 구분해/);
  assert.match(currentCopy, /價格만큼 가진 동전이 줄어/);
});
