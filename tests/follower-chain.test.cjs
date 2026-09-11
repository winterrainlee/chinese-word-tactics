const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/follower-runtime.js');
require('../src/follower-chain-runtime.js');
const C = globalThis.FollowerChainMechanic;

const grid = ['##N##','#...#','.....','#O#.#','#...#','#...#','#...#'];

test('two followers advance through the exact previous positions in order', () => {
  const step = C.followerChainStep({ grid, followers: [[5,2],[6,2]], leaderFrom: [4,2], blockedChars: ['#','O'] });
  assert.deepEqual(step.positions, [[4,2],[5,2]]);
  assert.equal(step.allMoved, true);
  assert.equal(step.movedCount, 2);
});

test('if the first cart cannot move, the rest of the convoy waits instead of overlapping', () => {
  const step = C.followerChainStep({ grid, followers: [[4,1],[5,1]], leaderFrom: [3,1], blockedChars: ['#','O'] });
  assert.deepEqual(step.positions, [[4,1],[5,1]]);
  assert.equal(step.allMoved, false);
  assert.equal(step.reason, 'blocked');
});

test('final formation accepts either west or east approach behind the leader', () => {
  const goals = [ [[1,2]], [[1,1],[1,3]] ];
  assert.equal(C.followerChainAtGoal({ grid, leader: [0,2], followers: [[1,2],[1,1]], leaderGoalChar: 'N', followerGoalCells: goals }), true);
  assert.equal(C.followerChainAtGoal({ grid, leader: [0,2], followers: [[1,2],[1,3]], leaderGoalChar: 'N', followerGoalCells: goals }), true);
  assert.equal(C.followerChainAtGoal({ grid, leader: [0,2], followers: [[1,2],[2,2]], leaderGoalChar: 'N', followerGoalCells: goals }), false);
});
