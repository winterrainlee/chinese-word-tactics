/* P1: three optional post-rain sightings, not a re-clear of Chapter 1. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const load=(ctx,file)=>vm.runInContext(read(file),ctx,{filename:file});
const plain=x=>JSON.parse(JSON.stringify(x));
function harness(){
  const ctx=vm.createContext({});
  for(const file of ['src/journey-content.js','src/chapter1-finale-content.js',
    'src/chapter2-rain-content.js','src/journey-progress.js','src/chapter2-first-look-runtime.js'])load(ctx,file);
  return {ctx,P:ctx.JourneyProgress,FL:ctx.Chapter2FirstLook};
}
const IDS={
  'gate-town':'chapter2-gate-first-look',
  'market-town':'chapter2-market-first-look',
  'workshop-town':'chapter2-workshop-first-look'
};
const before={seenStories:['chapter1-room-finale'],completedMilestones:['chapter1-complete'],
  completedStages:['stage-5'],acknowledgedNodes:[],lastLocation:{view:'world'}};
const after={...before,seenStories:[...before.seenStories,'chapter2-rain-opening'],
  completedMilestones:[...before.completedMilestones,'chapter2-rain-passed']};

test('three independent optional first-look nodes remain in the Chapter 2 journey',()=>{
  const {ctx,P}=harness();
  const chapter=ctx.JourneyContent.JOURNEY.find(c=>c.id==='chapter-2-after-rain');
  assert.ok(chapter);
  assert.equal(chapter.sections.filter(x=>x.regionId && x.sequence?.[0]?.optionalFirstLook).length,3);
  const old=P.getNode('story:chapter2-rain-opening');
  assert.equal(old.milestone,'chapter2-rain-passed');
  assert.equal(old.returnToWorldAfter,true);
  assert.equal(old.requiresRainPassed,undefined);
  for(const [regionId,storyId] of Object.entries(IDS)){
    const node=P.getNode('story:'+storyId);
    const text=ctx.JourneyContent.STORIES[storyId];
    assert.ok(node && text,regionId);
    assert.equal(node.chapterId,chapter.id);
    assert.equal(node.entryRegionId,regionId);
    assert.equal(node.optionalFirstLook,true);
    assert.equal(node.requiresRainPassed,true);
    assert.equal(node.revealAfterRain,true);
    assert.equal(node.returnToWorldAfter,true);
    assert.equal(node.milestone,undefined);
    assert.equal(node.requires?.length||0,0);
    assert.ok(text.beats.length>=4);
    assert.ok(text.beats.every(b=>typeof b.zh==='string'&&b.zh.length>3&&typeof b.ko==='string'&&b.ko.length>3));
    assert.equal(P.isJourneyVisible(node,before),false);
    assert.equal(P.isAvailable(node,before),false);
    assert.equal(P.isJourneyVisible(node,after),true);
    assert.equal(P.isAvailable(node,after),true);
    assert.equal(P.nextNode(node.nodeId,after),null,'no forced next first-look stage');
  }
});

test('rain must have passed; old post-rain saves can also read first looks',()=>{
  const {P,FL}=harness();
  for(const id of Object.keys(IDS)){
    assert.equal(FL.statusFor(id,before),null);
    assert.equal(FL.statusFor(id,after).seen,false);
  }
  const legacy={...before,seenStories:[...before.seenStories,'first-free-quest-accepted']};
  assert.equal(P.hasRainPassed(legacy),true);
  for(const id of Object.keys(IDS))assert.equal(FL.statusFor(id,legacy).seen,false);
  const tooEarly={...before,completedStages:['academic-tower-turn-03b-ran-village']};
  assert.equal(P.hasRainPassed(tooEarly),false);
  for(const id of Object.keys(IDS))assert.equal(FL.statusFor(id,tooEarly),null);
  assert.equal(FL.statusFor('council-town',after),null);
  assert.equal(FL.statusFor('border-village',after),null);
  assert.equal(FL.statusFor('academic-tower',after),null);
});

test('optional first looks never hijack generic Continue but saved unfinished story can resume',()=>{
  const {P}=harness();
  const nodes=P.allNodes();
  const completed=P.normalize({
    seenStories:nodes.filter(n=>n.type==='story'&&!n.optionalFirstLook).map(n=>n.id),
    completedStages:nodes.filter(n=>n.type==='stage').map(n=>n.id),
    completedMilestones:['chapter1-complete','chapter2-rain-passed']
  });
  assert.equal(P.recommendedNode(completed),null,
    'unread optional scenery may not become the mandatory next campaign node');
  for(const id of Object.values(IDS)){
    const continued=P.normalize({...plain(completed),lastLocation:{
      view:'story',nodeId:'story:'+id,beat:2}});
    assert.equal(P.recommendedNode(continued).id,id,
      'an interrupted first look must be resumable from its saved beat');
  }
});

test('first-play records only the actually read sight; replay never changes completion',()=>{
  const {P,FL}=harness();
  const memory=new Map([[P.KEY,JSON.stringify(after)]]);
  const store=P.createStore({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)});
  const original=plain(store.get());
  for(const id of ['chapter2-market-first-look','chapter2-workshop-first-look','chapter2-gate-first-look']){
    const node=P.getNode('story:'+id);
    assert.equal(store.get().seenStories.includes(id),false);
    store.complete(node);
    assert.equal(store.get().seenStories.includes(id),true);
    const snapshot=plain(store.get());
    store.complete(node,'replay');
    assert.deepEqual(plain(store.get()),snapshot);
  }
  const final=store.get();
  assert.equal(final.completedStages.join(','),original.completedStages.join(','));
  assert.deepEqual(plain(final.completedMilestones),plain(original.completedMilestones));
  assert.equal(final.seenStories.filter(id=>id.startsWith('chapter2-')&&id.endsWith('-first-look')).length,3);
  assert.equal(FL.statusFor('gate-town',final).seen,true);
  assert.equal(final.sideResearchProgress && Object.keys(final.sideResearchProgress).length,0);
});

test('entry action uses same story engine with correct first/replay mode, never edits progress',()=>{
  const {ctx,FL}=harness();
  let state=plain(after);const calls=[];
  ctx.GameFlow={
    progress(){return state;},
    playStory(id,options){calls.push({id,options:plain(options)});return true;}
  };
  assert.equal(FL.open('gate-town'),true);
  assert.deepEqual(calls[0],{id:IDS['gate-town'],options:{mode:'first-play',returnTo:'world'}});
  assert.equal(FL.open('council-town'),false);
  state={...state,seenStories:[...state.seenStories,IDS['gate-town']]};
  assert.equal(FL.open('gate-town'),true);
  assert.deepEqual(calls[1],{id:IDS['gate-town'],options:{mode:'replay',returnTo:'world'}});
  assert.equal(state.completedMilestones.includes('chapter2-rain-passed'),true);
});

test('stable G3 story bindings and world sheet entry do not touch maps or routes',()=>{
  const source=read('src/world-spatial-context.js');
  for(const [regionId,id] of Object.entries(IDS)){
    assert.ok(source.includes("'"+id+"':'"+regionId+"'"));
  }
  const world=read('src/world-runtime.js');
  assert.match(world,/Chapter2FirstLook\?\.statusFor/);
  assert.match(world,/worldFirstLookEntry/);
  assert.match(world,/Chapter2FirstLook\?\.open/);
  assert.match(world,/showRegionPractice/);
  const html=read('index.html');
  assert.match(html,/src\/chapter2-first-look-runtime\.js/);
  assert.match(html,/src\/chapter2-rain-content\.js\?v=20261102-chapter2-p1/);
  assert.match(html,/src\/world\.css\?v=20261102-chapter2-p1/);
  assert.equal(Object.prototype.hasOwnProperty.call(after,'chapter2FirstLook'),false);
  assert.doesNotMatch(read('src/chapter2-first-look-runtime.js'),/localStorage|GameStorage|setItem\(/);
});
