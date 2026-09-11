const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/journey-content.js');
require('../src/journey-progress.js');
const P = globalThis.JourneyProgress;

test('gate-town G6 starts after G5 post-story and returns to world after its post-story', () => {
  const progress = P.normalize({
    seenStories: ['prologue-departure','prologue-forest-edge','chapter1-roadside-merchant','gate-arrival','gate-after-entry','gate-bell-task','gate-after-bell','gate-route-task','gate-after-route','gate-cart-task','gate-after-obstacle','gate-narrow-gate-task','gate-after-narrow-gate'],
    completedStages: ['gate-stage-1','gate-stage-2','gate-stage-3','gate-stage-4','gate-stage-5']
  });
  assert.equal(P.nextNode('story:gate-after-narrow-gate', progress).id, 'gate-stage-6');
  progress.completedStages.push('gate-stage-6');
  assert.equal(P.nextNode('stage:gate-stage-6', progress).id, 'gate-after-leading');
  assert.equal(P.getNode('story:gate-after-leading').returnToWorldAfter, true);
});
