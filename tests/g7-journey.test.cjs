const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/journey-content.js');
require('../src/g7-journey-content.js');
require('../src/journey-progress.js');
const P = globalThis.JourneyProgress;

test('G7 follows G6 after-story and closes the gate-town sequence', () => {
  const progress = P.normalize({
    seenStories: [
      'prologue-departure','prologue-forest-edge','chapter1-roadside-merchant','gate-arrival',
      'gate-after-entry','gate-bell-task','gate-after-bell','gate-route-task','gate-after-route',
      'gate-cart-task','gate-after-obstacle','gate-narrow-gate-task','gate-after-narrow-gate','gate-after-leading'
    ],
    completedStages: ['gate-stage-1','gate-stage-2','gate-stage-3','gate-stage-4','gate-stage-5','gate-stage-6']
  });
  assert.equal(P.nextNode('story:gate-after-leading', progress).id, 'gate-convoy-task');
  progress.seenStories.push('gate-convoy-task');
  assert.equal(P.nextNode('story:gate-convoy-task', progress).id, 'gate-stage-7');
  progress.completedStages.push('gate-stage-7');
  assert.equal(P.nextNode('stage:gate-stage-7', progress).id, 'gate-after-convoy');
  progress.seenStories.push('gate-after-convoy');
  const after = P.getNode('story:gate-after-convoy');
  assert.equal(after.returnToWorldAfter, true);
  assert.equal(P.nextNode(after.nodeId, progress), null);
});

test('G7 content keeps both routes valid and introduces no new vocabulary entries', () => {
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/g7-content.js'), 'utf8');
  assert.match(source, /id: 'gate-stage-7'/);
  assert.match(source, /id: 'west'/);
  assert.match(source, /id: 'east'/);
  assert.match(source, /words: \['路線','經由','跟隨','帶領'\]/);
  assert.doesNotMatch(source, /WORDS\[/);
});
