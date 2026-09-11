const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadWorld() {
  const context = vm.createContext({ console });
  vm.runInContext(read('src/content.js'), context, { filename: 'content.js' });
  vm.runInContext(read('src/journey-content.js'), context, { filename: 'journey-content.js' });
  vm.runInContext(read('src/world-v06-content.js'), context, { filename: 'world-v06-content.js' });
  vm.runInContext('globalThis.__world = WORLD; globalThis.__journey = JourneyContent;', context);
  return context;
}

test('v0.6 world keeps stable ids while presenting one Three Streams settlement', () => {
  const context = loadWorld();
  const world = context.__world;
  assert.equal(world.origin, '小村');
  assert.equal(world.originNameKo, '작은 마을');
  assert.equal(world.settlement.name, '三溪鎮');
  assert.equal(world.settlement.nameKo, '물길마을');

  const byId = Object.fromEntries(world.regions.map(region => [region.id, region]));
  assert.equal(byId['gate-town'].name, '關口');
  assert.equal(byId['workshop-town'].name, '工坊谷');
  assert.equal(byId['market-town'].name, '市集');
  assert.equal(byId['council-town'].name, '會議所');
  assert.equal(byId['research-city'].name, '學術塔');
  assert.equal(byId['border-village'].map.kind, 'outside');
  assert.deepEqual(world.regions.slice(0, 3).map(region => region.id), ['gate-town', 'workshop-town', 'market-town']);
});

test('merchant introduces the small village and Three Streams before the three routes', () => {
  const context = loadWorld();
  const stories = context.__journey.STORIES;
  assert.equal(stories['prologue-departure'].placeZh, '小村');
  const merchantText = stories['chapter1-roadside-merchant'].beats.map(beat => beat.zh).join('\n');
  assert.match(merchantText, /你從哪裡來/);
  assert.match(merchantText, /一個小村/);
  assert.match(merchantText, /三溪鎮/);
  assert.match(merchantText, /三條路都通進三溪鎮/);
  assert.equal(stories['gate-arrival'].placeZh, '關口');
  assert.match(stories['gate-arrival'].beats[0].zh, /三溪鎮北邊的關口/);
});

test('world overlay loads before runtime and map renderer exposes geographic nodes', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('journey-content.js') < html.indexOf('world-v06-content.js'));
  assert.ok(html.indexOf('world-v06-content.js') < html.indexOf('app.js'));

  const runtime = read('src/world-runtime.js');
  assert.match(runtime, /villageMapLines/);
  assert.match(runtime, /mapRiverWest/);
  assert.match(runtime, /data-region-id/);
  assert.match(runtime, /작은 마을/);

  const css = read('src/world.css');
  assert.match(css, /worldRegions\.villageMap/);
  assert.match(css, /--map-x/);
  assert.match(css, /regionCard\[data-map-kind="outside"\]/);
});
