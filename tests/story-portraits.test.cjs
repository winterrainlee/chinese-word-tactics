const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const portraits = {
  merchant: 'character-merchant.svg',
  gatekeeper: 'character-gatekeeper.svg',
  artisan: 'character-artisan.svg',
  marketkeeper: 'character-marketkeeper.svg',
  innkeeper: 'character-innkeeper.svg',
  driver: 'character-driver.svg',
  resident: 'character-resident.svg'
};

test('story character SVGs use the shared safe 32px visual grammar', () => {
  for (const file of Object.values(portraits)) {
    const svg = read(`icons/characters/${file}`);
    assert.match(svg, /viewBox="0 0 32 32"/);
    assert.match(svg, /stroke="#352e27"/);
    assert.match(svg, /stroke-width="0\.95"/);
    assert.doesNotMatch(svg, /<(?:script|foreignObject|image|text|style|animate|animateTransform)\b/i);
    assert.doesNotMatch(svg, /\bon[a-z]+\s*=|javascript:|url\(/i);
  }
});

test('every recurring story speaker and the generic resident have a portrait mapping', () => {
  const runtime = read('src/story-runtime.js');
  assert.match(runtime, /resident: \['居民', '주민'\]/);
  assert.ok(runtime.includes("boy: './icons/world/world-hero.svg'"));
  for (const [speaker, file] of Object.entries(portraits)) {
    assert.ok(runtime.includes(`${speaker}: './icons/characters/${file}'`), speaker);
  }
  assert.match(runtime, /const portraitEl = \$\('storyPortrait'\), portrait = portraits\[beat\.speaker\]/);
  assert.match(runtime, /portraitEl\.hidden = !portrait/);
  assert.doesNotMatch(runtime, /narrator:\s*'\.\/icons\/characters/);
  assert.doesNotMatch(runtime, /unknown:\s*'\.\/icons\/characters/);
});

test('gender-neutral resident asset avoids character-specific props and labels', () => {
  const resident = read('icons/characters/character-resident.svg');
  assert.match(resident, /Gender-neutral resident silhouette/);
  assert.doesNotMatch(resident, /hammer|key|ledger|spear|rein|satchel/i);
});
