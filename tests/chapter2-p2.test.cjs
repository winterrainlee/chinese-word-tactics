const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const {contentSourcesFor} = require('../tools/content-contract-audit.cjs');
const ctx = vm.createContext({});
for (const path of [...contentSourcesFor(),'src/journey-progress.js','src/save-data.js']) {
  vm.runInContext(fs.readFileSync(path,'utf8'),ctx);
}
const P = ctx.JourneyProgress;
test('both field sections open independently after rain, including old saves and optional discoveries',()=>{
  const p1 = ['chapter2-gate-first-look','chapter2-market-first-look','chapter2-workshop-first-look'];
  for (const seenStories of [[],p1.slice(0,1),p1]) {
    for (const signal of ['pre','normal','forest','04A']) {
      const p = P.normalize({completedMilestones:['chapter1-complete',...(signal==='normal'?['chapter2-rain-passed']:[])],
        seenStories:[...seenStories,...({forest:['first-free-quest-accepted'],'04A':['academic-tower-er-intro']}[signal]||[])]});
      for (const entry of ctx.Chapter2Fields.entries) {
        const intro=P.getNode('story:'+entry.prefix+'-intro'),stage=P.getNode('stage:'+entry.id);
        const council = entry.region === 'council-town';
        assert.equal(P.isAvailable(intro,p),signal!=='pre' && !council);
        assert.equal(P.isAvailable(intro,{...p,heardCouncilNotice:true}),signal!=='pre');
        assert.equal(P.isAvailable(intro,{...p,fieldDrafts:{[entry.id]:{prior:false}}}),signal!=='pre');
        assert.equal(P.isJourneyVisible(intro,p),signal!=='pre');
        assert.equal(P.isAvailable(stage,p),false);
        assert.equal(P.isAvailable(stage,{...p,seenStories:[...p.seenStories,intro.id]}),signal!=='pre');
      }
    }
  }
});
test('an unvisited field never displaces an active free quest, and interrupted field play still resumes',()=>{
  const nodes=P.allNodes().filter(n=>!n.chooseOnMap && !n.optionalFirstLook);
  const progress=P.normalize({
    completedStages:nodes.filter(n=>n.type==='stage').map(n=>n.id),
    seenStories:nodes.filter(n=>n.type==='story').map(n=>n.id),
    completedMilestones:['chapter1-complete','chapter2-rain-passed'],lastLocation:{view:'world'}
  });
  assert.equal(P.recommendedNode(progress),null);
  const entry=ctx.Chapter2Fields.entries[0];
  progress.seenStories.push(entry.prefix+'-intro');
  progress.lastLocation={view:'tactical',nodeId:'stage:'+entry.id};
  assert.equal(P.recommendedNode(progress).id,entry.id);
});
test('every field source has one Zhuyin syllable per Han character and all saved links have a real destination',()=>{
  for (const entry of ctx.Chapter2Fields.entries) {
    for (const [id,[,source]] of Object.entries(entry.sources)) {
      assert.equal(entry.readings[id].split(' ').length,(source.match(/\p{Script=Han}/gu)||[]).length);
    }
    const valid={prior:true,links:entry.rows.map(row=>row[4])};
    assert.ok(ctx.Chapter2Fields.validDraft(entry,valid));
    assert.equal(ctx.Chapter2Fields.validDraft(entry,{...valid,links:['<'] }),false);
  }
});
