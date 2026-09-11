/* Follower mechanic. G6 keeps the player on the hero while a cart follows the hero's physical trail. */
(() => {
  const samePosition = (a, b) => Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
  const manhattan = (a, b) => Array.isArray(a) && Array.isArray(b) ? Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) : Infinity;
  const tileIn = (grid, pos) => grid?.[pos?.[0]]?.[pos?.[1]];
  function followerStep({ grid, follower, leaderFrom, blockedChars = ['#', 'X', '='] }) {
    if (!Array.isArray(follower) || !Array.isArray(leaderFrom)) return { pos: follower, moved: false, reason: 'invalid', tile: null };
    if (manhattan(follower, leaderFrom) !== 1) return { pos: [...follower], moved: false, reason: 'disconnected', tile: tileIn(grid, leaderFrom) };
    const tile = tileIn(grid, leaderFrom);
    if (!tile) return { pos: [...follower], moved: false, reason: 'outside', tile };
    if (blockedChars.includes(tile)) return { pos: [...follower], moved: false, reason: 'blocked', tile };
    return { pos: [...leaderFrom], moved: true, reason: null, tile };
  }
  function formationAtGoal({ grid, leader, follower, leaderGoalChar = 'E', followerGoal }) {
    return tileIn(grid, leader) === leaderGoalChar && samePosition(follower, followerGoal);
  }

  globalThis.FollowerMechanic = Object.freeze({ samePosition, manhattan, tileIn, followerStep, formationAtGoal });

  if (typeof current !== 'function' || typeof render !== 'function' || typeof attemptMove !== 'function') return;

  const cfgFor = st => st.follower || null;
  const currentFollower = () => state?.followerPos;
  const atFollowerGoal = (st = current(), cfg = cfgFor(st)) => !!cfg && formationAtGoal({
    grid: st.grid,
    leader: state.hero,
    follower: currentFollower(),
    leaderGoalChar: cfg.leaderGoalChar || 'E',
    followerGoal: cfg.followerGoal
  });

  const baseInitialState = initialState;
  initialState = function followerInitialState(st) {
    const next = baseInitialState(st), cfg = cfgFor(st);
    if (cfg) Object.assign(next, {
      followerPos: locate(st.grid, cfg.char || 'C'),
      followerMoved: false,
      followed: false,
      led: false,
      followerStuck: false,
      followerStuckReason: null
    });
    return next;
  };

  const baseIsWin = isWin;
  isWin = function followerIsWin() {
    const base = baseIsWin(), st = current(), cfg = cfgFor(st);
    return st.win.includes('follower_at_exit') ? base && atFollowerGoal(st, cfg) : base;
  };

  const baseAcceptedMove = acceptedMove;
  acceptedMove = function followerAcceptedMove(pos) {
    const st = current(), cfg = cfgFor(st);
    if (cfg && samePosition(pos, currentFollower())) return false;
    return baseAcceptedMove(pos);
  };

  const baseRenderGoal = renderGoal;
  renderGoal = function followerRenderGoal() {
    baseRenderGoal();
    const st = current();
    if (!cfgFor(st)) return;
    let goal = st.goal;
    goal = markGoal(goal, '帶領', !!state.led);
    goal = markGoal(goal, '跟隨', !!state.followed);
    $('#goal').innerHTML = goal;
  };

  const baseDescTile = descTile;
  descTile = function followerDescTile(ch, pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return baseDescTile(ch, pos);
    if (samePosition(pos, currentFollower())) return '소년을 따라오는 짐수레';
    if (ch === cfg.char) return '길';
    if (ch === cfg.narrowChar) return '사람은 지나갈 수 있지만 짐수레는 지나갈 수 없는 좁은 길';
    return baseDescTile(ch, pos);
  };

  function finishFollowerStage(st) {
    if (stageSession.mode !== 'replay') completed.add(st.id);
    window.GameFlow?.recordStageComplete(st.id, stageSession);
    save(); render();
    setStatus('少年帶領貨車到了北口。貨車一路跟隨少年。 소년이 수레를 북쪽 길까지 이끌었어.', 'good');
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === st.id && isWin()) showComplete();
    }, 160);
  }

  const baseAttemptMove = attemptMove;
  attemptMove = function followerAttemptMove(pos, isWait) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg || isWait) return baseAttemptMove(pos, isWait);
    if (samePosition(pos, currentFollower())) {
      setStatus('이번에는 수레를 직접 움직이지 않아. 소년이 앞장서면 수레가 그 뒤를 따라와.', 'info');
      return;
    }

    const oldHero = clone(state.hero), oldFollower = clone(currentFollower()), hadFollowed = !!state.followed, oldTurn = state.turn;
    const result = baseAttemptMove(pos, isWait);
    if (samePosition(oldHero, state.hero) || state.turn === oldTurn) return result;

    const step = followerStep({
      grid: st.grid,
      follower: oldFollower,
      leaderFrom: oldHero,
      blockedChars: cfg.blockedChars || ['#', 'X', cfg.narrowChar || '=']
    });
    state.followerPos = clone(step.pos);
    state.followerStuck = !step.moved;
    state.followerStuckReason = step.reason;
    if (step.moved) {
      state.followerMoved = true;
      state.followed = true;
      state.led = true;
    }

    if (isWin()) {
      finishFollowerStage(st);
      return result;
    }

    save(); render();
    if (step.moved) {
      setStatus(hadFollowed ? '貨車跟隨少年，又往前走了一格。 수레가 소년의 자취를 한 칸 따라왔어.' : '貨車跟隨少年。少年正在帶領貨車。 수레가 소년의 자취를 따라오기 시작했어.', 'good');
    } else if (step.reason === 'blocked' && step.tile === cfg.narrowChar) {
      setStatus('貨車沒有跟上。這條窄路人能走，貨車不能走。 수레도 지나갈 수 있는 길로 다시 이끌어야 해.', 'info');
    } else if (step.reason === 'disconnected') {
      setStatus('貨車還沒跟上。 수레와 자취가 끊겼어. 수레 가까이 돌아가 통과할 수 있는 길에서 다시 앞장서봐.', 'info');
    } else {
      setStatus('貨車停在原地。 수레가 그 길은 따라갈 수 없어.', 'info');
    }
    return result;
  };

  const baseRender = render;
  render = function followerRender() {
    baseRender();
    const st = current(), cfg = cfgFor(st);
    if (!cfg || !Array.isArray(currentFollower())) return;
    const cols = st.grid[0].length;

    for (let r = 0; r < st.grid.length; r++) for (let c = 0; c < cols; c++) {
      if (st.grid[r][c] !== cfg.narrowChar) continue;
      const cell = gridEl.children[r * cols + c];
      if (!cell) continue;
      cell.classList.add('follower-narrow');
      if (!cell.querySelector('.follower-narrow-mark')) {
        const mark = document.createElement('span');
        mark.className = 'follower-narrow-mark'; mark.textContent = '窄'; mark.setAttribute('aria-hidden', 'true'); cell.appendChild(mark);
      }
    }

    const [r, c] = currentFollower(), cell = gridEl.children[r * cols + c];
    if (cell) {
      cell.classList.add('follower-cart-cell');
      if (state.followerStuck) cell.classList.add('follower-cart-stuck');
      if (!cell.querySelector('.follower-cart-mark')) {
        const mark = document.createElement('span'); mark.className = 'follower-cart-mark'; mark.textContent = '車'; mark.setAttribute('aria-hidden', 'true'); cell.appendChild(mark);
      }
    }

    $('#words').querySelectorAll('.wordbtn').forEach(button => {
      if (button.textContent === '跟隨' && state.followed) button.classList.add('done');
      if (button.textContent === '帶領' && state.led) button.classList.add('done');
    });
  };

  const baseShowInspect = showInspect;
  showInspect = function followerShowInspect(pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return baseShowInspect(pos);
    if (tileAt(pos) === cfg.narrowChar) {
      openSheet('<h2>窄路</h2><div class="meaning">좁은 지름길</div><div class="gamerule"><strong>이 길의 성질</strong><br>人可以通過，貨車不能通過。<br>사람은 지나갈 수 있지만 짐수레는 지나갈 수 없어.</div><div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>');
      return;
    }
    if (samePosition(pos, currentFollower())) {
      openSheet('<h2>貨車</h2><div class="meaning">따라오는 짐수레</div><div class="gamerule">이번 판에서는 수레를 직접 조작하지 않아. 소년이 통과 가능한 길을 앞장서면 수레가 소년이 방금 떠난 칸을 따라와.</div><div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>');
      return;
    }
    return baseShowInspect(pos);
  };

  const baseTapCell = tapCell;
  tapCell = function followerTapCell(pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg || inspect) return baseTapCell(pos);
    if (samePosition(pos, currentFollower())) {
      setStatus('這次不用直接移動貨車。少年走在前面，貨車會跟隨。 이번에는 소년만 움직여.', 'info');
      return;
    }
    return baseTapCell(pos);
  };
})();
