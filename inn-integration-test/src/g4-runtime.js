/* G4 investigation mechanic: read position, inspect surroundings, identify and clear an obstacle. */
(() => {
  const manhattan = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const isAround = (target, center, radius = 1) => Array.isArray(target) && Array.isArray(center) && manhattan(target, center) <= radius;
  globalThis.G4Mechanic = Object.freeze({ manhattan, isAround });

  if (typeof current !== 'function' || typeof render !== 'function' || typeof showInspect !== 'function') return;

  const cfgFor = st => st.investigation || null;
  const solidChars = st => [cfgFor(st)?.cartChar, cfgFor(st)?.obstacleChar, ...(cfgFor(st)?.nearbyChars || [])].filter(Boolean);
  function finishIfReady(st, message, type = 'info') {
    save(); render();
    setStatus(message, type);
    if (!isWin()) return;
    if (stageSession.mode !== 'replay') completed.add(st.id);
    window.GameFlow?.recordStageComplete(st.id, stageSession);
    save();
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === st.id && isWin()) showComplete();
    }, 160);
  }

  const baseInitialState = initialState;
  initialState = function investigationInitialState(st) {
    const next = baseInitialState(st);
    if (cfgFor(st)) Object.assign(next, {
      positionObserved: false,
      surroundingsObserved: false,
      obstacleIdentified: false,
      obstacleCleared: false,
      observedNearby: []
    });
    return next;
  };

  const baseIsWin = isWin;
  isWin = function investigationIsWin() {
    const base = baseIsWin(), st = current();
    if (!st.win.includes('obstacle_cleared')) return base;
    return base && !!state.positionObserved && !!state.surroundingsObserved && !!state.obstacleCleared;
  };

  const baseAcceptedMove = acceptedMove;
  acceptedMove = function investigationAcceptedMove(pos) {
    const st = current(), cfg = cfgFor(st), ch = tileAt(pos);
    if (cfg && solidChars(st).includes(ch) && !(ch === cfg.obstacleChar && state.obstacleCleared)) return false;
    return baseAcceptedMove(pos);
  };

  const baseAttemptMove = attemptMove;
  attemptMove = function investigationAttemptMove(pos, isWait) {
    const st = current(), cfg = cfgFor(st), ch = tileAt(pos);
    if (cfg && !isWait && solidChars(st).includes(ch) && !(ch === cfg.obstacleChar && state.obstacleCleared)) {
      setStatus(ch === cfg.cartChar ? '수레 위로는 올라갈 수 없어. 가까이 가서 살펴봐.' : '그 물체가 있는 칸으로는 들어갈 수 없어. 가까이 가서 살펴봐.', 'info');
      return;
    }
    return baseAttemptMove(pos, isWait);
  };

  const baseRenderGoal = renderGoal;
  renderGoal = function investigationRenderGoal() {
    baseRenderGoal();
    const st = current();
    if (!cfgFor(st)) return;
    let goal = state.obstacleIdentified && st.goalAfter ? st.goalAfter : st.goal;
    goal = markGoal(goal, '位置', !!state.positionObserved);
    goal = markGoal(goal, '周圍', !!state.surroundingsObserved);
    if (state.obstacleIdentified && st.goalAfter) goal = markGoal(goal, '障礙', !!state.obstacleCleared);
    else goal = markGoal(goal, '障礙', !!state.obstacleIdentified);
    $('#goal').innerHTML = goal;
  };

  const baseDescTile = descTile;
  descTile = function investigationDescTile(ch, pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return baseDescTile(ch, pos);
    if (ch === cfg.cartChar) return '멈춘 짐수레, 북쪽을 향함';
    if (ch === cfg.obstacleChar) return state.obstacleCleared ? '돌을 치운 자리' : '수레 앞의 돌';
    if (cfg.nearbyChars?.includes(ch)) return '수레 옆의 짐상자';
    return baseDescTile(ch, pos);
  };

  const baseRender = render;
  render = function investigationRender() {
    baseRender();
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return;
    const cols = st.grid[0].length;
    for (let r = 0; r < st.grid.length; r++) for (let c = 0; c < cols; c++) {
      const ch = st.grid[r][c], cell = gridEl.children[r * cols + c];
      if (!cell) continue;
      if (ch === cfg.cartChar) {
        cell.classList.add('investigation-cart');
        if (!cell.querySelector('.investigation-cart-mark')) {
          const mark = document.createElement('span'); mark.className = 'investigation-cart-mark'; mark.textContent = '車'; mark.setAttribute('aria-hidden', 'true'); cell.appendChild(mark);
        }
      }
      if (cfg.nearbyChars?.includes(ch)) {
        cell.classList.add('investigation-crate');
        if (!cell.querySelector('.investigation-crate-mark')) {
          const mark = document.createElement('span'); mark.className = 'investigation-crate-mark'; mark.textContent = '箱'; mark.setAttribute('aria-hidden', 'true'); cell.appendChild(mark);
        }
      }
      if (ch === cfg.obstacleChar) {
        cell.classList.add(state.obstacleCleared ? 'investigation-cleared' : 'investigation-rock');
        if (!state.obstacleCleared && !cell.querySelector('.investigation-rock-mark')) {
          const mark = document.createElement('span'); mark.className = 'investigation-rock-mark'; mark.textContent = '●'; mark.setAttribute('aria-hidden', 'true'); cell.appendChild(mark);
        }
      }
      if (state.positionObserved && (cfg.nearbyChars?.includes(ch) || (ch === cfg.obstacleChar && !state.obstacleCleared))) {
        cell.classList.add('investigation-around');
      }
    }
    $('#words').querySelectorAll('.wordbtn').forEach(button => {
      if (button.textContent === '位置' && state.positionObserved) button.classList.add('done');
      if (button.textContent === '周圍' && state.surroundingsObserved) button.classList.add('done');
      if (button.textContent === '障礙' && state.obstacleIdentified) button.classList.add('done');
    });
  };

  const handlers = globalThis.ContextActionHandlers = globalThis.ContextActionHandlers || {};
  handlers['g4-inspect-cart'] = () => {
    const st = current(), cfg = cfgFor(st); if (!cfg) return;
    state.positionObserved = true;
    finishIfReady(st, '貨車停在北口外，車頭朝北。 수레의 位置를 확인했어. 이제 周圍도 살펴볼 수 있어.', 'info');
  };
  handlers['g4-inspect-nearby'] = (pos) => {
    const st = current(), cfg = cfgFor(st); if (!cfg) return;
    state.surroundingsObserved = true;
    const id = key(pos); if (!state.observedNearby.includes(id)) state.observedNearby.push(id);
    finishIfReady(st, '木箱在貨車旁邊，沒有卡住車輪。 수레 周圍에 있지만 바퀴를 막고 있지는 않아.', 'info');
  };
  handlers['g4-inspect-obstacle'] = (pos) => {
    const st = current(), cfg = cfgFor(st); if (!cfg) return;
    state.surroundingsObserved = true; state.obstacleIdentified = true;
    const id = key(pos); if (!state.observedNearby.includes(id)) state.observedNearby.push(id);
    finishIfReady(st, '石頭正卡在前輪前面，擋住貨車前進。這塊石頭就是障礙。 돌이 앞바퀴를 막아서 수레가 앞으로 갈 수 없어. 이 돌이 바로 障礙야.', 'good');
  };
  handlers['g4-clear-obstacle'] = () => {
    const st = current(), cfg = cfgFor(st); if (!cfg || !state.obstacleIdentified || state.obstacleCleared) return;
    history.push(clone(state));
    state.obstacleCleared = true;
    finishIfReady(st, '已移開障礙。 앞바퀴 앞의 길이 비었어.', 'good');
  };

  const baseShowInspect = showInspect;
  showInspect = function investigationShowInspect(pos) {
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return baseShowInspect(pos);
    const ch = tileAt(pos), adjacent = dist(state.hero, pos) === 1;
    if (ch === cfg.cartChar) {
      if (adjacent) return handlers['g4-inspect-cart'](pos);
      setStatus('수레가 멈춰 있어. 가까이 가면 位置를 자세히 확인할 수 있어.', 'info'); return;
    }
    if (cfg.nearbyChars?.includes(ch)) {
      if (adjacent) return handlers['g4-inspect-nearby'](pos);
      setStatus('수레 옆에 짐상자가 있어. 가까이 가서 周圍 관계를 확인해봐.', 'info'); return;
    }
    if (ch === cfg.obstacleChar && !state.obstacleCleared) {
      if (adjacent) return state.obstacleIdentified ? handlers['g4-clear-obstacle'](pos) : handlers['g4-inspect-obstacle'](pos);
      setStatus('수레 앞쪽에 돌이 보여. 가까이 가야 바퀴와의 관계를 확인할 수 있어.', 'info'); return;
    }
    return baseShowInspect(pos);
  };
})();
