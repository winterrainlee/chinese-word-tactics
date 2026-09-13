#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const lifecycle = readJson('data/vocabulary-lifecycle-v0.1.json');
const tbcl = readJson('data/tbcl-word-levels-2025-04.json');
const words = Object.keys(lifecycle.words);

const storySources = [
  'src/journey-content.js',
  'src/g7-journey-content.js',
  'src/g7-story-outcome-content.js',
  'src/gate-reward-story-content.js',
  'src/story-outcome-content.js',
  'src/workshop-journey-content.js',
  'src/workshop-late-journey-content.js',
  'src/market-journey-content.js',
  'src/market-late-journey-content.js',
  'src/market-story-outcome-content.js'
];

function parseStageWords(rel) {
  const fullPath = path.join(root, rel);
  const text = fs.readFileSync(fullPath, 'utf8');
  const stageId = /\bid\s*:\s*['"]((?:stage|gate-stage|workshop-stage|market-stage)-\d+)['"]/g;
  const matches = [...text.matchAll(stageId)];
  const found = [];

  matches.forEach((match, index) => {
    const start = match.index;
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
    const chunk = text.slice(start, end);
    const wordsMatch = chunk.match(/\bwords\s*:\s*\[([^\]]*)\]/);
    if (!wordsMatch) return;

    const targetWords = [...wordsMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(item => item[1]);
    found.push({ stageId: match[1], words: targetWords });
  });

  return found;
}

const stages = lifecycle.stageSources.flatMap(parseStageWords);
const actualStagesByWord = Object.fromEntries(words.map(word => [word, []]));
const unknownStageWords = [];

for (const stage of stages) {
  for (const word of stage.words) {
    if (!actualStagesByWord[word]) {
      unknownStageWords.push({ word, stageId: stage.stageId });
      continue;
    }
    actualStagesByWord[word].push(stage.stageId);
  }
}

const lifecycleMismatches = [];
for (const word of words) {
  const expected = [...lifecycle.words[word].targetStageIds].sort();
  const actual = [...actualStagesByWord[word]].sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    lifecycleMismatches.push({ word, expected, actual });
  }
}

const tbclWords = new Set(Object.keys(tbcl.words));
const missingTbcl = words.filter(word => !tbclWords.has(word));
const extraTbcl = [...tbclWords].filter(word => !lifecycle.words[word]);

const counts = words.map(word => actualStagesByWord[word].length);
const targetPlacements = counts.reduce((sum, count) => sum + count, 0);
const distribution = {};
for (const count of counts) distribution[count] = (distribution[count] || 0) + 1;
const oneOffWords = words.filter(word => actualStagesByWord[word].length === 1);

const tbclDistribution = {};
for (const word of words) {
  const record = tbcl.words[word];
  if (!record) continue;
  const key = record.status === 'listed' ? record.level : record.status;
  tbclDistribution[key] = (tbclDistribution[key] || 0) + 1;
}

const storyTexts = storySources
  .filter(rel => fs.existsSync(path.join(root, rel)))
  .map(rel => ({ rel, text: fs.readFileSync(path.join(root, rel), 'utf8') }));

const storyLiteralCounts = {};
const storyLiteralFiles = {};
for (const word of words) {
  let total = 0;
  const files = [];
  for (const source of storyTexts) {
    const count = source.text.split(word).length - 1;
    if (count > 0) {
      total += count;
      files.push({ path: source.rel, count });
    }
  }
  storyLiteralCounts[word] = total;
  storyLiteralFiles[word] = files;
}

const result = {
  snapshotDate: lifecycle.snapshotDate,
  wordCount: words.length,
  targetPlacements,
  meanTargetPlacements: Number((targetPlacements / words.length).toFixed(4)),
  targetCountDistribution: distribution,
  oneOffCount: oneOffWords.length,
  oneOffShare: Number((oneOffWords.length / words.length).toFixed(4)),
  oneOffWords,
  tbclDistribution,
  tbclExactUnlisted: words.filter(word => tbcl.words[word]?.status === 'not-listed-exact'),
  storyLiteralCounts,
  storyLiteralFiles,
  consistency: {
    lifecycleMismatches,
    unknownStageWords,
    missingTbcl,
    extraTbcl,
    ok: lifecycleMismatches.length === 0 &&
        unknownStageWords.length === 0 &&
        missingTbcl.length === 0 &&
        extraTbcl.length === 0
  }
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('Vocabulary lifecycle audit');
  console.log('--------------------------');
  console.log(`words: ${result.wordCount}`);
  console.log(`target placements: ${result.targetPlacements}`);
  console.log(`mean target placements: ${result.meanTargetPlacements}`);
  console.log(`target count distribution: ${Object.entries(distribution).map(([count, n]) => `${count}x=${n}`).join(', ')}`);
  console.log(`one-off targets: ${result.oneOffCount} (${(result.oneOffShare * 100).toFixed(1)}%)`);
  console.log(`TBCL distribution: ${Object.entries(tbclDistribution).map(([level, n]) => `${level}=${n}`).join(', ')}`);
  console.log(`TBCL exact-unlisted: ${result.tbclExactUnlisted.join(', ') || 'none'}`);
  console.log(`source consistency: ${result.consistency.ok ? 'OK' : 'MISMATCH'}`);
  console.log('');
  console.log('one-off words:');
  console.log(oneOffWords.join(' · '));
  console.log('');
  console.log('story literal counts are passive text occurrences only; they are not active reuse evidence.');
}

if (!result.consistency.ok) {
  console.error(JSON.stringify(result.consistency, null, 2));
  process.exitCode = 1;
}
