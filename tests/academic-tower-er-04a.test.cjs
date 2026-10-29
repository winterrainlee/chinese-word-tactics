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
  doAction('er-observe','a-current-level');
  assert.equal(s.t1CurrentRecorded,true);
  assert.equal(s.phase,'work');
  doAction('er-observe','a-grass-high');doAction('er-confirm');
  assert.equal(s.phase,'review');doAction('er-next');
  doAction('er-select','check-between-b-c');doAction('er-confirm');doAction('er-next');
  assert.equal(s.phase,'scene');assert.equal(s.sceneId,'retrace');
  doAction('er-scene-finish');assert.equal(s.step,'search');
  doAction('er-search','top-stone');doAction('er-search','low-bank');
  assert.equal(s.openingFound,true);assert.equal(s.step,'direction');
  doAction('er-select','flow-out');doAction('er-confirm');doAction('er-next');
  assert.equal(s.sceneId,'record');doAction('er-scene-finish');
  doAction('er-inspect-d');
  assert.equal(s.t4Inspected,true);
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
  s=action(er,s,'er-inspect-d');
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

test('T1 accepts both observations without treating current water as a wrong fact',()=>{
  const c=setup(),er=c.AcademicTowerEr04A;
  let s=er.createState();
  const first=er.renderWorkbench(null,s);
  assert.match(first,/academicErUpstream/);
  assert.match(first,/data-academic-action="er-observe"/);
  assert.doesNotMatch(first,/水門壞了|data-academic-action="er-select"/);
  assert.equal(er.applyAction(null,s,{type:'er-confirm'}).changed,false);
  assert.equal(er.applyAction(null,s,{type:'er-select',value:'a-grass-high'}).changed,false);
  s=action(er,s,'er-observe','a-current-level');
  assert.equal(s.t1CurrentRecorded,true);
  assert.equal(s.phase,'work');
  assert.equal(s.lastCheck,null,'valid optional current observation must not imply whole task success');
  assert.equal(er.validState(s),true);
  const water=er.renderWorkbench(null,s);
  assert.match(water,/오늘의 관측/);
  assert.match(water,/그림에서 높은 석틈을 관찰하면 새 흔적을 메모에 더할 수 있어/);
  s=action(er,s,'er-observe','a-grass-high');
  const after=er.renderWorkbench(null,s);
  assert.match(after,/높은 틈에 풀잎이 걸려 있어/);
  assert.match(after,/data-academic-action="er-observe"/);
  s=action(er,s,'er-confirm');
  assert.equal(s.phase,'review');
  assert.equal(s.t1CurrentRecorded,true);
  assert.deepEqual(plain(s.t1ObservedIds),['a-current-level','a-grass-high']);
  assert.match(er.renderWorkbench(null,s),/而且高處的石縫/);
});

test('T2 preserves true B and C observations, not a uniquely forced investigation location',()=>{
  const c=setup(),er=c.AcademicTowerEr04A;
  const s=er.createState();
  s.taskIndex=1;s.completedTaskIds=[er.TASK_IDS[0]];
  assert.equal(er.validState(s),true);
  const view=er.renderWorkbench(null,s);
  assert.match(view,/academicErRoute/);
  assert.match(view,/B · 수문/);
  assert.match(view,/C · 공방/);
  assert.match(view,/아직 확인하지 않은 구간/);
  assert.match(view,/원인은 보류한다/);
  assert.doesNotMatch(view,/data-academic-action="er-search"/);
});

test('T4 toolmarks are learned by inspecting the same opening before choosing interpretation',()=>{
  const c=setup(),er=c.AcademicTowerEr04A;
  let s=er.createState();
  s.taskIndex=3;s.completedTaskIds=plain(er.TASK_IDS.slice(0,3));
  s.step='correct';s.openingFound=true;s.inspectedZoneIds=['low-bank'];s.seenScenes=['retrace','record'];
  assert.equal(er.validState(s),true);
  const before=er.renderWorkbench(null,s);
  assert.match(before,/data-academic-action="er-inspect-d"/);
  assert.doesNotMatch(before,/反覆鑿刻的痕跡/);
  assert.equal(er.applyAction(null,s,{type:'er-select',value:'artificial-passage'}).changed,false);
  s=action(er,s,'er-inspect-d');
  assert.equal(er.validState(s),true);
  const inspected=er.renderWorkbench(null,s);
  assert.match(inspected,/反覆鑿刻的痕跡/);
  s=action(er,s,'er-select','artificial-passage');
  s=action(er,s,'er-confirm');
  assert.equal(s.step,'scope');
  assert.match(er.renderWorkbench(null,s),/academicErPlans/);
});

test('legacy 04A checkpoints normalize without losing progress, new IDs are validated',()=>{
  const c=setup(),er=c.AcademicTowerEr04A;
  let old=er.createState();
  old.selected='a-grass-high';
  for(const key of ['t1ObservedIds','t1Focus','t1CurrentRecorded','t4Inspected'])delete old[key];
  assert.equal(er.validState(old),true);
  let migrated=er.normalizeState(old);
  assert.equal(migrated.selected,'a-grass-high');
  assert.deepEqual(plain(migrated.t1ObservedIds),[]);
  assert.equal(migrated.t1CurrentRecorded,false);
  assert.equal(er.applyAction(null,migrated,{type:'er-confirm'}).changed,false);
  const review={...old,phase:'review',selected:null,completedTaskIds:[er.TASK_IDS[0]],drafts:{t1:'a-grass-high'}};
  assert.equal(er.validState(review),true);
  assert.deepEqual(plain(er.normalizeState(review).t1ObservedIds),['a-grass-high']);
  const malformed={...old,t1ObservedIds:['outside-the-map']};
  assert.equal(er.validState(malformed),false);
  const completed=solved(er);
  assert.match(er.renderWorkbench(null,completed),/academicErFinalReport/);
  assert.match(er.renderWorkbench(null,completed),/從而確認/);
});

test('T1 illustrated event, screen-reader wording and T5 evidence agree with 這次大雨',()=>{
  const {AcademicTowerEr04A:er}=setup();
  const first=er.renderWorkbench(null,er.createState());
  assert.match(first,/這次大雨/);
  assert.match(first,/이번 큰비의 물 자국/);
  assert.match(first,/이번 큰비에 물이 여기까지 올라왔음을/);
  assert.doesNotMatch(first,/지난 큰비|지난 큰물|지난 물 자국/);
  const afterWater=action(er,er.createState(),'er-observe','a-current-level');
  assert.match(er.renderWorkbench(null,afterWater),/이번 큰비 때 남은 물 자국/);
  const final=solved(er);
  assert.match(er.renderWorkbench(null,final),/A · 직접 관찰 · 이번 큰비의 흔적/);
});


test('T3 反而 compares the workshop waterway with a side diversion, not an unsupported boy inflow expectation',()=>{
 const c=setup(),er=c.AcademicTowerEr04A;
 const cfg=vm.runInContext("STAGES.find(s=>s.id==='academic-tower-turn-04a-er-family').academicTower",c);
 const i1=cfg.scenes.retrace.beats.map(x=>x.zh+' '+x.ko).join(' ');
 const i2=cfg.scenes.record.beats.map(x=>x.zh+' '+x.ko).join(' ');
 assert.match(i1,/這條水道通往工坊/);
 assert.doesNotMatch(i1,/草叢裡的雨水流進水道|수풀에 남은 빗물이 수로로 들어오는/);
 assert.match(i2,/有一部分水從旁邊流走了/);
 assert.doesNotMatch(i2,/原來水是往外流的/);
 let s=er.createState();
 s.taskIndex=2;s.completedTaskIds=plain(er.TASK_IDS.slice(0,2));
 s.phase='scene';s.sceneId='retrace';s.step='search';
 assert.equal(er.validState(s),true);
 s=action(er,s,'er-scene-finish');
 const hidden=er.renderWorkbench(null,s);
 assert.match(hidden,/이 수로는 공방으로 이어져/);
 assert.doesNotMatch(hidden,/소년은 수풀의 빗물이|소년은 유입을 예상했어|有一部分反而/);
 s=action(er,s,'er-search','low-bank');
 const view=er.renderWorkbench(null,s);
 assert.match(view,/물 일부는 어디로 움직일까/);
 assert.match(view,/수로의 물 일부가 측벽의 틈으로 갈라져 나가/);
 assert.match(view,/수풀 쪽 물이 틈을 통해 수로에 합쳐져/);
 s=action(er,s,'er-select','flow-in');
 const wrong=er.applyAction(null,s,{type:'er-confirm'});
 assert.equal(wrong.correct,false);
 assert.equal(wrong.state.openingFound,true);
 s=action(er,wrong.state,'er-select','flow-out');
 const right=er.applyAction(null,s,{type:'er-confirm'});
 assert.equal(right.correct,true);
 assert.match(right.feedback,/물 일부가 오히려 옆 통로로/);
 assert.match(right.feedback,/전부 설명되지는 않아/);
 const done=er.renderWorkbench(null,right.state);
 assert.match(done,/有一部分反而從旁邊的孔口流走了/);
 assert.match(done,/새로 확인한 갈래 · 일부가 옆으로 유출/);
});

test('existing T3 flow-in checkpoint IDs remain valid when returning after an update',()=>{
 const er=setup().AcademicTowerEr04A;
 const s=er.createState();
 s.taskIndex=2;s.step='direction';
 s.completedTaskIds=plain(er.TASK_IDS.slice(0,2));
 s.openingFound=true;s.inspectedZoneIds=['low-bank'];
 s.seenScenes=['retrace'];s.selected='flow-in';s.drafts.t3='flow-in';
 assert.equal(er.validState(s),true);
 const after=er.normalizeState(s);
 assert.equal(after.selected,'flow-in');
 assert.match(er.renderWorkbench(null,after),/수풀 쪽 물이 틈을 통해 수로에 합쳐져/);
});
