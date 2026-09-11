const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('workshop late content extends classic-script vocabulary and stages through W7', () => {
  const context = vm.createContext({});
  vm.runInContext(read('src/content.js'), context, { filename: 'content.js' });
  vm.runInContext(read('src/workshop-content.js'), context, { filename: 'workshop-content.js' });
  vm.runInContext(read('src/workshop-late-content.js'), context, { filename: 'workshop-late-content.js' });
  const snapshot = vm.runInContext(`({
    stages: STAGES.filter(stage => stage.id.startsWith('workshop-stage-')).map(stage => ({
      id: stage.id, subtitle: stage.subtitle, words: stage.words, scene: stage.workshop && stage.workshop.scene, milestone: stage.milestone || null
    })),
    condition: WORDS['條件'], match: WORDS['符合'], appear: WORDS['出現'], disappear: WORDS['消失'],
    damaged: WORDS['損壞'], repair: WORDS['修復'], recover: WORDS['恢復'],
    w7: STAGES.find(stage => stage.id === 'workshop-stage-7')
  })`, context);

  assert.equal(snapshot.stages.length, 7);
  assert.deepEqual(Array.from(snapshot.stages.slice(3).map(stage => stage.id)), [
    'workshop-stage-4', 'workshop-stage-5', 'workshop-stage-6', 'workshop-stage-7'
  ]);
  assert.equal(snapshot.stages[3].scene, 'conditions');
  assert.equal(snapshot.stages[4].scene, 'blue-flame');
  assert.equal(snapshot.stages[5].scene, 'gears');
  assert.equal(snapshot.stages[6].scene, 'regulator');
  assert.equal(snapshot.stages[6].milestone, 'workshop-core');
  assert.deepEqual(Array.from(snapshot.w7.words), ['保持', '調整', '連接', '分開', '修復']);
  assert.equal(snapshot.w7.words.length, 5);

  assert.match(snapshot.condition.k, /조건/);
  assert.match(snapshot.match.k, /부합/);
  assert.match(snapshot.appear.rule, /결과/);
  assert.match(snapshot.disappear.rule, /직접 누르는 행동이 아니/);
  assert.match(snapshot.damaged.k, /손상/);
  assert.match(snapshot.repair.rule, /고치는 행동/);
  assert.match(snapshot.recover.rule, /결과/);
});

test('W4-W7 preserve the intended direct-versus-derived language roles', () => {
  const context = vm.createContext({});
  vm.runInContext(read('src/content.js'), context);
  vm.runInContext(read('src/workshop-content.js'), context);
  vm.runInContext(read('src/workshop-late-content.js'), context);
  const data = vm.runInContext(`({
    w4: STAGES.find(stage => stage.id === 'workshop-stage-4').workshop,
    w5: STAGES.find(stage => stage.id === 'workshop-stage-5').workshop,
    w6: STAGES.find(stage => stage.id === 'workshop-stage-6').workshop,
    w7: STAGES.find(stage => stage.id === 'workshop-stage-7').workshop
  })`, context);

  assert.ok(Array.from(data.w4.derived).some(item => item.id === 'benchUnlocked'));
  assert.ok(Array.from(data.w5.derived).some(item => item.id === 'blueFlameVisible'));
  assert.ok(Array.from(data.w5.derived).some(item => item.id === 'blackSmokeGone'));
  assert.ok(Array.from(data.w6.derived).some(item => item.id === 'machineRecovered'));
  assert.ok(Array.from(data.w7.derived).some(item => item.id === 'systemRecovered'));

  const w5Actions = Array.from(data.w5.components).map(item => item.kind);
  assert.deepEqual(w5Actions, ['level', 'level']);
  assert.deepEqual(Array.from(data.w6.repairTargets), ['gearB']);
  assert.equal(Array.from(data.w7.components).length, 5);
});