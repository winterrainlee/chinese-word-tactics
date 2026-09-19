const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const load = (context, file) => vm.runInContext(read(file), context, { filename: file });

function contentContext() {
  const context = vm.createContext({ console });
  [
    'src/content.js', 'src/workshop-content.js', 'src/workshop-late-content.js',
    'src/g7-content.js', 'src/market-content.js', 'src/market-late-content.js',
    'src/journey-content.js', 'src/g7-journey-content.js', 'src/workshop-journey-content.js',
    'src/workshop-late-journey-content.js', 'src/market-journey-content.js',
    'src/market-late-journey-content.js', 'src/continuous-region-flow.js',
    'src/chapter1-finale-content.js', 'src/first-free-quest-content.js',
    'src/north-forest-content.js', 'src/journey-progress.js'
  ].forEach(file => load(context, file));
  return context;
}

function snapshot() {
  const context = contentContext();
  return vm.runInContext(`(() => ({
    stages: STAGES.filter(stage => stage.id.startsWith('north-forest-stage-')),
    quests: JourneyContent.JOURNEY.find(chapter => chapter.id === 'waterway-side-quests')
      .sections.find(section => section.id === 'north-forest').quests,
    stories: Object.fromEntries(Object.entries(JourneyContent.STORIES).filter(([id]) => id.startsWith('north-forest-'))),
    words: Object.keys(WORDS), ids: NorthForestContent.IDS
  }))()`, context);
}

function mechanics() {
  const context = vm.createContext({ console });
  load(context, 'src/north-forest-runtime.js');
  return context.NorthForestMechanics;
}

test('F2-F8 append after F1 and use the exact twenty target words', () => {
  const value = plain(snapshot());
  assert.deepEqual(value.stages.map(stage => stage.id), [2, 3, 4, 5, 6, 7, 8].map(n => `north-forest-stage-${n}`));
  assert.deepEqual(value.stages.map(stage => stage.words), [
    ['標記', '方向', '確認'], ['正確', '指示'], ['特徵', '相似', '分辨'],
    ['材料', '適合', '生長'], ['遺失', '尋找', '痕跡'], ['發現', '附近', '留下'],
    ['情況', '安全', '危險']
  ]);
  const expected = value.stages.flatMap(stage => stage.words);
  assert.equal(new Set(expected).size, 20);
  expected.forEach(word => assert.ok(value.words.includes(word), word));
  for (const review of ['深綠色', '淺綠色', '藍色', '長', '短', '圓', '尖', '粗', '細', '乾', '濕', '寬', '窄']) {
    assert.ok(!expected.includes(review), `${review} must remain review-layer vocabulary`);
  }
});

test('F2 hides the obscured direction, tracks all three confirmations, and completes only after all three', () => {
  const stage = plain(snapshot().stages[0]), M = mechanics();
  const reveal = stage.contextActions.find(action => action.target === 'C' && action.label.includes('잎'));
  const confirm = stage.contextActions.find(action => action.target === 'C' && action.label.includes('方向'));
  assert.deepEqual(reveal.sets, ['markerCRevealed']);
  assert.equal(confirm.requires, 'markerCRevealed');
  assert.equal(M.flagsMet({}, confirm.requires), false);
  assert.equal(M.flagsMet({ markerCRevealed: true }, confirm.requires), true);
  assert.equal(M.completionFor(stage, { markerAConfirmed: true, markerBConfirmed: true }), false);
  assert.equal(M.completionFor(stage, { markerAConfirmed: true, markerBConfirmed: true, markerCConfirmed: true }), true);
  assert.equal(stage.northForest.observables.find(item => item.id === 'marker-c').direction, '左');
  assert.ok(!stage.contextActions.some(action => /오답|틀린|wrong/.test(action.message || '')), 'F2 must not grade the rotated marker');
});

test('F3 cycles all four directions and needs both the correct direction and route reference', () => {
  const stage = plain(snapshot().stages[1]), M = mechanics(), discrete = stage.northForest.discrete;
  let direction = discrete.states[0];
  const cycle = [];
  for (let i = 0; i < 4; i++) { cycle.push(direction); direction = M.nextDiscreteState(discrete.states, direction); }
  assert.deepEqual(cycle, ['上', '右', '下', '左']);
  assert.equal(direction, '上');
  assert.equal(M.completionFor(stage, { markerDirection: '左', routeReferenceObserved: true }), false);
  assert.equal(M.completionFor(stage, { markerDirection: '下', routeReferenceObserved: false }), false);
  assert.equal(M.completionFor(stage, { markerDirection: '下', routeReferenceObserved: true }), true);
});

test('F4 distractors each differ by exactly one visible feature and only A matches', () => {
  const stage = plain(snapshot().stages[2]), M = mechanics(), cfg = stage.northForest;
  const differences = Object.fromEntries(cfg.observables.map(item => [item.char,
    M.attributeDifferences(cfg.reference, item.attributes, cfg.attributeKeys)]));
  assert.deepEqual(plain(differences), { A: [], B: ['tip'], C: ['color'], D: ['length'] });
  for (const item of cfg.observables.slice(1)) assert.equal(M.attributesMatch(cfg.reference, item.attributes, cfg.attributeKeys), false);
  assert.equal(M.completionFor(stage, { selectedPatch: 'plant-b' }), false);
  assert.equal(M.completionFor(stage, { selectedPatch: 'plant-a' }), true);
});

test('F5 has two suitable materials, rejects every mismatch, supports return, and needs the exit', () => {
  const stage = plain(snapshot().stages[3]), M = mechanics(), cfg = stage.northForest;
  const suitability = Object.fromEntries(cfg.observables.map(item => [item.char, M.materialSuitable(item.attributes, cfg.requirements)]));
  assert.deepEqual(plain(suitability), { A: true, B: false, C: true, D: false });
  assert.ok(stage.contextActions.some(action => action.operation === 'return-material' && action.target === 'B'));
  assert.equal(M.completionFor(stage, { carriedMaterials: ['material-a', 'material-b'] }, true), false);
  assert.equal(M.completionFor(stage, { carriedMaterials: ['material-a', 'material-c'] }, false), false);
  assert.equal(M.completionFor(stage, { carriedMaterials: ['material-a', 'material-c'] }, true), true);
});

test('F6 clue graph gates traces and only the blue thread plus follow-up trace unlock the clearing', () => {
  const stage = plain(snapshot().stages[4]), M = mechanics(), byId = Object.fromEntries(stage.northForest.observables.map(item => [item.id, item]));
  assert.equal(M.observableVisible(byId['animal-trace'], {}), false);
  assert.equal(M.observableVisible(byId['animal-trace'], { lastSeenConfirmed: true }), true);
  assert.equal(M.observableVisible(byId['drag-trace'], { lastSeenConfirmed: true }), false);
  assert.equal(M.observableVisible(byId['drag-trace'], { blueThreadConfirmed: true }), true);
  assert.equal(M.completionFor(stage, { relatedTraceConfirmed: true, reachedClearing: true }), false);
  assert.equal(M.completionFor(stage, { lastSeenConfirmed: true, blueThreadConfirmed: false, relatedTraceConfirmed: false, reachedClearing: true }), false);
  assert.equal(M.completionFor(stage, { lastSeenConfirmed: true, blueThreadConfirmed: true, relatedTraceConfirmed: true, reachedClearing: true }), true);
  const animal = stage.contextActions.find(action => action.target === 'W').message;
  const wheel = stage.contextActions.find(action => action.target === 'V').message;
  assert.match(animal, /沒有關係|관계없/);
  assert.match(wheel, /이것만으로는|不能確認/);
  const interaction = vm.createContext({ console });
  load(interaction, 'src/interaction-runtime.js');
  assert.equal(interaction.ContextActionLogic.isDirectInformationTarget(stage, [2, 3], { hero: [2, 4], blueThreadConfirmed: false }), true);
  assert.equal(interaction.ContextActionLogic.isDirectInformationTarget(stage, [2, 3], { hero: [2, 4], blueThreadConfirmed: true }), false);
});

test('F7 uses real distance and preserves confirm, discover, collect, exit order', () => {
  const stage = plain(snapshot().stages[5]), M = mechanics();
  const position = char => {
    for (let r = 0; r < stage.grid.length; r++) {
      const c = stage.grid[r].indexOf(char); if (c >= 0) return [r, c];
    }
    return null;
  };
  const center = position('L');
  assert.equal(M.nearby(center, position('A'), stage.northForest.radius), false);
  assert.equal(M.nearby(center, position('B'), stage.northForest.radius), true);
  assert.equal(M.nearby(center, position('C'), stage.northForest.radius), true);
  const bushActions = stage.contextActions.filter(action => action.target === 'C');
  assert.equal(bushActions[0].requires, 'finalTraceConfirmed');
  assert.equal(bushActions[1].requires, 'bundleThreadFound');
  assert.equal(bushActions[2].requires, 'bundleDiscovered');
  assert.equal(M.completionFor(stage, { bundleDiscovered: true, bundleCollected: false }, true), false);
  assert.equal(M.completionFor(stage, { finalTraceConfirmed: true, bundleThreadFound: true, bundleDiscovered: true, bundleCollected: true }, false), false);
  assert.equal(M.completionFor(stage, { finalTraceConfirmed: true, bundleThreadFound: true, bundleDiscovered: true, bundleCollected: true }, true), true);
});

test('F8 accepts west and east formations, blocks the cart in the middle, and allows retreat', () => {
  const stage = plain(snapshot().stages[6]), M = mechanics();
  const followerContext = vm.createContext({ console });
  load(followerContext, 'src/follower-runtime.js');
  const F = followerContext.FollowerMechanic;
  const simulate = path => {
    let hero = [6, 3], follower = [6, 2];
    for (const next of path) {
      const step = F.followerStep({ grid: stage.grid, follower, leaderFrom: hero, blockedChars: stage.follower.blockedChars });
      hero = next; follower = plain(step.pos);
    }
    return { hero, follower };
  };
  const west = simulate([[5,3],[5,2],[5,1],[4,1],[3,1],[2,1],[1,1],[1,2],[1,3],[0,3]]);
  const east = simulate([[5,3],[5,4],[5,5],[4,5],[3,5],[2,5],[1,5],[1,4],[1,3],[0,3]]);
  assert.equal(F.formationAtGoal({ grid: stage.grid, leader: west.hero, follower: west.follower, leaderGoalChar: 'E', followerGoal: [1,3] }), true);
  assert.equal(F.formationAtGoal({ grid: stage.grid, leader: east.hero, follower: east.follower, leaderGoalChar: 'E', followerGoal: [1,3] }), true);
  const middle = simulate([[5,3],[4,3],[3,3],[2,3]]);
  assert.deepEqual(middle.hero, [2,3]);
  assert.deepEqual(middle.follower, [4,3]);
  const retreat = M.retreatFollower({ grid: stage.grid, leader: [3,3], follower: middle.follower, blockedChars: stage.follower.blockedChars });
  assert.deepEqual(plain(retreat), { leader: [4,3], follower: [5,3], moved: true });
  assert.equal(M.routeSafety({ wet: true, narrow: true }), '危險');
  assert.equal(M.routeSafety({ wet: false, narrow: false, obstacle: false }), '安全');
  assert.deepEqual(stage.northForest.observables.map(item => item.attributes), [
    { surface: '乾', breadth: '寬', obstacle: '粗樹枝' },
    { surface: '濕', breadth: '窄', obstacle: '無' },
    { surface: '乾', breadth: '寬', obstacle: '無' }
  ]);
  assert.equal(stage.finalObstacle.kind, 'branch');
  assert.equal(stage.route, undefined, 'F8 must not persist a superior route outcome');
  assert.equal(M.completionFor(stage, { westSituationConfirmed: true, middleSituationConfirmed: true, eastSituationConfirmed: false }), false);
  assert.equal(M.completionFor(stage, { westSituationConfirmed: true, middleSituationConfirmed: true, eastSituationConfirmed: true }), true);
});

test('four sibling quests preserve place-request-event hierarchy and F2/F4 open in parallel', () => {
  const context = contentContext();
  const result = vm.runInContext(`(() => {
    const forest = JourneyContent.JOURNEY.find(chapter => chapter.id === 'waterway-side-quests').sections.find(section => section.id === 'north-forest');
    const p = JourneyProgress.normalize({ seenStories: ['quest-board-installed'] });
    return {
      ids: forest.quests.map(quest => quest.id),
      available: JourneyProgress.allNodes().filter(node => node.entryRegionId === 'quest-board' && JourneyProgress.isAvailable(node, p) && !JourneyProgress.isComplete(node, p)).map(node => node.nodeId),
      questIds: JourneyProgress.allNodes().filter(node => node.id.startsWith('north-forest-')).map(node => node.questId),
      roadMilestone: JourneyProgress.getNode('story:north-forest-epilogue').milestone
    };
  })()`, context);
  assert.deepEqual(plain(result.ids), ['north-forest-mushrooms', 'north-forest-signs', 'north-forest-materials', 'north-forest-bundle', 'north-forest-road']);
  assert.deepEqual(plain(result.available), ['story:north-forest-signs-request', 'story:north-forest-material-request']);
  assert.ok(result.questIds.every(Boolean));
  assert.equal(result.roadMilestone, 'north-forest-familiar');
  assert.match(read('src/flow-runtime.js'), /activeQuestIds\.size > 1\) return openQuestPicker/);
});

test('story keeps the northern forest local and ends with the chapter-opening cart reversal', () => {
  const value = plain(snapshot()), text = JSON.stringify(value.stories);
  assert.doesNotMatch(text, /끝마을|邊境村|유명|出名/);
  assert.match(text, /採集人/);
  assert.match(text, /市集/);
  assert.match(text, /工坊谷/);
  const ending = value.stories['north-forest-road-arrival'].beats.map(beat => `${beat.zh} ${beat.ko}`).join(' ');
  assert.match(ending, /帶著車進市集|수레를 데리고 장터/);
  assert.match(ending, /跟著我的車|내 수레를 따라/);
  const epilogue = value.stories['north-forest-epilogue'].beats.map(beat => beat.ko).join(' ');
  assert.match(epilogue, /낯설지|알 것 같/);
  assert.doesNotMatch(epilogue, /해금|새 지역/);
  assert.match(read('src/story-runtime.js'), /collector: \['採集人', '채집인'\]/);
  assert.match(read('src/story-runtime.js'), /character-collector\.svg/);
});

test('the innkeeper states the marker request and clearly sends the boy to the collector', () => {
  const story = plain(snapshot().stories['north-forest-signs-request']);
  const innkeeper = story.beats.filter(beat => beat.speaker === 'innkeeper').map(beat => `${beat.zh} ${beat.ko}`).join(' ');
  const exchange = story.beats.map(beat => `${beat.zh} ${beat.ko}`).join(' ');
  assert.match(innkeeper, /三個標記.*方向/);
  assert.match(innkeeper, /표식 세 개.*방향/);
  assert.match(innkeeper, /客棧窗邊/);
  assert.match(innkeeper, /여관 창가/);
  assert.match(exchange, /少年走到客棧窗邊/);
  assert.match(exchange, /소년은 여관 창가로 가서/);
  assert.match(exchange, /到了森林以後.*確認什麼/);
  assert.match(exchange, /숲에 가면 무엇을 확인/);
});

test('northern forest art is local, lightweight, vector-only, and wired at mobile tile scale', () => {
  const directory = path.join(root, 'icons/tactical/north-forest');
  const files = fs.readdirSync(directory).filter(file => file.endsWith('.svg'));
  assert.equal(files.length, 19);
  for (const file of files) {
    const source = fs.readFileSync(path.join(directory, file), 'utf8');
    assert.ok(Buffer.byteLength(source) < 4096, file);
    assert.match(source, /viewBox="0 0 32 32"/, file);
    assert.doesNotMatch(source, /<script|<filter|<text|url\(/i, file);
  }
  const css = read('src/north-forest.css');
  for (const name of ['marker-pointer', 'plant-long-pointed-dark', 'plant-long-round-dark', 'plant-long-pointed-light', 'plant-short-pointed-dark', 'vine-long-thin', 'vine-long-thick', 'vine-short-thin', 'trace-blue-thread', 'trace-animal', 'trace-wheel', 'trace-drag', 'bundle', 'branch-obstacle']) {
    assert.match(css, new RegExp(`${name}\\.svg`), name);
  }
  assert.match(css, /--cell:min\(46px/);
  assert.match(css, /forest-path-wet/);
  assert.match(css, /forest-path-narrow/);
  assert.match(read('src/styles.css'), /min-width:44px;min-height:44px/);
});

test('index loads northern forest content, mechanics, world integration, and art in dependency order', () => {
  const html = read('index.html');
  const content = html.indexOf('./src/north-forest-content.js');
  const progress = html.indexOf('./src/journey-progress.js');
  const follower = html.indexOf('./src/follower-runtime.js');
  const obstacle = html.indexOf('./src/g7-runtime.js');
  const runtime = html.indexOf('./src/north-forest-runtime.js');
  const flow = html.indexOf('./src/flow-runtime.js');
  const world = html.indexOf('./src/north-forest-world-runtime.js');
  const firstWorld = html.indexOf('./src/first-free-quest-world-runtime.js');
  assert.ok(content > 0 && content < progress);
  assert.ok(follower < obstacle && obstacle < runtime && runtime < flow);
  assert.ok(flow < world && world < firstWorld);
  assert.match(html, /north-forest\.css\?v=20260919-f8/);
});
