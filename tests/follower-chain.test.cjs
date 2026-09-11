const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/follower-runtime.js');
require('../src/follower-chain-runtime.js');
const C = globalThis.FollowerChainMechanic;

const grid = ['##N##','.....','A...B','#O#.#','#...#','#...#','#...#'];
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

function walkConvoy(path, { clearObstacleAfterFirstStep = false } = {}) {
  let leader = [4,2], followers = [[5,2],[6,2]];
  path.forEach((next, index) => {
    assert.equal(followers.some(pos => same(pos, next)), false, `leader would collide with convoy at step ${index + 1}`);
    const blockedChars = clearObstacleAfterFirstStep && index >= 1 ? ['#'] : ['#','O'];
    const step = C.followerChainStep({ grid, followers, leaderFrom: leader, blockedChars });
    assert.equal(step.allMoved, true, `convoy failed to follow at step ${index + 1}`);
    followers = step.positions;
    leader = next;
  });
  return { leader, followers };
}

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

test('east outpost is a pass-through route for the whole convoy', () => {
  const result = walkConvoy([[4,3],[3,3],[2,3],[2,4],[1,4],[1,3],[1,2],[0,2]]);
  assert.deepEqual(result, { leader: [0,2], followers: [[1,2],[1,3]] });
});

test('west outpost becomes a pass-through route after the obstacle is cleared', () => {
  const result = walkConvoy([[4,1],[3,1],[2,1],[2,0],[1,0],[1,1],[1,2],[0,2]], { clearObstacleAfterFirstStep: true });
  assert.deepEqual(result, { leader: [0,2], followers: [[1,2],[1,1]] });
});
