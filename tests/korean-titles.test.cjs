const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = vm.createContext({});
vm.runInContext(read('src/content.js'), context);
vm.runInContext(read('src/g7-content.js'), context);
vm.runInContext(read('src/journey-content.js'), context);
vm.runInContext(read('src/g7-journey-content.js'), context);

const value = expression => JSON.parse(vm.runInContext(`JSON.stringify(${expression})`, context));

test('tutorial and gate stages use the approved Korean scene titles', () => {
  assert.deepEqual(value('Object.fromEntries(STAGES.map(stage => [stage.id, stage.subtitle]))'), {
    'stage-0': '마을 밖으로',
    'stage-1': '낡은 비석',
    'stage-2': '늑대와의 거리',
    'stage-3': '폐허를 지나서',
    'stage-4': '가시 사이의 길',
    'stage-5': '숲을 빠져나오다',
    'gate-stage-1': '관문 안의 길표지',
    'gate-stage-2': '종소리가 닿는 곳',
    'gate-stage-3': '두 갈래 길',
    'gate-stage-4': '수레가 멈춘 까닭',
    'gate-stage-5': '문이 열릴 자리',
    'gate-stage-6': '뒤따르는 수레',
    'gate-stage-7': '북쪽으로 가는 행렬'
  });
});

test('inter-stage stories use the approved Korean titles', () => {
  const titles = value('Object.fromEntries(Object.entries(JourneyContent.STORIES).map(([id, story]) => [id, story.titleKo]))');
  assert.equal(titles['gate-after-entry'], '관문에 울린 종소리');
  assert.equal(titles['gate-bell-task'], '종소리는 어디까지 들릴까');
  assert.equal(titles['gate-route-task'], '초소를 거쳐 북쪽으로');
  assert.equal(titles['gate-after-obstacle'], '다시 길을 나선 수레');
  assert.equal(titles['gate-after-leading'], '길잡이가 된 소년');
  assert.equal(titles['gate-after-convoy'], '북쪽 길에 닿은 행렬');
});

test('tactical and journey views present Korean stage titles before Chinese labels', () => {
  const app = read('src/app.js');
  const journey = read('src/journey-runtime.js');
  assert.match(app, /stageTitle'\)\.textContent=st\.subtitle/);
  assert.match(journey, /node\.type === 'story' \? content\.titleKo : content\.subtitle/);
  assert.match(journey, /journeyNodeTerms[\s\S]*content\.title\.replaceAll/);
  assert.match(read('src/journey.css'), /\.journeyNodeTerms\{/);
});
