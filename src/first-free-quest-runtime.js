/* C08 first quest tactical mechanic: inspect mushroom patches, collect exactly the requested target, then leave. */
(() => {
  const STAGE_ID = 'first-free-quest-forest';
  const cfgFor = st => st?.id === STAGE_ID ? st.forestQuest : null;
  const flag = (patch, suffix) => `forestPatch${patch.toUpperCase()}${suffix}`;
  const enough = (st = current(), s = state) => {
    const cfg = cfgFor(st);
    return !!cfg && Number(s?.forestCount || 0) >= cfg.required;
  };
  const inRange = (pos, cfg = cfgFor(current())) => !!cfg && Array.isArray(pos) &&
    pos[0] >= cfg.range.rowMin && pos[0] <= cfg.range.rowMax &&
    pos[1] >= cfg.range.colMin && pos[1] <= cfg.range.colMax;
  const patchFor = (st, ch) => cfgFor(st)?.patches?.[ch] || null;
  const patchCollected = (patch, s = state) => !!s?.[flag(patch.id, 'Collected')];
  const patchObserved = (patch, s = state) => !!s?.[flag(patch.id, 'Observed')];

  globalThis.FirstFreeQuestMechanic = Object.freeze({ STAGE_ID, enough, inRange });

  if (typeof current !== 'function' || typeof render !== 'function' || typeof initialState !== 'function') return;

  const baseInitialState = initialState;
  initialState = function firstQuestInitialState(st) {
    const next = baseInitialState(st);
    if (cfgFor(st)) Object.assign(next, {
      forestCount: 0,
      forestRangeEntered: false,
      forestObservedAny: false,
      forestSawShortage: false,
      forestPatchAObserved: false,
      forestPatchACollected: false,
      forestPatchBObserved: false,
      forestPatchCObserved: false,
      forestPatchCCollected: false
    });
    return next;
  };

  const baseIsWin = isWin;
  isWin = function firstQuestIsWin() {
    const base = baseIsWin(), st = current();
    if (!cfgFor(st)) return base;
    return base && enough(st, state);
  };

  const baseAcceptedMove = acceptedMove;
  acceptedMove = function firstQuestAcceptedMove(pos) {
    const st = current(), patch = patchFor(st, tileAt(pos));
    if (patch && (!patch.target || !patchCollected(patch))) return false;
    return baseAcceptedMove(pos);
  };

  const baseAttemptMove = attemptMove;
  attemptMove = function firstQuestAttemptMove(pos, isWait) {
    const st = current(), cfg = cfgFor(st), patch = cfg && patchFor(st, tileAt(pos));
    if (!cfg) return baseAttemptMove(pos, isWait);
    if (!isWait && patch && (!patch.target || !patchCollected(patch))) {
      setStatus('버섯이 자란 자리야. 가까이 가서 종류와 數量을 먼저 확인해봐.', 'info');
      return;
    }
    if (!isWait && inRange(pos, cfg)) state.forestRangeEntered = true;
    const leavingEarly = !isWait && tileAt(pos) === 'E' && !enough(st, state);
    const result = baseAttemptMove(pos, isWait);
    if (leavingEarly && screen === 'tutorial' && current().id === STAGE_ID && !isWin()) {
      setStatus(`數量還不足。月白菇 ${state.forestCount} / ${cfg.required}。 숲 안쪽을 조금 더 살펴봐.`, 'info');
    }
    return result;
  };

  const baseRenderGoal = renderGoal;
  renderGoal = function firstQuestRenderGoal() {
    baseRenderGoal();
    const st = current(), cfg = cfgFor(st);
    if (!cfg) return;
    let goal = st.goal;
    goal = markGoal(goal, '範圍', !!state.forestRangeEntered);
    goal = markGoal(goal, '數量', !!state.forestObservedAny);
    goal = markGoal(goal, '足夠', enough(st, state));
    goal = markGoal(goal, '退出', enough(st, state) && atExit());
    $('#goal').innerHTML = goal;
    $('#ruleLine').textContent = enough(st, state)
      ? `月白菇 ${state.forestCount} / ${cfg.required} · 數量足夠。입구로 돌아가 退出하면 돼.`
      : `月白菇 ${state.forestCount} / ${cfg.required} · 필요한 버섯의 數量을 확인해봐.`;
  };

  const baseDescTile = descTile;
  descTile = function firstQuestDescTile(ch, pos) {
    const st = current(), patch = patchFor(st, ch);
    if (!patch) return baseDescTile(ch, pos);
    if (patch.target && patchCollected(patch)) return `${patch.nameKo}를 챙긴 자리`;
    if (patchObserved(patch)) return `${patch.nameKo}, ${patch.quantity}개`;
    return '버섯이 자란 자리';
  };

  function wordDone(word) {
    if (word === '範圍') return !!state.forestRangeEntered;
    if (word === '數量') return !!state.forestObservedAny;
    if (word === '不足') return !!state.forestSawShortage;
    if (word === '足夠') return enough();
    if (word === '獲得') return state.forestCount > 0;
    if (word === '退出') return enough() && atExit();
    return false;
  }

  const baseRender = render;
  render = function firstQuestRender() {
    baseRender();
    const st = current(), cfg = cfgFor(st);
    const view = document.getElementById('tutorialView');
    view?.classList.toggle('forestQuestStage', !!cfg);
    if (!cfg) return;
    const cols = st.grid[0].length;
    for (let r = 0; r < st.grid.length; r++) for (let c = 0; c < cols; c++) {
      const ch = st.grid[r][c], cell = gridEl.children[r * cols + c];
      if (!cell) continue;
      if (inRange([r, c], cfg) && ch !== '#') cell.classList.add('forestQuestRange');
      const patch = patchFor(st, ch);
      if (!patch) continue;
      cell.classList.add('forestQuestPatch');
      cell.classList.toggle('target', patch.target);
      cell.classList.toggle('other', !patch.target);
      if (patch.target && patchCollected(patch)) {
        cell.classList.add('collected');
        continue;
      }
      if (!cell.querySelector('.forestQuestMushroom')) {
        const mark = document.createElement('span');
        mark.className = 'forestQuestMushroom';
        mark.textContent = '菇';
        mark.setAttribute('aria-hidden', 'true');
        cell.appendChild(mark);
      }
      if (patchObserved(patch) && !cell.querySelector('.forestQuestQuantity')) {
        const qty = document.createElement('span');
        qty.className = 'forestQuestQuantity';
        qty.textContent = `×${patch.quantity}`;
        qty.setAttribute('aria-hidden', 'true');
        cell.appendChild(qty);
      }
    }
    $('#words')?.querySelectorAll('.wordbtn').forEach(button => {
      if (wordDone(button.textContent)) button.classList.add('done');
    });
  };

  function finishIfReady(message, type = 'info') {
    const st = current();
    save(); render(); setStatus(message, type);
    if (!isWin()) return;
    if (stageSession.mode !== 'replay') completed.add(st.id);
    window.GameFlow?.recordStageComplete(st.id, stageSession);
    save();
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === st.id && isWin()) showComplete();
    }, 160);
  }

  function inspectPatch(ch) {
    const st = current(), cfg = cfgFor(st), patch = cfg && patchFor(st, ch);
    if (!patch) return;
    const observedFlag = flag(patch.id, 'Observed');
    if (!state[observedFlag]) history.push(clone(state));
    state[observedFlag] = true;
    state.forestObservedAny = true;
    if (patch.target) {
      const totalIfCollected = state.forestCount + (patchCollected(patch) ? 0 : patch.quantity);
      const relation = totalIfCollected < cfg.required ? '이것만으로는 아직 不足해.' : '지금 가진 것과 합치면 足夠해.';
      finishIfReady(`${patch.nameZh} ×${patch.quantity}。 ${relation}`, 'info');
    } else {
      finishIfReady(`${patch.nameZh} ×${patch.quantity}。 부탁받은 月白菇와 다른 버섯이야.`, 'info');
    }
  }

  function collectPatch(ch) {
    const st = current(), cfg = cfgFor(st), patch = cfg && patchFor(st, ch);
    if (!patch?.target || patchCollected(patch) || !patchObserved(patch)) return;
    history.push(clone(state));
    state[flag(patch.id, 'Collected')] = true;
    state.forestCount += patch.quantity;
    if (state.forestCount < cfg.required) state.forestSawShortage = true;
    const message = state.forestCount >= cfg.required
      ? `獲得${patch.nameZh} ×${patch.quantity}。現在 ${state.forestCount} / ${cfg.required}，數量足夠了。回到入口吧。`
      : `獲得${patch.nameZh} ×${patch.quantity}。現在 ${state.forestCount} / ${cfg.required}，還不足。`;
    finishIfReady(message, state.forestCount >= cfg.required ? 'good' : 'info');
  }

  const handlers = globalThis.ContextActionHandlers = globalThis.ContextActionHandlers || {};
  handlers['forest-inspect-a'] = () => inspectPatch('A');
  handlers['forest-collect-a'] = () => collectPatch('A');
  handlers['forest-inspect-b'] = () => inspectPatch('B');
  handlers['forest-inspect-c'] = () => inspectPatch('C');
  handlers['forest-collect-c'] = () => collectPatch('C');

  if (typeof showInspect === 'function') {
    const baseShowInspect = showInspect;
    showInspect = function firstQuestShowInspect(pos) {
      const st = current(), cfg = cfgFor(st), ch = tileAt(pos), patch = cfg && patchFor(st, ch);
      if (!patch) return baseShowInspect(pos);
      if (dist(state.hero, pos) !== 1) {
        setStatus('버섯 종류와 數量을 확인하려면 가까이 가야 해.', 'info');
        return;
      }
      if (!patchObserved(patch)) return inspectPatch(ch);
      const collected = patch.target && patchCollected(patch);
      setStatus(collected ? `${patch.nameZh}를 이미 챙겼어.` : `${patch.nameZh} ×${patch.quantity}。`, 'info');
    };
  }
})();
