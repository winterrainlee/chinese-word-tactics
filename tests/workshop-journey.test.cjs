const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../src/journey-content.js');
require('../src/workshop-journey-content.js');

test('workshop section connects W1 through W3 with world pauses', () => {
  const section = globalThis.JourneyContent.JOURNEY
    .flatMap(chapter => chapter.sections)
    .find(item => item.id === 'workshop-town');
  assert.ok(section);
  assert.deepEqual(section.sequence.map(node => `${node.type}:${node.id}`), [
    'story:workshop-arrival',
    'stage:workshop-stage-1',
    'story:workshop-after-w1',
    'story:workshop-w2-setup',
    'stage:workshop-stage-2',
    'story:workshop-after-w2',
    'story:workshop-w3-setup',
    'stage:workshop-stage-3',
    'story:workshop-after-w3'
  ]);
  assert.equal(section.sequence[2].returnToWorldAfter, true);
  assert.equal(section.sequence[5].returnToWorldAfter, true);
  assert.equal(section.sequence[8].returnToWorldAfter, true);
});

test('workshop W1 story gives the artisan a concrete reason to ask the boy for help', () => {
  const arrival = globalThis.JourneyContent.STORIES['workshop-arrival'];
  const after = globalThis.JourneyContent.STORIES['workshop-after-w1'];
  assert.ok(arrival);
  assert.ok(after);
  const zh = arrival.beats.map(beat => beat.zh).join('\n');
  const ko = arrival.beats.map(beat => beat.ko).join('\n');
  assert.match(zh, /我現在走不開/);
  assert.match(zh, /本來該我去看/);
  assert.match(zh, /我不會修東西/);
  assert.match(ko, /지금은 여기서 움직일 수가 없/);
  assert.match(ko, /원래는 내가/);
  assert.match(after.beats.map(beat => beat.zh).join('\n'), /第二次調整後/);
});

test('workshop W2 setup teaches target state without fixing an action order', () => {
  const setup = globalThis.JourneyContent.STORIES['workshop-w2-setup'];
  const after = globalThis.JourneyContent.STORIES['workshop-after-w2'];
  assert.ok(setup);
  assert.ok(after);
  const setupZh = setup.beats.map(beat => beat.zh).join('\n');
  const afterZh = after.beats.map(beat => beat.zh).join('\n');
  assert.match(setupZh, /火太大了/);
  assert.match(setupZh, /風反而太小/);
  assert.match(setupZh, /別管哪個先/);
  assert.match(afterZh, /不是越大越好/);
  assert.match(afterZh, /增加和減少/);
  assert.match(after.beats.at(-1).ko, /한쪽을 움직이면 다른 쪽도 같이 움직이는 장치/);
});

test('workshop W3 makes connection a propagated relation and keeps action order open', () => {
  const setup = globalThis.JourneyContent.STORIES['workshop-w3-setup'];
  const after = globalThis.JourneyContent.STORIES['workshop-after-w3'];
  assert.ok(setup);
  assert.ok(after);
  const setupZh = setup.beats.map(beat => beat.zh).join('\n');
  const setupKo = setup.beats.map(beat => beat.ko).join('\n');
  const afterZh = after.beats.map(beat => beat.zh).join('\n');
  assert.match(setupZh, /力量就會傳過去/);
  assert.match(setupZh, /中央木輪現在正常/);
  assert.match(setupZh, /右邊的吊輪在轉/);
  assert.match(setupKo, /순서는 네가 정해/);
  assert.match(afterZh, /力量也會跟著連接過去/);
  assert.match(afterZh, /該連的連，該分的分/);
  assert.match(after.beats.at(-1).ko, /여러 상태가 함께 맞아야 작업대가 열릴/);
});