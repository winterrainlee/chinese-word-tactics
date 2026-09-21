const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('the pilot pronunciation corpus covers prologue, market defaults and every market outcome', () => {
  const output = execFileSync(process.execPath, ['tools/story-pronunciation-audit.cjs'], {
    cwd: root, encoding: 'utf8'
  });
  assert.match(output, /18 stories/);
});

test('pronunciation lookup is scoped to the pilot story IDs', () => {
  const context = vm.createContext({});
  vm.runInContext(read('src/story-pronunciation-content.js'), context);
  const first = '天亮了。少年站在村口，背上是小小的行李。';
  assert.ok(context.StoryPronunciation.readingFor('prologue-departure', first));
  assert.equal(context.StoryPronunciation.readingFor('gate-arrival', first), null);
});

test('story renderer creates safe per-character ruby and keeps assistive text clean', () => {
  const runtime = read('src/story-runtime.js');
  assert.match(runtime, /document\.createElement\('ruby'\)/);
  assert.match(runtime, /document\.createElement\('rt'\)/);
  assert.match(runtime, /reading\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(runtime, /element\.setAttribute\('aria-label', ariaLabel\)/);
  assert.doesNotMatch(runtime, /innerHTML\s*=/);
});
