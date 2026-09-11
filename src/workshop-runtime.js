/* Workshop state-machine runtime: devices are manipulated directly instead of moving the hero on a grid. */
(() => {
  const copy = value => JSON.parse(JSON.stringify(value));
  const clampLevel = value => Math.max(0, Math.min(2, value));
  const cfgComponents = cfg => Array.isArray(cfg?.components) ? cfg.components : [];
  const componentById = (cfg, id) => cfgComponents(cfg).find(component => component.id === id) || null;

  function conditionMet(condition, workshopState) {
    if (!condition || !workshopState) return false;
    if (condition.component) return workshopState.values?.[condition.component] === condition.eq;
    if (condition.untouched) return workshopState.untouched?.[condition.untouched] === condition.eq;
    if (condition.derived) return workshopState.derived?.[condition.derived] === condition.eq;
    return false;
  }

  function recompute(cfg, workshopState) {
    workshopState.derived = workshopState.derived || {};
    for (const item of cfg?.derived || []) {
      if (item.type === 'all') workshopState.derived[item.id] = (item.conditions || []).every(condition => conditionMet(condition, workshopState));
    }
    return workshopState;
  }

  function createState(cfg) {
    const workshopState = { values: {}, untouched: {}, derived: {} };
    for (const component of cfgComponents(cfg)) {
      workshopState.values[component.id] = component.initial;
      if (component.trackUntouched) workshopState.untouched[component.id] = true;
    }
    return recompute(cfg, workshopState);
  }

  const isSolved = (cfg, workshopState) => (cfg?.predicates || []).every(condition => conditionMet(condition, workshopState));

  function applyAction(cfg, workshopState, action) {
    const component = componentById(cfg, action?.component);
    if (!component || !workshopState) return { state: workshopState, changed: false };
    const next = copy(workshopState);
    const before = next.values[component.id];
    let after = before;
    if (component.kind === 'level' && action.type === 'step-up') after = clampLevel(Number(before) + 1);
    if (component.kind === 'level' && action.type === 'step-down') after = clampLevel(Number(before) - 1);
    if (component.kind === 'toggle' && action.type === 'toggle') after = !before;
    if (component.kind === 'damage' && action.type === 'repair') after = false;
    if (after === before) return { state: workshopState, changed: false };
    next.values[component.id] = after;
    if (component.trackUntouched) next.untouched[component.id] = false;
    recompute(cfg, next);
    return { state: next, changed: true };
  }

  globalThis.WorkshopMechanic = Object.freeze({ clampLevel, conditionMet, recompute, createState, isSolved, applyAction });

  if (typeof document === 'undefined' || typeof current !== 'function' || typeof render !== 'function') return;

  const M = globalThis.WorkshopMechanic;
  const cfgFor = stage => stage?.workshop || null;
  const ensureWorkshopState = () => {
    const cfg = cfgFor(current());
    if (cfg && !state.workshop) state.workshop = M.createState(cfg);
    if (cfg) M.recompute(cfg, state.workshop);
  };

  const baseInitialState = initialState;
  initialState = function workshopInitialState(stage) {
    const next = baseInitialState(stage);
    if (cfgFor(stage)) next.workshop = M.createState(stage.workshop);
    return next;
  };

  const baseIsWin = isWin;
  isWin = function workshopIsWin() {
    const cfg = cfgFor(current());
    if (!cfg) return baseIsWin();
    ensureWorkshopState();
    return M.isSolved(cfg, state.workshop);
  };

  const baseResetStage = resetStage;
  resetStage = function workshopResetStage(quiet = false) {
    if (!cfgFor(current())) return baseResetStage(quiet);
    const result = baseResetStage(true);
    if (!quiet) setStatus(current().workshop.startStatus || '현재 상태를 보고 필요한 곳만 바꿔봐.', 'info');
    return result;
  };

  function levelDots(value) {
    return [0, 1, 2].map(level => `<i class="${level <= value ? 'active' : ''}" aria-hidden="true"></i>`).join('');
  }

  function renderLevelDevice(component, value) {
    const canDown = value > 0, canUp = value < 2;
    return `<section class="workshop-device" data-component="${component.id}">
      <div class="workshop-device-label"><span lang="zh-Hant">${component.labelZh}</span><small>${component.labelKo}</small></div>
      <div class="workshop-gate-visual" data-level="${value}" role="img" aria-label="${component.labelKo}, 3단계 중 ${value + 1}단계">
        <div class="workshop-gate-door"></div><div class="workshop-gate-water"></div><div class="workshop-level-dots">${levelDots(value)}</div>
      </div>
      <div class="workshop-device-controls">
        <button type="button" data-workshop-action="step-down" data-component="${component.id}" aria-label="${component.labelKo} 한 단계 낮추기" ${canDown ? '' : 'disabled'}>−</button>
        <button type="button" data-workshop-action="step-up" data-component="${component.id}" aria-label="${component.labelKo} 한 단계 높이기" ${canUp ? '' : 'disabled'}>＋</button>
      </div>
    </section>`;
  }

  function renderWorkshopGoal(stage) {
    const ws = state.workshop;
    const mainDone = ws.values.mainGate === 1;
    const keepDone = state.turn > 0 && ws.values.balanceGate === 1 && ws.untouched.balanceGate === true;
    let goal = stage.goal;
    goal = markGoal(goal, '改變', mainDone);
    goal = markGoal(goal, '保持', keepDone);
    $('#goal').innerHTML = goal;
    $('#ruleLine').textContent = stage.rule || '';
  }

  function renderWorkshopWords(stage) {
    const solved = isWin();
    $('#words').innerHTML = '';
    for (const word of stage.words) {
      const button = document.createElement('button');
      button.className = 'wordbtn';
      if (solved) button.classList.add('done');
      button.textContent = word;
      button.onclick = () => showWord(word);
      $('#words').append(button);
    }
  }

  function bindWorkshopActions() {
    gridEl.querySelectorAll('[data-workshop-action]').forEach(button => {
      button.addEventListener('click', () => runWorkshopAction(button.dataset.component, button.dataset.workshopAction));
    });
  }

  const baseRender = render;
  render = function workshopRender() {
    const stage = current(), cfg = cfgFor(stage);
    if (!cfg) {
      gridEl.classList.remove('workshop-board');
      gridEl.setAttribute('role', 'grid');
      gridEl.setAttribute('aria-label', '전술 지도');
      $('#inspectBtn').hidden = false;
      $('#undoBtn').hidden = false;
      return baseRender();
    }

    ensureWorkshopState();
    $('#stageKicker').textContent = stage.kicker || '1장 · 장인골';
    $('#stageTitle').textContent = stage.subtitle;
    renderWorkshopGoal(stage);

    gridEl.style.gridTemplateColumns = '';
    gridEl.className = 'grid workshop-board';
    gridEl.setAttribute('role', 'group');
    gridEl.setAttribute('aria-label', '물레방아 수문 조절 장치');
    const devices = cfgComponents(cfg).map(component => renderLevelDevice(component, state.workshop.values[component.id])).join('');
    const wheelRunning = !!state.workshop.derived.wheelRunning;
    gridEl.innerHTML = `<div class="workshop-scene">
      <div class="workshop-headwater" aria-hidden="true"></div>
      <div class="workshop-gates">${devices}</div>
      <div class="workshop-channel" aria-hidden="true"></div>
      <div class="workshop-wheel-area">
        <div class="workshop-wheel ${wheelRunning ? 'running' : ''}" role="img" aria-label="${wheelRunning ? '돌고 있는 물레방아' : '멈춰 있는 물레방아'}"><span></span></div>
        <div class="workshop-wheel-state"><strong>${wheelRunning ? '水車轉動中' : '水車停止'}</strong>${wheelRunning ? '물이 알맞게 흐르고 있어.' : '물이 모자라 멈춰 있어.'}</div>
      </div>
      <div class="workshop-board-note">장치를 바꾸면 물의 높이와 물레방아 상태가 바로 달라져.</div>
    </div>`;
    bindWorkshopActions();
    renderWorkshopWords(stage);

    const controls = $('.controls');
    $('#waitBtn').hidden = true;
    $('#inspectBtn').hidden = true;
    $('#undoBtn').hidden = false;
    $('#undoBtn').disabled = !history.length;
    controls.style.gridTemplateColumns = '1fr';
  };

  function feedbackFor(componentId, value, solved) {
    if (componentId === 'balanceGate') return {
      text: '這邊不用改變，要保持原樣。 이쪽은 바꾸지 않고 그대로 두어야 해. 되돌리면 다시 처음 상태로 돌아갈 수 있어.',
      type: 'info'
    };
    if (solved) return {
      text: '一個改變了，一個保持原樣。水車開始轉了。 하나는 바꾸고, 하나는 그대로 뒀어. 물레방아가 돌기 시작했어.',
      type: 'good'
    };
    if (value === 0) return { text: '左邊還是太低了。 왼쪽 물이 아직 너무 적어.', type: 'info' };
    if (value === 2) return { text: '左邊太高了。 왼쪽 물이 이번에는 너무 많아졌어.', type: 'info' };
    return { text: '水量改變了。 물의 양이 달라졌어.', type: 'good' };
  }

  function runWorkshopAction(componentId, actionType) {
    const stage = current(), cfg = cfgFor(stage);
    if (!cfg || screen !== 'tutorial' || isWin()) return;
    ensureWorkshopState();
    const result = M.applyAction(cfg, state.workshop, { component: componentId, type: actionType });
    if (!result.changed) {
      setStatus('이 장치는 그 방향으로 더 움직이지 않아.', 'info');
      return;
    }

    history.push(clone(state));
    state.workshop = result.state;
    state.turn++;
    const solved = M.isSolved(cfg, state.workshop);
    save();
    render();
    const feedback = feedbackFor(componentId, state.workshop.values[componentId], solved);
    setStatus(feedback.text, feedback.type);

    if (!solved) return;
    if (stageSession.mode !== 'replay') completed.add(stage.id);
    window.GameFlow?.recordStageComplete(stage.id, stageSession);
    save();
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === stage.id && isWin()) showComplete();
    }, 420);
  }

  const baseAdapter = window.TacticalGame;
  if (baseAdapter) {
    window.TacticalGame = Object.freeze({
      ...baseAdapter,
      resumeStage(id, options = {}) {
        const ok = baseAdapter.resumeStage(id, options);
        if (ok && cfgFor(current())) setStatus(current().workshop.startStatus || '현재 상태를 보고 필요한 곳만 바꿔봐.', 'info');
        return ok;
      }
    });
  }
})();