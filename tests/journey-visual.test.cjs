const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const css = read('src/journey.css');
const runtime = read('src/journey-runtime.js');
const html = read('index.html');
const continueIcon = read('icons/ui/ui-continue.svg');

test('journey filters render as text tabs instead of segmented cards', () => {
  assert.match(css, /\.journeyFilters button\{[^}]*border:0;[^}]*border-bottom:2px solid transparent;[^}]*border-radius:0;[^}]*background:transparent/s);
  assert.match(css, /button\[aria-pressed="true"\]\{[^}]*background:transparent;[^}]*border-bottom-color:var\(--accent\)/s);
});

test('journey regions and events are flat timeline records, not rounded cards', () => {
  assert.match(css, /\.journeyRegionSummary\{[^}]*border:0;[^}]*border-radius:0;[^}]*background:transparent/s);
  assert.match(css, /\.journeyNode\{[^}]*border:0;[^}]*border-radius:0;[^}]*background:transparent/s);
  assert.match(css, /\.journeyTimeline>li::before\{/);
  assert.match(css, /\.journeyNode::before\{/);
  assert.match(css, /\.journeyNode\[data-state="complete"\]::before/);
  assert.match(css, /\.journeyNode\[data-state="locked"\]::before/);
});

test('journey rows keep full type labels while compacting status actions by state', () => {
  assert.match(runtime, /typeLabel = node\.type === 'story' \? '이야기' : reference\?\.optional \? '선택 연구'/);
  assert.match(runtime, /\? '연구' : '스테이지'/);
  assert.match(runtime, /`준비 중 · 스테이지 \$\{section\.plannedStageCount\}개`/);
  assert.match(runtime, /make\('span', 'journeyNodeMeta'\)/);
  assert.match(runtime, /const actionLabel = current \? '계속' : done \? '다시'/);
  assert.match(runtime, /action\.dataset\.icon = current \? 'continue' : 'replay'/);
  assert.match(runtime, /action\.setAttribute\('aria-hidden', 'true'\)/);
  assert.doesNotMatch(runtime, /journeyNodeNow|'지금'/);
  assert.match(runtime, /button\.setAttribute\('aria-label'/);
  assert.match(css, /\.journeyNode\{[^}]*grid-template-areas:'number title state' 'number meta state'[^}]*min-height:58px/s);
  assert.match(css, /\.journeyNodeState\{[^}]*width:48px[^}]*min-height:44px/s);
  assert.match(css, /\.journeyNodeAction\[data-icon\]\{[^}]*width:19px[^}]*height:19px[^}]*background-color:currentColor/s);
  assert.match(css, /data-icon="replay"[^}]*ui-restart\.svg/s);
  assert.match(css, /data-icon="continue"[^}]*ui-continue\.svg/s);
  assert.match(continueIcon, /viewBox="0 0 24 24"/);
  assert.match(continueIcon, /<path fill="currentColor"/);
  assert.doesNotMatch(continueIcon, /<(?:script|foreignObject|image|text|style|animate|animateTransform)\b/i);
});

test('journey keeps one future lock visible and folds the remaining locked nodes', () => {
  assert.match(runtime, /firstLockedSeen/);
  assert.match(runtime, /make\('details', 'journeyLockedGroup'\)/);
  assert.match(runtime, /`잠긴 항목 \$\{lockedCount\}개`/);
  assert.match(css, /\.journeyLockedSummary\{[^}]*min-height:44px/s);
  assert.match(css, /\.journeyLockedSummary:focus-visible\{outline:3px solid var\(--blue\)/);
});

test('journey highlights the recommended current point without changing replay logic', () => {
  assert.match(runtime, /const recommendedId = recommended \? JourneyProgress\.nodeId\(recommended\) : null/);
  assert.match(runtime, /campaignCurrent = id === recommendedId/);
  assert.match(runtime, /questCurrent = id === questCurrentId/);
  assert.match(runtime, /button\.dataset\.current = String\(campaignCurrent\)/);
  assert.match(runtime, /button\.dataset\.questCurrent = String\(questCurrent\)/);
  assert.match(runtime, /aria-current', 'step'/);
  assert.match(css, /\.journeyNode\[data-current="true"\]/);
  assert.match(css, /\.journeyNode\[data-quest-current="true"\]/);
});

test('journey stage references are a quiet fixed text column with accessible context', () => {
  assert.match(runtime, /const reference = node\.stageReference/);
  assert.match(runtime, /button\.dataset\.stageNumber = reference\.number/);
  assert.match(runtime, /`\$\{reference\.groupLabel\} \$\{reference\.number\}`/);
  assert.match(runtime, /make\('span', 'journeyNodeNumber', reference\.number\)/);
  assert.match(css, /\.journeyNodeNumber\{[^}]*font-variant-numeric:tabular-nums[^}]*background:transparent[^}]*border:0[^}]*border-radius:0/s);
});

test('journey guidance follows the actual continue destination and scopes replay help', () => {
  const progress = read('src/journey-progress.js');
  const flow = read('src/flow-runtime.js');
  assert.match(progress, /function continueAction\(progress\)/);
  assert.match(flow, /const action = P\.continueAction\(store\.get\(\)\)/);
  assert.match(runtime, /const continueAction = JourneyProgress\.continueAction\(progress\)/);
  assert.match(runtime, /journeyGuidance/);
  assert.match(runtime, /filter !== 'stage'/);
  assert.match(runtime, /entry\.started \? '진행 중' : '열림'/);
  assert.match(html, /id="journeyReplayGuidance"[^>]*hidden/);
});

test('optional requests render as collection, place, request, and event levels', () => {
  assert.match(runtime, /chapter\.kind !== 'quest-collection'/);
  assert.match(runtime, /function appendQuestLocation\(/);
  assert.match(runtime, /section\.quests/);
  assert.match(runtime, /journeyQuestLocation/);
  assert.match(runtime, /journeyQuestSummary/);
  assert.match(runtime, /journeyQuestBody/);
  assert.match(runtime, /entry\.done \? '완료' : entry\.started \? '진행 중' : '열림'/);
  assert.match(css, /\.journeyQuestSummary\{[^}]*min-height:48px/s);
  assert.match(css, /\.journeyQuestBody\{/);
  assert.match(css, /\.journeyQuestSummary:focus-visible[^\{]*\{outline:3px solid var\(--blue\)/);
  assert.match(read('src/flow-runtime.js'), /flowQuestChoice/);
  assert.match(css, /\.flowQuestChoice strong,/);
  assert.match(css, /\.flowQuestChoice:focus-visible/);
});

test('completed world regions can open their own replay list', () => {
  const flow = read('src/flow-runtime.js');
  assert.match(runtime, /regionDetails\.dataset\.journeyRegionId = section\.regionId/);
  assert.match(runtime, /if \(focusRegionId\) filter = focusRegionId === 'academic-tower' \? 'all' : 'stage'/);
  assert.match(runtime, /focusRegionId === section\.regionId/);
  assert.match(runtime, /focusRegion\(focusRegionId\)/);
  assert.match(flow, /function showRegionPractice\(regionId\)/);
  assert.match(flow, /JourneyRuntime\.render\(options\.restoreContext \? \{\} : focusRegionId \? \{ focusRegionId \} : \{ focusCurrent: true \}\)/);
});

test('journey reset is separated from the primary continue action', () => {
  assert.match(runtime, /resetRow\.id = 'journeyResetRow'/);
  assert.match(runtime, /root\.after\(resetRow\)/);
  assert.doesNotMatch(runtime, /actions\.append\(reset\)/);
  assert.match(css, /\.journeyResetRow\{/);
  assert.match(css, /\.journeyReset\{[^}]*border:0;[^}]*border-radius:0;[^}]*background:transparent/s);
});

test('browser loads the journey redesign assets with a fresh cache key', () => {
  assert.match(html, /stage-reference\.js\?v=20261006-a10a061/);
  assert.match(html, /journey\.css\?v=20261006-a041/);
  assert.match(html, /journey-runtime\.js\?v=20261006-a051/);
  assert.match(html, /journey-progress\.js\?v=20261006-a10a061/);
  assert.match(html, /flow-runtime\.js\?v=20261006-a041/);
});
