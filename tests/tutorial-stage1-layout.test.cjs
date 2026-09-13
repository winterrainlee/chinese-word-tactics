const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadStages() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'content.js'), 'utf8');
  const context = {};
  vm.runInNewContext(`${source}\nthis.__STAGES = STAGES;`, context);
  return context.__STAGES;
}

function locate(grid, ch) {
  for (let r = 0; r < grid.length; r += 1) {
    const c = grid[r].indexOf(ch);
    if (c >= 0) return [r, c];
  }
  return null;
}

function dist(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function reachable(grid, start, targetPredicate, passable) {
  const queue = [start];
  const seen = new Set([start.join(',')]);
  while (queue.length) {
    const [r, c] = queue.shift();
    if (targetPredicate([r, c])) return true;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      const ch = grid[nr]?.[nc];
      const key = `${nr},${nc}`;
      if (ch == null || seen.has(key) || !passable(ch)) continue;
      seen.add(key);
      queue.push([nr, nc]);
    }
  }
  return false;
}

test('stage-1 requires leaving the direct lane to approach the stone', () => {
  const stage = loadStages().find(({ id }) => id === 'stage-1');
  assert.ok(stage);

  const start = locate(stage.grid, 'S');
  const gate = locate(stage.grid, 'G');
  const stone = locate(stage.grid, 'K');
  const exit = locate(stage.grid, 'E');
  assert.ok(start && gate && stone && exit);
  assert.equal(start[1], gate[1], 'start and gate should define the tempting direct lane');

  const step = start[0] > gate[0] ? -1 : 1;
  for (let r = start[0] + step; r !== gate[0]; r += step) {
    assert.ok(dist([r, start[1]], stone) > 1, 'walking straight must not trigger 接近');
  }

  const canReachStoneSide = reachable(
    stage.grid,
    start,
    pos => dist(pos, stone) === 1,
    ch => !['#', 'K', 'G'].includes(ch),
  );
  assert.equal(canReachStoneSide, true, 'a side path to the stone must remain reachable before the gate opens');

  const canReachExitAfterOpen = reachable(
    stage.grid,
    start,
    pos => pos[0] === exit[0] && pos[1] === exit[1],
    ch => !['#', 'K'].includes(ch),
  );
  assert.equal(canReachExitAfterOpen, true, 'opening the gate must still leave a path to the exit');
});
