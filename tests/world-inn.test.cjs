const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

class FakeClassList {
  constructor(element) { this.element = element; }
  values() { return new Set(this.element.className.split(/\s+/).filter(Boolean)); }
  contains(name) { return this.values().has(name); }
  toggle(name, force) {
    const values = this.values();
    const add = force === undefined ? !values.has(name) : force;
    if (add) values.add(name);
    else values.delete(name);
    this.element.className = [...values].join(' ');
    return add;
  }
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.className = '';
    this.classList = new FakeClassList(this);
    this.dataset = {};
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this.innerHTML = '';
    this.onclick = null;
  }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  querySelector(selector) {
    if (!selector.startsWith('.')) return null;
    const className = selector.slice(1);
    return this.children.find(child => child.classList.contains(className)) || null;
  }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
  }
}

function loadInn(initialMilestones = []) {
  const map = new FakeElement('section');
  const closeButton = new FakeElement('button');
  const enterButton = new FakeElement('button');
  const state = {
    progress: { completedMilestones: [...initialMilestones] },
    sheet: '',
    closeCount: 0
  };
  const sandbox = {
    GameFlow: {
      progress: () => state.progress,
      enterRegion() { throw new Error('inn marker must not change world progression'); }
    },
    TacticalGame: {
      openSheet: html => { state.sheet = html; },
      closeSheet: () => { state.closeCount++; }
    },
    document: {
      createElement: tagName => new FakeElement(tagName),
      getElementById: id => id === 'worldRegions' ? map : id === 'worldInnClose' ? closeButton : id === 'worldInnEnter' ? enterButton : null
    },
    MutationObserver: class { observe() {} },
    setTimeout: callback => { callback(); return 1; },
    console
  };
  sandbox.window = { addEventListener() {} };
  vm.runInNewContext(read('src/world-inn-runtime.js'), sandbox, { filename: 'world-inn-runtime.js' });
  return { map, closeButton, enterButton, state, WorldInn: sandbox.WorldInn };
}

test('inn marker stays absent before inn-unlocked, including a market-core-only save', () => {
  const before = loadInn();
  assert.equal(before.map.querySelector('.worldInnMarker'), null);

  before.state.progress = { completedMilestones: ['market-core'] };
  before.WorldInn.syncInnMarker();
  assert.equal(before.map.querySelector('.worldInnMarker'), null);
  assert.equal(before.WorldInn.hasRoomKey(before.state.progress), false);
});

test('inn-unlocked alone renders the base inn without a room-key state', () => {
  const { map } = loadInn(['inn-unlocked']);
  const marker = map.querySelector('.worldInnMarker');

  assert.ok(marker);
  assert.equal(marker.dataset.subplaceId, 'inn');
  assert.equal(marker.classList.contains('has-room-key'), false);
  assert.equal(marker.getAttribute('aria-label'), '여관, 客棧. 오늘부터 돌아올 수 있는 생활 거점.');
  assert.match(marker.innerHTML, /subplace-inn\.svg/);
  assert.match(marker.innerHTML, /subplace-room-key\.svg/);
  assert.doesNotMatch(marker.innerHTML, /🔒|🔓|✓/);
});

test('market-core upgrades the existing inn marker and can resync without replacing its click target', () => {
  const { map, state, WorldInn } = loadInn(['inn-unlocked']);
  const marker = map.querySelector('.worldInnMarker');

  state.progress = { completedMilestones: ['inn-unlocked', 'market-core'] };
  WorldInn.syncInnMarker();

  assert.equal(map.querySelector('.worldInnMarker'), marker);
  assert.equal(marker.classList.contains('has-room-key'), true);
  assert.equal(marker.getAttribute('aria-label'), '여관, 客棧. 방 열쇠를 받은 생활 거점.');
  assert.equal(typeof marker.onclick, 'function');

  state.progress = { completedMilestones: ['inn-unlocked'] };
  WorldInn.syncInnMarker();
  assert.equal(marker.classList.contains('has-room-key'), false);
});

test('inn detail sheet offers room entry at M4 and room-key copy at M8', () => {
  const { map, closeButton, enterButton, state, WorldInn } = loadInn(['inn-unlocked']);
  const marker = map.querySelector('.worldInnMarker');

  marker.onclick();
  assert.match(state.sheet, /오늘부터 돌아올 수 있는 곳/);
  assert.match(state.sheet, /빈방 하나를 남겨 두었어/);
  assert.match(state.sheet, /id="worldInnClose">닫기/);
  assert.match(state.sheet, /id="worldInnEnter">들어가기/);
  assert.equal(typeof closeButton.onclick, 'function');
  assert.equal(typeof enterButton.onclick, 'function');
  assert.doesNotMatch(state.sheet, /방 열쇠가 생긴|✓|잠금 해제/);

  state.progress = { completedMilestones: ['inn-unlocked', 'market-core'] };
  WorldInn.syncInnMarker();
  marker.onclick();
  assert.match(state.sheet, /방 열쇠가 생긴 돌아올 곳/);
  assert.match(state.sheet, /남는 방 하나를 맡겨 두었어/);
  assert.match(state.sheet, /자기 물건을 둘 수 있는 자리/);
  assert.match(state.sheet, /들어가기/);
  assert.doesNotMatch(state.sheet, /✓|잠금 해제/);

  closeButton.onclick();
  assert.equal(state.closeCount, 1);
});

test('inn presentation adds no save key and preserves the existing mobile marker coordinates', () => {
  const runtime = read('src/world-inn-runtime.js');
  const css = read('src/world-inn.css');
  const html = read('index.html');

  assert.match(runtime, /completedMilestones/);
  assert.match(runtime, /ROOM_KEY_MILESTONE = 'market-core'/);
  assert.doesNotMatch(runtime, /localStorage|setItem|removeItem/);
  assert.match(css, /\.worldInnMarker\{[^}]*left:77%;top:69%/);
  assert.match(css, /\.worldInnMarker\{[^}]*width:70px;min-height:58px/);
  assert.match(css, /worldInnBuilding\{[^}]*width:32px;height:32px/);
  assert.match(css, /worldInnKeyCharm\{[^}]*width:15px;height:18px/);
  assert.match(css, /@media\(max-width:360px\)\{\.worldInnMarker\{width:64px\}/);
  assert.match(html, /world-inn\.css\?v=20260913-innroom2/);
  assert.match(html, /world-inn-runtime\.js\?v=20260913-innroom4/);
});

test('inn room fetch is deferred until the player interacts with the inn', () => {
  const runtime = read('src/world-inn-runtime.js');
  assert.match(runtime, /function preloadRoomBackground\(\)/);
  assert.match(runtime, /fetch\(url, \{ cache: 'force-cache' \}\)/);
  assert.doesNotMatch(runtime, /syncMarkerState\(existing, value\);\s*preloadRoomBackground\(\);/);
  assert.match(runtime, /function openInnSheet\(\) \{\s*preloadRoomBackground\(\);/);
  assert.match(runtime, /function openRoom\(\)[\s\S]*loadRoomBackground\(\);/);
  assert.match(runtime, /const ROOM_HOTSPOTS_SVG = `<svg/);
  assert.doesNotMatch(runtime, /fetch\('\.\/src\/inn-room-hotspots\.svg/);
  for (const word of ['床', '桌子', '椅子', '箱子']) assert.match(runtime, new RegExp(`data-word="${word}"`));
  assert.match(runtime, /data-action="leave-room"/);
});

test('room background chunks reconstruct one valid WebP payload', () => {
  const dir = path.join(root, 'images/inn/room-v0.2');
  const files = fs.readdirSync(dir).filter(name => /^\d\d\.txt$/.test(name)).sort();
  assert.deepEqual(files, ['00.txt', '01.txt', '02.txt']);
  const encoded = files.map(name => fs.readFileSync(path.join(dir, name), 'utf8')).join('').replace(/\s+/g, '');
  const bytes = Buffer.from(encoded, 'base64');
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length);
  assert.ok(bytes.length > 20000);
});

test('room hotspot SVG source keeps the four starter objects as the editable reference', () => {
  const svg = read('src/inn-room-hotspots.svg');
  for (const word of ['床', '桌子', '椅子', '箱子']) assert.match(svg, new RegExp(`data-word="${word}"`));
  assert.match(svg, /data-action="leave-room"/);
  assert.doesNotMatch(svg, /<script|<foreignObject|javascript:/i);
});

test('new inn and key SVGs are small self-contained world assets', () => {
  for (const file of ['icons/world/regions/subplace-inn.svg', 'icons/world/regions/subplace-room-key.svg']) {
    const svg = read(file);
    assert.match(svg, /^<svg[^>]+viewBox="0 0 /);
    assert.doesNotMatch(svg, /<script|<foreignObject|<image|<text|javascript:|url\(/i);
  }
  const inn = read('icons/world/regions/subplace-inn.svg');
  const key = read('icons/world/regions/subplace-room-key.svg');
  assert.match(inn, /stroke="#352e27" stroke-width="1\.4"/);
  assert.match(inn, /fill="#d7c49a"/);
  assert.match(inn, /fill="#b9784d"/);
  assert.match(key, /fill="#d7aa45"/);
  assert.match(key, /fill="#a97a4a"/);
});
