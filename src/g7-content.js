/* G7 finale content: no new vocabulary, only a synthesis of already learned ideas. */
(() => {
  if (typeof STAGES === 'undefined' || STAGES.some(stage => stage.id === 'gate-stage-7')) return;

  STAGES.push({
    id: 'gate-stage-7',
    title: '路線・經由・跟隨・帶領',
    subtitle: '해 지기 전',
    kicker: '1장 · 길목 7/7',
    grid: ['##N##','.....','A...B','#O#.#','#.S.#','#.C.#','#.c.#'],
    goal: '帶領兩輛貨車，選一條路線，經由哨站，到達北路。',
    rule: '두 길 모두 북쪽으로 이어져. 서두르지 말고, 두 수레가 모두 따라올 수 있는 길을 골라.',
    words: ['路線','經由','跟隨','帶領'],
    win: ['via','follower_chain_at_exit'],
    route: {
      awardPass: false,
      goalChar: 'N',
      routes: [
        { id: 'west', nameZh: '西路', nameKo: '서쪽 길', cells: [[4,1],[3,1],[2,1],[2,0],[1,0],[1,1]] },
        { id: 'east', nameZh: '東路', nameKo: '동쪽 길', cells: [[4,3],[3,3],[2,3],[2,4],[1,4],[1,3]] }
      ],
      waypoints: {
        A: { id: 'west-post', nameZh: '西哨站', nameKo: '서쪽 초소', visitZh: '再次經由西哨站。', visitKo: '다시 서쪽 초소를 경유했어.' },
        B: { id: 'east-post', nameZh: '東哨站', nameKo: '동쪽 초소', visitZh: '再次經由東哨站。', visitKo: '다시 동쪽 초소를 경유했어.' }
      }
    },
    followerChain: {
      chars: ['C','c'],
      blockedChars: ['#','O'],
      clearableChar: 'O',
      clearableFlag: 'g7ObstacleCleared',
      leaderGoalChar: 'N',
      followerGoalCells: [
        [[1,2]],
        [[1,1],[1,3]]
      ]
    },
    finalObstacle: { char: 'O' },
    contextActions: [
      { target: 'O', label: '돌 살펴보기', action: 'g7-inspect-obstacle', unless: 'g7ObstacleIdentified' },
      { target: 'O', label: '돌 치우기', action: 'g7-clear-obstacle', priority: 100, requires: 'g7ObstacleIdentified', unless: 'g7ObstacleCleared' }
    ],
    milestone: 'gate-core',
    story: '소년은 두 대의 수레를 이끌고 초소를 거쳐 북쪽 길에 도착했다.'
  });

  const gate = WORLD?.regions?.find(region => region.id === 'gate-town');
  if (gate) {
    for (const word of ['跟隨','帶領']) if (!gate.targets.includes(word)) gate.targets.push(word);
  }
})();
