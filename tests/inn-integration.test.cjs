const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
require('../src/academic-tower-er-04a-runtime.js');require('../src/journey-content.js');require('../src/journey-progress.js');require('../src/save-data.js');
const P=globalThis.JourneyProgress;
function disk(){const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}}
test('visit persists through reload, backup and restore without changing story progress',()=>{
 const d=disk(),s=P.createStore(d),before=s.get();assert.equal(before.innVisited,false);
 s.visitInn();assert.equal(P.createStore(d).get().innVisited,true);
 const b=SaveData.createBackup(d);assert.equal(SaveData.validateBackup(b).ok,true);
 const d2=disk();SaveData.restoreBackup(d2,b);const after=P.createStore(d2).get();assert.equal(after.innVisited,true);
 delete before.innVisited;delete after.innVisited;assert.deepEqual(after,before);
});
test('legacy room evidence migrates but unlock alone does not invent a visit',()=>{
 assert.equal(P.normalize({completedMilestones:['inn-unlocked']}).innVisited,false);
 assert.equal(P.normalize({seenStories:['chapter1-room-finale']}).innVisited,true);
 assert.equal(P.normalize({seenStories:['first-free-quest-accepted']}).innVisited,true);
 assert.equal(P.normalize({seenStories:['academic-tower-turn-result']}).innVisited,false);
});
test('test bootstrap isolates writes, removes and backup restoration from production',()=>{
 const d=disk();d.setItem(P.KEY,'production-original');
 const sandbox={localStorage:d};vm.runInNewContext(fs.readFileSync('tools/inn-test-harness/bootstrap.js','utf8'),sandbox);
 const adapter=sandbox.GameStorage;assert.equal(adapter.getItem(P.KEY),null);
 const s=P.createStore(adapter);s.visitInn();const b=SaveData.createBackup(adapter);
 SaveData.restoreBackup(adapter,b);adapter.removeItem(P.KEY);
 assert.equal(d.getItem(P.KEY),'production-original');
});
