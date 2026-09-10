/* Route + waypoint mechanic. G3 distinguishes a whole route from a place included along the way. */
(() => {
  const samePosition = (a, b) => Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
  const routeForPosition = (position, routes = []) => routes.find(route =>
    Array.isArray(route.cells) && route.cells.some(cell => samePosition(position, cell))) || null;
  const waypointForTile = (tile, waypoints = {}) => waypoints?.[tile] || null;

  globalThis.RouteMechanic = Object.freeze({ samePosition, routeForPosition, waypointForTile });

  // Unit tests can load the pure helpers without the browser tactical runtime.
  if (typeof current !== 'function' || typeof render !== 'function' || typeof attemptMove !== 'function') return;

  const baseInitialState = initialState;
  initialState = function routeInitialState(st) {
    const next = baseInitialState(st);
    if (st.route) Object.assign(next, { routeObserved: false, routeChoices: [], via: false, viaIds: [] });
    return next;
  };

  const baseIsWin = isWin;
  isWin = function routeIsWin() {
    const base = baseIsWin(), st = current();
    return st.win.includes('via') ? base && !!state.via : base;
  };

  const baseRenderGoal = renderGoal;
  renderGoal = function routeRenderGoal() {
    baseRenderGoal();
    const st = current();
    if (!st.route) return;
    let goal = st.goal;
    goal = markGoal(goal, '路線', !!state.routeObserved);
    goal = markGoal(goal, '經由', !!state.via);
    $('#goal').innerHTML = goal;
  };

  const baseDescTile = descTile;
  descTile = function routeDescTile(ch, pos) {
    const st = current(), cfg = st.route;
    if (!cfg) return baseDescTile(ch, pos);
    const waypoint = waypointForTile(ch, cfg.waypoints);
    if (waypoint) return `${waypoint.nameKo} · 중간 초소`;
    const route = routeForPosition(pos, cfg.routes);
    if (route) return `${route.nameKo} · 북쪽 출구로 이어지는 길`;
    return baseDescTile(ch, pos);
  };

  const baseRender = render;
  render = function routeRender() {
    baseRender();
    const st = current(), cfg = st.route;
    if (!cfg) return;
    const cols = st.grid[0].length;
    for (let r = 0; r < st.grid.length; r++) for (let c = 0; c < cols; c++) {
      const ch = st.grid[r][c], cell = gridEl.children[r * cols + c];
      if (!cell) continue;
      const waypoint = waypointForTile(ch, cfg.waypoints);
      if (waypoint) {
        cell.classList.add('route-waypoint');
        if (!cell.querySelector('.route-waypoint-mark')) {
          const mark = document.createElement('span');
          mark.className = 'route-waypoint-mark'; mark.textContent = '哨'; mark.setAttribute('aria-hidden', 'true');
          cell.appendChild(mark);
        }
        if (state.viaIds?.includes(waypoint.id)) cell.classList.add('route-visited');
      }
    }
    $('#words').querySelectorAll('.wordbtn').forEach(button => {
      if (button.textContent === '路線' && state.routeObserved) button.classList.add('done');
      if (button.textContent === '經由' && state.via) button.classList.add('done');
    });
  };

  const baseShowInspect = showInspect;
  showInspect = function routeShowInspect(pos) {
    const st = current(), cfg = st.route;
    if (!cfg) return baseShowInspect(pos);
    const ch = tileAt(pos), waypoint = waypointForTile(ch, cfg.waypoints);
    const coordinate = `${String.fromCharCode(65 + pos[1])}${pos[0] + 1}`;
    if (waypoint) {
      openSheet(`<h2>${waypoint.nameKo}</h2><div class="pinyin">${waypoint.nameZh} · ${coordinate}</div><div class="gamerule">북쪽 출구로 가는 중간 초소야.<br>이곳에 실제로 들르면 <b>經由</b>가 성립해.</div><div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>`);
      return;
    }
    const route = routeForPosition(pos, cfg.routes);
    if (route) {
      openSheet(`<h2>${route.nameKo}</h2><div class="pinyin">${route.nameZh} · ${coordinate}</div><div class="gamerule">북쪽 출구로 이어지는 여러 <b>路線</b> 중 하나야. 어느 길을 택할지는 자유야.</div><div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>`);
      return;
    }
    return baseShowInspect(pos);
  };

  const baseAttemptMove = attemptMove;
  attemptMove = function routeAttemptMove(pos, isWait) {
    const st = current(), cfg = st.route;
    if (!cfg) return baseAttemptMove(pos, isWait);
    const beforeTurn = state.turn;
    const result = baseAttemptMove(pos, isWait);
    if (state.turn === beforeTurn || current().id !== st.id) return result;

    let message = '';
    const route = routeForPosition(state.hero, cfg.routes);
    if (route) {
      state.routeObserved = true;
      if (!state.routeChoices.includes(route.id)) {
        state.routeChoices.push(route.id);
        message = `選擇${route.nameZh}。 이 길도 북쪽 출구로 이어지는 路線이야.`;
      }
    }

    const waypoint = waypointForTile(tileAt(state.hero), cfg.waypoints);
    if (waypoint) {
      state.routeObserved = true;
      state.via = true;
      if (!state.viaIds.includes(waypoint.id)) state.viaIds.push(waypoint.id);
      message = `已經由${waypoint.nameZh}。 ${waypoint.nameKo}에 들렀어.`;
    }

    save(); render();
    if (atExit() && !state.via) {
      setStatus('已經到北口，但還沒經由哨站。 북쪽 출구에는 왔지만 아직 초소를 경유하지 않았어.', 'info');
    } else if (message) {
      setStatus(message, waypoint ? 'good' : 'info');
    }
    return result;
  };
})();
