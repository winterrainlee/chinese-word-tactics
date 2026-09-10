/* Fixed-source Manhattan range mechanic. G2 is the second real use of radius after wolf danger. */
(() => {
  const distanceBetween = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const isWithinRange = (target, source, radius) => distanceBetween(target, source) <= radius;
  const isRangeBoundary = (target, source, radius) => distanceBetween(target, source) === radius;
  const shouldRevealAfterClear = (mode, alreadyCompleted, enabled = true) =>
    !!enabled && mode !== 'replay' && !alreadyCompleted;

  globalThis.RangeMechanic = Object.freeze({
    distanceBetween, isWithinRange, isRangeBoundary, shouldRevealAfterClear
  });

  // Node tests can load the pure helpers without a browser runtime.
  if (typeof current !== 'function' || typeof render !== 'function' || typeof attemptMove !== 'function') return;

  const sourcePosition = st => st.rangeSource ? locate(st.grid, st.rangeSource.source) : null;
  const pointChar = st => st.rangeSource?.pointChar || 'P';

  const baseInitialState = initialState;
  initialState = function rangeInitialState(st) {
    const next = baseInitialState(st);
    if (st.rangeSource) Object.assign(next, { rangeObserved: false, rangeSolved: false, rangeReveal: false });
    return next;
  };

  const baseIsWin = isWin;
  isWin = function rangeIsWin() {
    const base = baseIsWin(), st = current();
    return st.win.includes('range_boundary') ? base && !!state.rangeSolved : base;
  };

  const baseAcceptedMove = acceptedMove;
  acceptedMove = function rangeAcceptedMove(pos) {
    const st = current();
    if (st.rangeSource && tileAt(pos) === st.rangeSource.source) return false;
    return baseAcceptedMove(pos);
  };

  const baseDescTile = descTile;
  descTile = function rangeDescTile(ch, pos) {
    const st = current();
    if (!st.rangeSource) return baseDescTile(ch, pos);
    if (ch === st.rangeSource.source) return '감시탑의 종, 이동 불가';
    if (ch === pointChar(st)) return `${baseDescTile(ch, pos)} · 확인 표식`;
    return baseDescTile(ch, pos);
  };

  const baseRenderGoal = renderGoal;
  renderGoal = function rangeRenderGoal() {
    baseRenderGoal();
    const st = current();
    if (!st.rangeSource) return;
    let goal = st.goal;
    goal = markGoal(goal, '距離', !!state.rangeObserved);
    goal = markGoal(goal, '範圍', !!state.rangeSolved);
    $('#goal').innerHTML = goal;
  };

  const baseRender = render;
  render = function rangeRender() {
    baseRender();
    const st = current(), cfg = st.rangeSource, inspectButton = $('#inspectBtn');
    if (inspectButton) inspectButton.disabled = false;
    if (!cfg) return;

    const source = sourcePosition(st), cols = st.grid[0].length;
    for (let r = 0; r < st.grid.length; r++) for (let c = 0; c < cols; c++) {
      const ch = st.grid[r][c], cell = gridEl.children[r * cols + c], pos = [r, c];
      if (!cell) continue;
      if (ch === cfg.source) {
        cell.classList.add('range-source');
        if (!cell.querySelector('.range-bell')) {
          const bell = document.createElement('span');
          bell.className = 'range-bell'; bell.textContent = '🔔'; bell.setAttribute('aria-hidden', 'true');
          cell.appendChild(bell);
        }
      }
      if (ch === pointChar(st)) {
        cell.classList.add('range-point');
        if (!cell.querySelector('.range-marker')) {
          const marker = document.createElement('span');
          marker.className = 'range-marker'; marker.textContent = '⚑'; marker.setAttribute('aria-hidden', 'true');
          cell.appendChild(marker);
        }
      }
      if (state.rangeReveal && source && isWithinRange(pos, source, cfg.radius)) {
        cell.classList.add('range-revealed');
        if (isRangeBoundary(pos, source, cfg.radius)) cell.classList.add('range-edge');
      }
    }

    $('#words').querySelectorAll('.wordbtn').forEach(button => {
      if (button.textContent === '距離' && state.rangeObserved) button.classList.add('done');
      if (button.textContent === '範圍' && state.rangeSolved) button.classList.add('done');
    });

    if (state.rangeSolved) {
      gridEl.querySelectorAll('.move-arrow').forEach(arrow => arrow.remove());
      gridEl.querySelectorAll('.moveable').forEach(cell => cell.classList.remove('moveable'));
      if (inspectButton) inspectButton.disabled = true;
      $('#undoBtn').disabled = true;
    }
  };

  const baseShowInspect = showInspect;
  showInspect = function rangeShowInspect(pos) {
    const st = current(), cfg = st.rangeSource, ch = tileAt(pos);
    if (!cfg) return baseShowInspect(pos);
    const coordinate = `${String.fromCharCode(65 + pos[1])}${pos[0] + 1}`;
    if (ch === cfg.source) {
      openSheet(`<h2>감시탑의 종</h2><div class="pinyin">${coordinate}</div><div class="gamerule">鐘聲從這裡傳出去。<br>종소리가 어디까지 닿는지는 직접 움직이며 확인해야 해.</div><div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>`);
      return;
    }
    if (ch === pointChar(st)) {
      const source = sourcePosition(st), here = key(pos) === key(state.hero);
      const info = here && source
        ? `距離鐘樓：${distanceBetween(pos, source)}格。<br>${isWithinRange(pos, source, cfg.radius) ? '這裡聽得到鐘聲。' : '這裡聽不到鐘聲。'}`
        : '站到標記上，就能確認跟鐘樓的距離和鐘聲。';
      openSheet(`<h2>확인 표식</h2><div class="pinyin">${coordinate}</div><div class="gamerule">${info}</div><div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>`);
      return;
    }
    return baseShowInspect(pos);
  };

  const finishRangeStage = (st, distance) => {
    const cfg = st.rangeSource, alreadyCompleted = completed.has(st.id);
    state.rangeObserved = true;
    state.rangeSolved = true;
    state.rangeReveal = shouldRevealAfterClear(stageSession.mode, alreadyCompleted, cfg.revealOnFirstClear);
    if (stageSession.mode !== 'replay') completed.add(st.id);
    window.GameFlow?.recordStageComplete(st.id, stageSession);
    save(); render();
    setStatus(state.rangeReveal
      ? `距離鐘樓：${distance}格。找到了鐘聲範圍的邊緣。 종소리가 닿는 전체 범위가 잠깐 드러났어.`
      : `距離鐘樓：${distance}格。找到了鐘聲範圍的邊緣。`, 'good');
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === st.id && isWin()) showComplete();
    }, state.rangeReveal ? 900 : 120);
  };

  const baseAttemptMove = attemptMove;
  attemptMove = function rangeAttemptMove(pos, isWait) {
    const st = current(), cfg = st.rangeSource;
    if (!cfg) return baseAttemptMove(pos, isWait);
    if (!isWait && tileAt(pos) === cfg.source) {
      setStatus('종이 있는 감시탑 위로는 올라갈 수 없어.', 'info');
      return;
    }

    const source = sourcePosition(st), beforeHero = clone(state.hero), beforeTurn = state.turn;
    const beforeInside = source ? isWithinRange(beforeHero, source, cfg.radius) : false;
    const result = baseAttemptMove(pos, isWait);
    if (!source || state.turn === beforeTurn || current().id !== st.id) return result;

    const distance = distanceBetween(state.hero, source), inside = isWithinRange(state.hero, source, cfg.radius);
    if (tileAt(state.hero) === pointChar(st)) {
      state.rangeObserved = true;
      if (isRangeBoundary(state.hero, source, cfg.radius)) {
        finishRangeStage(st, distance);
        return result;
      }
      save(); render();
      setStatus(`距離鐘樓：${distance}格。${inside ? '這裡聽得到鐘聲。' : '這裡聽不到鐘聲。'}`, 'info');
      return result;
    }

    if (beforeInside !== inside) {
      setStatus(inside ? '鐘聲變清楚了。進入鐘聲的範圍。' : '聽不到鐘聲了。已經離開鐘聲的範圍。', 'info');
    }
    return result;
  };
})();
