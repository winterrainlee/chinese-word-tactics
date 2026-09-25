#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));

if (args.has('--help') || args.has('-h')) {
  console.log(`Usage: node tools/verify-content.cjs [--browser]

Runs the repository's complete fast content gate.

  --browser  Also run the Playwright browser and viewport smoke tests.
             Python Playwright and Chromium must already be installed.
`);
  process.exit(0);
}

const unknown = [...args].filter(value => value !== '--browser');
if (unknown.length) {
  console.error(`Unknown option: ${unknown.join(', ')}`);
  process.exit(2);
}

function run(label, command, commandArgs, options = {}) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    env: { ...process.env, ...options.env },
    stdio: 'inherit'
  });
  if (result.error) {
    console.error(`${label} could not start: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
    process.exit(result.status || 1);
  }
}

const sourceFiles = fs.readdirSync(path.join(root, 'src'))
  .filter(file => file.endsWith('.js'))
  .sort()
  .map(file => path.join('src', file));

for (const file of sourceFiles) run(`JavaScript syntax: ${file}`, process.execPath, ['--check', file]);

const nodeTests = fs.readdirSync(path.join(root, 'tests'))
  .filter(file => file.endsWith('.test.cjs'))
  .sort()
  .map(file => path.join('tests', file));

run('Node regression tests', process.execPath, ['--test', ...nodeTests]);

for (const [label, script] of [
  ['Content contract audit', 'tools/content-contract-audit.cjs'],
  ['Academic Tower candidate audit', 'tools/academic-tower-candidate-audit.cjs'],
  ['Vocabulary lifecycle audit', 'tools/vocabulary-lifecycle-audit.cjs'],
  ['UX heuristic audit', 'tools/ux-audit.cjs'],
  ['Status language audit', 'tools/status-language-audit.cjs'],
  ['Story handoff audit', 'tools/story-handoff-audit.cjs'],
  ['Story pronunciation audit', 'tools/story-pronunciation-audit.cjs']
]) run(label, process.execPath, [script]);

if (args.has('--browser')) {
  const python = process.env.PYTHON || 'python3';
  const browserTests = [
    'tests/smoke_ux.py',
    'tests/smoke_settings.py',
    'tests/smoke_gate_tactical.py',
    'tests/smoke_inn.py',
    'tests/smoke_first_free_quest.py',
    'tests/smoke_north_forest.py',
    'tests/smoke_gate_layout.py',
    'tests/smoke_workshop_layout.py',
    'tests/smoke_market_layout.py',
    'tests/smoke_north_forest_layout.py',
    'tests/smoke_lexicon.py',
    'tests/smoke_journey.py'
  ];
  for (const script of browserTests) run(`Browser regression: ${script}`, python, [script]);
}

console.log(`\nContent verification passed${args.has('--browser') ? ', including browser regressions' : ''}.`);
