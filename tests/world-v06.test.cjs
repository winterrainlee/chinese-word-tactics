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
  assert.equal(world.settlement.mapAsset, './images/world/three-streams-map.webp');

  const byId = Object.fromEntries(world.regions.map(region => [region.id, region]));
  assert.equal(byId['gate-town'].name, '關口');
  assert.equal(byId['workshop-town'].name, '工坊谷');
  assert.equal(byId['market-town'].name, '市集');
  assert.equal(byId['council-town'].name, '會議所');
  assert.equal(byId['research-city'].name, '學術塔');
  assert.equal(byId['border-village'].map.kind, 'outside');
  assert.equal(world.regions.slice(0, 3).map(region => region.id).join(','), 'gate-town,workshop-town,market-town');
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
  assert.match(stories['gate-arrival'].beats[0].zh, /三溪鎮/);
});

test('watercolor map runs top to bottom and keeps recommendation text off the markers', () => {
  const context = loadWorld();
  const byId = Object.fromEntries(context.__world.regions.map(region => [region.id, region]));
  assert.ok(byId['research-city'].map.y < byId['workshop-town'].map.y);
  assert.ok(byId['council-town'].map.y < byId['market-town'].map.y);
  assert.ok(byId['gate-town'].map.y < byId['border-village'].map.y);
  assert.match(byId['border-village'].recommendation, /길목/);
  assert.match(byId['council-town'].recommendation, /장터/);
  assert.match(byId['research-city'].lockHint, /장인골/);
});

test('world renderer uses raster art, paper wash, and tappable POI state badges', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('journey-content.js') < html.indexOf('world-v06-content.js'));
  assert.ok(html.indexOf('world-v06-content.js') < html.indexOf('app.js'));

  const mapFile = path.join(root, 'images/world/three-streams-map.webp');
  assert.ok(fs.existsSync(mapFile));
  assert.ok(fs.statSync(mapFile).size > 30_000);

  const runtime = read('src/world-runtime.js');
  assert.match(runtime, /villageMapImage/);
  assert.match(runtime, /villageMapWash/);
  assert.match(runtime, /dataset\.regionId/);
  assert.match(runtime, /regionIconWrap/);
  assert.match(runtime, /card\.disabled = false/);
  assert.match(runtime, /showRegionInfo/);
  assert.doesNotMatch(runtime, /mapRiverWest/);

  const css = read('src/world.css');
  assert.match(css, /worldRegions\.villageMap/);
  assert.match(css, /saturate\(\.82\)/);
  assert.match(css, /villageMapWash/);
  assert.match(css, /regionBadge/);
  assert.match(css, /regionCard\.selected/);
});
