const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/journey-content.js');
require('../src/journey-progress.js');
const P = globalThis.JourneyProgress;

test('gate-town G5 follows G4 and hands the story to G6 setup', () => {
  const progress = P.normalize({
    seenStories: [
      'prologue-departure','prologue-forest-edge','chapter1-roadside-merchant','gate-arrival',
      'gate-after-entry','gate-bell-task','gate-after-bell','gate-route-task','gate-after-route',
      'gate-cart-task','gate-after-obstacle'
    ],
    completedStages: ['gate-stage-1','gate-stage-2','gate-stage-3','gate-stage-4']
  });
  assert.equal(P.nextNode('story:gate-after-obstacle', progress).id, 'gate-narrow-gate-task');
  progress.seenStories.push('gate-narrow-gate-task');
  assert.equal(P.nextNode('story:gate-narrow-gate-task', progress).id, 'gate-stage-5');
  progress.completedStages.push('gate-stage-5');
  assert.equal(P.nextNode('stage:gate-stage-5', progress).id, 'gate-after-narrow-gate');
  const after = P.getNode('story:gate-after-narrow-gate');
  assert.equal(after.returnToWorldAfter, true);
  assert.ok(JourneyContent.STORIES['gate-after-narrow-gate'].beats.some(beat => beat.zh.includes('跟著我')));
});
