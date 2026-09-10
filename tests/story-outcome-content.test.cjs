const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/story-outcome-content.js');
const S = globalThis.StoryOutcomeContent;
const base = { id: 'gate-after-route', beats: [{ speaker: 'boy', zh: 'fallback', ko: '기본' }] };

test('G3 after-story follows the saved west or east pass', () => {
  const west = S.resolve(base, { stageOutcomes: { 'gate-stage-3': { viaIds: ['west-post'] } } });
  const east = S.resolve(base, { stageOutcomes: { 'gate-stage-3': { viaIds: ['east-post'] } } });
  assert.match(west.beats.map(beat => beat.zh).join(' '), /西哨通行牌/);
  assert.doesNotMatch(west.beats.map(beat => beat.zh).join(' '), /東哨通行牌/);
  assert.match(east.beats.map(beat => beat.zh).join(' '), /東哨通行牌/);
});

test('visiting both posts produces the two-pass version regardless of visit order', () => {
  const a = S.resolve(base, { stageOutcomes: { 'gate-stage-3': { viaIds: ['west-post', 'east-post'] } } });
  const b = S.resolve(base, { stageOutcomes: { 'gate-stage-3': { viaIds: ['east-post', 'west-post'] } } });
  assert.deepEqual(a.beats, b.beats);
  const text = a.beats.map(beat => beat.zh).join(' ');
  assert.match(text, /西哨通行牌/);
  assert.match(text, /東哨通行牌/);
});

test('missing outcome keeps the original generic story as a safe fallback', () => {
  assert.equal(S.resolve(base, { stageOutcomes: {} }), base);
  assert.equal(S.resolve({ id: 'other-story', beats: [] }, {} ).id, 'other-story');
});
