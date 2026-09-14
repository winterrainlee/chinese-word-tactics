/* Contextual tactical actions. Keeps common one-tap interactions out of stage-specific rules. */
(() => {
  const manhattan = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const list = value => Array.isArray(value) ? value : value ? [value] : [];
  const priorityOf = action => Number.isFinite(action?.priority) ? action.priority : 0;
  const enabled = (action, s) => list(action.requires).every(flag => !!s?.[flag]) &&
    list(action.unless).every(flag => !s?.[flag]);
  function actionsForPosition(stage, pos, s) {
    if (!stage?.grid || !Array.isArray(pos) || !Array.isArray(s?.hero) || manhattan(s.hero, pos) !== 1) return [];
    const ch = stage.grid[pos[0]]?.[pos[1]];
    return list(stage.contextActions).filter(action => action?.target === ch && enabled(action, s));
  }
  const primaryActionForPosition = (stage, pos, s) => actionsForPosition(stage, pos, s)
    .sort((a, b) => priorityOf(b) - priorityOf(a))[0] || null;
  function highestPriorityActions(items = []) {
    if (!items.length) return [];
    const top = Math.max(...items.map(item => priorityOf(item.action)));
    return items.filter(item => priorityOf(item.action) === top);
  }
  const samePosition = (a, b) => Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
  function isDirectInformationTarget(stage, pos, s) {
    if (!stage?.grid || !Array.isArray(pos)) return false;
    const ch = stage.grid[pos[0]]?.[pos[1]], distance = Array.isArray(s?.hero) ? manhattan(s.hero, pos) : Infinity;
    const wolf = stage.wolf?.cycle?.[s?.phase];
    if (samePosition(pos, wolf)) return true;
    if (ch === 'K') return true;
    if (ch === 'X') return distance > 1;
    if (stage.ruin && ch === 'R') return distance > 1;
    if (stage.rangeSource) {
      if (ch === stage.rangeSource.source) return true;
      if (ch === (stage.rangeSource.pointChar || 'P')) return distance > 1;
    }
    if (stage.route?.waypoints?.[ch]) return distance > 1;
    if (stage.follower) {
      if (samePosition(pos, s?.followerPos)) return true;
      if (ch === stage.follower.narrowChar) return distance > 1;
    }
    if (stage.followerChain && Array.isArray(s?.followerPositions) && s.followerPositions.some(item => samePosition(pos, item))) return true;
    return false;
  }

  globalThis.ContextActionLogic = Object.freeze({ manhattan, priorityOf, enabled, actionsForPosition, primaryActionForPosition, highestPriorityActions, isDirectInformationTarget });

  if (typeof document === 'undefined' || typeof render !== 'function') return;
  const button = document.getElementById('inspectBtn');
  const grid = document.getElementById('grid');
  const controls = document.querySelector('.controls');
  if (!button || !grid) return;

  function runAction(action, pos) {
    if (action.action === 'inspect') return showInspect(pos);
    const handler = globalThis.ContextActionHandlers?.[action.action];
    if (typeof handler === 'function') return handler(pos, action);
    setStatus('아직 이 행동을 사용할 수 없어.', 'info');
  }

  function actionFor(pos) {
    const action = primaryActionForPosition(current(), pos, state);
    if (action) return { ...action, run: () => runAction(action, pos) };
    // Compatibility for saves/content created before contextActions was added to G1.
    const ch = current().grid[pos[0]]?.[pos[1]];
    if (ch === 'L' && current().enterExit && dist(state.hero, pos) === 1) {
      return { label: '길표지 살펴보기', priority: 0, run: () => showInspect(pos) };
    }
    return null;
  }

  function nearbyActions() {
    if (!state?.hero) return [];
    const [r, c] = state.hero;
    const candidates = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .map(pos => ({ pos, action: actionFor(pos) }))
      .filter(item => item.action);
    return highestPriorityActions(candidates);
  }

  function enhance() {
    const actions = nearbyActions();
    inspect = false;
    button.hidden = actions.length === 0;
    button.disabled = actions.length !== 1;
    button.textContent = actions.length === 1 ? actions[0].action.label : actions.length > 1 ? '대상 선택' : '살펴보기';
    if (controls) {
      const hasWait = !document.getElementById('waitBtn')?.hidden;
      const count = 1 + (hasWait ? 1 : 0) + (actions.length ? 1 : 0);
      controls.style.gridTemplateColumns = `repeat(${count},1fr)`;
    }
    for (const item of actions) {
      const [r, c] = item.pos;
      const index = r * current().grid[0].length + c;
      grid.children[index]?.classList.add('inspectable');
    }
  }

  const baseRender = render;
  render = function contextualRender() {
    baseRender();
    enhance();
  };

  const baseTapCell = tapCell;
  tapCell = function contextualTapCell(pos) {
    const actions = nearbyActions();
    if (actions.length > 1) {
      const selected = actions.find(item => samePosition(item.pos, pos));
      if (selected) return selected.action.run();
    }
    if (isDirectInformationTarget(current(), pos, state)) return showInspect(pos);
    return baseTapCell(pos);
  };

  button.onclick = () => {
    const actions = nearbyActions();
    if (actions.length === 1) actions[0].action.run();
  };

  enhance();
})();
