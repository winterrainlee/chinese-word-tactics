const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../src/journey-content.js');
require('../src/workshop-journey-content.js');
require('../src/workshop-late-journey-content.js');

const section = globalThis.JourneyContent.JOURNEY
  .flatMap(chapter => chapter.sections)
  .find(item => item.id === 'workshop-town');

test('workshop journey runs continuously from W1 through W7 with world pauses', () => {
  assert.ok(section);
  const ids = section.sequence.map(node => `${node.type}:${node.id}`);
  assert.deepEqual(ids.slice(-12), [
    'story:workshop-w4-setup',
    'stage:workshop-stage-4',
    'story:workshop-after-w4',
    'story:workshop-w5-setup',
    'stage:workshop-stage-5',
    'story:workshop-after-w5',
    'story:workshop-w6-setup',
    'stage:workshop-stage-6',
    'story:workshop-after-w6',
    'story:workshop-before-core',
    'stage:workshop-stage-7',
    'story:workshop-finale'
  ]);
  for (const id of ['workshop-after-w4', 'workshop-after-w5', 'workshop-after-w6', 'workshop-finale']) {
    assert.equal(section.sequence.find(node => node.id === id).returnToWorldAfter, true);
  }
});

test('W4-W6 stories hand off the learning idea to the next stage', () => {
  const stories = globalThis.JourneyContent.STORIES;
  const w4 = stories['workshop-w4-setup'].beats.map(beat => beat.zh).join('\n');
  const w5after = stories['workshop-after-w5'].beats.map(beat => beat.zh).join('\n');
  const w6 = stories['workshop-w6-setup'].beats.map(beat => beat.zh).join('\n');
  assert.match(w4, /三個條件都對了/);
  assert.match(w4, /哪個條件已經符合/);
  assert.match(w5after, /不是直接碰結果/);
  assert.match(w6, /真的損壞了/);
  assert.match(w6, /先看，再決定要不要修/);
});

test('W7 setup shows earned trust and finale awards repair token and first wage without forcing the tower', () => {
  const stories = globalThis.JourneyContent.STORIES;
  const setupZh = stories['workshop-before-core'].beats.map(beat => beat.zh).join('\n');
  const finaleZh = stories['workshop-finale'].beats.map(beat => beat.zh).join('\n');
  const finaleKo = stories['workshop-finale'].beats.map(beat => beat.ko).join('\n');
  assert.match(setupZh, /第一次來時/);
  assert.match(setupZh, /現在不一樣/);
  assert.match(setupZh, /你先自己判斷/);
  assert.match(finaleZh, /修繕牌/);
  assert.match(finaleZh, /工錢/);
  assert.match(finaleZh, /學術塔/);
  assert.match(finaleZh, /不急/);
  assert.match(finaleKo, /공방 수리패/);
  assert.match(finaleKo, /품삯/);
});
