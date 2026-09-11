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
    w1: STAGES.find(stage => stage.id === 'workshop-stage-1'),
    w2: STAGES.find(stage => stage.id === 'workshop-stage-2'),
    w3: STAGES.find(stage => stage.id === 'workshop-stage-3'),
    changeWord: WORDS['改變'],
    keepWord: WORDS['保持'],
    increaseWord: WORDS['增加'],
    decreaseWord: WORDS['減少'],
    adjustWord: WORDS['調整'],
    connectWord: WORDS['連接'],
    separateWord: WORDS['分開']
  })`, context);

  assert.equal(snapshot.w1.subtitle, '멈춘 물레방아');
  assert.deepEqual(Array.from(snapshot.w1.words), ['改變', '保持']);
  assert.equal(snapshot.w1.workshop.components[0].initial, 0);
  assert.equal(snapshot.w1.workshop.components[0].target, 2);
  assert.equal(snapshot.w1.workshop.components[1].trackUntouched, true);
  assert.match(snapshot.changeWord.k, /바꾸다/);
  assert.match(snapshot.keepWord.rule, /그대로/);

  assert.equal(snapshot.w2.subtitle, '불씨 맞추기');
  assert.deepEqual(Array.from(snapshot.w2.words), ['增加', '減少', '調整']);
  assert.equal(snapshot.w2.workshop.scene, 'forge');
  assert.equal(snapshot.w2.workshop.components.find(item => item.id === 'fire').initial, 2);
  assert.equal(snapshot.w2.workshop.components.find(item => item.id === 'fire').target, 1);
  assert.equal(snapshot.w2.workshop.components.find(item => item.id === 'air').initial, 0);
  assert.equal(snapshot.w2.workshop.components.find(item => item.id === 'air').target, 1);
  assert.match(snapshot.increaseWord.k, /늘리/);
  assert.match(snapshot.decreaseWord.k, /줄이/);
  assert.match(snapshot.adjustWord.rule, /함께 맞췄을 때/);

  assert.equal(snapshot.w3.subtitle, '함께 도는 도르래');
  assert.deepEqual(Array.from(snapshot.w3.words), ['連接', '分開', '保持']);
  assert.equal(snapshot.w3.workshop.scene, 'couplings');
  const w3ById = Object.fromEntries(Array.from(snapshot.w3.workshop.components, item => [item.id, item]));
  assert.equal(w3ById.grinderLink.initial, false);
  assert.equal(w3ById.grinderLink.target, true);
  assert.equal(w3ById.workLink.initial, true);
  assert.equal(w3ById.workLink.trackUntouched, true);
  assert.equal(w3ById.hoistLink.initial, true);
  assert.equal(w3ById.hoistLink.target, false);
  assert.match(snapshot.connectWord.rule, /함께 돌아/);
  assert.match(snapshot.separateWord.rule, /더 이상 함께 돌지 않아/);
});