const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const load=(ctx,file)=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const plain=value=>JSON.parse(JSON.stringify(value));
const files=[
  'src/content.js','src/workshop-content.js','src/workshop-late-content.js',
  'src/g7-content.js','src/market-content.js','src/market-late-content.js',
  'src/journey-content.js','src/g7-journey-content.js','src/workshop-journey-content.js',
  'src/workshop-late-journey-content.js','src/market-journey-content.js',
  'src/market-late-journey-content.js','src/continuous-region-flow.js',
  'src/chapter1-finale-content.js','src/first-free-quest-content.js','src/north-forest-content.js',
  'src/academic-tower-content.js','src/academic-tower-journey-content.js',
  'src/academic-tower-er-04a-runtime.js','src/stage-reference.js',
  'src/journey-progress.js','src/save-data.js'
];
function setup(){const ctx=vm.createContext({console});files.forEach(f=>load(ctx,f));return ctx;}
const action=(ER,s,type,value)=>ER.applyAction(null,s,{type,value}).state;
function solved(ER) {
  let s=ER.createState();
  const doAction=(type,value)=>{s=action(ER,s,type,value);assert.equal(ER.validState(s),true);};
  doAction('er-select','a-grass-high');doAction('er-confirm');
  assert.equal(s.phase,'review');doAction('er-next');
  doAction('er-select','check-between-b-c');doAction('er-confirm');doAction('er-next');
  assert.equal(s.phase,'scene');assert.equal(s.sceneId,'retrace');
  doAction('er-scene-finish');assert.equal(s.step,'search');
  doAction('er-search','top-stone');doAction('er-search','low-bank');
  assert.equal(s.openingFound,true);assert.equal(s.step,'direction');
  doAction('er-select','flow-out');doAction('er-confirm');doAction('er-next');
  assert.equal(s.sceneId,'record');doAction('er-scene-finish');
  doAction('er-select','artificial-passage');doAction('er-confirm');
  assert.equal(s.step,'scope');
  doAction('er-select','scope-original-only');doAction('er-confirm');doAction('er-next');
  doAction('er-note','method:method-compare');
  doAction('er-note','action:notify-manager');
  doAction('er-note','inquiry:inquiry-records');
  doAction('er-confirm');
  assert.equal(s.phase,'complete');assert.equal(ER.isSolved(s),true);
  return s;
}
test('04A remains one optional study and does not require 03A/03B/05',()=>{
  const c=setup(),er=c.AcademicTowerEr04A;
  const id=er.STAGE_ID,room=c.AcademicTowerContent.bundle.rooms.find(r=>r.id===id);
  assert.deepEqual(plain(room.requires),['academic-tower-turn-04-faner']);
  assert.equal(room.sideGroup,'synthesis');
  const stages=vm.runInContext('STAGES.map(s=>s.id)',c);
  assert.equal(stages.filter(s=>s===id).length,1);
  const story=c.JourneyProgress.getNode('story:academic-tower-er-intro');
  assert.deepEqual(plain(story.requires),['stage:academic-tower-turn-04-faner']);
  const node=c.JourneyProgress.getNode('stage:'+id);
  assert.deepEqual(plain(node.requires),['story:academic-tower-er-intro']);
  assert.equal(c.JourneyProgress.isAvailable(story,c.JourneyProgress.normalize({completedStages:['academic-tower-turn-04-faner']})),true);
  assert.equal(c.JourneyProgress.isAvailable(story,c.JourneyProgress.normalize({})),false);
});
test('T1-T5 reveal/meaning choices and two interludes yield one completed fieldwork record',()=>{
  const c=setup(),er=c.AcademicTowerEr04A,s=solved(er);
  assert.deepEqual(plain(s.completedTaskIds),plain(er.TASK_IDS));
  assert.deepEqual(plain(s.seenScenes),['retrace','record']);
  assert.deepEqual(plain(s.inspectedZoneIds),['top-stone','low-bank']);
  assert.deepEqual(plain(er.revealedWords(s)),['而且','然而','反而','而是','而已','從而','因而','進而']);
});
test('T3 hidden illustration never names the exit, and wrong direction keeps discovered opening',()=>{
  const c=setup(),er=c.AcademicTowerEr04A;
  let s=er.createState();
  s.taskIndex=2;s.completedTaskIds=plain(er.TASK_IDS.slice(0,2));s.step='search';
  assert.equal(er.validState(s),true);
  const before=er.renderWorkbench(null,s);
  assert.doesNotMatch(before,/data-value="flow-out"|data-value="flow-in"|小孔|rect x="80"/);
  s=action(er,s,'er-search','near-wheel');
  assert.equal(s.openingFound,false);assert.equal(s.inspectedZoneIds.includes('near-wheel'),true);
  s=action(er,s,'er-search','low-bank');assert.equal(s.openingFound,true);
  const after=er.renderWorkbench(null,s);
  assert.match(after,/data-value="flow-out"/);
  s=action(er,s,'er-select','flow-in');
  let a=er.applyAction(null,s,{type:'er-confirm'});
  assert.equal(a.correct,false);assert.equal(a.state.openingFound,true);
  assert.equal(er.validState(a.state),true);
});
test('T4 wrong interpretation survives normalization, and replay supports either next inquiry',()=>{
  const c=setup(),er=c.AcademicTowerEr04A;
  let s=er.createState();
  s.taskIndex=3;s.completedTaskIds=plain(er.TASK_IDS.slice(0,3));
  s.step='correct';s.openingFound=true;s.inspectedZoneIds=['low-bank'];s.seenScenes=['retrace','record'];
  s=action(er,s,'er-select','natural-crack');
  s=action(er,s,'er-confirm');
  assert.equal(er.validState(s),true);
  assert.equal(er.normalizeState(s).drafts.t4a,'natural-crack');
  assert.equal(s.step,'correct');
  const full=solved(er);
  const changed=action(er,{...full,phase:'work',completedTaskIds:plain(er.TASK_IDS.slice(0,4)),
    drafts:{...full.drafts,inquiry:'inquiry-outlet'},selected:null},'er-confirm');
  assert.equal(er.isSolved(changed),true);
});
test('journey checkpoint and first outcome survive restore, malformed 04A backup is rejected',()=>{
  const c=setup(),er=c.AcademicTowerEr04A,P=c.JourneyProgress,SD=c.SaveData;
  const key=P.KEY, map=new Map();
  const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  const store=P.createStore(storage);
  const s=er.createState();s.selected='a-grass-high';
  assert.equal(store.checkpointSide(er.STAGE_ID,s),true);
  assert.equal(store.get().sideResearchProgress[er.STAGE_ID].selected,'a-grass-high');
  assert.equal(P.normalize(JSON.parse(map.get(key))).sideResearchProgress[er.STAGE_ID].selected,'a-grass-high');
  const full=solved(er);
  assert.equal(store.completeSide(er.STAGE_ID,full,'inquiry-records'),true);
  assert.equal(store.checkpointSide(er.STAGE_ID,er.createState()),false);
  assert.equal(store.completeSide(er.STAGE_ID,full,'inquiry-outlet'),true);
  const progress=store.get();
  assert.equal(progress.stageOutcomes[er.STAGE_ID].nextInquiryId,'inquiry-records');
  assert.equal(progress.completedStages.filter(v=>v===er.STAGE_ID).length,1);
  const K=SD.STORAGE_KEYS;
  for(const k of SD.KEY_LIST)if(!map.has(k))map.set(k,null);
  const backup=SD.createBackup(storage,{createdAt:'2026-10-29T00:00:00Z'});
  assert.equal(SD.validateBackup(backup).ok,true);
  const old=plain(backup);delete old.storage[K.journey].sideResearchProgress;
  assert.equal(SD.validateBackup(old).ok,true);
  for(const loc of [null,{view:'world'}]){
    const broken=plain(backup);
    broken.storage[K.journey].lastLocation=loc;
    broken.storage[K.journey].sideResearchProgress[er.STAGE_ID].taskIndex=999;
    assert.equal(SD.validateBackup(broken).ok,false);
  }
});
