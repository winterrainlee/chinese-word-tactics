const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { auditContent, loadProject } = require('../tools/content-contract-audit.cjs');
const root = path.resolve(__dirname, '..');
const clone = value => JSON.parse(JSON.stringify(value));

test('current classic-script content satisfies the cross-reference contract', () => {
  const result = auditContent(loadProject(root));
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
  assert.ok(result.counts.stages > 30);
  assert.ok(result.counts.journeyNodes > result.counts.stages);
  assert.equal(result.warnings[0].code, 'STAGE_ORDER_APPEND_ONLY');
});

test('audit reports duplicate ids, broken references, malformed grids, and lifecycle drift', () => {
  const content = clone(loadProject(root));
  content.stages.push(clone(content.stages[0]));
  content.stages.push({ id: 'orphan-stage', words: [], grid: ['S'] });
  content.unloadedContentSources = ['src/new-region-content.js'];
  content.stages[0].words.push('없는말');
  content.stages[0].grid = ['S.', '.'];
  content.stages[1].grid = content.stages[1].grid.map(row => row.replace('S', '.'));
  const firstNode = content.journey[0].sections[0].sequence[0];
  content.journey[0].sections[0].sequence.push(clone(firstNode));
  firstNode.requires = ['story:missing-prerequisite'];
  const stageNode = content.journey.flatMap(chapter => chapter.sections)
    .flatMap(section => section.sequence || []).find(node => node.type === 'stage');
  stageNode.id = 'missing-stage';
  content.lifecycle.words['接近'].targetStageIds = [];

  const codes = new Set(auditContent(content).errors.map(error => error.code));
  for (const code of [
    'DUPLICATE_STAGE_ID', 'DUPLICATE_NODE_ID', 'UNLOADED_CONTENT_SOURCE', 'UNKNOWN_STAGE_WORD', 'NON_RECTANGULAR_GRID',
    'MISSING_START', 'INVALID_REQUIRES', 'MISSING_JOURNEY_STAGE', 'UNREGISTERED_STAGE',
    'LIFECYCLE_STAGE_MISMATCH'
  ]) assert.ok(codes.has(code), `expected ${code}; got ${[...codes].join(', ')}`);
});

test('--json CLI returns a machine-readable success result', () => {
  const run = spawnSync(process.execPath, ['tools/content-contract-audit.cjs', '--json'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const result = JSON.parse(run.stdout);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('deployment and the local gate run the blocking content audits', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
  const localGate = fs.readFileSync(path.join(root, 'tools/verify-content.cjs'), 'utf8');
  for (const script of ['content-contract-audit.cjs', 'vocabulary-lifecycle-audit.cjs', 'story-pronunciation-audit.cjs']) {
    assert.match(workflow, new RegExp(script.replace('.', '\\.')));
    assert.match(localGate, new RegExp(script.replace('.', '\\.')));
  }
});
