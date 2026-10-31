const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function harness(initial = {}) {
  let progress = initial;
  const heading = {
    textContent: '',
    insertAdjacentElement() {}
  };
  const kicker = { textContent: '' };
  const zh = { textContent: '' };
  const compass = { textContent: '' };
  const origin = { setAttribute() {}, classList: { add() {} } };
  const selectors = {
    '.worldHeading .stagekicker': kicker,
    '.worldHeading h1': heading,
    '.worldHeadingZh': zh,
    '.worldCompass': compass,
    '.worldOrigin': origin
  };
  const world = {
    hidden: true,
    dataset: {},
    querySelector: selector => selectors[selector] || null
  };
  const observers = [];
  class MutationObserver {
    constructor(callback) { this.callback = callback; }
    observe(target, options) { observers.push({ target, options, callback: this.callback }); }
  }
  const context = vm.createContext({
    WORLD: { regions: [] },
    GameFlow: { progress: () => progress },
    document: {
      getElementById: id => id === 'worldView' ? world : null,
      addEventListener() {},
      createElement() { return { className: '', textContent: '' }; }
    },
    window: { addEventListener() {} },
    MutationObserver,
    console
  });
  vm.runInContext(read('src/chapter2-rain-runtime.js'), context, { filename: 'chapter2-rain-runtime.js' });
  vm.runInContext(read('src/world-runtime.js'), context, { filename: 'world-runtime.js' });
  return { context, world, kicker, heading, zh, observers, setProgress(v) { progress = v; } };
}

test('world header follows the one Chapter 2 rain event without changing the settlement name', () => {
  const t = harness({});
  assert.equal(t.kicker.textContent, '1장 · 세 갈래 길');
  assert.equal(t.heading.textContent, '물길마을');
  assert.equal(t.zh.textContent, '三溪鎮');

  const cases = [
    [{ completedMilestones: [] }, '1장 · 세 갈래 길'],
    [{ completedMilestones: ['chapter1-complete'] }, '2장 · 새로운 이야기'],
    [{ completedMilestones: ['chapter1-complete', 'chapter2-rain-passed'] }, '2장 · 비가 그친 뒤'],
    [{ completedMilestones: ['chapter1-complete'], seenStories: ['chapter2-rain-opening'] }, '2장 · 비가 그친 뒤'],
    [{ completedMilestones: ['chapter1-complete'], seenStories: ['academic-tower-er-intro'] }, '2장 · 비가 그친 뒤'],
    [{ completedMilestones: ['chapter1-complete'], completedStages: ['academic-tower-turn-04a-er-family'] }, '2장 · 비가 그친 뒤'],
    [{ completedMilestones: ['chapter1-complete'], seenStories: ['first-free-quest-accepted'] }, '2장 · 비가 그친 뒤'],
    [{ completedMilestones: ['chapter1-complete'], seenStories: ['chapter1-room-finale'] }, '2장 · 새로운 이야기']
  ];
  for (const [state, expected] of cases) {
    t.setProgress(state);
    assert.equal(t.context.WorldChapterHeader.labelFor(), expected);
    t.context.WorldChapterHeader.refresh();
    assert.equal(t.kicker.textContent, expected);
    assert.equal(t.world.dataset.worldChapterLabel, expected);
    assert.equal(t.heading.textContent, '물길마을');
  }
});

test('returning to the map refreshes chapter marker even when map nodes are unchanged', () => {
  const t = harness({ completedMilestones: ['chapter1-complete'] });
  assert.equal(t.kicker.textContent, '2장 · 새로운 이야기');
  const observer = t.observers.find(item => item.target === t.world);
  assert.ok(observer, 'world view hidden state must be observed');
  assert.deepEqual(Array.from(observer.options.attributeFilter), ['hidden']);

  t.setProgress({ completedMilestones: ['chapter1-complete', 'chapter2-rain-passed'] });
  t.world.hidden = false;
  observer.callback([{ type: 'attributes', attributeName: 'hidden', target: t.world }]);
  assert.equal(t.kicker.textContent, '2장 · 비가 그친 뒤');

  t.setProgress({ completedMilestones: ['chapter1-complete'], seenStories: ['academic-tower-er-result'] });
  observer.callback([{ type: 'attributes', attributeName: 'hidden', target: t.world }]);
  assert.equal(t.kicker.textContent, '2장 · 비가 그친 뒤');
});
