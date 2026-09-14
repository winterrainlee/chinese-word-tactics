const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src/word-context.js'), 'utf8');

function resolver(dictionary) {
  const sandbox = { WORDS: dictionary };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'src/word-context.js' });
  return sandbox.WordContext.resolve;
}

test('stage wordContext overrides only example and stage rule', () => {
  const base = { p: 'shared-p', k: 'shared-k', ex: 'shared-ex', rule: 'shared-rule' };
  const resolve = resolver({ 範圍: base });
  const detail = resolve({ wordContext: { 範圍: { p: 'wrong-p', k: 'wrong-k', ex: 'stage-ex', rule: 'stage-rule' } } }, '範圍');

  assert.deepEqual({ ...detail }, { p: 'shared-p', k: 'shared-k', ex: 'stage-ex', rule: 'stage-rule' });
});

test('partial wordContext falls back per field and an existing stage without context is unchanged', () => {
  const base = { p: 'shared-p', k: 'shared-k', ex: 'shared-ex', rule: 'shared-rule' };
  const resolve = resolver({ 範圍: base });

  assert.deepEqual({ ...resolve({ wordContext: { 範圍: { ex: 'stage-ex' } } }, '範圍') }, {
    p: 'shared-p', k: 'shared-k', ex: 'stage-ex', rule: 'shared-rule'
  });
  assert.deepEqual({ ...resolve({ id: 'gate-stage-2' }, '範圍') }, base);
});
