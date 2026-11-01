const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const scene=require('../inn-layer-test/scene.json');
const M=require('../inn-layer-test/model.js');
test('layer fixture: eight independent combinations and stable identities',()=>{
 const ids=scene.objects.map(o=>o.id);assert.equal(new Set(ids).size,ids.length);
 for(const o of scene.objects){assert.ok(scene.conditions[o.condition]);assert.ok(scene.layers[o.layer]);if(o.asset){assert.ok(scene.assets[o.asset]);assert.ok(scene.placements[o.placement]);}if(o.interaction)assert.ok(scene.interactions[o.interaction]);}
 for(const a of Object.values(scene.assets))assert.ok(fs.existsSync('inn-layer-test/'+a.src));
 for(let n=0;n<8;n++){
  const state={board:!!(n&1),rain:!!(n&2),newQuest:!!(n&4)};
  const visible=M.project(scene,state).map(o=>o.id);
  assert.equal(visible.includes('inn.lobby.board'),state.board);
  assert.equal(visible.includes('inn.lobby.notice.first'),state.board);
  assert.equal(visible.includes('inn.lobby.notice.new'),state.board&&state.newQuest);
  assert.equal(visible.includes('inn.lobby.rain.water'),state.rain);
  assert.equal(visible.includes('inn.lobby.rain.belongings'),state.rain);
  assert.ok(visible.includes('inn.lobby.structure'));
  assert.ok(visible.includes('inn.lobby.keeper'));
 }
 assert.deepEqual(scene.objects.map(o=>o.id),ids);
});
test('layer/object isolation does not mutate event state or configuration',()=>{
 const state={board:true,rain:true,newQuest:true},before=JSON.stringify({scene,state});
 assert.ok(!M.project(scene,state,['people']).some(o=>o.id==='inn.lobby.keeper'));
 assert.ok(!M.project(scene,state,[],['inn.lobby.notice.new']).some(o=>o.id==='inn.lobby.notice.new'));
 assert.ok(M.project(scene,state).some(o=>o.id==='inn.lobby.notice.new'));
 assert.equal(JSON.stringify({scene,state}),before);
 assert.match(M.describe({board:false,rain:true,newQuest:true}),/게시판 없음/);
});

test('mobile art budget and preserved authored sources',()=>{
 const crypto=require('node:crypto');
 const originals=require('../inn-layer-test/assets/manifest.json');
 for(const file of originals){
  const data=fs.readFileSync('inn-layer-test/assets/'+file.file);
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),file.sha256);
 }
 const derivatives=require('../inn-layer-test/assets/mobile/manifest.json');
 for(const file of derivatives.assets){
  const data=fs.readFileSync('inn-layer-test/'+file.src);
  assert.equal(data.length,file.bytes);
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),file.sha256);
 }
 const urls=[...new Set(Object.values(scene.assets).map(a=>a.src))];
 assert.ok(urls.every(url=>url.startsWith('assets/mobile/')));
 const bytes=urls.reduce((n,url)=>n+fs.statSync('inn-layer-test/'+url).size,0);
 assert.ok(bytes<160000,`mobile image budget exceeded: ${bytes}`);
});
