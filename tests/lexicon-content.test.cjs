const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const load = (context, file) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);

test('lexicon groups cover every first-chapter stage word without inventing vocabulary', () => {
  const context = vm.createContext({});
  [
    'src/content.js',
    'src/workshop-content.js',
    'src/workshop-late-content.js',
    'src/g7-content.js',
    'src/market-content.js',
    'src/market-late-content.js',
    'src/journey-content.js',
    'src/g7-journey-content.js',
    'src/workshop-journey-content.js',
    'src/workshop-late-journey-content.js',
    'src/market-journey-content.js',
    'src/market-late-journey-content.js',
    'src/continuous-region-flow.js',
    'src/chapter1-finale-content.js',
    'src/first-free-quest-content.js',
    'src/north-forest-content.js',
    'src/academic-tower-content.js',
    'src/lexicon-content.js'
  ].forEach(file => load(context, file));

  const snapshot = vm.runInContext(`(() => {
    const regionIds = ['forest-road','gate-town','workshop-town','market-town','north-forest','academic-tower'];
    const stageWords = Object.fromEntries(regionIds.map(regionId => {
      const words = [];
      STAGES.filter(stage => LexiconContent.stageRegionId(stage.id) === regionId).forEach(stage => {
        stage.words.forEach(word => { if (!words.includes(word)) words.push(word); });
      });
      return [regionId, words];
    }));
    const groupWords = Object.fromEntries(regionIds.map(regionId => {
      const words = [];
      LexiconContent.GROUPS.filter(group => group.regionId === regionId).forEach(group => {
        group.words.forEach(word => { if (!words.includes(word)) words.push(word); });
      });
      return [regionId, words];
    }));
    return {
      wordKeys: Object.keys(WORDS),
      stageWords,
      groupWords,
      groupIds: LexiconContent.GROUPS.map(group => group.id),
      related: LexiconContent.GROUPS.flatMap(group => group.related || [])
    };
  })()`, context);

  assert.deepEqual(Object.fromEntries(Object.entries(snapshot.stageWords).map(([key, words]) => [key, words.length])), {
    'forest-road': 5,
    'gate-town': 14,
    'workshop-town': 14,
    'market-town': 15,
    'north-forest': 21,
    'academic-tower': 2
  });

  assert.equal(new Set(snapshot.groupIds).size, snapshot.groupIds.length, 'group ids must be unique');

  for (const [regionId, words] of Object.entries(snapshot.stageWords)) {
    assert.deepEqual(new Set(snapshot.groupWords[regionId]), new Set(words), `${regionId} groups must cover its stage vocabulary`);
  }

  for (const word of [...Object.values(snapshot.groupWords).flat(), ...snapshot.related]) {
    assert.ok(snapshot.wordKeys.includes(word), `lexicon references missing WORDS entry: ${word}`);
  }
});
