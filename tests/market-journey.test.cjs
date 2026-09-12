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

test('merchant is foreshadowed in M1 and formally reappears before M2', () => {
  const arrival = globalThis.JourneyContent.STORIES['market-arrival'];
  const setup = globalThis.JourneyContent.STORIES['market-m2-setup'];
  assert.match(arrival.beats.map(beat => beat.zh).join('\n'), /好像在哪裡看過/);
  assert.match(setup.beats.map(beat => beat.zh).join('\n'), /咦？是你/);
  assert.match(setup.beats.map(beat => beat.ko).join('\n'), /길에서 좀 지체/);
});

test('M2 leftovers lead directly to the M3 cloth-for-rope exchange', () => {
  const after = globalThis.JourneyContent.STORIES['market-after-m2'];
  const setup = globalThis.JourneyContent.STORIES['market-m3-setup'];
  assert.match(after.beats.map(beat => beat.zh).join('\n'), /繩子攤正好需要布/);
  assert.match(after.beats.map(beat => beat.zh).join('\n'), /少一捆繩子/);
  assert.match(setup.beats.map(beat => beat.zh).join('\n'), /不是白拿，要互相交換/);
});
