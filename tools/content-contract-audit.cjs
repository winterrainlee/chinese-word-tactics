#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const isContentSource = rel => rel === 'src/content.js' || rel === 'src/continuous-region-flow.js' || rel.endsWith('-content.js');

function contentSourcesFor(root = PROJECT_ROOT) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']\.\/(src\/[^"'?]+\.js)(?:\?[^"']*)?["']/g)]
    .map(match => match[1])
    .filter(isContentSource);
}

const CONTENT_SOURCES = contentSourcesFor();

const clone = value => JSON.parse(JSON.stringify(value));
const strings = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) (seen.has(value) ? duplicates : seen).add(value);
  return [...duplicates].sort();
}

function journeyContainers(journey) {
  return journey.flatMap(chapter => (chapter.sections || []).flatMap(section => {
    if (Array.isArray(section.quests)) {
      return section.quests.map(quest => ({ chapter, section, quest, sequence: quest.sequence || [] }));
    }
    return [{ chapter, section, quest: null, sequence: section.sequence || [] }];
  }));
}

function parseLifecycleStages(root, lifecycle) {
  const found = [];
  for (const rel of strings(lifecycle.stageSources)) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    const stageId = /\bid\s*:\s*['"]((?:stage|gate-stage|workshop-stage|market-stage|north-forest-stage)-\d+|academic-tower-turn-\d{2}-[a-z0-9-]+)['"]/g;
    const matches = [...text.matchAll(stageId)];
    matches.forEach((match, index) => {
      const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
      const wordsMatch = text.slice(match.index, end).match(/\bwords\s*:\s*\[([^\]]*)\]/);
      if (!wordsMatch) return;
      found.push({
        id: match[1],
        words: [...wordsMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(item => item[1])
      });
    });
  }
  return found;
}

function loadProject(root = PROJECT_ROOT) {
  const contentSources = contentSourcesFor(root);
  const indexed = new Set(contentSources);
  const unloadedContentSources = fs.readdirSync(path.join(root, 'src'))
    .filter(file => file === 'content.js' || file.endsWith('-content.js'))
    .map(file => `src/${file}`)
    .filter(rel => !indexed.has(rel))
    .sort();
  const context = vm.createContext(Object.create(null), {
    name: 'content-contract-audit',
    codeGeneration: { strings: false, wasm: false }
  });
  for (const rel of contentSources) {
    const filename = path.join(root, rel);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename, timeout: 1000 });
  }
  const content = vm.runInContext(`({
    words: WORDS,
    stages: STAGES,
    world: WORLD,
    stories: globalThis.JourneyContent.STORIES,
    journey: globalThis.JourneyContent.JOURNEY,
    lexicon: globalThis.LexiconContent
  })`, context, { timeout: 1000 });
  const lifecycle = JSON.parse(fs.readFileSync(path.join(root, 'data/vocabulary-lifecycle-v0.1.json'), 'utf8'));
  return clone({ ...content, lifecycle, lifecycleStages: parseLifecycleStages(root, lifecycle), unloadedContentSources });
}

function auditContent(content) {
  const errors = [];
  const warnings = [{
    code: 'STAGE_ORDER_APPEND_ONLY',
    message: 'STAGES index is persisted by legacy saves. This audit cannot infer a historical baseline; append new stages and review any reorder manually.'
  }];
  const add = (code, location, message) => errors.push({ code, location, message });
  const stages = Array.isArray(content.stages) ? content.stages : [];
  const stories = content.stories && typeof content.stories === 'object' ? content.stories : {};
  const journey = Array.isArray(content.journey) ? content.journey : [];
  const words = content.words && typeof content.words === 'object' ? content.words : {};
  const lexicon = content.lexicon || {};
  const lifecycle = content.lifecycle || { words: {} };
  const containers = journeyContainers(journey);
  const nodes = containers.flatMap(({ chapter, section, quest, sequence }) => sequence.map(node => ({
    ...node,
    nodeId: `${node.type}:${node.id}`,
    location: `journey.${chapter.id}.${section.id}${quest ? `.${quest.id}` : ''}.${node.type}:${node.id}`
  })));

  for (const rel of strings(content.unloadedContentSources)) {
    add('UNLOADED_CONTENT_SOURCE', rel, 'content source exists in src but is not loaded by index.html');
  }

  for (const id of duplicateValues(stages.map(stage => stage.id))) {
    add('DUPLICATE_STAGE_ID', `stage:${id}`, `stage id is declared more than once: ${id}`);
  }
  for (const id of duplicateValues(nodes.map(node => node.nodeId))) {
    add('DUPLICATE_NODE_ID', id, `journey node is declared more than once: ${id}`);
  }

  const stageIds = new Set(stages.map(stage => stage.id));
  const storyIds = new Set(Object.keys(stories));
  const nodeIds = new Set(nodes.map(node => node.nodeId));
  for (const [key, story] of Object.entries(stories)) {
    if (!story || story.id !== key) add('STORY_ID_MISMATCH', `stories.${key}`, `story registry key ${key} does not match story.id ${story?.id}`);
  }

  for (const stage of stages) {
    for (const word of strings(stage.words)) {
      if (!Object.hasOwn(words, word)) add('UNKNOWN_STAGE_WORD', `stage:${stage.id}.words`, `${word} is not registered in WORDS`);
    }
    if (!Array.isArray(stage.grid) || stage.grid.length === 0 || stage.grid.some(row => typeof row !== 'string')) {
      add('INVALID_GRID', `stage:${stage.id}.grid`, 'grid must be a non-empty array of strings');
      continue;
    }
    const width = stage.grid[0].length;
    if (width === 0 || stage.grid.some(row => row.length !== width)) {
      add('NON_RECTANGULAR_GRID', `stage:${stage.id}.grid`, 'all grid rows must have the same non-zero width');
    }
    if (!stage.grid.some(row => row.includes('S'))) add('MISSING_START', `stage:${stage.id}.grid`, 'grid must contain an S start tile');
  }

  for (const node of nodes) {
    if (node.type === 'stage' && !stageIds.has(node.id)) add('MISSING_JOURNEY_STAGE', node.location, `journey references missing stage ${node.id}`);
    else if (node.type === 'story' && !storyIds.has(node.id)) add('MISSING_JOURNEY_STORY', node.location, `journey references missing story ${node.id}`);
    else if (!['stage', 'story'].includes(node.type)) add('UNKNOWN_NODE_TYPE', node.location, `unsupported journey node type ${node.type}`);
    for (const required of strings(node.requires)) {
      if (!nodeIds.has(required)) add('INVALID_REQUIRES', `${node.location}.requires`, `required journey node does not exist: ${required}`);
    }
    for (const required of strings(node.journeyRevealRequires)) {
      if (!nodeIds.has(required)) add('INVALID_REVEAL_REQUIRES', `${node.location}.journeyRevealRequires`, `reveal requirement does not exist: ${required}`);
    }
  }
  for (const id of stageIds) if (!nodeIds.has(`stage:${id}`)) add('UNREGISTERED_STAGE', `stage:${id}`, 'stage is not registered in JOURNEY');
  for (const id of storyIds) if (!nodeIds.has(`story:${id}`)) add('UNREGISTERED_STORY', `stories.${id}`, 'story is not registered in JOURNEY');
  for (const { chapter, section, quest } of containers) {
    for (const [owner, refs] of [
      [`journey.${chapter.id}.${section.id}.revealRequires`, section.revealRequires],
      [`journey.${chapter.id}.${section.id}${quest ? `.${quest.id}` : ''}.revealRequires`, quest?.revealRequires]
    ]) {
      for (const required of strings(refs)) if (!nodeIds.has(required)) add('INVALID_REVEAL_REQUIRES', owner, `reveal requirement does not exist: ${required}`);
    }
  }
  const sectionIds = new Set(journey.flatMap(chapter => (chapter.sections || []).map(section => section.id)));
  for (const chapter of journey) for (const section of chapter.sections || []) {
    if (section.nextSectionId && !sectionIds.has(section.nextSectionId)) {
      add('INVALID_NEXT_SECTION', `journey.${chapter.id}.${section.id}.nextSectionId`, `next section does not exist: ${section.nextSectionId}`);
    }
  }

  const lexiconRegions = new Set((lexicon.REGIONS || []).map(region => region.id));
  const worldRegions = new Set((content.world?.regions || []).map(region => region.id));
  for (const id of duplicateValues((content.world?.regions || []).map(region => region.id))) {
    add('DUPLICATE_WORLD_REGION_ID', `world.region:${id}`, `world region id is declared more than once: ${id}`);
  }
  for (const id of duplicateValues((lexicon.REGIONS || []).map(region => region.id))) {
    add('DUPLICATE_LEXICON_REGION_ID', `lexicon.region:${id}`, `lexicon region id is declared more than once: ${id}`);
  }
  for (const chapter of journey) for (const section of chapter.sections || []) {
    if (section.regionId && !section.hiddenFromJourney && !worldRegions.has(section.regionId) && !lexiconRegions.has(section.regionId)) {
      add('UNCONNECTED_REGION', `journey.${chapter.id}.${section.id}.regionId`, `visible journey region is in neither WORLD nor LexiconContent.REGIONS: ${section.regionId}`);
    }
  }
  for (const region of lexicon.REGIONS || []) {
    if (!region.chapterId || !(lexicon.CHAPTERS || []).some(chapter => chapter.id === region.chapterId)) {
      add('INVALID_LEXICON_CHAPTER', `lexicon.region:${region.id}`, `lexicon region references missing chapter ${region.chapterId}`);
    }
  }
  for (const group of lexicon.GROUPS || []) {
    if (!lexiconRegions.has(group.regionId)) add('INVALID_LEXICON_REGION', `lexicon.group:${group.id}`, `group references missing lexicon region ${group.regionId}`);
    for (const word of [...strings(group.words), ...strings(group.related)]) {
      if (!Object.hasOwn(words, word)) add('UNKNOWN_LEXICON_WORD', `lexicon.group:${group.id}`, `${word} is not registered in WORDS`);
    }
  }

  const lifecycleWords = lifecycle.words && typeof lifecycle.words === 'object' ? lifecycle.words : {};
  const groupedWords = new Set((lexicon.GROUPS || []).flatMap(group => strings(group.words)));
  const actualByWord = Object.fromEntries(Object.keys(lifecycleWords).map(word => [word, []]));
  for (const stage of content.lifecycleStages || []) for (const word of strings(stage.words)) {
    if (!actualByWord[word]) add('UNKNOWN_LIFECYCLE_STAGE_WORD', `lifecycle.stage:${stage.id}`, `${word} is absent from lifecycle.words`);
    else actualByWord[word].push(stage.id);
  }
  for (const [word, record] of Object.entries(lifecycleWords)) {
    if (!Object.hasOwn(words, word)) add('MISSING_WORD_DEFINITION', `lifecycle.word:${word}`, `${word} is not registered in WORDS`);
    if (!groupedWords.has(word)) add('MISSING_LEXICON_GROUP', `lifecycle.word:${word}`, `${word} is not registered as a primary word in a lexicon group`);
    if (!lexiconRegions.has(record.regionId)) add('INVALID_LIFECYCLE_REGION', `lifecycle.word:${word}`, `region is absent from LexiconContent.REGIONS: ${record.regionId}`);
    const expected = [...strings(record.targetStageIds)].sort();
    const actual = [...(actualByWord[word] || [])].sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      add('LIFECYCLE_STAGE_MISMATCH', `lifecycle.word:${word}`, `targetStageIds=${JSON.stringify(expected)} but source stages=${JSON.stringify(actual)}`);
    }
  }

  errors.sort((a, b) => `${a.code}:${a.location}`.localeCompare(`${b.code}:${b.location}`));
  return {
    ok: errors.length === 0,
    counts: {
      words: Object.keys(words).length,
      stages: stages.length,
      stories: storyIds.size,
      journeyNodes: nodes.length,
      worldRegions: worldRegions.size,
      lexiconRegions: lexiconRegions.size,
      lifecycleWords: Object.keys(lifecycleWords).length
    },
    errors,
    warnings
  };
}

function runCli() {
  let result;
  try {
    result = auditContent(loadProject());
  } catch (error) {
    result = { ok: false, counts: {}, errors: [{ code: 'LOAD_FAILED', location: 'project', message: error.message }], warnings: [] };
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('Content contract audit');
    console.log('----------------------');
    console.log(`status: ${result.ok ? 'OK' : 'FAILED'}`);
    if (Object.keys(result.counts).length) console.log(`counts: ${Object.entries(result.counts).map(([key, value]) => `${key}=${value}`).join(', ')}`);
    for (const error of result.errors) console.error(`ERROR ${error.code} [${error.location}] ${error.message}`);
    for (const warning of result.warnings) console.log(`NOTICE ${warning.code}: ${warning.message}`);
  }
  if (!result.ok) process.exitCode = 1;
}

module.exports = { CONTENT_SOURCES, auditContent, contentSourcesFor, loadProject, parseLifecycleStages };
if (require.main === module) runCli();
