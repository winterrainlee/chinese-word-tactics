const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/journey-content.js');
require('../src/journey-progress.js');
const P = globalThis.JourneyProgress;

test('gate-town G4 starts after G3 post-story and returns to world after its post-story', () => {
  const progress = P.normalize({
    seenStories: ['prologue-departure','prologue-forest-edge','chapter1-roadside-merchant','gate-arrival','gate-after-entry','gate-bell-task','gate-after-bell','gate-route-task','gate-after-route'],
    completedStages: ['gate-stage-1','gate-stage-2','gate-stage-3']
  });
  assert.equal(P.nextNode('story:gate-after-route', progress).id, 'gate-cart-task');
  progress.seenStories.push('gate-cart-task');
  assert.equal(P.nextNode('story:gate-cart-task', progress).id, 'gate-stage-4');
  progress.completedStages.push('gate-stage-4');
  assert.equal(P.nextNode('stage:gate-stage-4', progress).id, 'gate-after-obstacle');
  assert.equal(P.getNode('story:gate-after-obstacle').returnToWorldAfter, true);
});
