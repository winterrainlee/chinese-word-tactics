const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

require('../src/journey-content.js');
require('../src/g7-journey-content.js');
require('../src/workshop-journey-content.js');
require('../src/workshop-late-journey-content.js');
require('../src/market-journey-content.js');
require('../src/market-late-journey-content.js');
require('../src/continuous-region-flow.js');
require('../src/chapter1-finale-content.js');
require('../src/journey-progress.js');

const P = globalThis.JourneyProgress;
const storage = seed => {
  const data = new Map(Object.entries(seed || {}));
  return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), data };
};

test('C06 waits for all three regional finales and lives in the inn section', () => {
  const chapter = JourneyContent.JOURNEY.find(item => item.id === 'chapter-1-three-roads');
  const finale = chapter.sections.find(section => section.id === 'chapter1-finale');
  assert.ok(finale);
  assert.equal(finale.regionId, 'inn');
  assert.deepEqual(finale.sequence.map(node => node.id), ['chapter1-inn-convergence', 'chapter1-room-finale']);
  assert.deepEqual(finale.sequence[0].requires, [
    'story:gate-after-convoy', 'story:workshop-finale', 'story:market-after-m8'
  ]);
  assert.deepEqual(finale.sequence[1].requires, ['story:chapter1-inn-convergence']);
  assert.equal(finale.sequence[1].milestone, 'chapter1-complete');
  assert.equal(finale.sequence[0].returnToWorldAfter, undefined);
});

test('C06 dialogue joins the three routes without inventing a next day or townwide fame', () => {
  const convergence = JourneyContent.STORIES['chapter1-inn-convergence'];
  const room = JourneyContent.STORIES['chapter1-room-finale'];
  const all = [...convergence.beats, ...room.beats].map(beat => `${beat.zh} ${beat.ko}`).join(' ');

  assert.match(all, /길목/);
  assert.match(all, /장인골/);
  assert.match(all, /장터/);
  assert.match(all, /돌아올 곳도 생겼네/);
  assert.match(all, /다음엔 어디로 가볼까/);
  assert.doesNotMatch(all, /다음 날|오늘도|어제도|明天|今天又|昨天/);
  assert.doesNotMatch(all, /유명|온 마을|찾으러 왔|全鎮.*知道/);
});

test('the room finale persists chapter1-complete as a story milestone', () => {
  const disk = storage();
  const store = P.createStore(disk);
  const room = P.getNode('story:chapter1-room-finale');
  assert.ok(room);

  store.complete(room);
  assert.ok(store.get().seenStories.includes('chapter1-room-finale'));
  assert.ok(store.get().completedMilestones.includes('chapter1-complete'));

  const saved = JSON.parse(disk.getItem(P.KEY));
  assert.ok(saved.completedMilestones.includes('chapter1-complete'));
});

test('replaying the room finale cannot create chapter completion', () => {
  const store = P.createStore(storage());
  const room = P.getNode('story:chapter1-room-finale');
  store.complete(room, 'replay');
  assert.deepEqual(store.get().completedMilestones, []);
  assert.deepEqual(store.get().seenStories, []);
});

test('C06 runtime points the player to the inn and returns the ending to the actual room', () => {
  const runtime = read('src/chapter1-finale-runtime.js');
  const html = read('index.html');

  for (const core of ['gate-core', 'workshop-core', 'market-core']) assert.match(runtime, new RegExp(core));
  for (const story of ['gate-after-convoy', 'workshop-finale', 'market-after-m8']) assert.match(runtime, new RegExp(story));
  assert.match(runtime, /chapter1-complete/);
  assert.match(runtime, /돌아와서 할 이야기가 생겼다/);
  assert.match(runtime, /여관으로 돌아가기/);
  assert.match(runtime, /enterRegion\?\.\('inn'\)/);
  assert.match(runtime, /stopImmediatePropagation/);
  assert.match(runtime, /ROOM_STORY_ID/);
  assert.match(runtime, /WorldInn\?\.openRoom\?\.\(\)/);
  assert.doesNotMatch(runtime, /localStorage|setItem|removeItem/);
  assert.ok(html.indexOf('continuous-region-flow.js') < html.indexOf('chapter1-finale-content.js'));
  assert.ok(html.indexOf('chapter1-finale-content.js') < html.indexOf('journey-progress.js'));
  assert.ok(html.indexOf('world-inn-runtime.js') < html.indexOf('chapter1-finale-runtime.js'));
});
