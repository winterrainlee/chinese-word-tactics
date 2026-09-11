/* G7 finale obstacle: reuses the G4 lesson without turning the finale into another investigation puzzle. */
(() => {
  if (typeof current !== 'function' || typeof render !== 'function' || typeof showInspect !== 'function') return;

  const cfgFor = st => st.finalObstacle || null;
  const obstaclePos = st => locate(st.grid, cfgFor(st)?.char || 'O');

  const baseInitialState = initialState;
  initialState = function g7InitialState(st) {
    const next = baseInitialState(st);
    if (cfgFor(st)) Object.assign(next, { g7ObstacleIdentified: false, g7ObstacleCleared: false });
    return next;
  };

  const baseAcceptedMove = acceptedMove;
  acceptedMove = function g7AcceptedMove(pos) {
    const st = current(), cfg = cfgFor(st);
    if (cfg && tileAt(pos) === cfg.char && !state.g7ObstacleCleared) return false;
    return baseAcceptedMove(pos);
  };

  const baseAttemptMove = attemptMove;
  attemptMove = function g7AttemptMove(pos, isWait) {
    const st = current(), cfg = cfgFor(st);
    if (cfg && !isWait && tileAt(pos) === cfg.char && !state.g7ObstacleCleared) {
      setStatus('前面有障礙。 돌이 길을 막고 있어. 가까이 가서 살펴보면 치울 수 있을지 알 수 있어.', 'info');
      return;
    }
    return baseAttemptMove(pos, isWait);
  };

  const baseDescTile = descTile;
  descTile = function g7DescTile(ch, pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return baseDescTile(ch, pos);
    if (ch === cfg.char) return state.g7ObstacleCleared ? '돌을 치운 서쪽 길' : '서쪽 길을 막는 돌';
    if (ch === 'N') return '북쪽 길 · 행렬의 목적지';
    return baseDescTile(ch, pos);
  };

  const baseRender = render;
  render = function g7Render() {
    baseRender();
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return;
    const cols = st.grid[0].length;
    const goalChar = st.followerChain?.leaderGoalChar || 'N';
    const goalPos = locate(st.grid, goalChar);
    if (goalPos) gridEl.children[goalPos[0] * cols + goalPos[1]]?.classList.add('exit', 'g7-goal');

    const pos = obstaclePos(st);
    if (!pos) return;
    const cell = gridEl.children[pos[0] * cols + pos[1]];
    if (!cell) return;
    cell.classList.add(state.g7ObstacleCleared ? 'g7-obstacle-cleared' : 'g7-obstacle');
    if (!state.g7ObstacleCleared && !cell.querySelector('.g7-obstacle-mark')) {
      const mark = document.createElement('span');
      mark.className = 'g7-obstacle-mark'; mark.textContent = '●'; mark.setAttribute('aria-hidden', 'true'); cell.appendChild(mark);
    }
  };

  const handlers = globalThis.ContextActionHandlers = globalThis.ContextActionHandlers || {};
  handlers['g7-inspect-obstacle'] = pos => {
    const st = current(), cfg = cfgFor(st);
    if (!cfg || dist(state.hero, pos) !== 1 || state.g7ObstacleCleared) return;
    state.g7ObstacleIdentified = true;
    save(); render();
    setStatus('石頭擋住西路，這就是障礙。 이 돌은 서쪽 길을 실제로 막고 있는 障礙야. 동쪽으로 돌아가도 되고, 치우고 서쪽으로 가도 돼.', 'info');
  };
  handlers['g7-clear-obstacle'] = pos => {
    const st = current(), cfg = cfgFor(st);
    if (!cfg || dist(state.hero, pos) !== 1 || !state.g7ObstacleIdentified || state.g7ObstacleCleared) return;
    history.push(clone(state));
    state.g7ObstacleCleared = true;
    save(); render();
    setStatus('障礙移開了。 돌을 길가로 밀어내서 서쪽 길도 수레가 지나갈 수 있게 됐어.', 'good');
  };

  const baseShowInspect = showInspect;
  showInspect = function g7ShowInspect(pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg || tileAt(pos) !== cfg.char) return baseShowInspect(pos);
    if (dist(state.hero, pos) !== 1) {
      setStatus('돌은 가까이 가서 봐야 길을 얼마나 막고 있는지 알 수 있어.', 'info');
      return;
    }
    if (!state.g7ObstacleIdentified) return handlers['g7-inspect-obstacle'](pos);
    if (!state.g7ObstacleCleared) return handlers['g7-clear-obstacle'](pos);
    openSheet('<h2>치운 돌</h2><div class="meaning">서쪽 길 옆으로 밀어낸 장애물</div><div class="gamerule">이제 소년과 수레가 모두 이 칸을 지나갈 수 있어.</div><div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>');
  };
})();
