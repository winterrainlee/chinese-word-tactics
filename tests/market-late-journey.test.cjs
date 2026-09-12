const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../src/journey-content.js');
require('../src/market-journey-content.js');
require('../src/market-late-journey-content.js');

test('market journey now runs continuously through M8 with world pauses', () => {
  const section = globalThis.JourneyContent.JOURNEY
    .flatMap(chapter => chapter.sections)
    .find(item => item.id === 'market-town');
  const ids = section.sequence.map(node => `${node.type}:${node.id}`);
  assert.deepEqual(ids.slice(-12), [
    'story:market-m5-setup',
    'stage:market-stage-5',
    'story:market-after-m5',
    'story:market-m6-setup',
    'stage:market-stage-6',
    'story:market-after-m6',
    'story:market-m7-setup',
    'stage:market-stage-7',
    'story:market-after-m7',
    'story:market-m8-setup',
    'stage:market-stage-8',
    'story:market-after-m8'
  ]);
  for (const storyId of ['market-after-m5', 'market-after-m6', 'market-after-m7', 'market-after-m8']) {
    assert.equal(section.sequence.find(node => node.id === storyId).returnToWorldAfter, true);
  }
});

test('M5 states that both tool choices are valid and distinguishes price from value', () => {
  const story = globalThis.JourneyContent.STORIES['market-m5-setup'];
  const zh = story.beats.map(beat => beat.zh).join('\n');
  const ko = story.beats.map(beat => beat.ko).join('\n');
  assert.match(zh, /兩種都能把事情做完/);
  assert.match(zh, /價格/);
  assert.match(ko, /어느 쪽을 골라도/);
  assert.match(ko, /더 싼지만 보면 안/);
});

test('M6 explicitly teaches temporary defer rather than permanent loss', () => {
  const story = globalThis.JourneyContent.STORIES['market-m6-setup'];
  const zh = story.beats.map(beat => beat.zh).join('\n');
  const ko = story.beats.map(beat => beat.ko).join('\n');
  assert.match(zh, /不是丟掉/);
  assert.match(zh, /下一趟/);
  assert.match(ko, /버리는 게 아니라/);
});

test('M7 hands the player from replenishment into distribution and M8 leaves order open', () => {
  const m7 = globalThis.JourneyContent.STORIES['market-m7-setup'].beats.map(beat => beat.zh).join('\n');
  const m8 = globalThis.JourneyContent.STORIES['market-m8-setup'].beats.map(beat => beat.zh).join('\n');
  assert.match(m7, /先看每個地方缺什麼，再分配/);
  assert.match(m7, /補充/);
  assert.match(m8, /都由你決定/);
});

test('M8 finale closes the market arc with the merchant auntie and market keeper', () => {
  const finale = globalThis.JourneyContent.STORIES['market-after-m8'];
  const speakers = finale.beats.map(beat => beat.speaker);
  const zh = finale.beats.map(beat => beat.zh).join('\n');
  assert.ok(speakers.includes('merchant'));
  assert.ok(speakers.includes('marketkeeper'));
  assert.match(zh, /怎麼交換、怎麼買、怎麼分配/);
});
