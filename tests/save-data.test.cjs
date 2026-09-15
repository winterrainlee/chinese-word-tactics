const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src/save-data.js'), 'utf8');
const context = { console, Date, Object, JSON, Error };
context.globalThis = context;
vm.runInNewContext(source, context);
const SaveData = context.SaveData;

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
    dump: () => Object.fromEntries(map)
  };
}

const K = SaveData.STORAGE_KEYS;
const validSeed = () => ({
  [K.journey]: JSON.stringify({
    seenStories: ['prologue-departure'], completedStages: ['stage-0'], completedMilestones: [],
    acknowledgedNodes: ['story:prologue-departure', 'stage:stage-0'], stageOutcomes: {},
    lastLocation: { view: 'tactical', nodeId: 'stage:stage-0', beat: 0 }
  }),
  [K.tactical]: JSON.stringify({ stageIndex: 0, state: { hero: [1, 1] }, history: [], selected: true, inspect: false, completed: ['stage-0'] }),
  [K.world]: JSON.stringify({ visited: [], completedMilestones: [] }),
  [K.pendingCompletion]: null,
  [K.lexicon]: JSON.stringify({ discovered: ['進入'], visitedStages: ['stage-0'], lastChapterId: 'chapter-1', lastRegionId: 'tutorial' })
});

test('backup exports only the five game-owned storage keys in a versioned envelope', () => {
  const store = storage(validSeed());
  const backup = SaveData.createBackup(store, { createdAt: '2026-09-15T12:00:00.000Z', build: 'test-build' });
  assert.equal(backup.app, 'chinese-word-tactics');
  assert.equal(backup.formatVersion, 1);
  assert.deepEqual(Object.keys(backup.storage).sort(), SaveData.KEY_LIST.slice().sort());
  assert.equal(backup.storage[K.pendingCompletion], null);
  assert.equal(backup.build, 'test-build');
});

test('valid backup produces a safe summary before restore', () => {
  const backup = SaveData.createBackup(storage(validSeed()), { createdAt: '2026-09-15T12:00:00.000Z' });
  const checked = SaveData.validateBackup(backup);
  assert.equal(checked.ok, true);
  assert.equal(checked.summary.completedStages, 1);
  assert.equal(checked.summary.discoveredWords, 1);
  assert.equal(checked.summary.chapter1Complete, false);
});

test('restore replaces only known game keys and leaves unrelated same-origin data alone', () => {
  const backup = SaveData.createBackup(storage(validSeed()), { createdAt: '2026-09-15T12:00:00.000Z' });
  const target = storage({ other-project: 'keep-me', [K.journey]: JSON.stringify({ broken: true }) });
  SaveData.restoreBackup(target, backup);
  const dump = target.dump();
  assert.equal(dump['other-project'], 'keep-me');
  assert.equal(JSON.parse(dump[K.journey]).completedStages[0], 'stage-0');
  assert.equal(dump[K.pendingCompletion], undefined);
});

test('malformed or foreign files are rejected before touching storage', () => {
  const foreign = { app: 'other-game', formatVersion: 1, createdAt: '2026-09-15T12:00:00.000Z', storage: {} };
  assert.equal(SaveData.validateBackup(foreign).ok, false);
  const backup = JSON.parse(JSON.stringify(SaveData.createBackup(storage(validSeed()), { createdAt: '2026-09-15T12:00:00.000Z' })));
  backup.storage['other-project'] = { surprise: true };
  assert.equal(SaveData.validateBackup(backup).ok, false);
  delete backup.storage['other-project'];
  backup.storage[K.lexicon].discovered = 'not-an-array';
  assert.equal(SaveData.validateBackup(backup).ok, false);
});
