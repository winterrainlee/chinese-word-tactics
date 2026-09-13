const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const html = read('index.html');
const css = read('src/landing.css');
const flow = read('src/flow-runtime.js');
const art = read('images/title-departure.svg');

test('title view is the initial visible app surface', () => {
  assert.match(html, /<main id="landingView" class="landingShell appView"/);
  assert.match(html, /<h1 id="landingTitle" class="landingTitle">따라온 단어들<\/h1>/);
  assert.match(html, /id="tutorialView" class="shell appView" hidden/);
  assert.match(html, /landing\.css\?v=20260913-landing1/);
  assert.match(html, /title-departure\.svg\?v=20260913-landing1/);
});

test('landing scene stays a quiet journey illustration rather than a card dashboard', () => {
  assert.match(css, /\.landingShell\{[^}]*display:grid/);
  assert.match(css, /\.landingScene\{/);
  assert.doesNotMatch(css, /\.landingSceneWrap\{[^}]*border-radius/s);
  assert.match(art, /<svg[^>]*viewBox="0 0 360 310"/);
});

test('first visit starts the prologue while returning visits resume', () => {
  assert.match(flow, /primary\.textContent = started \? '이어서 여행하기' : '여행 시작'/);
  assert.match(flow, /started \? resume\(\) : playStory\('prologue-departure'\)/);
  assert.match(flow, /showLanding\(\);\s*\n\}\)\(\);/);
});

test('secondary record links unlock only after they have something to show', () => {
  assert.match(flow, /secondary\.hidden = !started/);
  assert.match(flow, /\$\('landingWords'\)\.hidden = !hasWords/);
  assert.match(flow, /LexiconRuntime\?\.snapshot\?\.\(\)/);
});

test('future settings slot exists without exposing an empty control', () => {
  assert.match(html, /id="landingSettings"[^>]*aria-label="설정" hidden/);
});
