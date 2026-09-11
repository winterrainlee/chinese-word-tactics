const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../src/journey-content.js');
require('../src/workshop-journey-content.js');

test('workshop section starts with arrival story, W1, and return story', () => {
  const section = globalThis.JourneyContent.JOURNEY
    .flatMap(chapter => chapter.sections)
    .find(item => item.id === 'workshop-town');
  assert.ok(section);
  assert.deepEqual(section.sequence.map(node => `${node.type}:${node.id}`), [
    'story:workshop-arrival',
    'stage:workshop-stage-1',
    'story:workshop-after-w1'
  ]);
  assert.equal(section.sequence[2].returnToWorldAfter, true);
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