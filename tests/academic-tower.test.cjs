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

test('Academic Tower result story explicitly awards the observation card', () => {
  const source = read('src/academic-tower-journey-content.js');
  assert.match(source, /這張觀察卡你帶著/);
  assert.match(source, /실제로 본 것부터 적어서 가져와/);
  assert.match(source, /‘관찰’이라는 두 글자/);
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
    lastStages: STAGES.slice(-9).map(stage => stage.id),
    rooms: AcademicTowerContent.bundle.rooms,
    words: [WORDS['卻'], WORDS['然而'], WORDS['果然'], WORDS['竟然'], WORDS['反而']]
  }))()`, context);
  assert.deepEqual(plain(result.lastStages), [
    'north-forest-stage-8', 'academic-tower-turn-01-que',
    'academic-tower-turn-02-raner', 'academic-tower-turn-03-expectation',
    'academic-tower-turn-04-faner', 'academic-tower-turn-05-synthesis', 'academic-tower-turn-03a-ran-family',
    'academic-tower-turn-03b-ran-village', 'academic-tower-turn-04a-er-family'
  ]);
  assert.deepEqual(plain(result.rooms.map(room => room.implemented)), Array(8).fill(true));
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
  assert.equal(state.actualResultId,'normal','actual is supplied by the remaining record');
  assert.equal(M.applyAction(config,state,{type:'select-slot',value:'actual'}).changed,false);
  assert.equal(M.applyAction(config,state,{type:'submit-results'}).changed,false);
  for(const wrong of ['normal','unknown']) {
    state=M.applyAction(config,state,{type:'select-result',value:wrong}).state;
    result=M.applyAction(config,state,{type:'submit-results'});state=result.state;
    assert.equal(result.correct,false);assert.equal(state.phase,'place-results');assert.ok(result.feedback);
  }
  state=M.applyAction(config,state,{type:'select-result',value:'stop'}).state;
  state=M.applyAction(config,state,{type:'submit-results'}).state;
  assert.equal(M.isSolved(config,state),true);
  const old=M.createState(config);
  Object.assign(old,{schemaVersion:1,caseIndex:1,resultSlot:'actual',absentResultId:'stop',resultId:'normal',completedCaseIds:[config.cases[0].id]});
  const upgraded=M.applyAction(config,old,{type:'submit-results'}).state;
  assert.equal(upgraded.schemaVersion,2);assert.equal(upgraded.phase,'complete');
  const oldLink={...old,schemaVersion:2,phase:'choose-link',actualResultId:'normal',linkId:'jingran'};
  const resumed=M.applyAction(config,oldLink,{type:'select-link',value:'faner'}).state;
  assert.equal(resumed.phase,'place-results');assert.equal(resumed.absentResultId,null);
  assert.equal(resumed.completedCaseIds.length,1);

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
    const before = P.normalize({ seenStories: ['workshop-finale'] });
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

test('Academic Tower hub reuses the perforated header as horizontal floor beams', () => {
  const css = read('src/academic-tower.css');
  const hub = read('src/academic-tower-hub-runtime.js');
  const content = read('src/academic-tower-content.js');
  assert.match(css, /Academic Tower hub: perforated floor beams/);
  assert.doesNotMatch(css, /perforated vertical research stack/);
  assert.match(css, /\.academicTowerShell \.academicHubGroup h3\{/);
  assert.match(css, /background-color:var\(--tower-wall\)/);
  assert.match(css, /background-size:22px 22px/);
  assert.match(css, /Tower crown: five merlons/);
  assert.match(css, /clip-path:polygon\(/);
  assert.match(css, /0 0,[\s\S]*13% 0,13% 12px/);
  assert.match(css, /87% 12px,87% 0,[\s\S]*100% 0/);
  assert.match(css, /\.academicTowerShell \.academicTowerHeader\{[\s\S]*padding-top:18px/);
  assert.match(css, /Optional research belongs to the floor that produced it/);
  assert.match(css, /\.academicTowerShell \.academicHubSideRoom\{/);
  assert.match(css, /width:76%/);
  assert.match(css, /\.academicTowerShell \.academicHubSideRoom h4\{/);
  assert.match(css, /\.academicTowerHeader \.academicTowerBack\{/);
  assert.match(css, /color:#2f3436/);
  assert.match(css, /background:#f7f3eb/);
  assert.doesNotMatch(css, /content:"01F"/);
  assert.doesNotMatch(css, /\.academicTowerShell \.academicTowerRoom::after/);
  assert.match(content, /optional: true, sideGroup: 'branch'/);
  assert.match(hub, /function sideRoomsFor\(groupKey, optionalRooms\)/);
  assert.match(hub, /room\.sideGroup === groupKey/);
  assert.doesNotMatch(hub, /requires\.every\(id => ids\.has\(id\)\)/);
  assert.match(hub, /side\.className = 'academicHubSideRoom'/);
  assert.match(hub, /function makeSideRoomButton\(room, progress\)/);
  assert.match(hub, /button\.className = 'academicTowerRoom academicTowerSideRoomButton'/);
  assert.match(hub, /title\.textContent = room\.titleKo/);
  assert.match(hub, /if \(state === 'complete'\)/);
  assert.match(hub, /check\.className = 'academicTowerSideRoomCheck'/);
  assert.match(hub, /check\.textContent = '✓'/);
  const sideButtonSource = hub.slice(hub.indexOf('function makeSideRoomButton'), hub.indexOf('function appendSideRoom'));
  assert.doesNotMatch(sideButtonSource, /＋|academicTowerRoomNumber|academicTowerRoomTerms|academicTowerRoomState/);
  assert.match(sideButtonSource, /check\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(sideButtonSource, /button\.setAttribute\('aria-label'/);
  assert.match(css, /\.academicTowerShell \.academicTowerSideRoomButton\{/);
  assert.match(css, /\.academicTowerShell \.academicTowerSideRoomCheck\{/);
  assert.match(css, /white-space:nowrap/);
  assert.match(hub, /title: '두 갈래 연구'/);
  assert.match(hub, /room\.number === '02' \|\| room\.number === '03'/);
  assert.match(hub, /title: '기록 종합'/);
  assert.doesNotMatch(hub, /group\.dataset\.group = room\.optional/);
});

test('Academic Tower sky stays outside the warm tower shell and outside other views', () => {
  const css = read('src/academic-tower.css');
  const towerView = /body:has\(> #app > #academicTowerView:not\(\[hidden\]\)\)/;
  assert.match(css, /Academic Tower exterior sky/);
  assert.match(css, towerView);
  assert.match(css, /--tower-sky-top:#dfeaf4/);
  assert.match(css, /linear-gradient\(180deg,var\(--tower-sky-top\)/);
  assert.match(css, /radial-gradient\(ellipse 48% 17%/);
  assert.match(css, /pointer-events:none/);
  assert.doesNotMatch(css, /\.academicTowerShell::(?:before|after)/);
  assert.doesNotMatch(css, /(?:^|\})body\{[^}]*--tower-sky/s);
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
  assert.match(html, /academic-tower\.css\?v=\d{8}-[a-z0-9]+/);
  assert.match(html, /academic-tower-journey-content\.js\?v=\d{8}-[a-z0-9-]+/);
  assert.match(html, /academic-tower-hub-runtime\.js\?v=\d{8}-[a-z0-9]+/);
  assert.match(html, /academic-tower-content\.js\?v=\d{8}-[a-z0-9]+/);
  assert.match(html, /academic-tower-runtime\.js\?v=\d{8}-[a-z0-9]+/);
  assert.match(html, /lexicon-content\.js\?v=\d{8}-[a-z0-9-]+/);
  assert.match(html, /story-pronunciation-content\.js\?v=\d{8}-[a-z0-9]+/);
  assert.match(read('src/flow-runtime.js'), /returnTargetFor/);
  assert.match(read('src/app.js'), /research-city'\?'academic-tower/);
});

for (const suffix of ['01-que','02-raner','03-expectation','03a-ran-family']) test(`${suffix}: retains semantic decisions and persists every draft`, () => {
  const M=mechanics(), config=vm.runInContext(`STAGES.find(s=>s.id==='academic-tower-turn-${suffix}').academicTower`,contentContext());
  const before=JSON.stringify(config); let state=M.createState(config);
  const act=(type,value)=>{const result=M.applyAction(config,state,{type,value});state=plain(result.state);return result;};
  if(config.introduction) {
    assert.equal(state.phase,'work');assert.equal(state.introRead,true);
    assert.equal(act('select-character','然而:然').changed,false);
  }
  for(const task of config.tasks) {
    if(task.type!=='read') assert.equal(act('meaning-confirm').changed,false);
    if(task.relations) act('meaning-relation',task.relation);
    if(task.slots.length) {
    for(const slot of task.slots){act('meaning-slot',slot.id);act('meaning-source',task.sources.find(s=>s.id!==task.answer[slot.id]).id);}
    assert.equal(act('meaning-confirm').correct,false);
    assert.equal(state.phase,'work'); assert.equal(M.isSolved(config,state),false);
    assert.deepEqual(plain(M.normalizeMeaning(config,state)),state,'round trip retains wrong draft');
    for(const slot of task.slots){act('meaning-slot',slot.id);act('meaning-source',task.answer[slot.id]);}
    }
    if(task.relations) {
      const wrong=task.relations.find(r=>r.id!==task.relation);
      act('meaning-relation',wrong.id);assert.equal(act('meaning-confirm').correct,false);
      assert.equal(state.relation,wrong.id,'wrong relationship remains editable');
      act('meaning-relation',task.relation); assert.equal(state.lastCheck,null);
    }
    assert.equal(act('meaning-confirm').correct,true);
    if(state.phase==='review')act('meaning-next');
  }
  assert.equal(M.isSolved(config,state),true);
  assert.equal(JSON.stringify(config),before,'sources are immutable');
  const broken=plain(state);broken.answers[config.tasks[0].id]=null;
  assert.equal(M.isSolved(config,broken),false);
  assert.equal(M.normalizeMeaning(config,broken).taskIndex,0);
  const old={kind:config.kind,schemaVersion:config.schemaVersion,caseIndex:1,phase:'review'};
  const migrated=M.normalizeMeaning(config,old);
  assert.equal(migrated.kind,'meaning-links');assert.equal(migrated.taskIndex,0);assert.ok(migrated.migrationNotice);
});
test('03 preserves four valence/relation combinations and has no answered source labels',()=>{
 const c=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-03-expectation').academicTower",contentContext());
 assert.deepEqual(plain(c.cases.map(t=>[t.valence,t.relation])),[['positive','matched'],['negative','surprising'],['negative','matched'],['positive','surprising']]);
 assert.ok(c.tasks.every(t=>t.sources.every(s=>!/[果竟]然/.test(s.text))));
});

test('05 reconnects seven former relationships, reads complete source, and bounds the final decision',()=>{
 const M=mechanics(),config=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-05-synthesis').academicTower",contentContext());
 let state=M.createState(config);const act=(type,value)=>{const r=M.applyAction(config,state,{type,value});state=plain(r.state);return r;};
 assert.deepEqual(plain(config.tasks.map(t=>t.id)),['r1-match','r2-contrast','r2-evaluation','r3-general','r3-replacement','safety-scope','reread','dispatch']);
 const safety=config.tasks.find(t=>t.id==='safety-scope');
 assert.equal(safety.sources.map(s=>s.text).join(''),'雖然增加水量可以讓水流更快，然而如果水量超過安全範圍，剛修復的裝置反而可能損壞。');
 assert.equal(safety.displayPaths.find(s=>s.id==='risk').style,'possible');
 assert.equal(safety.slots.some(s=>s.style==='actual'),false);
 for(const task of config.tasks){
  assert.equal(config.tasks[state.taskIndex].id,task.id);
  if(task.slots.length){
   assert.equal(act('meaning-confirm').changed,false);
   for(const slot of task.slots){act('meaning-slot',slot.id);act('meaning-source',task.sources.find(s=>s.id!==task.answer[slot.id]).id);}
   assert.equal(act('meaning-confirm').correct,false);
   for(const slot of task.slots){act('meaning-slot',slot.id);act('meaning-source',task.answer[slot.id]);}
  }
  for(const relation of task.relations || []) if(relation.id!==task.relation){act('meaning-relation',relation.id);assert.equal(act('meaning-confirm').correct,false);assert.equal(state.relation,relation.id);}
  if(task.relations)act('meaning-relation',task.relation);
  assert.deepEqual(plain(M.normalizeMeaning(config,state)),state);
  assert.equal(act('meaning-confirm').correct,true);
  if(task.id==='reread')assert.equal(state.phase,'work');
  if(state.phase==='review')act('meaning-next');
 }
 assert.equal(M.isSolved(config,state),true);
 state.answers.reread=true;assert.equal(M.isSolved(config,state),false);
 assert.equal(M.normalizeMeaning(config,state).taskIndex,6);
 delete state.answers.reread;assert.equal(M.isSolved(config,state),false);
 const old={kind:config.kind,schemaVersion:2,blankIndex:6,phase:'review',completedBlankIds:config.blanks.map(b=>b.id)};
 assert.equal(M.normalizeMeaning(config,old).taskIndex,0,'old blank counts cannot certify new scope work');
});

test('meaning drafts, confirmed links and history survive backup/restore without touching other progress',()=>{
 const ctx=contentContext();load(ctx,'src/save-data.js');const S=ctx.SaveData,M=mechanics();
 const configs=vm.runInContext('STAGES.filter(s=>s.academicTower?.tasks).map(s=>({index:STAGES.indexOf(s),config:s.academicTower}))',ctx);
 const progress={seenStories:['chapter1-room-finale'],completedStages:['stage-5'],completedMilestones:['chapter1-complete'],acknowledgedNodes:[],stageOutcomes:{'market-stage-1':{choice:'keep'}},lastLocation:{view:'world'}};
 const map=new Map([[S.STORAGE_KEYS.journey,JSON.stringify(progress)]]);
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 for(const {index,config} of configs){
  let state=plain(M.createState(config));const history=[];
  const check=()=>{
   const tactical={stageIndex:index,state:{academicTower:state},history,completed:['stage-5'],selected:false,inspect:false};
   storage.setItem(S.STORAGE_KEYS.tactical,JSON.stringify(tactical));
   const before=JSON.stringify([...map]);const backup=plain(S.createBackup(storage,{createdAt:'2026-10-25T08:00:00Z',build:'test'}));
   assert.equal(S.validateBackup(backup).ok,true);S.restoreBackup(storage,backup);
   assert.equal(JSON.stringify([...map]),before);assert.deepEqual(JSON.parse(storage.getItem(S.STORAGE_KEYS.journey)),progress);
   assert.deepEqual(JSON.parse(storage.getItem(S.STORAGE_KEYS.tactical)).state.academicTower,state);
  };
  const act=(type,value)=>{history.push({academicTower:plain(state)});state=plain(M.applyAction(config,state,{type,value}).state);check();};
  check();
  if(config.introduction)act('start-compare');
  for(const task of config.tasks){
   if(config.villageResearch && state.phase==='scene'){
    state.sceneIndex=1;check(); // Mid-dialogue progress must also survive backup.
    act('meaning-scene-finish');
    if(task.id==='village-paper')continue;
   }
   if (task.type==='cloze') {
    for(const slot of task.slots){
     act('meaning-cloze-slot',slot.id);act('meaning-cloze-place',task.answer[slot.id]);
    }
   } else {
    for(const slot of task.slots){act('meaning-slot',slot.id);act('meaning-source',task.answer[slot.id]);}
    if(task.relations)act('meaning-relation',task.relation);
   }
   act('meaning-confirm');if(state.phase==='review')act('meaning-next');
  }
  assert.equal(M.isSolved(config,state),true);
 }
});

test('only the active old case restarts when earlier accepted cases map exactly',()=>{
 const M=mechanics(),c=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-03-expectation').academicTower",contentContext());
 const old={kind:c.kind,schemaVersion:c.schemaVersion,caseIndex:2,completedCaseIds:c.cases.slice(0,2).map(t=>t.id),phase:'sort',relationId:'matched'};
 const migrated=plain(M.normalizeMeaning(c,old));
 assert.equal(migrated.taskIndex,2);assert.equal(Object.keys(migrated.answers).length,2);
 assert.deepEqual(migrated.placements,{});assert.equal(migrated.relation,null);
 const damaged=plain(migrated);damaged.placements={from:'nonexistent'};
 assert.deepEqual(plain(M.normalizeMeaning(c,damaged)).placements,{});
 assert.equal(M.normalizeMeaning(c,damaged).taskIndex,2);
});


test('damaged preview fields recover from the confirmed answer without resetting accepted work',()=>{
 const M=mechanics(),config=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-03-expectation').academicTower",contentContext());
 const state=plain(M.createState(config)),task=config.tasks[0];
 Object.assign(state,{phase:'review',placements:{from:'missing'},relation:'invalid',answers:{[task.id]:{placements:plain(task.answer),relation:task.relation}}});
 const recovered=plain(M.normalizeMeaning(config,state));
 assert.equal(recovered.phase,'review');assert.deepEqual(recovered.placements,plain(task.answer));assert.equal(recovered.relation,task.relation);
 const unexpected=plain(M.createState(config));unexpected.phase='notice';
 assert.equal(M.normalizeMeaning(config,unexpected).phase,'work');
 const malformedOld={kind:config.kind,schemaVersion:config.schemaVersion,caseIndex:1,completedCaseIds:3};
 assert.equal(M.normalizeMeaning(config,malformedOld).taskIndex,0);
 const ran=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-03a-ran-family').academicTower",contentContext());
 const broken=plain(M.createState(ran));broken.selectedCharacter=42;broken.phase='work';
 assert.equal(M.normalizeMeaning(ran,broken).phase,'work');
});

test('simple UI removes positional work and keeps direct semantic targets',()=>{
 const ctx=contentContext();const c=suffix=>vm.runInContext(`STAGES.find(s=>s.id==='academic-tower-turn-${suffix}').academicTower`,ctx);
 for(const suffix of ['03-expectation']) assert.ok(c(suffix).tasks.every(t=>t.slots.length===0 && t.relations.length>1));
 const M=mechanics(),config=c('02-raner');let state=M.createState(config);
 assert.equal(M.applyAction(config,state,{type:'meaning-confirm'}).changed,false);
 state=M.applyAction(config,state,{type:'meaning-source',value:'whole-judgment'}).state;
 assert.equal(state.placements.to,'whole-judgment');assert.equal(state.slot,null);
 assert.equal(M.applyAction(config,state,{type:'meaning-confirm'}).correct,true);
 assert.ok(c('03a-ran-family').tasks.filter(t=>t.type==='read').every(t=>t.slots.length===0 && !t.relations));
});

test('03A migrates old discovery without discarding later work and enters observation after the story',()=>{
 const M=mechanics(),c=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-03a-ran-family').academicTower",contentContext());
 const old=plain(M.createState(c));delete old.introRead;old.phase='notice';old.selectedCharacter={'然而':'而'};
 assert.equal(M.normalizeMeaning(c,old).phase,'work');
 old.phase='work';old.taskIndex=1;old.answers[c.tasks[0].id]={placements:{},relation:null};
 const migrated=M.normalizeMeaning(c,old);assert.equal(migrated.taskIndex,1);assert.equal(migrated.phase,'work');assert.equal(migrated.introRead,true);
 assert.equal(M.createState(c).phase,'work');assert.equal(M.createState(c).introRead,true);
 assert.equal(Object.keys(c.characterGuides).length,7);
 assert.ok(c.tasks.filter(t=>t.id.startsWith('observe-')).every(t=>t.characterGuide?.clue && t.characterGuide?.meaning));
 assert.ok(c.tasks.filter(t=>t.id.startsWith('apply-')).every(t=>!t.characterGuide));
});

test('01 contrasts relations then repairs an inference; old keep-both answers are not new success',()=>{
 const M=mechanics(),c=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-01-que').academicTower",contentContext());
 assert.equal(c.tasks[0].relation,'contrast');assert.equal(c.tasks[0].slots.length,0);
 assert.equal(c.tasks[1].directSlot,'to');assert.equal(c.tasks[1].relations,undefined);
 const old={...M.createState(c),taskIndex:1,phase:'complete',answers:{practice:{placements:{},relation:'keep'},transfer:{placements:{},relation:'keep'}}};
 const next=M.normalizeMeaning(c,old);assert.equal(next.taskIndex,0);assert.equal(next.phase,'work');assert.ok(next.migrationNotice);
});


test('03B follows 03A result and remains independent of 04 and 05',()=>{
  const ctx=contentContext(), P=vm.runInContext('JourneyProgress',ctx);
  const progress=partial=>P.normalize(partial);
  const intro=P.getNode('story:academic-tower-ran-village-intro');
  const stage=P.getNode('stage:academic-tower-turn-03b-ran-village');
  const outcome=P.getNode('story:academic-tower-ran-village-result');
  const before=progress({completedStages:['academic-tower-turn-02-raner','academic-tower-turn-03-expectation']});
  const afterStage=progress({completedStages:[...before.completedStages,'academic-tower-turn-03a-ran-family']});
  const afterResult=progress({...afterStage,seenStories:['academic-tower-ran-result']});
  const afterMarket=progress({...afterResult,seenStories:['academic-tower-ran-result','market-after-m4']});
  const afterFive=progress({...afterResult,completedStages:[...afterResult.completedStages,'academic-tower-turn-05-synthesis'],completedMilestones:['academic-tower-turn-foundation']});
  assert.equal(P.isJourneyVisible(intro,before),false);
  assert.equal(P.isAvailable(intro,before),false);
  assert.equal(P.isAvailable(intro,afterStage),false);
  assert.equal(P.isAvailable(intro,afterResult),false,'03B needs Market M4 as well as 03A');
  assert.equal(P.isAvailable(intro,afterMarket),true);
  assert.equal(P.isAvailable(intro,afterFive),false,'finishing Tower 05 is not a substitute for Market M4');
  assert.deepEqual(plain(stage.requires),['story:academic-tower-ran-village-intro']);
  assert.deepEqual(plain(outcome.requires),['stage:academic-tower-turn-03b-ran-village']);
  assert.deepEqual(plain(P.getNode('stage:academic-tower-turn-04-faner').requires),['story:academic-tower-turn-before-faner']);
  const stories=vm.runInContext('JourneyContent.STORIES',ctx);
  assert.equal(stories['academic-tower-ran-village-intro'].beats.length,15);
  assert.ok(stories['academic-tower-ran-village-intro'].beats.some(x=>x.zh.includes('便當')));
  assert.ok(stories['academic-tower-ran-village-intro'].beats.some(x=>x.zh.includes('訪客簿')));
  assert.ok(stories['academic-tower-ran-village-result'].beats.some(x=>x.zh.includes('一起吃')));
  assert.ok(stories['academic-tower-ran-village-result'].beats.some(x=>x.zh.includes('不盡然')));
});

test('03B choices, pure reading and confirmed state survive resume without affecting old stages',()=>{
  const ctx=contentContext(), M=mechanics();
  const config=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-03b-ran-village').academicTower",ctx);
  assert.equal(config.kind,'meaning-links');assert.equal(config.schemaVersion,1);
  assert.equal(config.tasks.length,6);
  assert.deepEqual(plain(config.tasks.map(t=>t.id)),[
    'village-path','village-paper','village-assumption',
    'village-concession','village-scope','village-reread'
  ]);
  assert.deepEqual(plain(config.tasks.filter(t=>t.type==='read').map(t=>t.id)),['village-paper']);
  assert.equal(config.tasks[5].type,'cloze');
  assert.ok(config.tasks[0].relations.every(t=>t.text.includes('仍然')));
  assert.ok(config.tasks[3].choicePrefix.includes('固然'));
  assert.equal(config.scenes.paper.beats.length,5);
  assert.equal(config.scenes.market.beats.length,4);
  assert.ok(config.tasks.every(t=>!t.reaction && !t.readBeats));
  let state=plain(M.createState(config,()=>.25)),order=plain(state.optionOrders);
  const action=(type,value)=>{const r=M.applyAction(config,state,{type,value});state=plain(r.state);return r;};
  assert.equal(state.phase,'work');assert.deepEqual(state.answers,{});
  for(const [index,task] of config.tasks.entries()){
    assert.equal(state.taskIndex,index);
    if(index===1){
      assert.equal(state.phase,'scene');
      assert.equal(state.sceneId,'paper');
      assert.equal(action('meaning-confirm').changed,false);
      // The narrative position belongs in the saved tactical state.
      state.sceneIndex=3;
      assert.equal(M.normalizeMeaning(config,state).sceneIndex,3);
      action('meaning-scene-finish');
      assert.equal(state.taskIndex,2);
      assert.equal(state.phase,'work');
      assert.ok(state.answers['village-paper']);
      assert.ok(state.seenScenes.includes('paper'));
      continue;
    }
    if(index===4){
      assert.equal(state.phase,'scene');
      assert.equal(state.sceneId,'market');
      assert.equal(action('meaning-confirm').changed,false);
      action('meaning-scene-finish');
      assert.equal(state.phase,'work');
      assert.equal(state.taskIndex,4);
      assert.ok(state.seenScenes.includes('market'));
    }
    if(task.type==='cloze'){
      assert.equal(action('meaning-confirm').changed,false);
      for(const slot of task.slots){
        action('meaning-cloze-slot',slot.id);
        assert.equal(action('meaning-cloze-place',task.answer[slot.id]).changed,true);
      }
      assert.equal(action('meaning-confirm').correct,true);
      assert.equal(state.phase,'complete');
      continue;
    }
    if(task.type==='read'){
      assert.equal(action('meaning-confirm').correct,true);
      assert.equal(state.phase,'complete');
      continue;
    }
    const options=task.targets||task.relations;
    const correct=task.targets?task.answer.to:task.relation;
    const wrong=options.find(x=>x.id!==correct).id;
    assert.equal(action('meaning-confirm').changed,false);
    action(task.targets?'meaning-source':'meaning-relation',wrong);
    assert.equal(action('meaning-confirm').correct,false);
    assert.equal(state.phase,'work');
    assert.deepEqual(plain(M.normalizeMeaning(config,state)),state);
    action(task.targets?'meaning-source':'meaning-relation',correct);
    assert.equal(action('meaning-confirm').correct,true);
    assert.equal(state.phase,'review');
    action('meaning-next');
    assert.deepEqual(state.optionOrders,order);
  }
  assert.equal(M.isSolved(config,state),true);
  const initial=plain(M.createState(config,()=>.8));
  assert.deepEqual(initial.answers,{});assert.equal(initial.taskIndex,0);
  assert.equal(M.isSolved(config,initial),false);
  const damaged=plain(state);delete damaged.answers['village-path'];
  assert.equal(M.normalizeMeaning(config,damaged).taskIndex,0);
  const existingT2=plain(M.createState(config,()=>.5));
  existingT2.answers['village-path']={placements:{},relation:'road-used'};
  existingT2.taskIndex=1;existingT2.phase='work';
  delete existingT2.sceneId;delete existingT2.seenScenes;delete existingT2.sceneIndex;
  const convertedT2=plain(M.normalizeMeaning(config,existingT2));
  assert.equal(convertedT2.phase,'scene');
  assert.equal(convertedT2.sceneId,'paper');
  assert.deepEqual(convertedT2.answers['village-path'],{placements:{},relation:'road-used'});
  const existingT5=plain(state);
  existingT5.phase='work';existingT5.taskIndex=4;
  delete existingT5.answers['village-scope'];
  delete existingT5.answers['village-reread'];
  delete existingT5.seenScenes;delete existingT5.sceneId;delete existingT5.sceneIndex;
  const convertedT5=plain(M.normalizeMeaning(config,existingT5));
  assert.equal(convertedT5.phase,'scene');
  assert.equal(convertedT5.sceneId,'market');
  assert.ok(convertedT5.answers['village-concession']);

});


test('03B work surfaces distinguish boy notes, researcher draft, quoted folder evaluation and joint record',()=>{
  const ctx=contentContext();
  const stage=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-03b-ran-village')",ctx);
  const tasks=Object.fromEntries(stage.academicTower.tasks.map(task=>[task.id,task]));
  const names={
    'village-path':['소년의 비교 메모','소년의 메모 남기기','observe'],
    'village-assumption':['소년의 검토 표시','작성자의 주장 표시','decision'],
    'village-concession':['연구원의 해설 초안','연구원의 문장 이어 쓰기','interpretation'],
    'village-scope':['봉투 평가의 검토문','과장된 평가 고치기','decision']
  };
  for(const [taskId,[label,button,kind]] of Object.entries(names)){
    const task=tasks[taskId];
    assert.equal(task.workLabel,label,taskId);
    assert.equal(task.confirmLabel,button,taskId);
    assert.equal(task.workKind,kind,taskId);
    assert.ok(task.question.length>10,taskId);
    assert.doesNotMatch(task.workLabel,/^나의|^내 /,taskId);
  }
  assert.ok(tasks['village-path'].question.includes('소년이'));
  assert.ok(tasks['village-assumption'].question.includes('소년은'));
  assert.ok(tasks['village-concession'].question.includes('연구원이 적은'));
  assert.ok(tasks['village-concession'].workContext.includes('소년이 본'));
  assert.ok(tasks['village-concession'].choicePrefix.includes('固然'));
  assert.equal(tasks['village-concession'].prefixLabel,'연구원이 적기 시작한 문장');
  assert.ok(tasks['village-scope'].workContext.includes('검토하려고 옮겨 적었어'));
  assert.ok(tasks['village-scope'].workContext.includes('결론은 아니야'));
  assert.equal(tasks['village-scope'].draftLabel,'봉투 평가를 요약한 검토용 문장');
  assert.equal(tasks['village-scope'].sourceLabel,'봉투 원문');
  assert.equal(tasks['village-reread'].sources[0].label,'옛 지도에 표시된 것');
  assert.equal(tasks['village-reread'].workLabel,'두 사람의 공동 연구 기록');
  assert.equal(tasks['village-reread'].workKind,'restore');
  assert.equal(tasks['village-reread'].type,'cloze');
  assert.ok(stage.rule.includes('소년의 경험'));
  assert.ok(!stage.rule.includes('내 경험'));
  // The in-world author is presentation content, not a new completion state.
  const M=mechanics(), before=plain(M.createState(stage.academicTower,()=>.1));
  assert.equal(before.schemaVersion,1);
  assert.deepEqual(before.answers,{});
});


test('03B final record places five unique words, reveals only incorrect slots, and can swap without resetting',()=>{
  const ctx=contentContext(), M=mechanics();
  const config=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-03b-ran-village').academicTower",ctx);
  const task=config.tasks[5];
  assert.equal(task.type,'cloze');
  assert.equal(task.blanks.length,5);
  assert.equal(task.slots.length,5);
  assert.deepEqual(plain(task.blanks.map(x=>x.section)),[
    '연구실에서 있었던 일','옛 쪽지 · 작성자 미상의 주장',
    '소년과 연구원의 공동 해설','소년과 연구원의 공동 해설','소년과 연구원의 공동 해설'
  ]);
  assert.equal(new Set(task.wordBank).size,5);
  assert.deepEqual([...task.wordBank].sort(),Object.values(task.answer).sort());
  assert.match(task.blanks[1].before,/「/);
  assert.match(task.blanks[1].after,/」/);
  assert.ok(task.blanks.every(blank=>!Object.values(task.answer).some(word=>
    blank.before.includes(word)||blank.after.includes(word))));
  assert.ok(!task.sources.some(item=>task.wordBank.some(word=>item.text.includes(word))),
    'original evidence must not give away five cloze answers');

  let state=plain(M.createState(config,()=>.0));
  const originalOrder=plain(state.optionOrders[task.id]);
  assert.equal(originalOrder.length,5);
  assert.deepEqual([...originalOrder].sort(),[...task.wordBank].sort());
  const past=config.tasks.slice(0,5);
  state.taskIndex=5;state.phase='work';state.seenScenes=['paper','market'];
  state.answers=Object.fromEntries(past.map(t=>[t.id,{
    placements:plain(t.answer),relation:t.relation||null
  }]));
  state.placements={};state.slot=null;state.lastCheck=null;
  const a=(type,value)=>{
    const result=M.applyAction(config,state,{type,value});
    state=plain(result.state);return result;
  };
  assert.equal(M.normalizeMeaning(config,state).slot,'incident');
  assert.equal(state.clozeMenuOpen,false);
  assert.equal(a('meaning-confirm').changed,false);
  assert.equal(a('meaning-cloze-reset').changed,false);
  assert.equal(a('meaning-cloze-place','仍然').changed,false,'a closed dropdown cannot place words');
  assert.equal(a('meaning-cloze-slot','incident').changed,true,'tapping first blank opens its dropdown');
  assert.equal(state.clozeMenuOpen,true);
  assert.deepEqual(plain(M.normalizeMeaning(config,state)),state,'open dropdown survives reload');
  assert.equal(a('meaning-cloze-slot','incident').changed,true,'tapping again closes dropdown');
  assert.equal(state.clozeMenuOpen,false);
  assert.equal(a('meaning-cloze-slot','incident').changed,true);
  assert.equal(a('meaning-cloze-close').changed,true);
  assert.equal(state.clozeMenuOpen,false);
  assert.deepEqual(state.placements,{});
  for(const word of ['仍然','突然']){
    assert.equal(a('meaning-cloze-slot',state.slot).changed,true);
    assert.equal(state.clozeMenuOpen,true);
    assert.equal(a('meaning-cloze-place',word).changed,true);
    assert.equal(state.clozeMenuOpen,false);
  }
  assert.deepEqual(state.placements,{incident:'仍然',claim:'突然'});
  assert.equal(state.slot,'continuity');
  assert.equal(a('meaning-cloze-reset').changed,true);
  assert.deepEqual(state.placements,{});
  assert.equal(state.slot,'incident');
  assert.equal(a('meaning-confirm').changed,false);

  for(const word of ['仍然','突然','當然','固然','不盡然']){
    assert.equal(a('meaning-cloze-slot',state.slot).changed,true);
    assert.equal(a('meaning-cloze-place',word).changed,true);
    assert.equal(state.clozeMenuOpen,false);
  }
  const wrong=plain(state),firstOrder=plain(state.optionOrders);
  assert.equal(a('meaning-confirm').correct,false);
  assert.equal(state.phase,'work');
  assert.equal(state.lastCheck.step,'cloze');
  assert.equal(state.lastCheck.correct,false);
  assert.deepEqual(state.placements,wrong.placements);
  assert.deepEqual(plain(M.normalizeMeaning(config,state)),state);
  assert.deepEqual(state.optionOrders,firstOrder);
  assert.equal(M.isSolved(config,state),false);
  a('meaning-cloze-slot','incident');
  assert.equal(state.clozeMenuOpen,true);
  assert.equal(state.lastCheck.step,'cloze','opening the list does not dismiss the incorrect verdict');
  a('meaning-cloze-place','突然');
  assert.equal(state.placements.incident,'突然');
  assert.equal(state.placements.claim,'仍然');
  assert.equal(state.lastCheck,null);
  a('meaning-cloze-slot','claim');
  a('meaning-cloze-place','當然');
  assert.equal(state.placements.claim,'當然');
  assert.equal(state.placements.continuity,'仍然');
  assert.equal(state.clozeMenuOpen,false);
  assert.equal(a('meaning-confirm').correct,true);
  assert.equal(state.phase,'complete');
  assert.equal(M.isSolved(config,state),true);
  assert.deepEqual(state.answers[task.id].placements,plain(task.answer));
  assert.deepEqual(plain(M.normalizeMeaning(config,state)),state);

  // Existing incomplete T6 saves (the old read-only task) retain all prior
  // progress but must redo five blanks instead of being auto-awarded success.
  const legacy=plain(wrong);
  legacy.phase='complete';legacy.placements={};
  legacy.answers[task.id]={placements:{},relation:null};
  const migrated=plain(M.normalizeMeaning(config,legacy));
  assert.equal(migrated.taskIndex,5);
  assert.equal(migrated.phase,'work');
  assert.equal(migrated.slot,'incident');
  assert.equal(migrated.clozeMenuOpen,false);
  assert.equal(migrated.answers[task.id],undefined);
  assert.equal(Object.keys(migrated.answers).length,5);
});
