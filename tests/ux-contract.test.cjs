const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('index.html');
const styles = read('src/styles.css');
const flow = read('src/flow-runtime.js');
const story = read('src/story-runtime.js');

function ordered(source, tokens) {
  let cursor = -1;
  for (const token of tokens) {
    const next = source.indexOf(token, cursor + 1);
    if (next < 0 || next <= cursor) return false;
    cursor = next;
  }
  return true;
}

test('UX-01 tactical screen keeps intent, board, feedback, words, controls in a stable order', () => {
  assert.equal(
    ordered(index, ['class="goalbox"', 'class="mapwrap"', 'class="status"', 'class="words"', 'class="controls"']),
    true
  );
});

test('UX-01/12 mobile shell respects safe areas and tactical cells keep the 44px touch floor', () => {
  assert.match(index, /viewport-fit=cover/);
  assert.match(styles, /env\(safe-area-inset-top\)/);
  assert.match(styles, /\.cell\{[^}]*min-width:44px;[^}]*min-height:44px;/s);
  assert.match(styles, /\.wordbtn\{[^}]*height:44px;/s);
});

test('UX-02 feedback sits immediately after the tactical board instead of behind navigation', () => {
  const mapEnd = index.indexOf('</section>', index.indexOf('class="mapwrap"'));
  const status = index.indexOf('class="status"');
  const words = index.indexOf('class="words"');
  assert.ok(mapEnd >= 0 && status > mapEnd && words > status);
});

test('UX-06 completion keeps retry secondary and forward progress primary', () => {
  const retryAt = flow.indexOf('flowRetry');
  const nextAt = flow.indexOf('flowNext');
  assert.ok(retryAt >= 0 && nextAt >= 0, 'completion actions should exist');
  assert.match(flow.slice(Math.max(0, retryAt - 100), retryAt + 150), /secondary/);
  assert.match(flow, /flowNext[\s\S]*textContent[\s\S]*replay/);
});

test('UX-07 stage completion continues to the next node directly on first play', () => {
  const nextHandlerAt = flow.indexOf("$('flowNext').onclick");
  assert.ok(nextHandlerAt >= 0, 'forward completion handler should exist');
  const handler = flow.slice(nextHandlerAt, nextHandlerAt + 320);
  assert.match(handler, /returnFromReplay\(context\)/);
  assert.match(handler, /continueFromNode/);
  assert.doesNotMatch(handler, /showJourney\(/);
});

test('UX-08 story end label describes the next node and finish continues directly', () => {
  assert.match(flow, /next\?\.type === 'stage' \? '스테이지 시작'/);
  assert.match(flow, /next\?\.type === 'story' \? '이야기 계속'/);
  assert.match(flow, /continueFromNode\(node\.nodeId\)/);
  assert.match(story, /storyNext[\s\S]*options\.endLabel/);
});

test('UX-09 direct stage-to-stage flow does not force a journey or world detour', () => {
  const start = flow.indexOf('function continueFromNode(id)');
  const end = flow.indexOf('function playStory', start);
  assert.ok(start >= 0 && end > start, 'continueFromNode should exist');
  const body = flow.slice(start, end);
  assert.match(body, /P\.nextNode/);
  assert.match(body, /if \(node\) return playNode\(node\)/);
});

test('UX-06 replay exit returns to the caller instead of altering campaign progression', () => {
  assert.match(flow, /function returnFromReplay\(options\)/);
  assert.match(flow, /context\.mode === 'replay'/);
});
