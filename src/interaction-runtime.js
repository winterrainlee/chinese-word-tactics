/* Contextual tactical actions. Keeps common one-tap interactions out of stage-specific rules. */
(() => {
  const button = document.getElementById('inspectBtn');
  const grid = document.getElementById('grid');
  if (!button || !grid || typeof render !== 'function') return;

  function actionFor(pos) {
    const ch = current().grid[pos[0]]?.[pos[1]];
    if (ch === 'L' && current().enterExit && dist(state.hero, pos) === 1) {
      return { label: '길표지 살펴보기', run: () => showInspect(pos) };
    }
    return null;
  }

  function nearbyActions() {
    if (!state?.hero) return [];
    const [r, c] = state.hero;
    return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .map(pos => ({ pos, action: actionFor(pos) }))
      .filter(item => item.action);
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
