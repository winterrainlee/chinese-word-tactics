const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const files = [
  'src/content.js',
  'src/workshop-content.js',
  'src/workshop-late-content.js',
  'src/g7-content.js',
  'src/market-content.js',
  'src/market-late-content.js',
  'src/journey-content.js',
  'src/g7-journey-content.js',
  'src/workshop-journey-content.js',
  'src/workshop-late-journey-content.js',
  'src/market-journey-content.js',
  'src/market-late-journey-content.js',
  'src/continuous-region-flow.js',
  'src/story-outcome-content.js',
  'src/market-story-outcome-content.js',
  'src/g7-story-outcome-content.js'
];

const sandbox = { console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const file of files) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });

const stages = vm.runInContext('STAGES', sandbox);
const stageById = new Map(stages.map(stage => [stage.id, stage]));
const stories = sandbox.JourneyContent.STORIES;
const sections = sandbox.JourneyContent.JOURNEY.flatMap(chapter => chapter.sections || []);

function normalize(text) {
  return String(text || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

function bigrams(text) {
  const value = normalize(text);
  if (!value) return new Set();
  if (value.length === 1) return new Set([value]);
  const result = new Set();
  for (let i = 0; i < value.length - 1; i++) result.add(value.slice(i, i + 2));
  return result;
}

function dice(left, right) {
  const a = bigrams(left), b = bigrams(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const value of a) if (b.has(value)) shared++;
  return (2 * shared) / (a.size + b.size);
}

function beatsText(beats, side) {
  const chosen = side === 'start' ? (beats || []).slice(0, 2) : (beats || []).slice(-2);
  return {
    zh: chosen.map(beat => beat.zh || '').filter(Boolean).join(' '),
    ko: chosen.map(beat => beat.ko || '').filter(Boolean).join(' ')
  };
}

function completionText(stage) {
  const feedback = stage?.market?.feedback?.solved ?? stage?.workshop?.feedback?.solved;
  const solved = typeof feedback === 'string' ? feedback : feedback?.text;
  return {
    zh: String(solved || stage?.story || ''),
    ko: String(solved || stage?.story || '')
  };
}

function setupText(stage) {
  const startStatus = stage?.market?.startStatus || stage?.workshop?.startStatus || '';
  return {
    zh: [stage?.goal, stage?.rule, startStatus].filter(Boolean).join(' '),
    ko: [stage?.goal, stage?.rule, startStatus].filter(Boolean).join(' ')
  };
}

const candidates = [];
function addCandidate(kind, sectionId, leftId, rightId, left, right, variant = '') {
  const zh = dice(left.zh, right.zh);
  const ko = dice(left.ko, right.ko);
  candidates.push({ kind, sectionId, leftId, rightId, variant, zh, ko, score: Math.max(zh, ko), left, right });
}

for (const section of sections) {
  const sequence = section.sequence || [];
  for (let i = 0; i < sequence.length - 1; i++) {
    const leftNode = sequence[i], rightNode = sequence[i + 1];
    if (leftNode.type === 'stage' && rightNode.type === 'story') {
      const stage = stageById.get(leftNode.id), story = stories[rightNode.id];
      if (stage && story) addCandidate('completion→after-story', section.id, leftNode.id, rightNode.id, completionText(stage), beatsText(story.beats, 'start'));
    }
    if (leftNode.type === 'story' && rightNode.type === 'story') {
      const leftStory = stories[leftNode.id], rightStory = stories[rightNode.id];
      if (leftStory && rightStory) addCandidate('story→story', section.id, leftNode.id, rightNode.id, beatsText(leftStory.beats, 'end'), beatsText(rightStory.beats, 'start'));
    }
    if (leftNode.type === 'story' && rightNode.type === 'stage') {
      const story = stories[leftNode.id], stage = stageById.get(rightNode.id);
      if (story && stage) addCandidate('setup→stage', section.id, leftNode.id, rightNode.id, beatsText(story.beats, 'end'), setupText(stage));
    }
  }
}

// Explicitly audit outcome-dependent after-stories so first-play choices are not hidden by generic fallback copy.
const outcome = sandbox.StoryOutcomeContent || {};
const marketVariants = outcome.marketVariants || {};
for (const [storyId, config] of Object.entries(marketVariants)) {
  const stage = stageById.get(config.stageId);
  if (!stage) continue;
  for (const [variant, beats] of Object.entries(config.variants || {})) {
    addCandidate('completion→after-story', 'market-town', config.stageId, storyId, completionText(stage), beatsText(beats, 'start'), variant);
  }
}
const g7Variants = outcome.g7Variants || {};
const g7Stage = stageById.get('gate-stage-7');
if (g7Stage) {
  for (const [variant, beats] of Object.entries(g7Variants)) {
    addCandidate('completion→after-story', 'gate-town', 'gate-stage-7', 'gate-after-convoy', completionText(g7Stage), beatsText(beats, 'start'), variant);
  }
}

const sorted = candidates.sort((a, b) => b.score - a.score);
const review = sorted.filter(item => item.score >= 0.34);
const shown = review.length ? review : sorted.slice(0, 8);

console.log('Story handoff repetition audit');
console.log('This is a REVIEW report, not a pass/fail gate. Similar wording can be intentional.');
for (const item of shown.slice(0, 20)) {
  const label = item.variant ? `${item.leftId} → ${item.rightId} [${item.variant}]` : `${item.leftId} → ${item.rightId}`;
  console.log(`REVIEW ${item.score.toFixed(2)} zh=${item.zh.toFixed(2)} ko=${item.ko.toFixed(2)} ${item.kind} ${item.sectionId} :: ${label}`);
  console.log(`  L-ko: ${item.left.ko}`);
  console.log(`  R-ko: ${item.right.ko}`);
  console.log(`  L-zh: ${item.left.zh}`);
  console.log(`  R-zh: ${item.right.zh}`);
}
console.log(`\n${candidates.length} adjacent handoffs checked, ${review.length} review candidate(s) at score >= 0.34.`);
