const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../src/journey-content.js');
require('../src/g7-journey-content.js');
require('../src/workshop-journey-content.js');
require('../src/workshop-late-journey-content.js');
require('../src/market-journey-content.js');
require('../src/market-late-journey-content.js');
require('../src/continuous-region-flow.js');

const sections = globalThis.JourneyContent.JOURNEY.flatMap(chapter => chapter.sections);

for (const id of ['gate-town', 'workshop-town', 'market-town']) {
  test(`${id} returns to the world only after its final story`, () => {
    const section = sections.find(item => item.id === id);
    assert.ok(section);
    const stories = section.sequence.filter(node => node.type === 'story');
    assert.ok(stories.length > 1);
    for (const story of stories.slice(0, -1)) assert.equal(story.returnToWorldAfter, false, story.id);
    assert.equal(stories.at(-1).returnToWorldAfter, true, stories.at(-1).id);
  });
}

test('M5 after-story now hands directly to the M6 setup node', () => {
  const market = sections.find(item => item.id === 'market-town');
  const index = market.sequence.findIndex(node => node.id === 'market-after-m5');
  assert.equal(market.sequence[index].returnToWorldAfter, false);
  assert.equal(market.sequence[index + 1].id, 'market-m6-setup');
});
