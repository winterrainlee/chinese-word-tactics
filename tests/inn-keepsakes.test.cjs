const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadKeepsakes(progress = {}) {
  const sandbox = {
    GameFlow: { progress: () => progress },
    document: { getElementById: () => null },
    MutationObserver: class { observe() {} },
    window: { addEventListener() {} },
    setTimeout: callback => { callback(); return 1; },
    console
  };
  vm.runInNewContext(read('src/inn-keepsakes-runtime.js'), sandbox, { filename: 'inn-keepsakes-runtime.js' });
  return sandbox.InnKeepsakes;
}

test('pass keepsakes appear only after the route story has actually awarded them', () => {
  const outcomeOnly = {
    stageOutcomes: { 'gate-stage-3': { viaIds: ['west-post'] } }
  };
  assert.deepEqual(Array.from(loadKeepsakes(outcomeOnly).keepsakes(outcomeOnly)), []);

  const awarded = {
    seenStories: ['gate-after-route'],
    stageOutcomes: { 'gate-stage-3': { viaIds: ['west-post'] } }
  };
  assert.deepEqual(
    Array.from(loadKeepsakes(awarded).keepsakes(awarded), item => item.id),
    ['west-pass']
  );
});

test('east and west passage plaques both remain visible when both were received', () => {
  const progress = {
    seenStories: ['gate-after-route'],
    stageOutcomes: { 'gate-stage-3': { viaIds: ['west-post', 'east-post'] } }
  };
  const items = loadKeepsakes(progress).keepsakes(progress);
  assert.deepEqual(Array.from(items, item => item.id), ['west-pass', 'east-pass']);
  assert.deepEqual(Array.from(items, item => item.zh), ['西哨通行牌', '東哨通行牌']);
});

test('cart guide plaque appears only after the G7 reward story', () => {
  const beforeReward = {
    seenStories: ['gate-after-route'],
    stageOutcomes: { 'gate-stage-3': { viaIds: ['west-post'] } }
  };
  assert.deepEqual(Array.from(loadKeepsakes(beforeReward).keepsakes(beforeReward), item => item.id), ['west-pass']);

  const rewarded = {
    seenStories: ['gate-after-route', 'gate-after-convoy'],
    stageOutcomes: { 'gate-stage-3': { viaIds: ['west-post'] } }
  };
  const items = loadKeepsakes(rewarded).keepsakes(rewarded);
  assert.deepEqual(Array.from(items, item => item.id), ['west-pass', 'guide-plaque']);
  assert.equal(items[1].zh, '貨車引路牌');
  assert.equal(items[1].ko, '짐수레 길잡이패');
});

test('workshop repair plaque appears after the workshop finale story', () => {
  const progress = { seenStories: ['workshop-finale'] };
  const items = loadKeepsakes(progress).keepsakes(progress);
  assert.deepEqual(Array.from(items, item => item.id), ['repair-plaque']);
  assert.equal(items[0].zh, '修繕牌');
});

test('all earned keepsakes can share the inn room without inventing a new save key', () => {
  const progress = {
    seenStories: ['gate-after-route', 'gate-after-convoy', 'workshop-finale'],
    stageOutcomes: { 'gate-stage-3': { viaIds: ['east-post'] } }
  };
  const runtime = read('src/inn-keepsakes-runtime.js');
  const css = read('src/inn-keepsakes.css');
  const html = read('index.html');
  const items = loadKeepsakes(progress).keepsakes(progress);

  assert.deepEqual(Array.from(items, item => item.id), ['east-pass', 'guide-plaque', 'repair-plaque']);
  assert.doesNotMatch(runtime, /localStorage|setItem|removeItem/);
  assert.match(runtime, /seenStories/);
  assert.match(runtime, /stageOutcomes/);
  assert.match(runtime, /GUIDE_STORY_ID = 'gate-after-convoy'/);
  assert.doesNotMatch(runtime, /소년이 여행 중 실제로 받아 방에 남겨 둔 물건/);
  assert.match(css, /\.innDeskKeepsakes\{position:absolute;inset:0/);
  assert.match(css, /\.innDeskKeepsake\.guide-plaque/);
  assert.match(css, /\.innDeskKeepsake\.repair-plaque/);
  assert.match(html, /inn-keepsakes\.css\?v=20260913-keepsakes4/);
  assert.match(html, /inn-keepsakes-runtime\.js\?v=20260913-keepsakes5/);
});

test('travel passes live on the clothes chest, guide plaque on the wall, repair plaque on the desk', () => {
  const css = read('src/inn-keepsakes.css');
  const runtime = read('src/inn-keepsakes-runtime.js');
  assert.match(css, /\.innDeskKeepsake\.west-pass\{left:16\.5%;top:49\.2%/);
  assert.match(css, /\.innDeskKeepsake\.east-pass\{left:21%;top:50%/);
  assert.match(css, /\.innDeskKeepsake\.pass-single\{left:18\.7%;top:49\.6%/);
  assert.match(css, /\.innDeskKeepsake\.guide-plaque\{left:43%;top:23\.5%/);
  assert.match(css, /\.innDeskKeepsake\.repair-plaque\{left:84%;top:34\.5%/);
  assert.match(runtime, /const passCount = items\.filter\(isPass\)\.length/);
  assert.match(runtime, /passCount === 1/);
  assert.match(runtime, /방 안 여행의 흔적/);
});

test('inn keepsakes render when the room view is first created as well as when it becomes visible', () => {
  const runtime = read('src/inn-keepsakes-runtime.js');
  assert.match(runtime, /function mutationOpensOrCreatesRoom/);
  assert.match(runtime, /'childList'/);
  assert.match(runtime, /addedNodes/);
  assert.match(runtime, /node\?\.id === 'innRoomView'/);
  assert.match(runtime, /childList: true/);
  assert.match(runtime, /attributeFilter: \['hidden'\]/);
});
