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
    'src/content.js', 'src/workshop-content.js', 'src/workshop-late-content.js',
    'src/g7-content.js', 'src/market-content.js', 'src/market-late-content.js',
    'src/journey-content.js', 'src/g7-journey-content.js', 'src/workshop-journey-content.js',
    'src/workshop-late-journey-content.js', 'src/market-journey-content.js',
    'src/market-late-journey-content.js', 'src/continuous-region-flow.js',
    'src/chapter1-finale-content.js', 'src/first-free-quest-content.js',
    'src/north-forest-content.js', 'src/academic-tower-content.js',
    'src/academic-tower-journey-content.js', 'src/journey-progress.js'
  ].forEach(file => load(context, file));
  return context;
}

function mechanics() {
  const context = vm.createContext({ console });
  load(context, 'src/academic-tower-runtime.js');
  return context.AcademicTowerMechanic;
}

test('Academic Tower appends rooms 01 through 03 without changing earlier stage order', () => {
  const context = contentContext();
  const result = vm.runInContext(`(() => ({
    lastStages: STAGES.slice(-4).map(stage => stage.id),
    rooms: AcademicTowerContent.bundle.rooms,
    words: [WORDS['卻'], WORDS['然而'], WORDS['果然'], WORDS['竟然']]
  }))()`, context);
  assert.deepEqual(plain(result.lastStages), [
    'north-forest-stage-8', 'academic-tower-turn-01-que',
    'academic-tower-turn-02-raner', 'academic-tower-turn-03-expectation'
  ]);
  assert.deepEqual(plain(result.rooms.map(room => room.implemented)), [true, true, true, false, false]);
  assert.deepEqual(plain(result.words.map(word => word.p)), ['ㄑㄩㄝˋ', 'ㄖㄢˊ ㄦˊ', 'ㄍㄨㄛˇ ㄖㄢˊ', 'ㄐㄧㄥˋ ㄖㄢˊ']);
  assert.deepEqual(plain(vm.runInContext(`STAGES.slice(-3, -1).map(stage => ({
    kind: stage.academicTower.kind,
    schemaVersion: stage.academicTower.schemaVersion,
    modes: stage.academicTower.cases.map(item => item.mode),
    optionCounts: stage.academicTower.cases.map(item => ({
      claims: item.claims?.length || 0,
      revisions: item.revisions.length
    })),
    allSourcesImmediate: stage.academicTower.cases.every(item =>
      !('revealLabelKo' in item) && item.sources.every(source => !('initiallyVisible' in source)))
  }))`, context)), [
    { kind: 'claim-revision', schemaVersion: 3, modes: ['guided', 'transfer'],
      optionCounts: [{ claims: 4, revisions: 4 }, { claims: 0, revisions: 4 }], allSourcesImmediate: true },
    { kind: 'claim-revision', schemaVersion: 3, modes: ['guided', 'transfer'],
      optionCounts: [{ claims: 4, revisions: 4 }, { claims: 0, revisions: 4 }], allSourcesImmediate: true }
  ]);
});

test('01 repairs an unsupported claim and requires a fresh opposite-direction record', () => {
  const context = contentContext(), M = mechanics();
  const config = vm.runInContext("STAGES.find(stage => stage.id === 'academic-tower-turn-01-que').academicTower", context);
  let state = M.createState(config, () => 0);
  assert.equal(state.phase, 'claim');
  assert.equal(state.claimId, null);
  assert.equal(state.revisionId, null);

  state = M.applyAction(config, state, { type: 'select-claim', value: 'fact-short' }).state;
  let result = M.applyAction(config, state, { type: 'submit-claim' });
  state = result.state;
  assert.equal(result.correct, false);
  assert.equal(state.phase, 'claim', 'a recorded fact must not be treated as the repair target');

  state = M.applyAction(config, state, { type: 'select-claim', value: 'overreach-use' }).state;
  state = M.applyAction(config, state, { type: 'submit-claim' }).state;
  assert.equal(state.phase, 'revision');
  state = M.applyAction(config, state, { type: 'select-revision', value: 'ignore-danger' }).state;
  state = M.applyAction(config, state, { type: 'submit-revision' }).state;
  assert.equal(state.phase, 'revision', 'finding the claim is not enough if the repair drops a fact');
  state = M.applyAction(config, state, { type: 'select-revision', value: 'keep-both' }).state;
  state = M.applyAction(config, state, { type: 'submit-revision' }).state;
  assert.equal(state.phase, 'review');
  assert.equal(M.isSolved(config, state), false, 'the guided example alone must not complete the room');

  state = M.applyAction(config, state, { type: 'next-case' }).state;
  assert.equal(state.phase, 'revision');
  state = M.applyAction(config, state, { type: 'select-revision', value: 'old-not-working' }).state;
  state = M.applyAction(config, state, { type: 'submit-revision' }).state;
  assert.equal(M.isSolved(config, state), false, 'repeating a negative conclusion must fail on the transfer case');
  state = M.applyAction(config, state, { type: 'select-revision', value: 'old-and-working' }).state;
  state = M.applyAction(config, state, { type: 'submit-revision' }).state;
  assert.equal(M.isSolved(config, state), true);
});

test('02 keeps partial improvement separate from whole-device recovery', () => {
  const context = contentContext(), M = mechanics();
  const config = vm.runInContext("STAGES.find(stage => stage.id === 'academic-tower-turn-02-raner').academicTower", context);
  let state = M.createState(config, () => .9);
  assert.equal(state.phase, 'claim', 'both records must be available immediately');
  state = M.applyAction(config, state, { type: 'select-claim', value: 'overreach-restored' }).state;
  state = M.applyAction(config, state, { type: 'submit-claim' }).state;
  state = M.applyAction(config, state, { type: 'select-revision', value: 'cancel-improvement' }).state;
  state = M.applyAction(config, state, { type: 'submit-revision' }).state;
  assert.equal(state.phase, 'revision');
  state = M.applyAction(config, state, { type: 'select-revision', value: 'keep-both' }).state;
  state = M.applyAction(config, state, { type: 'submit-revision' }).state;
  state = M.applyAction(config, state, { type: 'next-case' }).state;
  assert.equal(state.phase, 'revision');
  state = M.applyAction(config, state, { type: 'select-revision', value: 'deny-water' }).state;
  state = M.applyAction(config, state, { type: 'submit-revision' }).state;
  assert.equal(M.isSolved(config, state), false);
  state = M.applyAction(config, state, { type: 'select-revision', value: 'keep-both' }).state;
  state = M.applyAction(config, state, { type: 'submit-revision' }).state;
  assert.equal(M.isSolved(config, state), true);
});

test('03 crosses result valence with expectation relation and requires all four cases', () => {
  const context = contentContext(), M = mechanics();
  const config = vm.runInContext("STAGES.find(stage => stage.id === 'academic-tower-turn-03-expectation').academicTower", context);
  assert.equal(config.kind, 'expectation-sort');
  assert.deepEqual(plain(config.cases.map(item => [item.valence, item.relation])), [
    ['positive', 'matched'], ['negative', 'surprising'],
    ['negative', 'matched'], ['positive', 'surprising']
  ]);
  assert.ok(config.cases.slice(0, 2).every(item => item.resultZh.includes(item.markerZh)));
  assert.ok(config.cases.slice(2).every(item => !item.resultZh.includes(item.markerZh) && item.reviewZh.includes(item.markerZh)));

  let state = M.createState(config);
  assert.equal(state.phase, 'sort');
  assert.equal(state.relationId, null);
  state = M.applyAction(config, state, { type: 'select-relation', value: 'surprising' }).state;
  let result = M.applyAction(config, state, { type: 'submit-relation' });
  state = result.state;
  assert.equal(result.correct, false);
  assert.equal(state.phase, 'sort');
  assert.deepEqual(plain(state.completedCaseIds), []);

  for (const relation of ['matched', 'surprising', 'matched', 'surprising']) {
    state = M.applyAction(config, state, { type: 'select-relation', value: relation }).state;
    result = M.applyAction(config, state, { type: 'submit-relation' });
    state = result.state;
    assert.equal(result.correct, true);
    if (state.phase === 'review') state = M.applyAction(config, state, { type: 'next-case' }).state;
  }
  assert.equal(state.phase, 'complete');
  assert.equal(state.completedCaseIds.length, 4);
  assert.equal(M.isSolved(config, state), true);
});

test('answer slots rotate per entry and remain stable in saved workbench state', () => {
  const context = contentContext(), M = mechanics();
  const config = vm.runInContext("STAGES.find(stage => stage.id === 'academic-tower-turn-01-que').academicTower", context);
  for (const random of [0, .26, .51, .76]) {
    const state = M.createState(config, () => random);
    const targets = [
      ['practice:claim', 'overreach-use'],
      ['practice:revision', 'keep-both'],
      ['transfer:revision', 'old-and-working']
    ];
    const slots = targets.map(([key, id]) => state.optionOrders[key].indexOf(id));
    assert.equal(new Set(slots).size, 3, 'always tapping one slot must not clear the room');
    assert.ok(slots.every(slot => slot >= 0 && slot < 4));
    assert.deepEqual(plain(M.applyAction(config, state, { type: 'select-claim', value: 'fact-short' }).state.optionOrders), plain(state.optionOrders));
  }
});

test('a pre-full-source in-progress workbench restarts safely without changing stage identity', () => {
  const context = contentContext(), M = mechanics();
  const config = vm.runInContext("STAGES.find(stage => stage.id === 'academic-tower-turn-01-que').academicTower", context);
  const legacy = { schemaVersion: 2, kind: 'claim-revision', caseIndex: 0, phase: 'source',
    revealedSourceIds: ['short'], optionOrders: {} };
  const result = M.applyAction(config, legacy, { type: 'select-claim', value: 'overreach-use' });
  assert.equal(result.changed, true);
  assert.equal(result.state.schemaVersion, 3);
  assert.equal(result.state.kind, 'claim-revision');
  assert.equal(result.state.phase, 'claim');
  assert.equal(result.state.claimId, 'overreach-use');
  assert.equal(M.isSolved(config, result.state), false);
});

test('entry, story handoff, first-play save, and replay remain separate', () => {
  const context = contentContext();
  const result = vm.runInContext(`(() => {
    const P = JourneyProgress;
    const arrival = P.getNode('story:academic-tower-arrival');
    const intro = P.getNode('story:academic-tower-turn-intro');
    const room1 = P.getNode('stage:academic-tower-turn-01-que');
    const after1 = P.getNode('story:academic-tower-turn-after-que');
    const room2 = P.getNode('stage:academic-tower-turn-02-raner');
    const room3 = P.getNode('stage:academic-tower-turn-03-expectation');
    const before = P.normalize({ seenStories: ['chapter1-room-finale'] });
    const memory = new Map();
    const disk = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
    const store = P.createStore(disk);
    store.complete(arrival, 'first-play');
    store.complete(intro, 'first-play');
    store.complete(room1, 'first-play');
    store.complete(after1, 'first-play');
    const parallel = [P.isAvailable(room2, store.get()), P.isAvailable(room3, store.get())];
    store.complete(room2, 'first-play');
    store.complete(room3, 'first-play');
    const first = store.get();
    store.complete(room3, 'replay');
    return {
      arrivalAvailable: P.isAvailable(arrival, before),
      arrivalWithoutFinale: P.isAvailable(arrival, P.normalize({})),
      hiddenBeforeArrival: !P.nodes(before).some(node => node.nodeId === arrival.nodeId),
      milestone: arrival.milestone,
      handoff: [after1.returnToRegionHubAfter, room2.returnToRegionHubAfter, room3.returnToRegionHubAfter],
      parallel,
      missingRoom4: P.getNode('stage:academic-tower-turn-04-faner') === undefined,
      afterReplay: store.get(), first
    };
  })()`, context);
  assert.equal(result.arrivalAvailable, true);
  assert.equal(result.arrivalWithoutFinale, false);
  assert.equal(result.hiddenBeforeArrival, true, 'the tower timeline appears only after the world entry story');
  assert.equal(result.milestone, 'academic-tower-entered');
  assert.deepEqual(plain(result.handoff), ['academic-tower', 'academic-tower', 'academic-tower']);
  assert.deepEqual(plain(result.parallel), [true, true], '02 and 03 must stay parallel after room 01');
  assert.equal(result.missingRoom4, true, 'planned rooms must not become playable nodes early');
  assert.deepEqual(plain(result.afterReplay), plain(result.first));
  assert.ok(result.first.completedStages.includes('academic-tower-turn-02-raner'));
  assert.ok(result.first.completedStages.includes('academic-tower-turn-03-expectation'));
  assert.ok(vm.runInContext("JourneyProgress.nodes(JourneyProgress.normalize({seenStories:['academic-tower-arrival']})).some(node => node.nodeId === 'story:academic-tower-arrival')", context));
  assert.ok(!result.first.completedMilestones.some(id => /academic-tower.*(complete|foundation)/.test(id)));
});

test('browser entrypoints load the tower in dependency order and expose a dedicated hub', () => {
  const html = read('index.html');
  const content = html.indexOf('academic-tower-content.js');
  const journey = html.indexOf('academic-tower-journey-content.js');
  const progress = html.indexOf('journey-progress.js');
  const runtime = html.indexOf('academic-tower-runtime.js');
  const hub = html.indexOf('academic-tower-hub-runtime.js');
  const flow = html.indexOf('flow-runtime.js');
  assert.ok(content > html.indexOf('north-forest-content.js'));
  assert.ok(content < journey && journey < progress);
  assert.ok(runtime < hub && hub < flow);
  assert.match(html, /id="academicTowerView"/);
  assert.match(html, /academic-tower\.css\?v=20260925-expectationsort1/);
  for (const asset of ['academic-tower-content', 'academic-tower-journey-content', 'academic-tower-runtime', 'academic-tower-hub-runtime']) {
    assert.match(html, new RegExp(`${asset}\\.js\\?v=20260925-expectationsort1`));
  }
  assert.match(html, /lexicon-content\.js\?v=20260925-expectationsort1/);
  assert.match(html, /story-pronunciation-content\.js\?v=20260925-expectationsort1/);
  assert.match(read('src/flow-runtime.js'), /returnTargetFor/);
  assert.match(read('src/app.js'), /research-city'\?'academic-tower/);
});
