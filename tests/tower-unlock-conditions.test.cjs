const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const plain = p => JSON.parse(JSON.stringify(p));

function setup() {
  const context = vm.createContext({
    console,
    document: { getElementById() { return null; }, addEventListener() {} }
  });
  for (const p of [
    'src/content.js', 'src/workshop-content.js', 'src/workshop-late-content.js',
    'src/g7-content.js', 'src/market-content.js', 'src/market-late-content.js',
    'src/journey-content.js', 'src/g7-journey-content.js',
    'src/workshop-journey-content.js', 'src/workshop-late-journey-content.js',
    'src/market-journey-content.js', 'src/market-late-journey-content.js',
    'src/continuous-region-flow.js', 'src/chapter1-finale-content.js',
    'src/chapter2-rain-content.js', 'src/first-free-quest-content.js',
    'src/north-forest-content.js', 'src/academic-tower-content.js',
    'src/academic-tower-journey-content.js', 'src/academic-tower-er-04a-runtime.js',
    'src/world-v06-content.js', 'src/journey-progress.js',
    'src/story-outcome-content.js', 'src/academic-tower-hub-runtime.js',
    'src/chapter2-rain-runtime.js'
  ]) vm.runInContext(read(p), context, { filename:p });
  return context;
}

test('W7 story, not stage milestone or Chapter 1 finale, opens the Tower', () => {
  const c = setup(), P = c.JourneyProgress;
  const arrival = P.getNode('story:academic-tower-arrival');
  assert.deepEqual(plain(arrival.requires), ['story:workshop-finale']);
  const region = vm.runInContext("WORLD.regions.find(region => region.id === 'academic-tower')", c);
  assert.equal(region.requires, 'story:workshop-finale');
  const stageOnly = P.normalize({ completedStages:['workshop-stage-7'],
    completedMilestones:['workshop-core'] });
  const afterStory = P.normalize({ ...stageOnly, seenStories:['workshop-finale'] });
  assert.equal(P.isAvailable(arrival, stageOnly), false);
  assert.equal(P.isAvailable(arrival, afterStory), true);
  assert.equal(P.isAvailable(arrival, P.normalize({seenStories:['chapter1-room-finale']})), false);
  assert.equal(afterStory.completedMilestones.includes('chapter1-complete'), false);
  assert.equal(P.isJourneyVisible(arrival, afterStory), false,
    'the internal Tower timeline is displayed only after first arrival');
});

test('early Tower dialogue never invents a Gate G7 sign, but remembers it if seen', () => {
  const c = setup(), P = c.JourneyProgress, S = c.StoryOutcomeContent;
  const cases = [
    ['academic-tower-arrival', 5],
    ['academic-tower-turn-intro', 3],
    ['academic-tower-turn-result', 8]
  ];
  for (const [id,index] of cases) {
    const original = c.JourneyContent.STORIES[id];
    const before = S.resolve(original, P.normalize({ seenStories:['workshop-finale'] }));
    const after = S.resolve(original, P.normalize({
      seenStories:['workshop-finale','gate-after-convoy']
    }));
    assert.equal(before.beats.length, original.beats.length);
    assert.equal(before.beats[index].speaker, 'boy');
    assert.doesNotMatch(before.beats[index].zh, /關口|路標/);
    assert.match(after.beats[index].zh, /關口/);
    assert.equal(after.beats[index].zh, original.beats[index].zh);
    assert.equal(original.beats[index].zh.includes('關口'), true, 'base story remains intact');
  }
});

test('03B is gated by both 03A and Market M4 but a started legacy visit stays accessible', () => {
  const c=setup(), P=c.JourneyProgress, hub=c.AcademicTowerRuntime;
  const intro=P.getNode('story:academic-tower-ran-village-intro');
  const room=c.AcademicTowerContent.bundle.rooms.find(r=>r.id==='academic-tower-turn-03b-ran-village');
  assert.deepEqual(plain(intro.requires), [
    'story:academic-tower-ran-result','story:market-after-m4'
  ]);
  assert.deepEqual(plain(room.requiresStories), [
    'academic-tower-ran-result','market-after-m4'
  ]);
  const base=P.normalize({
    completedStages:['academic-tower-turn-03a-ran-family'],
    seenStories:['academic-tower-ran-result']
  });
  const market=P.normalize({ ...base,
    seenStories:['academic-tower-ran-result','market-after-m4']
  });
  assert.equal(P.isAvailable(intro,base),false);
  assert.equal(hub.roomState(room,base),'locked');
  assert.equal(P.isAvailable(intro,market),true);
  assert.equal(hub.roomState(room,market),'available');
  const started=P.normalize({
    ...base, seenStories:['academic-tower-ran-result','academic-tower-ran-village-intro']
  });
  assert.equal(hub.roomState(room,started),'available',
    'do not revoke a previously started 03B visit');
});

test('04A requires rain independently from Tower 04; earlier research is not rain evidence', () => {
  const c=setup(), P=c.JourneyProgress, hub=c.AcademicTowerRuntime;
  const intro=P.getNode('story:academic-tower-er-intro');
  const room=c.AcademicTowerContent.bundle.rooms.find(r=>r.id==='academic-tower-turn-04a-er-family');
  assert.equal(room.requiresRainPassed,true);
  assert.equal(intro.requiresRainPassed,true);
  assert.equal(intro.revealAfterRain,true);
  const before=P.normalize({
    seenStories:['academic-tower-arrival','academic-tower-turn-intro',
      'academic-tower-ran-result','academic-tower-ran-village-intro'],
    completedStages:['academic-tower-turn-04-faner','academic-tower-turn-03a-ran-family',
      'academic-tower-turn-03b-ran-village'],
    completedMilestones:['chapter1-complete','academic-tower-entered']
  });
  assert.equal(P.hasPostRainEvidence(before),false);
  assert.equal(P.hasRainPassed(before),false);
  assert.equal(c.Chapter2Rain.statusFor(before),'pending');
  assert.equal(hub.roomState(room,before),'locked');
  assert.equal(P.isAvailable(intro,before),false);
  assert.equal(P.isJourneyVisible(intro,before),false);
  const rain=P.normalize({ ...before,
    completedMilestones:[...before.completedMilestones,'chapter2-rain-passed']
  });
  assert.equal(P.hasRainPassed(rain),true);
  assert.equal(P.isAvailable(intro,rain),true);
  assert.equal(P.isJourneyVisible(intro,rain),true);
  assert.equal(hub.roomState(room,rain),'available');
  assert.equal(P.hasRainPassed(P.normalize({
    ...rain, completedMilestones:['chapter2-rain-passed']
  })),false,'cannot encounter the Chapter2 rain before Chapter1');
});

test('old 04A and post-Chapter1 quest saves count as past rain without fabricated completion', () => {
  const c=setup(), P=c.JourneyProgress;
  const plainChapter=P.normalize({ completedMilestones:['chapter1-complete'],
    seenStories:['chapter1-room-finale'] });
  for (const update of [
    { seenStories:['chapter1-room-finale','academic-tower-er-intro'] },
    { completedStages:['academic-tower-turn-04a-er-family'] },
    { sideResearchProgress:{ 'academic-tower-turn-04a-er-family':{schemaVersion:1} } },
    { seenStories:['chapter1-room-finale','first-free-quest-accepted'] },
    { completedMilestones:['chapter1-complete','quest-board-unlocked'] }
  ]) {
    const progress={ ...plainChapter, ...update };
    assert.equal(P.hasPostRainEvidence(progress),true);
    assert.equal(P.hasRainPassed(progress),true);
    assert.equal(c.Chapter2Rain.statusFor(progress),'legacy');
    assert.equal(progress.seenStories.includes('chapter2-rain-opening'),false,
      'do not falsely mark an unviewed story complete');
  }
});
