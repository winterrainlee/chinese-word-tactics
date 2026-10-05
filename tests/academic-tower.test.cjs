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

test('03A requires discovery, all comparisons and two independent applications', () => {
  const config = vm.runInContext("STAGES.find(s => s.id === 'academic-tower-turn-03a-ran-family').academicTower", contentContext());
  const M = mechanics(); let state = M.createState(config, () => .3);
  const act = (type, value) => { const result = M.applyAction(config, state, {type, value}); state = result.state; return result; };
  for (const word of config.noticeWords) act('select-character', `${word}:${word[0]}`);
  assert.equal(act('submit-notice').correct, false);
  for (const word of config.noticeWords) act('select-character', `${word}:然`);
  act('submit-notice'); assert.equal(state.phase, 'discovery'); act('start-compare');
  for (const card of config.cards) {
    act('select-position', card.position === 'first' ? 'last' : 'first');
    act('select-ran-relation', card.relation);
    assert.equal(act('submit-comparison').correct, false);
    act('select-position', card.position); assert.equal(act('submit-comparison').correct, true);
    state = plain(state); assert.equal(M.isValidState(config, state), true);
    act('next-comparison');
  }
  assert.equal(state.phase, 'apply-premise');
  act('select-ran-word', '如果'); assert.equal(act('submit-ran-word').correct, false);
  assert.equal(state.selectedWord, '如果');
  act('select-ran-word', '既然'); act('submit-ran-word');
  assert.equal(M.isSolved(config, state), false);
  act('select-ran-word', '然後'); assert.equal(act('submit-ran-word').correct, false);
  act('select-ran-word', '不然'); act('submit-ran-word');
  assert.equal(M.isSolved(config, state), true);
});

test('03A is optional, unlocks after both branches and remains available after foundation', () => {
  const c = contentContext();
  const result = vm.runInContext(`(() => {
    const P = JourneyProgress, intro = P.getNode('story:academic-tower-ran-intro');
    const base = {completedStages:['academic-tower-turn-02-raner','academic-tower-turn-03-expectation']};
    return {before:P.isAvailable(intro,P.normalize({completedStages:base.completedStages.slice(0,1)})),
      early:P.isAvailable(intro,P.normalize(base)), late:P.isAvailable(intro,P.normalize({...base,completedMilestones:['academic-tower-turn-foundation']})),
      requires:P.getNode('story:academic-tower-turn-result').requires,
      sideMilestone:P.getNode('story:academic-tower-ran-result').milestone};
  })()`, c);
  assert.equal(result.before, false); assert.equal(result.early, true); assert.equal(result.late, true);
  assert.deepEqual(plain(result.requires), ['stage:academic-tower-turn-05-synthesis']);
  assert.equal(result.sideMilestone, undefined);
});

test('Academic Tower appends rooms 01 through 05 without changing earlier stage order', () => {
  const context = contentContext();
  const result = vm.runInContext(`(() => ({
    lastStages: STAGES.slice(-7).map(stage => stage.id),
    rooms: AcademicTowerContent.bundle.rooms,
    words: [WORDS['卻'], WORDS['然而'], WORDS['果然'], WORDS['竟然'], WORDS['反而']]
  }))()`, context);
  assert.deepEqual(plain(result.lastStages), [
    'north-forest-stage-8', 'academic-tower-turn-01-que',
    'academic-tower-turn-02-raner', 'academic-tower-turn-03-expectation',
    'academic-tower-turn-04-faner', 'academic-tower-turn-05-synthesis', 'academic-tower-turn-03a-ran-family'
  ]);
  assert.deepEqual(plain(result.rooms.map(room => room.implemented)), [true, true, true, true, true, true]);
  assert.deepEqual(plain(result.words.map(word => word.p)), ['ㄑㄩㄝˋ', 'ㄖㄢˊ ㄦˊ', 'ㄍㄨㄛˇ ㄖㄢˊ', 'ㄐㄧㄥˋ ㄖㄢˊ', 'ㄈㄢˇ ㄦˊ']);
  assert.deepEqual(plain(vm.runInContext(`['academic-tower-turn-01-que', 'academic-tower-turn-02-raner'].map(id => STAGES.find(stage => stage.id === id)).map(stage => ({
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
  assert.ok(config.cases.every(item => !/[果竟]然/.test(item.expectationZh + item.resultZh) && item.reviewZh.includes(item.markerZh)));

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

test('04 keeps surprise separate from replacement and uses positive and negative actual results', () => {
  const context = contentContext(), M = mechanics();
  const config = vm.runInContext("STAGES.find(stage => stage.id === 'academic-tower-turn-04-faner').academicTower", context);
  assert.equal(config.kind, 'replacement-link');
  assert.deepEqual(plain(config.cases.map(item => [item.absentResultId, item.actualResultId])), [
    ['faster', 'stopped'], ['stop', 'normal']
  ]);
  let state = M.createState(config, () => .4);
  assert.equal(state.phase, 'place-results');
  state = M.applyAction(config, state, { type: 'select-result', value: 'stopped' }).state;
  assert.equal(M.applyAction(config, state, { type: 'submit-results' }).changed, false, 'both slots required');
  state = M.applyAction(config, state, { type: 'select-slot', value: 'actual' }).state;
  state = M.applyAction(config, state, { type: 'select-result', value: 'stopped' }).state;
  let result = M.applyAction(config, state, { type: 'submit-results' });
  state = result.state;
  assert.equal(result.correct, false);
  assert.equal(state.absentResultId, 'stopped', 'a wrong placement remains editable');
  assert.equal(state.actualResultId, 'stopped');
  assert.equal(state.resultSlot, 'absent', 'review activates the wrong slot');

  state = M.applyAction(config, state, { type: 'select-slot', value: 'absent' }).state;
  state = M.applyAction(config, state, { type: 'select-result', value: 'faster' }).state;
  state = M.applyAction(config, state, { type: 'submit-results' }).state;
  assert.equal(state.phase, 'review', 'the guided case builds the visible 反而 frame');
  state = M.applyAction(config, state, { type: 'next-case' }).state;
  for (const [slot, value] of [['actual', 'normal'], ['absent', 'stop']]) {
    state = M.applyAction(config, state, { type: 'select-slot', value: slot }).state;
    state = M.applyAction(config, state, { type: 'select-result', value }).state;
  }
  assert.equal(state.phase, 'place-results', 'actual can be placed first without a check');
  state = M.applyAction(config, state, { type: 'submit-results' }).state;
  assert.equal(state.phase, 'choose-link');
  state = M.applyAction(config, state, { type: 'select-link', value: 'jingran' }).state;
  result = M.applyAction(config, state, { type: 'submit-link' });
  state = result.state;
  assert.equal(result.correct, false);
  assert.match(result.feedback, /뜻밖/);
  assert.equal(state.phase, 'choose-link', '竟然 evaluates surprise but does not complete the replacement link');
  state = M.applyAction(config, state, { type: 'select-link', value: 'faner' }).state;
  state = M.applyAction(config, state, { type: 'submit-link' }).state;
  assert.equal(M.isSolved(config, state), true);
  const old = M.createState(config);
  Object.assign(old, {schemaVersion: 1, caseIndex: 1, resultSlot: 'actual', absentResultId: 'stop', resultId: 'normal', completedCaseIds: [config.cases[0].id]});
  const upgraded = M.applyAction(config, old, {type: 'submit-results'}).state;
  assert.equal(upgraded.schemaVersion, 2);
  assert.equal(upgraded.phase, 'choose-link');
  assert.equal(upgraded.caseIndex, 1);
  assert.equal(upgraded.completedCaseIds.length, 1, 'legacy progress is preserved');
});

test('05 requires seven restorations and an evidence-bounded dispatch decision', () => {
  const context = contentContext(), M = mechanics();
  const config = vm.runInContext("STAGES.find(stage => stage.id === 'academic-tower-turn-05-synthesis').academicTower", context);
  assert.equal(config.kind, 'connector-cloze');
  assert.equal(config.blanks.length, 8);
  assert.ok(config.blanks.every(item => item.options.length === 4));
  assert.ok(config.blanks.slice(0, 7).every(item => item.options.some(option => ['然後', '所以', '而且'].includes(option))));
  assert.deepEqual(plain(config.blanks.slice(0, 7).map(item => item.correctConnectorId)), ['果然', '卻', '竟然', '然而', '反而', '然而', '反而']);
  assert.equal(config.blanks[7].kind, 'decision');
  assert.match(config.blanks[5].tailZh, /裝置也可能損壞/);

  let state = M.createState(config, () => 0);
  const correctSlots = config.blanks.map(item => state.optionOrders[item.id].indexOf(item.correctConnectorId));
  assert.notDeepEqual(plain(correctSlots.slice(0, 7)), [0, 1, 2, 3, 0, 1, 2]);
  const savedOrders = plain(state.optionOrders);
  state = M.applyAction(config, state, { type: 'select-connector', value: '所以' }).state;
  let result = M.applyAction(config, state, { type: 'submit-connector' });
  state = result.state;
  assert.equal(result.correct, false);
  assert.equal(state.selectedConnectorId, '所以');
  assert.equal(state.phase, 'choose-connector');
  assert.deepEqual(plain(state.optionOrders), savedOrders);

  for (const item of config.blanks) {
    if (item.kind === 'decision') {
      assert.equal(M.isSolved(config, state), false, 'restoring connectors alone does not complete 05');
      for (const wrong of item.options.filter(id => id !== item.correctConnectorId)) {
        state = M.applyAction(config, state, { type: 'select-connector', value: wrong }).state;
        const rejected = M.applyAction(config, state, { type: 'submit-connector' });
        assert.equal(rejected.correct, false);
        assert.ok(rejected.feedback);
        state = rejected.state;
      }
    }
    state = M.applyAction(config, state, { type: 'select-connector', value: item.correctConnectorId }).state;
    result = M.applyAction(config, state, { type: 'submit-connector' });
    state = result.state;
    assert.equal(result.correct, true);
    if (state.phase === 'review') state = M.applyAction(config, state, { type: 'next-blank' }).state;
  }
  assert.equal(state.completedBlankIds.length, 8);
  assert.equal(M.isSolved(config, state), true);
});

test('answer orders are independent permutations and remain stable in saved state', () => {
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
    for (const [key] of targets) assert.equal(new Set(state.optionOrders[key]).size, 4);
    assert.ok(slots.every(slot => slot >= 0 && slot < 4));
    assert.deepEqual(plain(M.applyAction(config, state, { type: 'select-claim', value: 'fact-short' }).state.optionOrders), plain(state.optionOrders));
  }
});

test('cloze shuffling consumes independent randomness and old in-progress schemas restart safely', () => {
  const context = contentContext(), M = mechanics();
  const config = vm.runInContext("STAGES.find(stage => stage.id === 'academic-tower-turn-05-synthesis').academicTower", context);
  let calls = 0;
  const state = M.createState(config, () => { calls += 1; return (calls * .137) % 1; });
  assert.equal(calls, 24);
  const restored = plain(state);
  const action = M.applyAction(config, restored, { type: 'select-connector', value: '所以' });
  assert.deepEqual(plain(action.state.optionOrders), plain(state.optionOrders));
  const legacy = { ...state, schemaVersion: 1, phase: 'complete', completedBlankIds: config.blanks.slice(0, 7).map(b => b.id) };
  assert.equal(M.isSolved(config, legacy), false);
  const restarted = M.applyAction(config, legacy, { type: 'select-connector', value: '果然' });
  assert.equal(restarted.state.schemaVersion, 2);
  assert.equal(restarted.state.blankIndex, 0);
  assert.deepEqual(plain(restarted.state.completedBlankIds), []);
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
    const before4 = P.getNode('story:academic-tower-turn-before-faner');
    const room4 = P.getNode('stage:academic-tower-turn-04-faner');
    const before5 = P.getNode('story:academic-tower-turn-before-synthesis');
    const room5 = P.getNode('stage:academic-tower-turn-05-synthesis');
    const resultStory = P.getNode('story:academic-tower-turn-result');
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
    const joinAfterOne = P.isAvailable(before4, store.get());
    store.complete(room3, 'first-play');
    const joinAfterBoth = P.isAvailable(before4, store.get());
    const room4BeforeStory = P.isAvailable(room4, store.get());
    store.complete(before4, 'first-play');
    const room4AfterStory = P.isAvailable(room4, store.get());
    store.complete(room4, 'first-play');
    const transitionAvailable = P.isAvailable(before5, store.get());
    const room5BeforeStory = P.isAvailable(room5, store.get());
    store.complete(before5, 'first-play');
    const room5AfterStory = P.isAvailable(room5, store.get());
    store.complete(room5, 'first-play');
    const resultAvailable = P.isAvailable(resultStory, store.get());
    const beforeResult = store.get();
    store.complete(resultStory, 'first-play');
    const first = store.get();
    store.complete(room5, 'replay');
    return {
      arrivalAvailable: P.isAvailable(arrival, before),
      arrivalWithoutFinale: P.isAvailable(arrival, P.normalize({})),
      hiddenBeforeArrival: !P.nodes(before).some(node => node.nodeId === arrival.nodeId),
      milestone: arrival.milestone,
      handoff: [after1, room2, room3, before4, room4, before5, room5, resultStory].map(node => node.returnToRegionHubAfter),
      parallel,
      gates: { joinAfterOne, joinAfterBoth, room4BeforeStory, room4AfterStory,
        transitionAvailable, room5BeforeStory, room5AfterStory, resultAvailable },
      milestoneBeforeResult: beforeResult.completedMilestones.includes('academic-tower-turn-foundation'),
      resultMilestone: resultStory.milestone,
      afterReplay: store.get(), first
    };
  })()`, context);
  assert.equal(result.arrivalAvailable, true);
  assert.equal(result.arrivalWithoutFinale, false);
  assert.equal(result.hiddenBeforeArrival, true, 'the tower timeline appears only after the world entry story');
  assert.equal(result.milestone, 'academic-tower-entered');
  assert.deepEqual(plain(result.handoff), Array(8).fill('academic-tower'));
  assert.deepEqual(plain(result.parallel), [true, true], '02 and 03 must stay parallel after room 01');
  assert.deepEqual(plain(result.gates), {
    joinAfterOne: false, joinAfterBoth: true, room4BeforeStory: false, room4AfterStory: true,
    transitionAvailable: true, room5BeforeStory: false, room5AfterStory: true, resultAvailable: true
  });
  assert.equal(result.milestoneBeforeResult, false, 'finishing room 05 must not award the story milestone early');
  assert.equal(result.resultMilestone, 'academic-tower-turn-foundation');
  assert.deepEqual(plain(result.afterReplay), plain(result.first));
  assert.ok(result.first.completedStages.includes('academic-tower-turn-02-raner'));
  assert.ok(result.first.completedStages.includes('academic-tower-turn-03-expectation'));
  assert.ok(vm.runInContext("JourneyProgress.nodes(JourneyProgress.normalize({seenStories:['academic-tower-arrival']})).some(node => node.nodeId === 'story:academic-tower-arrival')", context));
  assert.ok(result.first.completedMilestones.includes('academic-tower-turn-foundation'));
  assert.ok(!result.first.completedMilestones.some(id => /academic-tower.*complete/.test(id)));
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
  assert.match(html, /academic-tower\.css\?v=20261005-towerbooth1/);
  for (const asset of ['academic-tower-journey-content', 'academic-tower-hub-runtime']) {
    assert.match(html, new RegExp(`${asset}\\.js\\?v=20261005-towerjourney1`));
  }
  assert.match(html, /academic-tower-content\.js\?v=20261005-towerfeedback1/);
  assert.match(html, /academic-tower-runtime\.js\?v=20261005-towerbooth1/);
  assert.match(html, /lexicon-content\.js\?v=20261005-towerexpand1/);
  assert.match(html, /story-pronunciation-content\.js\?v=20261005-towerexpand1/);
  assert.match(read('src/flow-runtime.js'), /returnTargetFor/);
  assert.match(read('src/app.js'), /research-city'\?'academic-tower/);
});
