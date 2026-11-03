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
        assert.equal(P.isAvailable(intro,p),signal!=='pre');
        assert.equal(P.isJourneyVisible(intro,p),signal!=='pre');
        assert.equal(P.isAvailable(stage,p),false);
        assert.equal(P.isAvailable(stage,{...p,seenStories:[...p.seenStories,intro.id]}),signal!=='pre');
      }
    }
  }
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
