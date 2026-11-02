/* G2 minimal confirmed world data: do not invent a second authoritative map. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const catalog=JSON.parse(read('data/world-spatial-catalog-v0.1.json'));
const g1=JSON.parse(read('data/world-spatial-illustration-trace-v0.1.json'));
const world=require('../src/world-spatial-catalog.js');

test('catalog has provenance, stable identities and no invented geometry',()=>{
  assert.deepEqual(world.validate(catalog),{ok:true,errors:[]});
  assert.equal(catalog.schemaVersion,1);
  assert.equal(catalog.scope,'internal-data-only');
  assert.equal(catalog.mapGeometry,'undetermined');
  for(const item of [
    ...catalog.places,...catalog.relations,...catalog.observations,
    ...catalog.futureRules,...catalog.unknowns
  ]) for(const source of item.sources) assert.ok(fs.existsSync(path.join(root,source)),item.id+': '+source);
  assert.equal(world.worldPlace(catalog,'three-streams-town').nameZh,'三溪鎮');
  assert.equal(world.worldPlace(catalog,'inn').parentId,'three-streams-town');
  assert.equal(world.worldPlace(catalog,'border-village').parentId,null);
  assert.equal(world.worldPlace(catalog,'border-village').mapAnchorRole,'outside-direction');
});

test('all six legacy world map anchor IDs remain, without promoting percentages to geography',()=>{
  const ids=g1.placeAnchors.map(item=>item.id);
  assert.deepEqual(ids.sort(),[...world.legacyIds].sort());
  for(const anchor of g1.placeAnchors) {
    const place=world.worldPlace(catalog,anchor.id);
    assert.ok(place,anchor.id);
    assert.equal(place.mapAnchorRole,anchor.role);
    assert.equal(place.geometry,null);
    assert.equal(Object.hasOwn(place,'xPct'),false);
    assert.equal(Object.hasOwn(place,'yPct'),false);
  }
  assert.equal(g1.status,'review-only');
  assert.equal(g1.authority,'illustration-reference-not-world-geography');
  assert.ok(g1.features.every(x=>x.id.startsWith('trace:')));
  assert.equal(catalog.observations.some(item=>item.id.startsWith('trace:')),false);
});

test('narrative adjacency and direction are NOT surveyed roads or water edges',()=>{
  const outward=world.relation(catalog,'relation:gate-to-border');
  assert.equal(outward.from,'gate-town');
  assert.equal(outward.to,'border-village');
  assert.equal(outward.kind,'narrative-route-direction');
  assert.equal(outward.physicalEdgeId,null);
  assert.equal(world.physicalEdge(catalog,'road','relation:gate-to-border'),null);
  assert.equal(world.physicalEdge(catalog,'water','relation:workshop-to-tower'),null);
  assert.equal(catalog.networks.road.edges.length,0);
  assert.equal(catalog.networks.water.edges.length,0);
  const relations=world.relationsFor(catalog,'market-town');
  assert.deepEqual(relations.map(x=>x.id).sort(),['relation:market-to-council','relation:market-to-inn']);
  assert.equal(world.relationsFor(catalog,'not-registered').length,0);
});

test('04A fact exists in world, but player knowledge requires the real discovery',()=>{
  const id='observation:04a-side-outlet';
  const fact=world.observation(catalog,id);
  assert.equal(fact.relativeLocation.first,'B');
  assert.equal(fact.relativeLocation.second,'C');
  assert.ok(fact.observedFacts.includes('outflow-to-vegetation'));
  assert.ok(fact.unknownFields.includes('destination'));
  const rainOnly={completedMilestones:['chapter1-complete','chapter2-rain-passed'],seenStories:['chapter2-rain-opening']};
  const oldSnapshot=JSON.stringify(rainOnly);
  assert.equal(world.observation(catalog,id,{viewer:'player',progress:rainOnly}),null);
  assert.equal(world.observation(catalog,id,{viewer:'player',progress:{
    completedStages:['academic-tower-turn-04-faner']
  }}),null);
  assert.equal(world.observation(catalog,id,{viewer:'player',progress:{
    sideResearchProgress:{'academic-tower-turn-04a-er-family':{openingFound:false}}
  }}),null);
  assert.equal(world.observation(catalog,id,{viewer:'player',progress:{
    sideResearchProgress:{'academic-tower-turn-04a-er-family':{openingFound:true}}
  }}),fact);
  assert.equal(world.observation(catalog,id,{viewer:'player',progress:{
    completedStages:['academic-tower-turn-04a-er-family']
  }}),fact);
  assert.equal(world.observation(catalog,id,{viewer:'unknown'}),null);
  assert.equal(JSON.stringify(rainOnly),oldSnapshot,'query may not mutate the saved journey');
  assert.equal(world.unknownFor(catalog,id)[0].type,'water-destination');
  assert.match(read('src/academic-tower-er-04a-runtime.js'),/const STAGE_ID = 'academic-tower-turn-04a-er-family'/);
  assert.match(read('src/academic-tower-er-04a-runtime.js'),/openingFound/);
});

test('approved post-rain transport limitation remains a scenario, not an active edge',()=>{
  const rule=world.futureRule(catalog,'scenario:post-rain-border-travel');
  assert.equal(rule.implementation,'approved-story-not-active-game-rule');
  assert.equal(rule.preciseSection,null);
  assert.equal(rule.affectedEdgeId,null);
  assert.equal(rule.nearPlaceId,'border-village');
  assert.equal(rule.modes.heavyCart,'temporarily-restricted-both-directions');
  assert.equal(world.physicalEdge(catalog,'road',rule.affectedEdgeId),null);
  assert.equal(world.unknownFor(catalog,rule.id)[0].type,'road-segment');
  assert.ok(!Object.hasOwn(rule,'isOpenNow'),'approved narrative is not runtime availability');
});

test('schema rejects invented topology, wrong foreign keys, invented coordinates and guessed discovery',()=>{
  const clone=()=>JSON.parse(JSON.stringify(catalog));
  for(const mutate of [
    data=>{data.places.find(p=>p.id==='border-village').parentId='three-streams-town';},
    data=>{data.places.find(p=>p.id==='gate-town').xPct=50;},
    data=>{data.relations[0].physicalEdgeId='invented-road';},
    data=>{data.networks.road.edges.push({id:'fake-road',from:'gate-town',to:'border-village'});},
    data=>{data.relations[0].to='unknown-town';},
    data=>{data.observations[0].geometry=[100,120];},
    data=>{data.futureRules[0].implementation='active';},
    data=>{data.unknowns[0].subject='nonexistent';},
    data=>{data.places[0].sources=[];}
  ]) {
    const x=clone();mutate(x);
    assert.equal(world.validate(x).ok,false,JSON.stringify(x).slice(0,100));
  }
});

test('G2 is read-only infrastructure: existing map and G1 remain independent',()=>{
  assert.doesNotMatch(read('src/world-spatial-catalog.js'),/localStorage|GameStorage|showView\(|setItem\(/);
  assert.doesNotMatch(read('index.html'),/src\/world-spatial-catalog\.js/);
  assert.match(read('world-grid-test/index.html'),/src\/world-spatial-prototype\.js/);
  assert.doesNotMatch(read('world-grid-test/index.html'),/world-spatial-catalog/);
  assert.deepEqual(g1.grids.map(x=>x.cols+'x'+x.rows),['20x36','32x57','40x71']);
});
