const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const gateStory = [
  read('src/journey-content.js'),
  read('src/world-v06-content.js'),
  read('src/story-outcome-content.js'),
  read('src/g7-journey-content.js'),
  read('src/g7-story-outcome-content.js')
].join('\n');
require('../src/journey-content.js');

const narrowGateTask = globalThis.JourneyContent.STORIES['gate-narrow-gate-task'].beats;

test('gate story uses the Three Streams settlement rather than three legacy towns', () => {
  assert.match(gateStory, /三條路都通往三溪鎮/);
  assert.match(gateStory, /三溪鎮外圍的關口/);
  assert.doesNotMatch(gateStory, /關口鎮來往的人多/);
});

test('revised dialogue avoids known spatial, grammatical, and grid-language regressions', () => {
  for (const stale of [
    '北口前面的路分成兩條',
    '鐘聲的結果',
    '哪條路順手',
    '先看貨車也能不能走',
    '一格一格跟在後面',
    '少年繞過兩個哨站',
    '길을 이끌어줘'
  ]) assert.doesNotMatch(gateStory, new RegExp(stale));
  assert.match(gateStory, /往北口的路分成兩條/);
  assert.match(gateStory, /先確認貨車能不能通過/);
  assert.match(gateStory, /依次經過兩座哨站/);
});

test('cart convoy terminology and speaker label stay consistent', () => {
  assert.match(gateStory, /車隊集合處/);
  assert.match(gateStory, /수레 집결지/);
  assert.doesNotMatch(gateStory, /待車場|마부/);
  assert.match(read('src/story-runtime.js'), /driver: \['車夫', '수레꾼'\]/);
});

test('narrow-gate prompt exposes spatial clues without spelling out the move order', () => {
  const zh = narrowGateTask.map(beat => beat.zh).join(' ');
  const ko = narrowGateTask.map(beat => beat.ko).join(' ');

  assert.match(zh, /前進/);
  assert.match(zh, /後退/);
  assert.match(zh, /位置/);
  assert.match(ko, /전진/);
  assert.match(ko, /후퇴/);
  assert.match(ko, /위치/);
  assert.doesNotMatch(zh, /先後退.*門.*(?:打開|開).*往前/s);
  assert.doesNotMatch(ko, /먼저.*후퇴.*문.*열.*앞/s);
});
