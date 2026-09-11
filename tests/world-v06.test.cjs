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

function readMapBuffer(config) {
  const parts = Array.from({ length: config.count }, (_, index) => {
    const file = `${config.base.replace('./', '')}/${String(index).padStart(2, '0')}.txt`;
    return read(file).trim();
  });
  return Buffer.from(parts.join(''), 'base64');
}

test('v0.6 world keeps stable ids while presenting one Three Streams settlement', () => {
  const context = loadWorld();
  const world = context.__world;
  assert.equal(world.origin, '小村');
  assert.equal(world.originNameKo, '작은 마을');
  assert.equal(world.settlement.name, '三溪鎮');
  assert.equal(world.settlement.nameKo, '물길마을');
  assert.equal(world.settlement.mapAssetChunks.base, './images/world/three-streams-map');
  assert.equal(world.settlement.mapAssetChunks.count, 8);
  assert.equal(world.settlement.mapAssetChunks.type, 'image/webp');

  const byId = Object.fromEntries(world.regions.map(region => [region.id, region]));
  assert.equal(byId['gate-town'].name, '關口');
  assert.equal(byId['workshop-town'].name, '工坊谷');
  assert.equal(byId['market-town'].name, '市集');
  assert.equal(byId['council-town'].name, '會議所');
  assert.equal(byId['research-city'].name, '學術塔');
  assert.equal(byId['border-village'].map.kind, 'outside');
  assert.equal(world.regions.slice(0, 3).map(region => region.id).join(','), 'gate-town,workshop-town,market-town');
});

test('merchant introduces Three Streams and leaves the boy near the market to choose what comes next', () => {
  const context = loadWorld();
  const stories = context.__journey.STORIES;
  assert.equal(stories['prologue-departure'].placeZh, '小村');
  const merchant = stories['chapter1-roadside-merchant'];
  const merchantText = merchant.beats.map(beat => beat.zh).join('\n');
  assert.match(merchantText, /你從哪裡來/);
  assert.match(merchantText, /一個小村/);
  assert.match(merchantText, /三溪鎮/);
  assert.match(merchantText, /三條路都通進三溪鎮/);
  assert.match(merchantText, /我要去市集交貨/);
  assert.match(merchantText, /走過橋/);
  assert.match(merchantText, /我……還沒想好/);
  assert.match(merchantText, /慢慢看看吧/);
  assert.equal(merchant.beats.at(-1).speaker, 'boy');
  assert.equal(merchant.beats.at(-1).zh, '接下來……我該做什麼呢？');
  assert.equal(merchant.beats.at(-1).ko, '이제……뭘 하지?');
  assert.equal(stories['gate-arrival'].placeZh, '關口');
  assert.match(stories['gate-arrival'].beats[0].zh, /三溪鎮/);
});

test('watercolor map runs top to bottom and aligns markers to illustrated landmarks', () => {
  const context = loadWorld();
  const byId = Object.fromEntries(context.__world.regions.map(region => [region.id, region]));
  assert.deepEqual([byId['research-city'].map.x, byId['research-city'].map.y], [26, 46]);
  assert.deepEqual([byId['workshop-town'].map.x, byId['workshop-town'].map.y], [18, 58]);
  assert.deepEqual([byId['council-town'].map.x, byId['council-town'].map.y], [79, 48]);
  assert.deepEqual([byId['market-town'].map.x, byId['market-town'].map.y], [65, 60]);
  assert.deepEqual([byId['gate-town'].map.x, byId['gate-town'].map.y], [50, 80]);
  assert.deepEqual([byId['border-village'].map.x, byId['border-village'].map.y], [50, 91]);
  assert.ok(byId['research-city'].map.y < byId['workshop-town'].map.y);
  assert.ok(byId['council-town'].map.y < byId['market-town'].map.y);
  assert.ok(byId['gate-town'].map.y < byId['border-village'].map.y);
  assert.match(byId['border-village'].recommendation, /길목/);
  assert.match(byId['council-town'].recommendation, /장터/);
  assert.match(byId['research-city'].lockHint, /장인골/);
});

test('chunked map data reconstructs a real WebP and preserves useful detail', () => {
  const context = loadWorld();
  const buffer = readMapBuffer(context.__world.settlement.mapAssetChunks);
  assert.ok(buffer.length > 30_000);
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP');
});

test('world renderer uses raster art, paper wash, and tappable POI state badges', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('journey-content.js') < html.indexOf('world-v06-content.js'));
  assert.ok(html.indexOf('world-v06-content.js') < html.indexOf('app.js'));
  assert.ok(html.indexOf('view.css') < html.indexOf('world-map-reset.css'));
  assert.match(html, /world\.css\?v=20260911-townarrival1/);
  assert.match(html, /world-map-reset\.css\?v=20260911-townarrival1/);
  assert.match(html, /world-v06-content\.js\?v=20260911-townarrival1/);
  assert.match(html, /world-runtime\.js\?v=20260911-townarrival1/);
  assert.match(html, /journey\.css\?v=20260911-journeytree1/);
  assert.match(html, /journey-runtime\.js\?v=20260911-journeytree1/);
  assert.match(html, /name="cwt-build" content="2026-09-11-journeytree1"/);

  const runtime = read('src/world-runtime.js');
  assert.match(runtime, /loadChunkedMap/);
  assert.match(runtime, /new Blob/);
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

  const reset = read('src/world-map-reset.css');
  assert.match(reset, /display:block!important/);
  assert.match(reset, /grid-template-columns:none!important/);
  assert.match(reset, /grid-column:auto!important/);
  assert.match(reset, /grid-row:auto!important/);
  assert.match(reset, /left:var\(--map-x\)!important/);
  assert.match(reset, /top:var\(--map-y\)!important/);
  assert.match(reset, /regionCard::before/);
});

test('journey view uses collapsible chapters, collapsible regions, and visible hierarchy indentation', () => {
  const runtime = read('src/journey-runtime.js');
  assert.match(runtime, /collapsedChapters/);
  assert.match(runtime, /collapsedRegions/);
  assert.match(runtime, /make\('details', 'journeyChapter'\)/);
  assert.match(runtime, /make\('summary', 'journeyChapterSummary'\)/);
  assert.match(runtime, /make\('details', 'journeyRegion'\)/);
  assert.match(runtime, /make\('summary', 'journeyRegionSummary'\)/);
  assert.match(runtime, /journeyChapterBody/);
  assert.match(runtime, /journeyRegionBody/);

  const css = read('src/journey.css');
  assert.match(css, /journeyChapterBody\{[^}]*padding:[^}]*14px[^}]*border-left:2px solid/);
  assert.match(css, /journeyRegionBody\{[^}]*padding:[^}]*14px[^}]*border-left:1px solid/);
  assert.match(css, /journeyChapter\[open\]>\.journeyChapterSummary::before/);
  assert.match(css, /journeyRegion\[open\]>\.journeyRegionSummary::before/);
});
