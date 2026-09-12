const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../src/journey-content.js');
require('../src/market-journey-content.js');

test('market section connects M1 through M3 with world pauses', () => {
  const section = globalThis.JourneyContent.JOURNEY
    .flatMap(chapter => chapter.sections)
    .find(item => item.id === 'market-town');
  assert.ok(section);
  assert.deepEqual(section.sequence.map(node => `${node.type}:${node.id}`), [
    'story:market-arrival',
    'stage:market-stage-1',
    'story:market-after-m1',
    'story:market-m2-setup',
    'stage:market-stage-2',
    'story:market-after-m2',
    'story:market-m3-setup',
    'stage:market-stage-3',
    'story:market-after-m3'
  ]);
  assert.equal(section.sequence[2].returnToWorldAfter, true);
  assert.equal(section.sequence[5].returnToWorldAfter, true);
  assert.equal(section.sequence[8].returnToWorldAfter, true);
});

test('M1 directly reunites the boy with a middle-aged merchant who has a concrete reason to ask for help', () => {
  const arrival = globalThis.JourneyContent.STORIES['market-arrival'];
  const zh = arrival.beats.map(beat => beat.zh).join('\n');
  const ko = arrival.beats.map(beat => beat.ko).join('\n');
  assert.match(zh, /中年女行商/);
  assert.match(zh, /小小的木製手推車/);
  assert.match(zh, /你也來市集啦/);
  assert.match(zh, /我現在走不開/);
  assert.match(zh, /我手邊還有一袋麵粉/);
  assert.match(ko, /손을 뗄 수가 없/);
});

test('M2 continues from the same merchant instead of staging a second reunion', () => {
  const afterM1 = globalThis.JourneyContent.STORIES['market-after-m1'];
  const setup = globalThis.JourneyContent.STORIES['market-m2-setup'];
  assert.match(afterM1.beats.map(beat => beat.zh).join('\n'), /這批貨還有幾箱/);
  assert.match(setup.beats.map(beat => beat.zh).join('\n'), /現在真正剩下多少/);
  assert.match(setup.beats.map(beat => beat.ko).join('\n'), /실제로 얼마나 남았/);
});

test('M2 leftovers lead directly to the M3 cloth-for-rope exchange', () => {
  const after = globalThis.JourneyContent.STORIES['market-after-m2'];
  const setup = globalThis.JourneyContent.STORIES['market-m3-setup'];
  assert.match(after.beats.map(beat => beat.zh).join('\n'), /繩子攤正好需要布/);
  assert.match(after.beats.map(beat => beat.zh).join('\n'), /少一捆繩子/);
  assert.match(setup.beats.map(beat => beat.zh).join('\n'), /行商阿姨把一捆布/);
  assert.match(setup.beats.map(beat => beat.zh).join('\n'), /不是白拿，要互相交換/);
});
