#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const sourcePath = 'data/tbcl-discourse-candidates-2025-04.json';
const editorialPath = 'data/academic-tower-discourse-candidates-v0.1.json';
const source = readJson(sourcePath);
const editorial = readJson(editorialPath);
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated].sort();
}

function assertAcyclic(label, nodes, dependenciesFor) {
  const state = new Map();
  const stack = [];

  function visit(node) {
    const current = state.get(node);
    if (current === 'done') return;
    if (current === 'visiting') {
      const start = stack.indexOf(node);
      errors.push(`${label} cycle: ${[...stack.slice(start), node].join(' -> ')}`);
      return;
    }

    state.set(node, 'visiting');
    stack.push(node);
    for (const dependency of dependenciesFor(node)) visit(dependency);
    stack.pop();
    state.set(node, 'done');
  }

  for (const node of nodes) visit(node);
}

assert(source.datasetRole === 'official-source-extract', 'source dataset role must remain official-source-extract');
assert(editorial.datasetRole === 'game-editorial-layer', 'editorial dataset role must remain game-editorial-layer');
assert(editorial.sourceDataset === sourcePath, `editorial sourceDataset must be ${sourcePath}`);

const lexical = source.lexicalEntries;
const grammar = source.grammarPoints;
const sourceRecords = [...lexical, ...grammar];
const sourceIds = sourceRecords.map(record => record[0]);
const sourceIdSet = new Set(sourceIds);

assert(lexical.length === source.screening.selectedCounts.lexicalEntries,
  `lexical selected count metadata ${source.screening.selectedCounts.lexicalEntries} != ${lexical.length}`);
assert(grammar.length === source.screening.selectedCounts.grammarPoints,
  `grammar selected count metadata ${source.screening.selectedCounts.grammarPoints} != ${grammar.length}`);
assert(sourceRecords.length === source.screening.selectedCounts.sourceRecords,
  `source selected count metadata ${source.screening.selectedCounts.sourceRecords} != ${sourceRecords.length}`);
assert(source.screening.wordEntryCounts.total === 4070, 'reviewed word-entry universe must stay at 4,070 for this snapshot');
assert(source.screening.grammarPointCounts.total === 255, 'reviewed grammar-point universe must stay at 255 for this snapshot');

const duplicateSourceIds = duplicates(sourceIds);
assert(duplicateSourceIds.length === 0, `duplicate source ids: ${duplicateSourceIds.join(', ')}`);

for (const [id, expression, level] of lexical) {
  assert(typeof expression === 'string' && expression.length > 0, `${id} has no expression`);
  assert(['4', '4*', '5'].includes(level), `${id} has invalid lexical level ${level}`);
  const expectedPrefix = level === '4*' ? 'w4s-' : `w${level}-`;
  assert(id.startsWith(expectedPrefix), `${id} does not match lexical level ${level}`);
}

for (const [id, expression, level] of grammar) {
  assert(typeof expression === 'string' && expression.length > 0, `${id} has no expression`);
  const row = Number(id.slice(1));
  assert(/^g\d+$/.test(id) && row >= 242 && row <= 496, `${id} is outside the reviewed grammar row range`);
  const expectedLevel = row <= 308 ? '4' : row <= 390 ? '4*' : '5';
  assert(level === expectedLevel, `${id} level ${level} should be ${expectedLevel}`);
}

const functionIds = editorial.functionGroups.map(group => group.id);
const functionIdSet = new Set(functionIds);
const duplicateFunctionIds = duplicates(functionIds);
assert(duplicateFunctionIds.length === 0, `duplicate function ids: ${duplicateFunctionIds.join(', ')}`);

const assignmentFunctionIds = Object.keys(editorial.primaryFunctionAssignments);
const unknownAssignmentFunctions = assignmentFunctionIds.filter(id => !functionIdSet.has(id));
const unassignedFunctions = functionIds.filter(id => !assignmentFunctionIds.includes(id));
assert(unknownAssignmentFunctions.length === 0, `unknown assignment functions: ${unknownAssignmentFunctions.join(', ')}`);
assert(unassignedFunctions.length === 0, `function groups without assignments: ${unassignedFunctions.join(', ')}`);

const assignedRefs = assignmentFunctionIds.flatMap(id => editorial.primaryFunctionAssignments[id]);
const unknownAssignedRefs = assignedRefs.filter(id => !sourceIdSet.has(id));
const duplicateAssignedRefs = duplicates(assignedRefs);
const missingAssignedRefs = sourceIds.filter(id => !assignedRefs.includes(id));
assert(unknownAssignedRefs.length === 0, `unknown assigned source refs: ${unknownAssignedRefs.join(', ')}`);
assert(duplicateAssignedRefs.length === 0, `source refs with multiple primary functions: ${duplicateAssignedRefs.join(', ')}`);
assert(missingAssignedRefs.length === 0, `source refs without a primary function: ${missingAssignedRefs.join(', ')}`);

const priorityOrder = editorial.priorityPolicy.priorityOrder;
const rankingCriteria = editorial.priorityPolicy.rankingCriteria;
const coreSourceRefs = editorial.priorityPolicy.coreSourceRefs;
const laterSourceRefs = editorial.priorityPolicy.laterSourceRefs;
const coreSourceRefSet = new Set(coreSourceRefs);
const laterSourceRefSet = new Set(laterSourceRefs);
const secondarySourceRefs = sourceIds.filter(id => !coreSourceRefSet.has(id) && !laterSourceRefSet.has(id));
assert(JSON.stringify(priorityOrder) === JSON.stringify(['core', 'secondary', 'later']),
  'priority order must be core, secondary, later');
assert(rankingCriteria.length === 5 && duplicates(rankingCriteria.map(criterion => criterion.id)).length === 0,
  'priority policy must contain five unique ranking criteria');
for (const criterion of rankingCriteria) {
  assert(typeof criterion.description === 'string' && criterion.description.length > 0,
    `priority ranking criterion ${criterion.id} has no description`);
}
assert(editorial.priorityPolicy.defaultPriority === 'secondary', 'unlisted priority must default to secondary');
for (const priority of priorityOrder) {
  assert(typeof editorial.priorityPolicy.definitions[priority] === 'string'
    && editorial.priorityPolicy.definitions[priority].length > 0,
  `priority ${priority} has no definition`);
}
const duplicateCoreRefs = duplicates(coreSourceRefs);
const duplicateLaterRefs = duplicates(laterSourceRefs);
const unknownCoreRefs = coreSourceRefs.filter(id => !sourceIdSet.has(id));
const unknownLaterRefs = laterSourceRefs.filter(id => !sourceIdSet.has(id));
const overlappingPriorityRefs = coreSourceRefs.filter(id => laterSourceRefSet.has(id));
assert(duplicateCoreRefs.length === 0, `duplicate core priority refs: ${duplicateCoreRefs.join(', ')}`);
assert(duplicateLaterRefs.length === 0, `duplicate later priority refs: ${duplicateLaterRefs.join(', ')}`);
assert(unknownCoreRefs.length === 0, `unknown core priority refs: ${unknownCoreRefs.join(', ')}`);
assert(unknownLaterRefs.length === 0, `unknown later priority refs: ${unknownLaterRefs.join(', ')}`);
assert(overlappingPriorityRefs.length === 0, `source refs in both core and later: ${overlappingPriorityRefs.join(', ')}`);
assert(coreSourceRefs.length + secondarySourceRefs.length + laterSourceRefs.length === sourceIds.length,
  'every source record must resolve to exactly one priority');

const foundationIds = editorial.foundationNodes.map(node => node.id);
const foundationIdSet = new Set(foundationIds);
const duplicateFoundationIds = duplicates(foundationIds);
assert(duplicateFoundationIds.length === 0, `duplicate foundation ids: ${duplicateFoundationIds.join(', ')}`);

for (const node of editorial.foundationNodes) {
  for (const dependency of node.requiresFoundationIds || []) {
    assert(foundationIdSet.has(dependency), `${node.id} has unknown foundation dependency ${dependency}`);
  }
}
assertAcyclic('foundation graph', foundationIds, id => {
  const node = editorial.foundationNodes.find(candidate => candidate.id === id);
  return node?.requiresFoundationIds || [];
});

for (const group of editorial.functionGroups) {
  for (const foundationId of group.foundationPrerequisiteIds) {
    assert(foundationIdSet.has(foundationId), `${group.id} has unknown foundation prerequisite ${foundationId}`);
  }
  for (const functionId of group.requiresFunctionIds) {
    assert(functionIdSet.has(functionId), `${group.id} has unknown function prerequisite ${functionId}`);
  }
}
assertAcyclic('function graph', functionIds, id => {
  const group = editorial.functionGroups.find(candidate => candidate.id === id);
  return group?.requiresFunctionIds || [];
});

const bandIds = editorial.readinessBands.map(band => band.id);
const band4 = editorial.readinessBands.find(band => band.id === 'band-4-paragraph-organization');
assert(bandIds.length === 4 && new Set(bandIds).size === 4, 'readiness bands must contain four unique bands');
for (const sourceRef of band4?.sourceRefOverrides || []) {
  assert(sourceIdSet.has(sourceRef), `band-4 has unknown source ref ${sourceRef}`);
}

const learningUnitIds = editorial.learningUnits.map(unit => unit.id);
const learningUnitIdSet = new Set(learningUnitIds);
const prerequisiteNodeIds = new Set([...foundationIds, ...learningUnitIds]);
const duplicateLearningUnitIds = duplicates(learningUnitIds);
assert(duplicateLearningUnitIds.length === 0, `duplicate learning-unit ids: ${duplicateLearningUnitIds.join(', ')}`);

for (const unit of editorial.learningUnits) {
  assert(unit.sourceRefs.length > 0, `${unit.id} has no source refs`);
  for (const sourceRef of unit.sourceRefs) {
    assert(sourceIdSet.has(sourceRef), `${unit.id} has unknown source ref ${sourceRef}`);
  }
  for (const prerequisiteId of unit.prerequisiteIds) {
    assert(prerequisiteNodeIds.has(prerequisiteId), `${unit.id} has unknown prerequisite ${prerequisiteId}`);
  }
}
assertAcyclic('learning-unit graph', learningUnitIds, id => {
  const unit = editorial.learningUnits.find(candidate => candidate.id === id);
  return (unit?.prerequisiteIds || []).filter(dependency => learningUnitIdSet.has(dependency));
});

const firstBundle = editorial.firstResearchBundle;
const firstBundleRooms = firstBundle.rooms;
const firstBundleRoomIds = firstBundleRooms.map(room => room.id);
const firstBundleRoomIdSet = new Set(firstBundleRoomIds);
const expectedFirstBundleRoomIds = [
  'academic-tower-turn-01-que',
  'academic-tower-turn-02-raner',
  'academic-tower-turn-03-expectation',
  'academic-tower-turn-04-faner',
  'academic-tower-turn-05-synthesis'
];
const duplicateFirstBundleRoomIds = duplicates(firstBundleRoomIds);
assert(firstBundle.id === 'academic-tower-turning-directions-v0.1', 'first research bundle id changed');
assert(firstBundle.regionId === 'academic-tower', 'first research bundle must belong to academic-tower');
assert(JSON.stringify(firstBundle.entryRequiresMilestoneIds) === JSON.stringify(['chapter1-complete']),
  'first research bundle actual unlock must remain chapter1-complete');
assert(JSON.stringify(firstBundle.recommendedAfterMilestoneIds) === JSON.stringify(['chapter1-complete']),
  'first research bundle recommendation must remain chapter1-complete');
assert(firstBundle.hubId === 'academic-tower-hub', 'first research bundle hub id changed');
assert(firstBundle.arrivalStoryId === 'academic-tower-arrival', 'Academic Tower arrival story id changed');
assert(firstBundle.introStoryId === 'academic-tower-turn-intro', 'first research bundle intro story id changed');
assert(firstBundle.resultStoryId === 'academic-tower-turn-result', 'first research bundle result story id changed');
const expectedInterludeStories = [
  {
    id: 'academic-tower-turn-after-que',
    afterRoomIds: ['academic-tower-turn-01-que'],
    beforeRoomIds: ['academic-tower-turn-02-raner', 'academic-tower-turn-03-expectation']
  },
  {
    id: 'academic-tower-turn-before-faner',
    afterRoomIds: ['academic-tower-turn-02-raner', 'academic-tower-turn-03-expectation'],
    beforeRoomIds: ['academic-tower-turn-04-faner']
  },
  {
    id: 'academic-tower-turn-before-synthesis',
    afterRoomIds: ['academic-tower-turn-04-faner'],
    beforeRoomIds: ['academic-tower-turn-05-synthesis']
  }
];
assert(JSON.stringify(firstBundle.interludeStories) === JSON.stringify(expectedInterludeStories),
  'first research bundle interlude story flow changed');
const firstBundleStoryIds = [
  firstBundle.arrivalStoryId,
  firstBundle.introStoryId,
  ...firstBundle.interludeStories.map(story => story.id),
  firstBundle.resultStoryId
];
assert(duplicates(firstBundleStoryIds).length === 0, 'first research bundle has duplicate story ids');
assert(firstBundle.entryMilestoneId === 'academic-tower-entered', 'first entry milestone changed');
assert(firstBundle.completionMilestoneId === 'academic-tower-turn-foundation', 'first bundle completion milestone changed');
assert(firstBundle.towerCompletionMilestoneId === null, 'first bundle must not create a tower completion milestone');
assert(JSON.stringify(firstBundleRoomIds) === JSON.stringify(expectedFirstBundleRoomIds),
  'first research bundle room order or ids changed');
assert(duplicateFirstBundleRoomIds.length === 0,
  `duplicate first-bundle room ids: ${duplicateFirstBundleRoomIds.join(', ')}`);

for (const room of firstBundleRooms) {
  assert(room.targetExpressions.length <= 3, `${room.id} has more than three new target expressions`);
  assert(room.targetExpressions.length > 0 || room.id.endsWith('-synthesis'),
    `${room.id} has no target expression but is not the synthesis room`);
  for (const sourceRef of room.targetSourceRefs) {
    assert(sourceIdSet.has(sourceRef), `${room.id} has unknown target source ref ${sourceRef}`);
    assert(coreSourceRefSet.has(sourceRef), `${room.id} target source ref is not core priority: ${sourceRef}`);
  }
  for (const prerequisiteId of room.requiresRoomIds) {
    assert(firstBundleRoomIdSet.has(prerequisiteId), `${room.id} has unknown room prerequisite ${prerequisiteId}`);
  }
}
assertAcyclic('first research bundle room graph', firstBundleRoomIds, id => {
  const room = firstBundleRooms.find(candidate => candidate.id === id);
  return room?.requiresRoomIds || [];
});

const firstBundleTargets = firstBundleRooms.flatMap(room => room.targetExpressions);
const firstBundleTargetRefs = firstBundleRooms.flatMap(room => room.targetSourceRefs);
assert(JSON.stringify(firstBundleTargets) === JSON.stringify(['卻', '然而', '果然', '竟然', '反而']),
  'first research bundle target sequence changed');
assert(duplicates(firstBundleTargetRefs).length === 0, 'first research bundle repeats a target source ref');
assert(JSON.stringify(firstBundleRooms[3].requiresRoomIds) === JSON.stringify([
  'academic-tower-turn-02-raner',
  'academic-tower-turn-03-expectation'
]), '反而 room must join the contrast and expectation branches');
assert(JSON.stringify(firstBundleRooms[4].activeReuseExpressions) === JSON.stringify(firstBundleTargets),
  'synthesis room must actively reuse all first-bundle targets without adding a new target');

assert(editorial.progressionPolicy.towerHasFinalClear === false, 'Academic Tower must not have a final clear');
assert(editorial.progressionPolicy.towerHasFixedStageCount === false, 'Academic Tower must not have a fixed stage count');

for (const requiredRef of ['w5-raner', 'w5-faner', 'g490', 'g492']) {
  assert(sourceIdSet.has(requiredRef), `required contrast/reversal source is missing: ${requiredRef}`);
}

const levelCounts = Object.fromEntries(['4', '4*', '5'].map(level => [
  level,
  sourceRecords.filter(record => record[2] === level).length
]));
const functionCounts = Object.fromEntries(functionIds.map(id => [
  id,
  editorial.primaryFunctionAssignments[id].length
]));
const priorityCounts = {
  core: coreSourceRefs.length,
  secondary: secondarySourceRefs.length,
  later: laterSourceRefs.length
};

console.log('Academic Tower candidate audit');
console.log('------------------------------');
console.log(`screened source universe: ${source.screening.wordEntryCounts.total} words + ${source.screening.grammarPointCounts.total} grammar points`);
console.log(`selected source records: ${sourceRecords.length} (${lexical.length} words, ${grammar.length} grammar points)`);
console.log(`selected levels: ${Object.entries(levelCounts).map(([level, count]) => `${level}=${count}`).join(', ')}`);
console.log(`primary functions: ${Object.entries(functionCounts).map(([id, count]) => `${id}=${count}`).join(', ')}`);
console.log(`priorities: ${Object.entries(priorityCounts).map(([priority, count]) => `${priority}=${count}`).join(', ')}`);
console.log(`foundation nodes: ${foundationIds.length}`);
console.log(`explicit learning units: ${learningUnitIds.length}`);
console.log(`first research bundle: ${firstBundleRooms.length} rooms, ${firstBundleStoryIds.length} stories, ${firstBundleTargets.length} target expressions`);
console.log(`source/editorial consistency: ${errors.length === 0 ? 'OK' : 'MISMATCH'}`);

if (errors.length > 0) {
  console.error('\n' + errors.map(error => `- ${error}`).join('\n'));
  process.exitCode = 1;
}
