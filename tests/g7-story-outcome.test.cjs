const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/story-outcome-content.js');
require('../src/g7-story-outcome-content.js');
const S = globalThis.StoryOutcomeContent;
const base = { id: 'gate-after-convoy', beats: [{ speaker: 'narrator', zh: 'fallback', ko: '기본' }] };

test('G7 finale reflects west or east first-play route', () => {
  const west = S.resolve(base, { stageOutcomes: { 'gate-stage-7': { viaIds: ['west-post'] } } });
  const east = S.resolve(base, { stageOutcomes: { 'gate-stage-7': { viaIds: ['east-post'] } } });
  assert.match(west.beats.map(beat => beat.zh).join(' '), /西路/);
  assert.match(east.beats.map(beat => beat.zh).join(' '), /東路/);
});

test('G7 finale has a both-post fallback for exploratory routes', () => {
  const both = S.resolve(base, { stageOutcomes: { 'gate-stage-7': { viaIds: ['west-post','east-post'] } } });
  assert.match(both.beats.map(beat => beat.zh).join(' '), /兩座哨站/);
});
