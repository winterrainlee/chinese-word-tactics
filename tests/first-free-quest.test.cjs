const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const load = (context, file) => vm.runInContext(read(file), context, { filename: file });
const plain = value => JSON.parse(JSON.stringify(value));

function contentContext() {
  const context = vm.createContext({ console });
  [
    'src/content.js',
    'src/workshop-content.js',
    'src/workshop-late-content.js',
    'src/g7-content.js',
    'src/market-content.js',
    'src/market-late-content.js',
    'src/journey-content.js',
    'src/g7-journey-content.js',
    'src/workshop-journey-content.js',
    'src/workshop-late-journey-content.js',
    'src/market-journey-content.js',
    'src/market-late-journey-content.js',
    'src/continuous-region-flow.js',
    'src/chapter1-finale-content.js',
    'src/first-free-quest-content.js',
    'src/journey-progress.js'
  ].forEach(file => load(context, file));
  return context;
}

test('C08 starts only after the chapter ending and keeps offer, forest, and report out of generic journey', () => {
  const context = contentContext();
  const snapshot = vm.runInContext(`(() => {
    const chapter = JourneyContent.JOURNEY.find(item => item.id === 'chapter-1-three-roads');
    const ids = ['first-free-quest-offer','first-free-quest-forest','first-free-quest-report'];
    return ids.map(id => {
      const section = chapter.sections.find(item => item.id === id);
      return { id, regionId: section.regionId, hidden: section.hiddenFromJourney, sequence: section.sequence };
    });
  })()`, context);

  assert.deepEqual(plain(snapshot.map(item => [item.id, item.regionId, item.hidden])), [
    ['first-free-quest-offer', 'inn-first-quest', true],
    ['first-free-quest-forest', 'north-forest', true],
    ['first-free-quest-report', 'inn-first-quest-report', true]
  ]);
  assert.deepEqual(plain(snapshot[0].sequence[0].requires), ['story:chapter1-room-finale']);
  assert.deepEqual(plain(snapshot[1].sequence[0].requires), ['story:first-free-quest-accepted']);
  assert.deepEqual(plain(snapshot[2].sequence[0].requires), ['stage:first-free-quest-forest']);
  assert.equal(snapshot[2].sequence[0].milestone, 'first-free-quest-completed');
  assert.equal(snapshot[2].sequence[1].milestone, 'quest-board-unlocked');
  assert.equal(snapshot[2].sequence[1].returnToWorldAfter, true);
});

test('the northern forest quest deliberately reuses chapter-one vocabulary instead of adding a new word family', () => {
  const context = contentContext();
  const snapshot = vm.runInContext(`(() => {
    const stage = STAGES.find(item => item.id === 'first-free-quest-forest');
    return { words: stage.words, goal: stage.goal, required: stage.forestQuest.required, patches: stage.forestQuest.patches, allWords: Object.keys(WORDS) };
  })()`, context);

  assert.deepEqual(plain(snapshot.words), ['範圍', '數量', '不足', '足夠', '獲得', '退出']);
  plain(snapshot.words).forEach(word => assert.ok(plain(snapshot.allWords).includes(word), `missing reused WORDS entry: ${word}`));
  assert.equal(snapshot.required, 3);
  assert.equal(snapshot.patches.A.quantity + snapshot.patches.C.quantity, 3);
  assert.equal(snapshot.patches.A.target, true);
  assert.equal(snapshot.patches.B.target, false);
  assert.equal(snapshot.patches.C.target, true);
  assert.match(snapshot.goal, /範圍/);
  assert.match(snapshot.goal, /數量足夠/);
  assert.match(snapshot.goal, /退出/);
});

test('first quest completion and quest-board unlock persist as separate milestones', () => {
  const context = contentContext();
  const result = vm.runInContext(`(() => {
    const data = new Map();
    const disk = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) };
    const store = JourneyProgress.createStore(disk);
    const report = JourneyProgress.getNode('story:first-free-quest-report');
    const board = JourneyProgress.getNode('story:quest-board-installed');
    store.complete(report);
    const afterReport = store.get();
    store.complete(board);
    const afterBoard = store.get();
    return { afterReport, afterBoard };
  })()`, context);

  assert.ok(result.afterReport.completedMilestones.includes('first-free-quest-completed'));
  assert.ok(!result.afterReport.completedMilestones.includes('quest-board-unlocked'));
  assert.ok(result.afterBoard.completedMilestones.includes('first-free-quest-completed'));
  assert.ok(result.afterBoard.completedMilestones.includes('quest-board-unlocked'));
});

test('world runtime reveals the existing northern forest only after acceptance and installs the board only after reporting', () => {
  const runtime = read('src/first-free-quest-world-runtime.js');
  const content = read('src/first-free-quest-content.js');
  const css = read('src/first-free-quest.css');
  const html = read('index.html');

  assert.match(runtime, /chapter1-complete/);
  assert.match(runtime, /C\.COMPLETE_MILESTONE/);
  assert.match(runtime, /C\.BOARD_MILESTONE/);
  assert.match(content, /COMPLETE_MILESTONE: 'first-free-quest-completed'/);
  assert.match(content, /BOARD_MILESTONE: 'quest-board-unlocked'/);
  assert.match(runtime, /accepted\(value\)/);
  assert.match(runtime, /worldForestQuestMarker/);
  assert.match(runtime, /北邊森林/);
  assert.match(runtime, /enterRegion\?\.\('north-forest'\)/);
  assert.match(runtime, /enterRegion\?\.\('inn-first-quest-report'\)/);
  assert.match(runtime, /나중에/);
  assert.match(runtime, /지금은 새로 적힌 부탁이 없다/);
  assert.doesNotMatch(runtime, /localStorage|setItem|removeItem|Date\(|new Date|24시간|하루 뒤/);
  assert.match(css, /\.worldForestQuestMarker\{[^}]*left:50%;top:24%/);
  assert.ok(html.indexOf('chapter1-finale-content.js') < html.indexOf('first-free-quest-content.js'));
  assert.ok(html.indexOf('first-free-quest-content.js') < html.indexOf('journey-progress.js'));
  assert.ok(html.indexOf('interaction-runtime.js') < html.indexOf('first-free-quest-runtime.js'));
  assert.ok(html.indexOf('chapter1-finale-runtime.js') < html.indexOf('first-free-quest-world-runtime.js'));
});
