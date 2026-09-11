const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('content.js and g7-content.js share classic-script lexical state', () => {
  const context = vm.createContext({});
  const base = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf8');
  const g7 = fs.readFileSync(path.join(__dirname, '../src/g7-content.js'), 'utf8');
  vm.runInContext(base, context);
  vm.runInContext(g7, context);
  const snapshot = vm.runInContext(`({
    stage: STAGES.find(stage => stage.id === 'gate-stage-7'),
    gateTargets: WORLD.regions.find(region => region.id === 'gate-town').targets
  })`, context);
  assert.equal(snapshot.stage.subtitle, '북쪽으로 가는 행렬');
  assert.deepEqual(Array.from(snapshot.stage.followerChain.chars), ['C','c']);
  assert.ok(Array.from(snapshot.gateTargets).includes('跟隨'));
  assert.ok(Array.from(snapshot.gateTargets).includes('帶領'));
});
