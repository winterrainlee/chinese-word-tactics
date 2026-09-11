const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

require('../src/story-outcome-content.js');
require('../src/g7-story-outcome-content.js');
require('../src/gate-reward-story-content.js');
const S = globalThis.StoryOutcomeContent;
const base = { id: 'gate-after-convoy', beats: [{ speaker: 'driver', zh: '有你走在前面，這趟路走得安心多了。', ko: '안심' }] };

test('G7 epilogue awards the cart guide pass with a signpost mark', () => {
  const story = S.resolve(base, { stageOutcomes: { 'gate-stage-7': { viaIds: ['west-post'] } } });
  const text = story.beats.map(beat => `${beat.zh} ${beat.ko}`).join(' ');
  assert.match(text, /貨車引路牌/);
  assert.match(text, /푯말 기호/);
  assert.equal(story.beats.filter(beat => beat.zh?.includes('貨車引路牌')).length, 2);
});

test('world reward badges are tied to finishing each award story and use the signpost symbol', () => {
  const runtime = read('src/world-reward-runtime.js');
  const css = read('src/world-reward.css');
  const html = read('index.html');
  assert.match(runtime, /'gate-town':\s*{[\s\S]*storyId: 'gate-after-convoy'/);
  assert.match(runtime, /'workshop-town':\s*{[\s\S]*storyId: 'workshop-finale'/);
  assert.match(runtime, /nameZh: '修繕牌'/);
  assert.match(runtime, /nameKo: '수선패'/);
  assert.equal((runtime.match(/symbol: '🪧'/g) || []).length, 2);
  assert.match(runtime, /seenStories/);
  assert.match(runtime, /regionRewardBadge/);
  assert.match(css, /regionRewardBadge/);
  assert.match(html, /gate-reward-story-content\.js\?v=20260911-gatereward1/);
  assert.match(html, /world-reward-runtime\.js\?v=20260911-workshopreward1/);
  assert.match(html, /world-reward\.css\?v=20260911-gatereward2/);
  assert.ok(html.indexOf('world-runtime.js?v=20260911-townarrival1') < html.indexOf('world-reward-runtime.js?v=20260911-workshopreward1'));
});

test('earned reward also appears inside the selected region detail sheet', () => {
  const runtime = read('src/world-reward-runtime.js');
  const css = read('src/world-reward.css');
  assert.match(runtime, /earnedRewardsForRegion/);
  assert.match(runtime, /regionSheetNameZh/);
  assert.match(runtime, /worldRewardDetail/);
  assert.match(runtime, /받은 증표/);
  assert.match(runtime, /\$\{reward\.nameKo\}를 받았어\./);
  assert.match(css, /worldRewardDetailItem/);
  assert.match(css, /worldRewardDetailSymbol/);
});
