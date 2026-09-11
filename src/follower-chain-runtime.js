/* Follower-chain extension. Reuses the one-step follower rule for G7's two-cart convoy. */
(() => {
  const F = globalThis.FollowerMechanic;
  if (!F) return;

  const samePosition = F.samePosition;
  const tileIn = F.tileIn;
  function directionFromStep(from, to) {
    if (!Array.isArray(from) || !Array.isArray(to)) return null;
    const dr = to[0] - from[0], dc = to[1] - from[1];
    if (dr === -1 && dc === 0) return 'north';
    if (dr === 1 && dc === 0) return 'south';
    if (dr === 0 && dc === -1) return 'west';
    if (dr === 0 && dc === 1) return 'east';
    return null;
  }
  function followerChainStep({ grid, followers = [], leaderFrom, blockedChars = ['#'] }) {
    const next = followers.map(pos => Array.isArray(pos) ? [...pos] : pos);
    const directions = followers.map(() => null);
    let target = Array.isArray(leaderFrom) ? [...leaderFrom] : leaderFrom;
    let previousMoved = true, movedCount = 0, stopReason = null, stopTile = null;

    for (let i = 0; i < followers.length; i++) {
      if (!previousMoved) continue;
      const step = F.followerStep({ grid, follower: followers[i], leaderFrom: target, blockedChars });
      next[i] = Array.isArray(step.pos) ? [...step.pos] : step.pos;
      if (!step.moved) {
        previousMoved = false;
        stopReason = step.reason;
        stopTile = step.tile;
        continue;
      }
      movedCount++;
      directions[i] = directionFromStep(followers[i], step.pos);
      target = [...followers[i]];
    }
    return { positions: next, directions, movedCount, allMoved: movedCount === followers.length, reason: stopReason, tile: stopTile };
  }

  function followerChainAtGoal({ grid, leader, followers = [], leaderGoalChar = 'N', followerGoalCells = [] }) {
    if (tileIn(grid, leader) !== leaderGoalChar || followers.length !== followerGoalCells.length) return false;
    return followers.every((pos, index) => Array.isArray(followerGoalCells[index]) &&
      followerGoalCells[index].some(goal => samePosition(pos, goal)));
  }

  globalThis.FollowerChainMechanic = Object.freeze({ directionFromStep, followerChainStep, followerChainAtGoal });

  if (typeof current !== 'function' || typeof render !== 'function' || typeof attemptMove !== 'function') return;

  const cfgFor = st => st.followerChain || null;
  let pendingStepDirections = [];
  const positions = () => Array.isArray(state?.followerPositions) ? state.followerPositions : [];
  const atGoal = (st = current(), cfg = cfgFor(st)) => !!cfg && followerChainAtGoal({
    grid: st.grid,
    leader: state.hero,
    followers: positions(),
    leaderGoalChar: cfg.leaderGoalChar || 'N',
    followerGoalCells: cfg.followerGoalCells || []
  });
  const blockedNow = cfg => {
    const blocked = [...(cfg.blockedChars || ['#'])];
    if (cfg.clearableChar && cfg.clearableFlag && state?.[cfg.clearableFlag]) {
      return blocked.filter(ch => ch !== cfg.clearableChar);
    }
    return blocked;
  };

  const baseInitialState = initialState;
  initialState = function followerChainInitialState(st) {
    const next = baseInitialState(st), cfg = cfgFor(st);
    if (cfg) Object.assign(next, {
      followerPositions: (cfg.chars || []).map(ch => locate(st.grid, ch)),
      followerDirections: (cfg.chars || []).map(() => 'north'),
      chainFollowed: false,
      chainLed: false,
      chainStuck: false,
      chainStuckReason: null
    });
    return next;
  };

  const baseIsWin = isWin;
  isWin = function followerChainIsWin() {
    const base = baseIsWin(), st = current(), cfg = cfgFor(st);
    return st.win.includes('follower_chain_at_exit') ? base && atGoal(st, cfg) : base;
  };

  const baseAcceptedMove = acceptedMove;
  acceptedMove = function followerChainAcceptedMove(pos) {
    const cfg = cfgFor(current());
    if (cfg && positions().some(follower => samePosition(pos, follower))) return false;
    return baseAcceptedMove(pos);
  };

  const baseDescTile = descTile;
  descTile = function followerChainDescTile(ch, pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return baseDescTile(ch, pos);
    const index = positions().findIndex(follower => samePosition(pos, follower));
    if (index >= 0) return index === 0 ? '행렬의 첫 번째 짐수레' : '행렬의 두 번째 짐수레';
    if ((cfg.chars || []).includes(ch)) return '길';
    if (ch === (cfg.leaderGoalChar || 'N')) return '북쪽 길 · 행렬의 목적지';
    return baseDescTile(ch, pos);
  };

  function finishChainStage(st) {
    if (stageSession.mode !== 'replay') {
      completed.add(st.id);
    }
    window.GameFlow?.recordStageComplete(st.id, stageSession);
    save(); render();
    setStatus('整隊都到了北路。少年帶領兩輛貨車，貨車一路跟隨。 행렬 전체가 북쪽 길에 도착했어.', 'good');
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === st.id && isWin()) showComplete();
    }, 180);
  }

  const baseAttemptMove = attemptMove;
  attemptMove = function followerChainAttemptMove(pos, isWait) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg || isWait) return baseAttemptMove(pos, isWait);
    if (positions().some(follower => samePosition(pos, follower))) {
      setStatus('행렬의 수레를 직접 움직이지 않아. 소년이 앞장서면 뒤의 수레들이 차례로 따라와.', 'info');
      return;
    }

    const oldHero = clone(state.hero), oldFollowers = clone(positions()), beforeTurn = state.turn;
    const result = baseAttemptMove(pos, isWait);
    if (samePosition(oldHero, state.hero) || state.turn === beforeTurn) return result;

    const step = followerChainStep({ grid: st.grid, followers: oldFollowers, leaderFrom: oldHero, blockedChars: blockedNow(cfg) });
    state.followerPositions = clone(step.positions);
    const oldDirections = Array.isArray(state.followerDirections) ? state.followerDirections : [];
    state.followerDirections = step.directions.map((direction, index) => direction || oldDirections[index] || 'north');
    pendingStepDirections = step.directions.map(direction => direction || null);
    state.chainStuck = !step.allMoved;
    state.chainStuckReason = step.reason;
    if (step.movedCount > 0) {
      state.chainFollowed = true;
      state.chainLed = true;
    }

    if (isWin()) {
      finishChainStage(st);
      return result;
    }

    save(); render();
    if (step.allMoved) {
      setStatus('車隊跟隨少年前進。 소년이 앞장서고 두 수레가 차례로 자취를 따라왔어.', 'good');
    } else if (step.reason === 'disconnected') {
      setStatus('後面的貨車還沒跟上。 행렬의 자취가 끊겼어. 수레 가까이 돌아가 이어지는 길을 다시 만들어봐.', 'info');
    } else {
      setStatus('車隊有一輛停下來了。 뒤의 수레까지 지나갈 수 있는 길인지 다시 살펴봐.', 'info');
    }
    return result;
  };

  const baseRender = render;
  render = function followerChainRender() {
    baseRender();
    const st = current(), cfg = cfgFor(st);
    if (!cfg || !positions().length) return;
    const cols = st.grid[0].length;

    positions().forEach((pos, index) => {
      if (!Array.isArray(pos)) return;
      const cell = gridEl.children[pos[0] * cols + pos[1]];
      if (!cell) return;
      cell.classList.add('follower-chain-cart');
      if (state.chainStuck) cell.classList.add('follower-chain-stuck');
      const mark = document.createElement('span');
      const direction = state.followerDirections?.[index] || 'north';
      const stepDirection = pendingStepDirections[index];
      mark.className = `follower-chain-mark follower-chain-direction-${direction}${stepDirection ? ' follower-chain-moving' : ''}`;
      mark.dataset.direction = direction;
      mark.textContent = '車'; mark.setAttribute('aria-hidden', 'true'); cell.appendChild(mark);
      const badge = document.createElement('small');
      badge.className = 'follower-chain-badge'; badge.textContent = String(index + 1); badge.setAttribute('aria-hidden', 'true'); cell.appendChild(badge);
    });
    pendingStepDirections = [];

    $('#words').querySelectorAll('.wordbtn').forEach(button => {
      if (button.textContent === '跟隨' && state.chainFollowed) button.classList.add('done');
      if (button.textContent === '帶領' && state.chainLed) button.classList.add('done');
    });
  };

  const baseShowInspect = showInspect;
  showInspect = function followerChainShowInspect(pos) {
    const cfg = cfgFor(current());
    if (!cfg) return baseShowInspect(pos);
    const index = positions().findIndex(follower => samePosition(pos, follower));
    if (index >= 0) {
      openSheet(`<h2>貨車 ${index + 1}</h2><div class="meaning">행렬의 ${index + 1}번째 수레</div><div class="gamerule">소년만 움직이면 앞 수레는 소년의 자취를, 뒤 수레는 앞 수레의 자취를 차례로 따라와.</div><div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>`);
      return;
    }
    return baseShowInspect(pos);
  };

  const baseTapCell = tapCell;
  tapCell = function followerChainTapCell(pos) {
    const cfg = cfgFor(current());
    if (!cfg || inspect) return baseTapCell(pos);
    if (positions().some(follower => samePosition(pos, follower))) {
      setStatus('이번에도 소년만 움직여. 첫 수레가 소년을, 둘째 수레가 첫 수레를 따라와.', 'info');
      return;
    }
    return baseTapCell(pos);
  };
})();
