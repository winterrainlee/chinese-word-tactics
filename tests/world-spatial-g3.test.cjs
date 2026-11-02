/* G3 context adapter: shared queries for map/story/quest with no player-visible changes. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fixture=JSON.parse(read('data/world-spatial-catalog-v0.1.json'));
const adapter=require('../src/world-spatial-context.js');

const seed={completedMilestones:['chapter1-complete','chapter2-rain-passed'],
  completedStages:[],seenStories:['chapter2-rain-opening']};

test('one validated lazy catalog serves region, story and quest contexts',async()=>{
  let reads=0;
  const context=adapter.create({readCatalog:async()=>{reads++;return fixture;}});
  assert.equal(reads,0,'lazy when first visited');
  const [region,story,quest]=await Promise.all([
    context.place('inn',seed),
    context.story('first-free-quest-accepted',seed),
    context.quest('north-forest-mushrooms',seed)
  ]);
  assert.equal(reads,1,'the three consumers share a single data fetch');
  assert.equal(region.place.id,'inn');
  assert.equal(story.placeId,'inn');
  assert.strictEqual(story.context.place,region.place);
  assert.equal(quest.originPlaceId,'inn');
  assert.strictEqual(quest.origin.place,region.place);
  assert.equal(quest.activityPlaceId,'north-forest');
  assert.equal(quest.activityCatalogued,false);
  assert.equal(quest.activity,null,'do not fabricate an unregistered forest geography');
  assert.equal(region.movementAuthority,'legacy-game-system');
  assert.equal(region.eventAuthority,'not-active-in-g3');
  assert.equal(region.physicalRoadEdges.length,0);
  assert.equal(region.physicalWaterEdges.length,0);
  assert.deepEqual(region.unknowns,[]);
  assert.ok(region.relations.some(r=>r.id==='relation:market-to-inn'));
  assert.ok(Object.isFrozen(region.place) && Object.isFrozen(region.relations));
  assert.ok(Object.isFrozen(quest) && Object.isFrozen(quest.origin));
});

test('04A facts appear only after the actual opening discovery or completed research',async()=>{
  const g=adapter.create({readCatalog:()=>fixture});
  const prior=await g.place('academic-tower',seed);
  assert.equal(prior.observations.length,0);
  assert.equal(prior.unknowns.length,0,'hidden evidence must not leak via unknown questions');
  const partial=await g.place('academic-tower',{
    ...seed,sideResearchProgress:{'academic-tower-turn-04a-er-family':{openingFound:true}}
  });
  assert.deepEqual(partial.observations.map(x=>x.id),['observation:04a-side-outlet']);
  assert.ok(partial.unknowns.some(x=>x.type==='water-destination'));
  const completed=await g.place('academic-tower',{
    ...seed,completedStages:['academic-tower-turn-04a-er-family']
  });
  assert.equal(completed.observations.length,1);
  const notKnowledge=await g.place('academic-tower',{
    ...seed,completedStages:['academic-tower-turn-04-faner'],
    seenStories:['chapter2-rain-opening']
  });
  assert.equal(notKnowledge.observations.length,0);
});

test('story binding requires an explicit stable ID, not an illustrated backdrop or place name',async()=>{
  const g=adapter.create({readCatalog:()=>fixture});
  assert.equal((await g.story('gate-arrival')).placeId,'gate-town');
  assert.equal((await g.story('chapter2-rain-opening')).placeId,'inn');
  assert.equal(await g.story('story-that-only-uses-an-inn-background'),null);
  assert.equal(await g.story('academic-tower-er-intro'),null,
    'outdoor tower story is not automatically tied to the indoor tower landmark');
  assert.equal(await g.quest('unknown-quest'),null);
  assert.equal(await g.place('north-forest'),null);
});

test('approved future restriction is not active routing or quest logic',async()=>{
  const g=adapter.create({readCatalog:()=>fixture});
  const p=await g.place('border-village',seed);
  assert.equal(p.place.parentId,null);
  assert.equal(p.place.mapAnchorRole,'outside-direction');
  assert.equal(p.physicalRoadEdges.length,0);
  assert.equal(Object.hasOwn(p,'futureRules'),false);
  const planned=await g.planningRule('scenario:post-rain-border-travel');
  assert.equal(planned.active,false);
  assert.equal(planned.implementation,'approved-story-not-active-game-rule');
  assert.equal(planned.sourceRule.affectedEdgeId,null);
  assert.equal(planned.sourceRule.modes.heavyCart,'temporarily-restricted-both-directions');
});

test('bridge returns immutable structures and never modifies save progress',async()=>{
  const g=adapter.create({readCatalog:()=>fixture});
  const before=JSON.stringify(seed);
  const ctx=await g.place('gate-town',seed);
  assert.equal(Object.isFrozen(ctx),true);
  assert.equal(Object.isFrozen(ctx.relations[0]),true);
  assert.equal(JSON.stringify(seed),before);
  assert.match(read('src/world-spatial-context.js'),/world-spatial-catalog-v0\.1\.json/);
  assert.doesNotMatch(read('src/world-spatial-context.js'),/localStorage|GameStorage|setItem\(|showView\(|openSheet\(/);
  assert.deepEqual(fixture.networks.road.edges,[]);
  assert.deepEqual(fixture.networks.water.edges,[]);
});

test('failed catalog is fail-closed, retryable, without affecting existing UI',async()=>{
  let attempts=0;
  const g=adapter.create({readCatalog:async()=>{
    attempts++;
    if(attempts===1)throw Error('offline');
    return fixture;
  }});
  const el={isConnected:true,dataset:{regionId:'gate-town'}};
  assert.equal(await g.annotateRegion(el,'gate-town'),null);
  assert.equal(el.dataset.spatialPlaceId,undefined);
  const place=await g.annotateRegion(el,'gate-town');
  assert.equal(place.place.id,'gate-town');
  assert.equal(el.dataset.spatialPlaceId,'gate-town');
  assert.equal(attempts,2);
  const broken=adapter.create({readCatalog:async()=>({...fixture,scope:'not-approved'})});
  await assert.rejects(broken.place('inn'),/invalid spatial catalog/);
});

test('stale asynchronous story lookup cannot annotate a different story',async()=>{
  let resolve;
  const g=adapter.create({readCatalog:()=>new Promise(r=>{resolve=r;})});
  const element={isConnected:true,dataset:{}};
  const first=g.annotateStory(element,'gate-arrival');
  const second=g.annotateStory(element,'first-free-quest-accepted');
  await Promise.resolve(); // reader starts asynchronously
  resolve(fixture);
  await Promise.all([first,second]);
  assert.equal(element.dataset.spatialStoryPlaceId,'inn');
  assert.equal(element.dataset.spatialStoryLookupId,'first-free-quest-accepted');
  const unknown=await g.annotateStory(element,'not-bound');
  assert.equal(unknown,null);
  assert.equal(element.dataset.spatialStoryPlaceId,undefined);
});

test('the same bridge is referenced by actual map, story and quest runtimes',()=>{
  const html=read('index.html');
  const bridgePosition=html.indexOf('src/world-spatial-context.js');
  const catalogPosition=html.indexOf('src/world-spatial-catalog.js');
  const storyPosition=html.indexOf('src/story-runtime.js');
  const worldPosition=html.indexOf('src/world-runtime.js');
  assert.ok(catalogPosition>0 && bridgePosition>catalogPosition && bridgePosition<storyPosition && bridgePosition<worldPosition);
  assert.match(read('src/world-runtime.js'),/WorldSpatialContext\?\.annotateRegion/);
  assert.match(read('src/story-runtime.js'),/WorldSpatialContext\?\.annotateStory/);
  assert.match(read('src/first-free-quest-world-runtime.js'),/WorldSpatialContext\?\.annotateQuest/);
  const legacy=read('src/journey-progress.js');
  assert.match(legacy,/function hasRainPassed/);
  assert.doesNotMatch(read('world-grid-test/index.html'),/world-spatial-context\.js/);
  assert.doesNotMatch(read('world-grid-test/app.js'),/world-spatial-catalog-v0\.1\.json/);
});
