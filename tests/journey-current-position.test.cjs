const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('journey foregrounds only the recommended unfinished node and focuses it on entry', () => {
  const runtime = read('src/journey-runtime.js');
  const flow = read('src/flow-runtime.js');
  const css = read('src/journey.css');

  assert.match(runtime, /recommended \? JourneyProgress\.nodeId\(recommended\) : null/);
  assert.match(runtime, /button\.dataset\.current = String\(current\)/);
  assert.match(runtime, /aria-current', 'step'/);
  assert.match(runtime, /진행 중/);
  assert.match(runtime, /이어서 플레이/);
  assert.match(runtime, /이어서 보기/);
  assert.match(runtime, /forceCurrentOpen = Boolean\(options\.focusCurrent && recommendedId\)/);
  assert.match(runtime, /scrollIntoView\(\{ block: 'center'/);
  assert.match(runtime, /if \(forceCurrentOpen\) focusCurrentNode\(\)/);

  assert.match(flow, /JourneyRuntime\.render\(\{ focusCurrent: true \}\)/);

  assert.match(css, /journeyNode\[data-current="true"\]\{background:linear-gradient/);
  assert.match(css, /journeyNode\[data-current="true"\]::before\{[^}]*width:14px[^}]*height:14px[^}]*box-shadow/);
});
