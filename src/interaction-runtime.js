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

  globalThis.ContextActionLogic = Object.freeze({ manhattan, priorityOf, enabled, actionsForPosition, primaryActionForPosition, highestPriorityActions });

  if (typeof document === 'undefined' || typeof render !== 'function') return;
  const button = document.getElementById('inspectBtn');
  const grid = document.getElementById('grid');
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
    if (inspect || actions.length !== 1) return;
    button.textContent = actions[0].action.label;
    const [r, c] = actions[0].pos;
    const index = r * current().grid[0].length + c;
    grid.children[index]?.classList.add('inspectable');
  }

  const baseRender = render;
  render = function contextualRender() {
    baseRender();
    enhance();
  };

  button.onclick = () => {
    if (inspect) {
      inspect = false;
      setStatus('이동 모드로 돌아왔어.', 'info');
      render();
      return;
    }
    const actions = nearbyActions();
    if (actions.length === 1) {
      actions[0].action.run();
      return;
    }
    inspect = true;
    setStatus(actions.length ? '살펴볼 곳을 눌러봐.' : '살펴보기 모드야. 지형이나 늑대를 눌러봐.', 'info');
    render();
  };

  enhance();
})();
