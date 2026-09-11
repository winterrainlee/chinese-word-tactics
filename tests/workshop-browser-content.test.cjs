const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('content.js and workshop-content.js share classic-script lexical state', () => {
  const context = vm.createContext({});
  const base = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf8');
  const workshop = fs.readFileSync(path.join(__dirname, '../src/workshop-content.js'), 'utf8');
  vm.runInContext(base, context);
  vm.runInContext(workshop, context);
  const snapshot = vm.runInContext(`({
    stage: STAGES.find(stage => stage.id === 'workshop-stage-1'),
    changeWord: WORDS['改變'],
    keepWord: WORDS['保持']
  })`, context);
  assert.equal(snapshot.stage.subtitle, '멈춘 물레방아');
  assert.deepEqual(Array.from(snapshot.stage.words), ['改變', '保持']);
  assert.equal(snapshot.stage.workshop.components[0].initial, 0);
  assert.equal(snapshot.stage.workshop.components[0].target, 2);
  assert.equal(snapshot.stage.workshop.components[1].trackUntouched, true);
  assert.match(snapshot.changeWord.k, /바꾸다/);
  assert.match(snapshot.keepWord.rule, /건드리지/);
});