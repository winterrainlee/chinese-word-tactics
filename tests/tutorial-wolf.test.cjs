const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');

function loadStages(){
  const file=path.join(__dirname,'..','src','content.js');
  const code=fs.readFileSync(file,'utf8')+'\n;globalThis.__stages=STAGES;';
  const context={};
  vm.createContext(context);
  vm.runInContext(code,context);
  return context.__stages;
}

test('tutorial 2 wolf patrol actually changes position every turn',()=>{
  const stage=loadStages().find(x=>x.id==='stage-2');
  assert.ok(stage?.wolf,'stage-2 should define a wolf patrol');
  const cycle=stage.wolf.cycle;
  assert.ok(cycle.length>=2,'stage-2 wolf patrol needs at least two positions');
  assert.ok(new Set(cycle.map(p=>p.join(','))).size>=2,'stage-2 wolf must not stay on one tile');

  for(let i=0;i<cycle.length;i++){
    const a=cycle[i],b=cycle[(i+1)%cycle.length];
    const step=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
    assert.equal(step,1,'each patrol phase should move the wolf by one tile');
  }
});
