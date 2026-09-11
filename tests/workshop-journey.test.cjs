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

test('workshop W1 story copy is registered', () => {
  assert.ok(globalThis.JourneyContent.STORIES['workshop-arrival']);
  assert.ok(globalThis.JourneyContent.STORIES['workshop-after-w1']);
});