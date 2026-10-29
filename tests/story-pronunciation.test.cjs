const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('the pronunciation corpus covers every implemented story and outcome', () => {
  const output = execFileSync(process.execPath, ['tools/story-pronunciation-audit.cjs'], {
    cwd: root, encoding: 'utf8'
  });
  assert.match(output, /76 stories/);
});

test('pronunciation lookup is scoped to the exact story context', () => {
  const context = vm.createContext({});
  vm.runInContext(read('src/story-pronunciation-content.js'), context);
  const first = '天亮了。少年站在村口，背上是小小的行李。';
  const gate = '少年沿著行商指的路，來到了三溪鎮外圍的關口。';
  assert.ok(context.StoryPronunciation.readingFor('prologue-departure', first));
  assert.ok(context.StoryPronunciation.readingFor('gate-arrival', gate));
  assert.equal(context.StoryPronunciation.readingFor('gate-arrival', first), null);
  assert.equal(context.StoryPronunciation.readingFor('prologue-departure', gate), null);
  assert.equal(context.StoryPronunciation.supportedStories.length, 76);
});

test('story renderer creates safe per-character ruby and keeps assistive text clean', () => {
  const runtime = read('src/story-runtime.js');
  assert.match(runtime, /document\.createElement\('ruby'\)/);
  assert.match(runtime, /document\.createElement\('rt'\)/);
  assert.match(runtime, /readingText\.className = 'storyPronunciation'/);
  assert.match(runtime, /reading\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(runtime, /element\.setAttribute\('aria-label', ariaLabel\)/);
  assert.doesNotMatch(runtime, /innerHTML\s*=/);
});


test('03B stage-local narrative scenes use the shared ruby corpus without new Journey story IDs', () => {
  const context=vm.createContext({});
  vm.runInContext(read('src/story-pronunciation-content.js'),context);
  const P=context.StoryPronunciation;
  const samples=[
    ['academic-tower-03b-scene-paper','研究員剛翻開地圖的一角，一張摺好的紙突然滑了出來。'],
    ['academic-tower-03b-scene-market','舊記錄我看得多，現在的市集倒是你比較熟。這一段就一起寫吧。']
  ];
  assert.equal(P.supportedStories.length,76,'stage-local scenes are not new Journey nodes');
  for (const [sceneId,text] of samples) {
    const reading=P.readingFor(sceneId,text);
    assert.ok(reading,'missing reading for '+sceneId);
    assert.equal(reading.length,[...text].filter(c=>/\p{Script=Han}/u.test(c)).length);
    assert.equal(P.readingFor('academic-tower-ran-village-intro',text),null);
  }
  const t5='完全沒用了？也不盡然吧。至少那條路現在還有人走。';
  assert.ok(P.readingFor('academic-tower-ran-village-result',t5));
});


test('04A stage-local 反而 discovery line reads 一部分 as ㄧˊ ㄅㄨˋ ㄈㄣˋ',()=>{
  const ctx=vm.createContext({});
  vm.runInContext(read('src/story-pronunciation-content.js'),ctx);
  const line='原來有一部分水從旁邊流走了！那個小孔是怎麼來的？';
  const reading=ctx.StoryPronunciation.readingFor('academic-tower-er-scene-record',line);
  assert.ok(reading,'04A result-scene pronunciation must be available');
  const prefix=[...line.slice(0,line.indexOf('一部分'))].filter(c=>/\p{Script=Han}/u.test(c)).length;
  assert.deepEqual(Array.from(reading.slice(prefix,prefix+3)),['ㄧˊ','ㄅㄨˋ','ㄈㄣˋ']);
});
