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

console.log('Academic Tower candidate audit');
console.log('------------------------------');
console.log(`screened source universe: ${source.screening.wordEntryCounts.total} words + ${source.screening.grammarPointCounts.total} grammar points`);
console.log(`selected source records: ${sourceRecords.length} (${lexical.length} words, ${grammar.length} grammar points)`);
console.log(`selected levels: ${Object.entries(levelCounts).map(([level, count]) => `${level}=${count}`).join(', ')}`);
console.log(`primary functions: ${Object.entries(functionCounts).map(([id, count]) => `${id}=${count}`).join(', ')}`);
console.log(`foundation nodes: ${foundationIds.length}`);
console.log(`explicit learning units: ${learningUnitIds.length}`);
console.log(`source/editorial consistency: ${errors.length === 0 ? 'OK' : 'MISMATCH'}`);

if (errors.length > 0) {
  console.error('\n' + errors.map(error => `- ${error}`).join('\n'));
  process.exitCode = 1;
}
