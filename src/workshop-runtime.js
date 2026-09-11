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

  function renderLevelVisual(component, value) {
    if (component.visual === 'fire') {
      return `<div class="workshop-fire-visual" data-level="${value}" role="img" aria-label="${component.labelKo}, 3단계 중 ${value + 1}단계">
        <div class="workshop-furnace-mouth"><span class="workshop-flame"></span></div>
        <div class="workshop-level-dots">${levelDots(value)}</div>
      </div>`;
    }
    if (component.visual === 'bellows') {
      return `<div class="workshop-bellows-visual" data-level="${value}" role="img" aria-label="${component.labelKo}, 3단계 중 ${value + 1}단계">
        <div class="workshop-bellows-body"><span></span></div>
        <div class="workshop-wind-lines" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="workshop-level-dots">${levelDots(value)}</div>
      </div>`;
    }
    return `<div class="workshop-gate-visual" data-level="${value}" role="img" aria-label="${component.labelKo}, 3단계 중 ${value + 1}단계">
      <div class="workshop-gate-door"></div><div class="workshop-gate-water"></div><div class="workshop-level-dots">${levelDots(value)}</div>
    </div>`;
  }

  function renderLevelDevice(component, value) {
    const downDisabled = value <= 0 && !component.allowLimitPress;
    const upDisabled = value >= 2 && !component.allowLimitPress;
    return `<section class="workshop-device" data-component="${component.id}">
      <div class="workshop-device-label"><span lang="zh-Hant">${component.labelZh}</span><small>${component.labelKo}</small></div>
      ${renderLevelVisual(component, value)}
      <div class="workshop-device-controls">
        <button type="button" data-workshop-action="step-down" data-component="${component.id}" aria-label="${component.labelKo} 한 단계 낮추기" ${downDisabled ? 'disabled' : ''}>−</button>
        <button type="button" data-workshop-action="step-up" data-component="${component.id}" aria-label="${component.labelKo} 한 단계 높이기" ${upDisabled ? 'disabled' : ''}>＋</button>
      </div>
    </section>`;
  }

  function goalMarkMet(mark, workshopState) {
    if (!mark) return false;
    if (mark.afterAction && state.turn < 1) return false;
    return (mark.conditions || []).every(condition => M.conditionMet(condition, workshopState));
  }

  function renderWorkshopGoal(stage) {
    const cfg = stage.workshop, ws = state.workshop;
    let goal = stage.goal;
    for (const mark of cfg.goalMarks || []) goal = markGoal(goal, mark.word, goalMarkMet(mark, ws));
    $('#goal').innerHTML = goal;
    $('#ruleLine').textContent = stage.rule || '';
  }

  function renderWorkshopWords(stage) {
    const cfg = stage.workshop, ws = state.workshop, solved = isWin();
    $('#words').innerHTML = '';
    for (const word of stage.words) {
      const button = document.createElement('button');
      button.className = 'wordbtn';
      const mark = (cfg.goalMarks || []).find(item => item.word === word);
      if ((mark && goalMarkMet(mark, ws)) || (!mark && solved)) button.classList.add('done');
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

  function renderWaterwheelScene(cfg) {
    const devices = cfgComponents(cfg).map(component => renderLevelDevice(component, state.workshop.values[component.id])).join('');
    const wheelRunning = !!state.workshop.derived.wheelRunning;
    return `<div class="workshop-scene workshop-waterwheel-scene">
      <div class="workshop-headwater" aria-hidden="true"></div>
      <div class="workshop-gates">${devices}</div>
      <div class="workshop-channel" aria-hidden="true"></div>
      <div class="workshop-wheel-area">
        <div class="workshop-wheel ${wheelRunning ? 'running' : ''}" role="img" aria-label="${wheelRunning ? '돌고 있는 물레방아' : '멈춰 있는 물레방아'}"><span></span></div>
        <div class="workshop-wheel-state"><strong>${wheelRunning ? '水車轉動中' : '水車停止'}</strong>${wheelRunning ? '물이 알맞게 흐르고 있어.' : '물이 모자라 멈춰 있어.'}</div>
      </div>
      <div class="workshop-board-note">한 번 움직인 뒤 바로 누르지 말고, 물의 높이와 물레방아가 어떻게 달라졌는지 봐.</div>
    </div>`;
  }

  function renderForgeScene(cfg) {
    const devices = cfgComponents(cfg).map(component => renderLevelDevice(component, state.workshop.values[component.id])).join('');
    const balanced = !!state.workshop.derived.balanced;
    return `<div class="workshop-scene workshop-forge-scene">
      <div class="workshop-forge-header" aria-hidden="true"><span></span><i></i><i></i></div>
      <div class="workshop-gates workshop-forge-controls">${devices}</div>
      <div class="workshop-forge-result ${balanced ? 'balanced' : ''}">
        <span class="workshop-metal-bar" aria-hidden="true"></span>
        <div><strong>${balanced ? '調整好了' : '還沒調好'}</strong>${balanced ? '불과 바람이 둘 다 알맞아.' : '불과 바람을 함께 보고 맞춰야 해.'}</div>
      </div>
      <div class="workshop-board-note">한쪽만 맞아도 끝이 아니야. 불과 바람 두 상태가 함께 맞는지 봐.</div>
    </div>`;
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
    gridEl.setAttribute('aria-label', cfg.boardLabel || '장인골 장치판');
    gridEl.innerHTML = cfg.scene === 'forge' ? renderForgeScene(cfg) : renderWaterwheelScene(cfg);
    bindWorkshopActions();
    renderWorkshopWords(stage);

    const controls = $('.controls');
    $('#waitBtn').hidden = true;
    $('#inspectBtn').hidden = true;
    $('#undoBtn').hidden = false;
    $('#undoBtn').disabled = !history.length;
    controls.style.gridTemplateColumns = '1fr';
  };

  function resolvedFeedback(entry, value) {
    if (!entry) return null;
    if (entry.values) return entry.values[String(value)] || entry.default || null;
    return entry;
  }

  function feedbackFor(stage, componentId, actionType, value, solved) {
    const feedback = stage.workshop?.feedback || {};
    if (solved && feedback.solved) return feedback.solved;
    const entry = resolvedFeedback(feedback.actions?.[`${componentId}:${actionType}`], value);
    if (entry) return entry;
    return { text: '상태가 달라졌어. 다른 장치도 함께 확인해봐.', type: 'info' };
  }

  function runWorkshopAction(componentId, actionType) {
    const stage = current(), cfg = cfgFor(stage);
    if (!cfg || screen !== 'tutorial' || isWin()) return;
    ensureWorkshopState();
    const result = M.applyAction(cfg, state.workshop, { component: componentId, type: actionType });
    if (!result.changed) {
      const limit = cfg.feedback?.limit?.[`${componentId}:${actionType}`];
      setStatus(limit?.text || '이 장치는 그 방향으로 더 움직이지 않아.', limit?.type || 'info');
      return;
    }

    history.push(clone(state));
    state.workshop = result.state;
    state.turn++;
    const solved = M.isSolved(cfg, state.workshop);
    save();
    render();
    const feedback = feedbackFor(stage, componentId, actionType, state.workshop.values[componentId], solved);
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