const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('index.html');
const styles = read('src/styles.css');
const uxStyles = read('src/ux-play.css');
const flow = read('src/flow-runtime.js');
const ux = read('src/ux-play-runtime.js');
const story = read('src/story-runtime.js');
const continuous = read('src/continuous-region-flow.js');

function ordered(source, tokens) {
  let cursor = -1;
  for (const token of tokens) {
    const next = source.indexOf(token, cursor + 1);
    if (next < 0 || next <= cursor) return false;
    cursor = next;
  }
  return true;
}

test('UX-01 tactical screen keeps intent, target words, board, feedback, controls in a stable order', () => {
  assert.equal(
    ordered(index, ['class="goalbox"', 'class="words"', 'class="mapwrap"', 'class="status"', 'class="controls"']),
    true
  );
  assert.match(index, /ux-play\.css/);
  assert.match(index, /ux-play-runtime\.js/);
});

test('UX-01/12 mobile shell respects safe areas and tactical cells keep the 44px touch floor', () => {
  assert.match(index, /viewport-fit=cover/);
  assert.match(styles, /env\(safe-area-inset-top\)/);
  assert.match(styles, /\.cell\{[^}]*min-width:44px;[^}]*min-height:44px;/s);
  assert.match(styles, /\.wordbtn\{[^}]*height:44px;/s);
});

test('UX-01/02 compact goal removes the always-visible rule block and strengthens feedback', () => {
  assert.match(uxStyles, /\.ruleline\{display:none\}/);
  assert.match(uxStyles, /\.goal\{[^}]*font-size:16px/s);
  assert.match(uxStyles, /\.status\{[^}]*min-height:48px[^}]*font-size:15px/s);
  assert.match(ux, /goalDetailBtn/);
  assert.match(ux, /목표와 규칙 자세히 보기/);
});

test('UX-01 learning words sit directly under the goal before the tactical board', () => {
  assert.equal(ordered(index, ['class="goalbox"', 'class="words"', 'class="mapwrap"']), true);
});

test('UX-02 market detail panel moves below immediate action feedback', () => {
  assert.match(ux, /document\.querySelector\('#grid \.market-panel'\)/);
  assert.match(ux, /context\.replaceChildren\(panel\)/);
  assert.match(uxStyles, /\.contextPanel \.market-panel-empty\{min-height:42px/);
});

test('UX-05/06 completion stays inline on the solved board and exposes only forward progress', () => {
  const start = ux.indexOf('function showStageComplete');
  const end = ux.indexOf('globalThis.GameFlow', start);
  assert.ok(start >= 0 && end > start);
  const body = ux.slice(start, end);
  assert.match(ux, /completionBar/);
  assert.match(body, /completion\.hidden = false/);
  assert.match(body, /✓ 스테이지 완료/);
  assert.match(body, /id=\"flowNext\"/);
  assert.doesNotMatch(body, /openSheet/);
  assert.doesNotMatch(body, /flowRetry/);
  assert.match(uxStyles, /\.shell\.stageComplete \.controls\{display:none\}/);
});

test('UX-07 stage completion continues to the next node directly on first play', () => {
  assert.match(ux, /baseFlow\.continueFromNode\(`stage:\$\{id\}`\)/);
  const start = flow.indexOf('function continueFromNode(id)');
  const end = flow.indexOf('function playStory', start);
  const body = flow.slice(start, end);
  assert.match(body, /if \(node\) return playNode\(node\)/);
});

test('UX-08 story end label still describes the next node', () => {
  assert.match(flow, /next\?\.type === 'stage' \? '스테이지 시작'/);
  assert.match(flow, /next\?\.type === 'story' \? '이야기 계속'/);
  assert.match(story, /storyNext[\s\S]*options\.endLabel/);
});

test('UX-09 regional stories suppress intermediate world-map returns but preserve the finale return', () => {
  assert.match(continuous, /lastStoryIndex/);
  assert.match(continuous, /node\.returnToWorldAfter = index === lastStoryIndex/);
});

test('UX-06 replay inline completion returns to its caller without changing campaign flow', () => {
  assert.match(ux, /context\.mode === 'replay'/);
  assert.match(ux, /baseFlow\.showWorld\(\)/);
  assert.match(ux, /baseFlow\.showJourney\(\)/);
});