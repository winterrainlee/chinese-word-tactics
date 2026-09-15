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

test('C08 becomes one revealed request under the reusable northern forest journey place', () => {
  const context = contentContext();
  const snapshot = vm.runInContext(`(() => {
    const collection = JourneyContent.JOURNEY.find(item => item.id === 'waterway-side-quests');
    const forest = collection.sections.find(item => item.id === 'north-forest');
    const quest = forest.quests.find(item => item.id === 'north-forest-mushrooms');
    const mainNodes = JourneyProgress.allNodes().filter(node => node.chapterKind !== 'quest-collection');
    const before = JourneyProgress.normalize({
      seenStories: mainNodes.filter(node => node.type === 'story').map(node => node.id),
      completedStages: mainNodes.filter(node => node.type === 'stage').map(node => node.id)
    });
    const after = JourneyProgress.normalize({ ...before, seenStories: [...before.seenStories, 'first-free-quest-accepted'] });
    const activeCheckpoint = JourneyProgress.normalize({ ...after,
      lastLocation: { view: 'tactical', nodeId: 'stage:first-free-quest-forest' } });
    return {
      collection: { kind: collection.kind, titleKo: collection.titleKo, tag: collection.tag },
      forest: { regionId: forest.regionId, nameKo: forest.nameKo, nameZh: forest.nameZh, questCount: forest.quests.length },
      quest: { id: quest.id, titleKo: quest.titleKo, titleZh: quest.titleZh, revealRequires: quest.revealRequires,
        sequence: quest.sequence },
      beforeVisible: JourneyProgress.nodes(before).filter(node => node.questId).map(node => node.nodeId),
      afterVisible: JourneyProgress.nodes(after).filter(node => node.questId).map(node => node.nodeId),
      recommendedAfter: JourneyProgress.recommendedNode(after)?.nodeId || null,
      recommendedAtCheckpoint: JourneyProgress.recommendedNode(activeCheckpoint)?.nodeId || null,
      resumeAtCheckpoint: JourneyProgress.resumeNode(activeCheckpoint)?.nodeId || null,
      nextAfterOffer: JourneyProgress.nextNode('story:first-free-quest-accepted', after)?.nodeId || null
    };
  })()`, context);

  assert.deepEqual(plain(snapshot.collection), {
    kind: 'quest-collection', titleKo: '자유 의뢰 · 물길마을 주변', tag: '선택 의뢰'
  });
  assert.deepEqual(plain(snapshot.forest), {
    regionId: 'north-forest', nameKo: '북쪽 숲', nameZh: '北邊森林', questCount: 1
  });
  assert.equal(snapshot.quest.id, 'north-forest-mushrooms');
  assert.equal(snapshot.quest.titleKo, '북쪽 숲의 버섯');
  assert.equal(snapshot.quest.titleZh, '北邊森林的蘑菇');
  assert.deepEqual(plain(snapshot.quest.revealRequires), ['story:first-free-quest-accepted']);
  assert.deepEqual(plain(snapshot.quest.sequence.map(node => [node.type, node.id, node.entryRegionId])), [
    ['story', 'first-free-quest-accepted', 'inn-first-quest'],
    ['stage', 'first-free-quest-forest', 'north-forest'],
    ['story', 'first-free-quest-report', 'inn-first-quest-report'],
    ['story', 'quest-board-installed', 'inn-first-quest-report']
  ]);
  assert.deepEqual(plain(snapshot.quest.sequence[0].requires), ['story:chapter1-room-finale']);
  assert.deepEqual(plain(snapshot.quest.sequence[1].requires), ['story:first-free-quest-accepted']);
  assert.deepEqual(plain(snapshot.quest.sequence[2].requires), ['stage:first-free-quest-forest']);
  assert.equal(snapshot.quest.sequence[2].milestone, 'first-free-quest-completed');
  assert.equal(snapshot.quest.sequence[3].milestone, 'quest-board-unlocked');
  assert.equal(snapshot.quest.sequence[3].returnToWorldAfter, true);
  assert.deepEqual(plain(snapshot.beforeVisible), []);
  assert.deepEqual(plain(snapshot.afterVisible), [
    'story:first-free-quest-accepted', 'stage:first-free-quest-forest',
    'story:first-free-quest-report', 'story:quest-board-installed'
  ]);
  assert.equal(snapshot.recommendedAfter, null);
  assert.equal(snapshot.recommendedAtCheckpoint, null);
  assert.equal(snapshot.resumeAtCheckpoint, 'stage:first-free-quest-forest');
  assert.equal(snapshot.nextAfterOffer, 'stage:first-free-quest-forest');
});

test('the northern forest quest deliberately reuses chapter-one vocabulary instead of adding a new word family', () => {
  const context = contentContext();
  const snapshot = vm.runInContext(`(() => {
    const stage = STAGES.find(item => item.id === 'first-free-quest-forest');
    return { words: stage.words, wordContext: stage.wordContext, goal: stage.goal, required: stage.forestQuest.required, patches: stage.forestQuest.patches, allWords: Object.keys(WORDS) };
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
  assert.deepEqual(Object.keys(snapshot.wordContext), plain(snapshot.words));
  for (const [word, detail] of Object.entries(snapshot.wordContext)) {
    assert.deepEqual(Object.keys(detail).sort(), ['ex', 'rule'], `${word} must override only ex/rule`);
    assert.ok(detail.ex && detail.rule, `${word} context must include both fields`);
  }
  assert.doesNotMatch(snapshot.wordContext['範圍'].ex + snapshot.wordContext['範圍'].rule, /鐘聲|종소리/);
  assert.match(snapshot.wordContext['範圍'].ex + snapshot.wordContext['範圍'].rule, /淺色|연하게/);
  assert.match(snapshot.wordContext['範圍'].rule, /채집 구역.*버섯 자리/);
  assert.doesNotMatch(snapshot.wordContext['數量'].rule, /原來數量|剩下/);
  assert.match(snapshot.wordContext['數量'].ex + snapshot.wordContext['數量'].rule, /種類和數量|종류와 數量/);
  assert.match(snapshot.wordContext['不足'].ex + snapshot.wordContext['不足'].rule, /不到三個|세 개보다 적/);
  assert.match(snapshot.wordContext['不足'].rule, /다른 종류 버섯.*포함되지 않아/);
  assert.match(snapshot.wordContext['足夠'].ex + snapshot.wordContext['足夠'].rule, /三個就足夠|세 개가 되면 足夠/);
  assert.match(snapshot.wordContext['足夠'].rule, /더 많이 모을 필요는 없어/);
  assert.doesNotMatch(snapshot.wordContext['獲得'].ex + snapshot.wordContext['獲得'].rule, /交換|繩子|밧줄/);
  assert.match(snapshot.wordContext['獲得'].ex + snapshot.wordContext['獲得'].rule, /持有的數量|보유 수량/);
  assert.doesNotMatch(snapshot.wordContext['退出'].ex + snapshot.wordContext['退出'].rule, /關口|관문/);
  assert.match(snapshot.wordContext['退出'].ex + snapshot.wordContext['退出'].rule, /回到入口退出森林|입구.*숲 밖/);
});

test('a future northern forest request stays a sibling quest instead of merging timelines', () => {
  const context = contentContext();
  const snapshot = vm.runInContext(`(() => {
    JourneyContent.STORIES['north-forest-signs-accepted'] = {
      id: 'north-forest-signs-accepted', chapterId: 'waterway-side-quests', titleKo: '숲길 표식 조사',
      beats: [{ speaker: 'narrator', zh: '看看路標。', ko: '길표지를 살펴보자.' }]
    };
    const forest = JourneyContent.JOURNEY.find(item => item.id === 'waterway-side-quests')
      .sections.find(item => item.id === 'north-forest');
    forest.quests.push({
      id: 'north-forest-signs', titleKo: '숲길 표식 조사', titleZh: '森林路標調查',
      revealRequires: ['story:north-forest-signs-accepted'],
      sequence: [{ type: 'story', id: 'north-forest-signs-accepted', entryRegionId: 'north-forest',
        requires: ['story:first-free-quest-accepted'] }]
    });
    const progress = JourneyProgress.normalize({
      seenStories: ['first-free-quest-accepted', 'first-free-quest-report', 'quest-board-installed', 'north-forest-signs-accepted'],
      completedStages: ['first-free-quest-forest']
    });
    return {
      questIds: JourneyProgress.nodes(progress).filter(node => node.sectionId === 'north-forest').map(node => node.questId),
      firstQuestNext: JourneyProgress.nextNode('story:quest-board-installed', progress)?.nodeId || null
    };
  })()`, context);

  assert.deepEqual(plain(snapshot.questIds), [
    'north-forest-mushrooms', 'north-forest-mushrooms', 'north-forest-mushrooms', 'north-forest-mushrooms',
    'north-forest-signs'
  ]);
  assert.equal(snapshot.firstQuestNext, null);
});

test('C08 keeps repeatable non-target inspection contextual while target patches switch to collection', () => {
  const context = contentContext();
  const actions = vm.runInContext(`(() => {
    const stage = STAGES.find(item => item.id === 'first-free-quest-forest');
    return stage.contextActions;
  })()`, context);
  const byAction = Object.fromEntries(plain(actions).map(action => [action.action, action]));

  assert.equal(byAction['forest-inspect-b'].target, 'B');
  assert.equal(byAction['forest-inspect-b'].unless, undefined);
  assert.equal(byAction['forest-inspect-b'].requires, undefined);
  for (const patch of ['a', 'c']) {
    assert.equal(byAction[`forest-inspect-${patch}`].unless, `forestPatch${patch.toUpperCase()}Observed`);
    assert.equal(byAction[`forest-collect-${patch}`].requires, `forestPatch${patch.toUpperCase()}Observed`);
    assert.equal(byAction[`forest-collect-${patch}`].unless, `forestPatch${patch.toUpperCase()}Collected`);
  }

  const runtime = read('src/first-free-quest-runtime.js');
  assert.match(runtime, /if \(!state\[observedFlag\]\) history\.push\(clone\(state\)\)/);
  assert.doesNotMatch(runtime, /showInspect\s*=/);
});

test('C08 acceptance remembers the route through the forest and the report reflects leaving that route', () => {
  const context = contentContext();
  const snapshot = vm.runInContext(`(() => {
    const accepted = JourneyContent.STORIES['first-free-quest-accepted'].beats;
    const report = JourneyContent.STORIES['first-free-quest-report'].beats;
    return {
      acceptedZh: accepted.map(beat => beat.zh).join(' '),
      acceptedKo: accepted.map(beat => beat.ko).join(' '),
      reportZh: report.map(beat => beat.zh).join(' '),
      reportKo: report.map(beat => beat.ko).join(' ')
    };
  })()`, context);

  assert.match(snapshot.acceptedZh, /三溪鎮/);
  assert.match(snapshot.acceptedZh, /走過那裡/);
  assert.match(snapshot.acceptedZh, /只是沿著路走/);
  assert.match(snapshot.acceptedKo, /물길마을에 올 때/);
  assert.match(snapshot.acceptedKo, /길만 따라/);
  assert.match(snapshot.reportZh, /離開原來那條路一點/);
  assert.match(snapshot.reportKo, /원래 길에서 조금만 벗어나도/);
  assert.doesNotMatch(snapshot.reportZh, /沒有很遠/);
  assert.doesNotMatch(snapshot.reportKo, /멀지 않/);
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
  const flow = read('src/flow-runtime.js');
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
  assert.match(flow, /activeQuestIds\.size > 1/);
  assert.match(flow, /function continueCampaign\(\)/);
  assert.match(flow, /P\.resumeNode\(progress\)/);
  assert.match(runtime, /나중에/);
  assert.match(runtime, /물길마을 북쪽에 있는 숲이야\./);
  assert.match(runtime, /지금은 새로 적힌 부탁이 없다/);
  assert.doesNotMatch(runtime, /첫 자유 의뢰에서 다녀온 북쪽 숲이야/);
  assert.doesNotMatch(runtime, /localStorage|setItem|removeItem|Date\(|new Date|24시간|하루 뒤/);
  assert.match(css, /\.worldForestQuestMarker\{[^}]*left:57\.5%;top:28\.5%/);
  assert.doesNotMatch(read('src/interaction-runtime.js'), /지형이나 늑대/);
  assert.ok(html.indexOf('chapter1-finale-content.js') < html.indexOf('first-free-quest-content.js'));
  assert.ok(html.indexOf('first-free-quest-content.js') < html.indexOf('journey-progress.js'));
  assert.ok(html.indexOf('word-context.js') < html.indexOf('app.js'));
  assert.ok(html.indexOf('interaction-runtime.js') < html.indexOf('first-free-quest-runtime.js'));
  assert.ok(html.indexOf('chapter1-finale-runtime.js') < html.indexOf('first-free-quest-world-runtime.js'));
});
