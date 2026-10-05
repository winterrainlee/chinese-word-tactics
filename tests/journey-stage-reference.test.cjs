const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

globalThis.AcademicTowerContent = { bundle: { rooms: [
  { id: 'academic-tower-turn-01-que', number: '01' },
  { id: 'academic-tower-turn-02-raner', number: '02' },
  { id: 'academic-tower-turn-03-expectation', number: '03' },
  { id: 'academic-tower-turn-04-faner', number: '04' },
  { id: 'academic-tower-turn-05-synthesis', number: '05' },
  { id: 'academic-tower-turn-03a-ran-family', number: '03A', optional: true }
] } };
require('../src/stage-reference.js');

const references = globalThis.JourneyStageReference;
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('every current stage has a stable explicit reference inside its own group', () => {
  assert.equal(references.all().length, 42);
  assert.deepEqual(
    references.all().filter(item => item.groupId === 'tutorial').map(item => [item.stageId, item.number]),
    Array.from({ length: 6 }, (_, index) => [`stage-${index}`, String(index + 1).padStart(2, '0')])
  );
  assert.equal(references.get('gate-stage-1').number, '01');
  assert.equal(references.get('market-stage-8').number, '08');
  assert.equal(references.get('first-free-quest-forest').number, '01');
  assert.equal(references.get('north-forest-stage-8').number, '08');
});

test('Academic Tower references reuse room numbers and keep 03A optional', () => {
  const main = references.all().filter(item => item.groupId === 'academic-tower-turning-directions' && !item.optional);
  assert.deepEqual(main.map(item => item.number), ['01', '02', '03', '04', '05']);
  assert.equal(main.every(item => item.groupTotal === 5), true);
  assert.deepEqual(references.get('academic-tower-turn-03a-ran-family'), {
    stageId: 'academic-tower-turn-03a-ran-family',
    groupId: 'academic-tower-turning-directions',
    groupLabel: '방향이 바뀌는 문장',
    number: '03A',
    groupTotal: 5,
    optional: true
  });
});

test('reference numbers are data, not DOM order, CSS counters, or parsed titles', () => {
  const source = read('src/stage-reference.js');
  const runtime = read('src/journey-runtime.js');
  assert.doesNotMatch(source, /querySelector|counter\(|parseInt|match\(|split\(/);
  assert.doesNotMatch(runtime, /counter\(|parseInt|content\.title.*match|stageIndex/);
  assert.match(runtime, /node\.stageReference/);
  assert.match(runtime, /reference\.groupLabel/);
});
