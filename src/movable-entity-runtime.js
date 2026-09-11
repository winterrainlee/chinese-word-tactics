/* Movable-entity mechanic. G5 lets the player directly reposition a cart without turning words into command buttons. */
(() => {
  const samePosition = (a, b) => Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
  const facingDelta = facing => ({ north: [-1, 0], south: [1, 0], west: [0, -1], east: [0, 1] })[facing] || [-1, 0];
  function directionForStep(from, to, facing = 'north') {
    if (!Array.isArray(from) || !Array.isArray(to)) return null;
    const dr = to[0] - from[0], dc = to[1] - from[1], [fr, fc] = facingDelta(facing);
    if (Math.abs(dr) + Math.abs(dc) !== 1) return null;
    if (dr === fr && dc === fc) return 'forward';
    if (dr === -fr && dc === -fc) return 'backward';
    return null;
  }
  const tileIn = (grid, pos) => grid?.[pos?.[0]]?.[pos?.[1]];
  function doorSwingIsClear({ swingCell, cart, hero }) {
    if (!Array.isArray(swingCell)) return true;
    return !samePosition(cart, swingCell) && !samePosition(hero, swingCell);
  }
  function movementCheck({ grid, from, to, hero, facing = 'north', blockedChars = ['#'], doorChar = 'D', doorOpen = false }) {
    const direction = directionForStep(from, to, facing);
    if (!direction) return { allowed: false, reason: 'axis', direction: null };
    const tile = tileIn(grid, to);
    if (!tile) return { allowed: false, reason: 'outside', direction };
    if (samePosition(hero, to)) return { allowed: false, reason: 'hero', direction, tile };
    if (blockedChars.includes(tile)) return { allowed: false, reason: 'blocked', direction, tile };
    if (tile === doorChar && !doorOpen) return { allowed: false, reason: 'door', direction, tile };
    return { allowed: true, reason: null, direction, tile };
  }
  const isAtGoal = (pos, grid, goalChar = 'E') => tileIn(grid, pos) === goalChar;

  globalThis.MovableEntityMechanic = Object.freeze({ samePosition, facingDelta, directionForStep, movementCheck, isAtGoal, doorSwingIsClear });

  if (typeof current !== 'function' || typeof render !== 'function' || typeof tapCell !== 'function') return;

  const cfgFor = st => st.movableEntity || null;
  const doorPos = (st, cfg) => locate(st.grid, cfg?.door?.char || 'D');
  const currentCart = () => state?.movablePos;
  const cartAtGoal = (st = current(), cfg = cfgFor(st)) => !!cfg && isAtGoal(currentCart(), st.grid, cfg.goalChar || 'E');
  const doorClearNow = (cfg, cart = currentCart(), hero = state?.hero) => doorSwingIsClear({
    swingCell: cfg?.door?.swingCell,
    cart,
    hero
  });
  const doorBlockedBy = (cfg, cart = currentCart(), hero = state?.hero) => {
    if (samePosition(cart, cfg?.door?.swingCell)) return 'cart';
    if (samePosition(hero, cfg?.door?.swingCell)) return 'hero';
    return null;
  };

  const baseInitialState = initialState;
  initialState = function movableInitialState(st) {
    const next = baseInitialState(st), cfg = cfgFor(st);
    if (cfg) {
      const start = locate(st.grid, cfg.char || 'C');
      Object.assign(next, {
        movablePos: start,
        controlEntity: 'hero',
        movableMoved: false,
        movableAdvanced: false,
        movableRetreated: false,
        doorInspected: false,
        doorOpen: false,
        doorClear: doorClearNow(cfg, start, next.hero)
      });
    }
    return next;
  };

  const baseIsWin = isWin;
  isWin = function movableIsWin() {
    const base = baseIsWin(), st = current(), cfg = cfgFor(st);
    return st.win.includes('cart_at_exit') ? base && cartAtGoal(st, cfg) : base;
  };

  const baseAcceptedMove = acceptedMove;
  acceptedMove = function movableAcceptedMove(pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return baseAcceptedMove(pos);
    if (state.controlEntity === 'cart') return false;
    if (samePosition(pos, currentCart())) return false;
    if (tileAt(pos) === cfg.door?.char && !state.doorOpen) return false;
    return baseAcceptedMove(pos);
  };

  const baseAttemptMove = attemptMove;
  attemptMove = function movableHeroMove(pos, isWait) {
    const st = current(), cfg = cfgFor(st);
    if (cfg && !isWait) {
      if (samePosition(pos, currentCart())) {
        setStatus('수레가 있는 칸으로는 들어갈 수 없어. 수레를 누르면 수레를 움직일 수 있어.', 'info');
        return;
      }
      if (tileAt(pos) === cfg.door?.char && !state.doorOpen) {
        setStatus('문이 아직 닫혀 있어. 가까이 가서 문을 살펴봐.', 'info');
        return;
      }
    }
    return baseAttemptMove(pos, isWait);
  };

  const baseRenderGoal = renderGoal;
  renderGoal = function movableRenderGoal() {
    baseRenderGoal();
    const st = current();
    if (!cfgFor(st)) return;
    let goal = st.goal;
    goal = markGoal(goal, '移動', !!state.movableMoved);
    $('#goal').innerHTML = goal;
  };

  const baseDescTile = descTile;
  descTile = function movableDescTile(ch, pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return baseDescTile(ch, pos);
    if (samePosition(pos, currentCart())) return '북쪽을 향한 짐수레';
    if (ch === cfg.char) return '길';
    if (ch === cfg.door?.char) return state.doorOpen ? '열린 좁은 문' : '안쪽으로 열리는 좁은 문';
    return baseDescTile(ch, pos);
  };

  function checkCartMove(to) {
    const st = current(), cfg = cfgFor(st);
    return movementCheck({
      grid: st.grid,
      from: currentCart(),
      to,
      hero: state.hero,
      facing: cfg.facing || 'north',
      blockedChars: cfg.blockedChars || ['#'],
      doorChar: cfg.door?.char || 'D',
      doorOpen: !!state.doorOpen
    });
  }

  function finishCartStage(st) {
    if (stageSession.mode !== 'replay') completed.add(st.id);
    window.GameFlow?.recordStageComplete(st.id, stageSession);
    save(); render();
    setStatus('貨車前進到北邊了。 수레가 좁은 문을 지나 북쪽 길에 도착했어.', 'good');
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === st.id && isWin()) showComplete();
    }, 160);
  }

  function moveCart(to) {
    const st = current(), cfg = cfgFor(st), check = checkCartMove(to);
    if (!check.allowed) {
      if (check.reason === 'door') setStatus('門還沒打開。貨車不能前進。 문이 닫혀 있어서 수레가 앞으로 갈 수 없어.', 'info');
      else if (check.reason === 'hero') setStatus('소년이 그 자리에 있어. 수레를 움직이려면 먼저 비켜야 해.', 'info');
      else if (check.reason === 'axis') setStatus('貨車只能前進或後退。 수레는 지금 방향에서 앞이나 뒤로만 움직일 수 있어.', 'info');
      else setStatus('그쪽으로는 수레를 움직일 수 없어.', 'info');
      return false;
    }

    history.push(clone(state));
    state.movablePos = clone(to);
    state.controlEntity = 'cart';
    state.movableMoved = true;
    if (check.direction === 'forward') state.movableAdvanced = true;
    if (check.direction === 'backward') state.movableRetreated = true;
    state.doorClear = doorClearNow(cfg, state.movablePos);
    state.turn++;

    if (isWin()) {
      finishCartStage(st);
      return true;
    }
    save(); render();
    setStatus(check.direction === 'forward' ? '貨車前進了一格。 수레가 한 칸 앞으로 움직였어.' : '貨車後退了一格。 수레가 한 칸 뒤로 움직였어.', 'good');
    return true;
  }

  const baseRender = render;
  render = function movableRender() {
    const beforeStage = current(), beforeCfg = cfgFor(beforeStage);
    if (beforeCfg) state.doorClear = doorClearNow(beforeCfg);
    baseRender();
    const st = current(), cfg = cfgFor(st);
    if (!cfg || !Array.isArray(currentCart())) return;
    const cols = st.grid[0].length;

    const dpos = doorPos(st, cfg);
    if (dpos) {
      const cell = gridEl.children[dpos[0] * cols + dpos[1]];
      if (cell) {
        cell.classList.add('movable-door');
        if (state.doorOpen) cell.classList.add('movable-door-open');
        if (!cell.querySelector('.movable-door-mark')) {
          const mark = document.createElement('span');
          mark.className = 'movable-door-mark';
          mark.textContent = state.doorOpen ? '開' : '門';
          mark.setAttribute('aria-hidden', 'true');
          cell.appendChild(mark);
        }
      }
    }

    const swingPos = cfg.door?.swingCell;
    if (!state.doorOpen && state.doorInspected && Array.isArray(swingPos)) {
      const swingCell = gridEl.children[swingPos[0] * cols + swingPos[1]];
      if (swingCell) {
        swingCell.classList.add('movable-door-swing');
        swingCell.classList.add(state.doorClear ? 'movable-door-swing-clear' : 'movable-door-swing-blocked');
        const cue = document.createElement('span');
        cue.className = 'movable-door-swing-cue';
        cue.textContent = '↓';
        cue.setAttribute('aria-hidden', 'true');
        swingCell.appendChild(cue);
      }
    }

    const [r, c] = currentCart(), cartCell = gridEl.children[r * cols + c];
    if (cartCell) {
      cartCell.classList.add('movable-entity-cell');
      if (state.controlEntity === 'cart') cartCell.classList.add('movable-entity-selected');
      if (!cartCell.querySelector('.movable-cart-mark')) {
        const mark = document.createElement('span');
        mark.className = 'movable-cart-mark';
        mark.textContent = '車';
        mark.setAttribute('aria-hidden', 'true');
        cartCell.appendChild(mark);
      }
    }

    if (state.controlEntity === 'cart' && !isWin()) {
      const [fr, fc] = facingDelta(cfg.facing || 'north');
      [
        { pos: [r + fr, c + fc], word: '前進', arrow: fr < 0 ? '↑' : fr > 0 ? '↓' : fc < 0 ? '←' : '→' },
        { pos: [r - fr, c - fc], word: '後退', arrow: fr < 0 ? '↓' : fr > 0 ? '↑' : fc < 0 ? '→' : '←' }
      ].forEach(option => {
        if (!checkCartMove(option.pos).allowed) return;
        const cell = gridEl.children[option.pos[0] * cols + option.pos[1]];
        if (!cell) return;
        cell.classList.add('entity-moveable');
        const label = document.createElement('span');
        label.className = 'entity-move-label';
        label.innerHTML = `<b>${option.arrow}</b><small>${option.word}</small>`;
        label.setAttribute('aria-hidden', 'true');
        cell.appendChild(label);
      });
    }

    $('#words').querySelectorAll('.wordbtn').forEach(button => {
      if (button.textContent === '移動' && state.movableMoved) button.classList.add('done');
      if (button.textContent === '前進' && state.movableAdvanced) button.classList.add('done');
      if (button.textContent === '後退' && state.movableRetreated) button.classList.add('done');
    });
  };

  const handlers = globalThis.ContextActionHandlers = globalThis.ContextActionHandlers || {};
  handlers['g5-inspect-door'] = pos => {
    const st = current(), cfg = cfgFor(st);
    if (!cfg || dist(state.hero, pos) !== 1) return;
    state.doorInspected = true;
    state.doorClear = doorClearNow(cfg);
    save(); render();
    const blockedBy = doorBlockedBy(cfg);
    if (!blockedBy) setStatus('這扇門往裡開。門後的空間現在是空的。 문은 아래쪽 표시 칸으로 열려. 문 옆에서 열면 돼.', 'info');
    else if (blockedBy === 'hero') setStatus('你站在開門的位置上。先移到門旁。 소년이 문이 열릴 칸에 서 있어. 문 옆으로 비켜야 해.', 'info');
    else setStatus('這扇門往裡開。貨車正停在開門的位置，所以現在打不開。 문이 열릴 칸을 수레가 막고 있어.', 'info');
  };
  handlers['g5-open-door'] = pos => {
    const st = current(), cfg = cfgFor(st);
    if (!cfg || state.doorOpen || !state.doorInspected || !doorClearNow(cfg) || dist(state.hero, pos) !== 1) return;
    history.push(clone(state));
    state.doorOpen = true;
    state.doorClear = true;
    save(); render();
    setStatus('門打開了。 좁은 문이 안쪽으로 열렸어. 이제 수레가 지나갈 수 있어.', 'good');
  };

  const baseShowInspect = showInspect;
  showInspect = function movableShowInspect(pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return baseShowInspect(pos);
    if (tileAt(pos) === cfg.door?.char) {
      if (dist(state.hero, pos) !== 1) {
        setStatus('문은 가까이 가야 어떻게 열리는지 확인할 수 있어.', 'info');
        return;
      }
      if (!state.doorInspected) return handlers['g5-inspect-door'](pos);
      if (!state.doorOpen && doorClearNow(cfg)) return handlers['g5-open-door'](pos);
      const blockedBy = doorBlockedBy(cfg);
      if (state.doorOpen) setStatus('문이 열려 있어. 수레가 지나갈 수 있어.', 'info');
      else if (blockedBy === 'hero') setStatus('소년이 문이 열릴 칸에 서 있어. 문 옆으로 비켜야 해.', 'info');
      else setStatus('문은 표시된 칸으로 열려. 지금은 수레가 그 자리를 막고 있어.', 'info');
      return;
    }
    return baseShowInspect(pos);
  };

  const baseTapCell = tapCell;
  tapCell = function movableTapCell(pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg || inspect) return baseTapCell(pos);
    if (samePosition(pos, currentCart())) {
      state.controlEntity = 'cart';
      selected = true;
      save(); render();
      setStatus('貨車를 선택했어. 표시된 앞·뒤 칸을 눌러 前進 또는 後退할 수 있어. 소년을 누르면 다시 소년을 움직여.', 'info');
      return;
    }
    if (state.controlEntity === 'cart') {
      if (samePosition(pos, state.hero)) {
        state.controlEntity = 'hero';
        save(); render();
        setStatus('다시 소년을 움직이는 중이야.', 'info');
        return;
      }
      moveCart(pos);
      return;
    }
    return baseTapCell(pos);
  };
})();
