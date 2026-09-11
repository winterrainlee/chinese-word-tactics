/* Workshop W4-W7 renderer and interaction layer. Reuses WorkshopMechanic state rules. */
(() => {
  if (typeof document === 'undefined' || !globalThis.WorkshopMechanic) return;

  const M = globalThis.WorkshopMechanic;
  const lateScenes = new Set(['conditions', 'blue-flame', 'gears', 'regulator']);
  const cfgFor = stage => stage?.workshop || null;
  const isLateStage = stage => lateScenes.has(cfgFor(stage)?.scene);
  const componentById = (cfg, id) => (cfg?.components || []).find(component => component.id === id) || null;
  const levelDots = value => [0, 1, 2].map(level => `<i class="${level <= value ? 'active' : ''}" aria-hidden="true"></i>`).join('');

  function ensureLateState() {
    const cfg = cfgFor(current());
    if (!cfg) return;
    if (!state.workshop) state.workshop = M.createState(cfg);
    state.workshop.identified = state.workshop.identified || {};
    M.recompute(cfg, state.workshop);
  }

  function goalMarkMet(mark, workshopState) {
    if (!mark) return false;
    if (mark.afterAction && state.turn < 1) return false;
    if (mark.identified && !workshopState.identified?.[mark.identified]) return false;
    return (mark.conditions || []).every(condition => M.conditionMet(condition, workshopState));
  }

  function renderLateGoal(stage) {
    let goal = stage.goal;
    for (const mark of stage.workshop.goalMarks || []) goal = markGoal(goal, mark.word, goalMarkMet(mark, state.workshop));
    $('#goal').innerHTML = goal;
    $('#ruleLine').textContent = stage.rule || '';
  }

  function renderLateWords(stage) {
    const solved = isWin();
    $('#words').innerHTML = '';
    for (const word of stage.words) {
      const button = document.createElement('button');
      button.className = 'wordbtn';
      const mark = (stage.workshop.goalMarks || []).find(item => item.word === word);
      if ((mark && goalMarkMet(mark, state.workshop)) || (!mark && solved)) button.classList.add('done');
      button.textContent = word;
      button.onclick = () => showWord(word);
      $('#words').append(button);
    }
  }

  function levelControls(component, value) {
    const downDisabled = value <= 0 && !component.allowLimitPress;
    const upDisabled = value >= 2 && !component.allowLimitPress;
    return `<div class="workshop-late-stepper">
      <button type="button" data-workshop-late-action="step-down" data-component="${component.id}" aria-label="${component.labelKo} 한 단계 낮추기" ${downDisabled ? 'disabled' : ''}>−</button>
      <button type="button" data-workshop-late-action="step-up" data-component="${component.id}" aria-label="${component.labelKo} 한 단계 높이기" ${upDisabled ? 'disabled' : ''}>＋</button>
    </div>`;
  }

  function matchBadge(matched) {
    return `<span class="workshop-condition-badge ${matched ? 'matched' : ''}"><b>${matched ? '✓' : '○'}</b>${matched ? '符合' : '未符合'}</span>`;
  }

  function renderConditionScene(cfg) {
    const ws = state.workshop;
    const water = componentById(cfg, 'conditionWater');
    const shaft = componentById(cfg, 'conditionShaft');
    const furnace = componentById(cfg, 'conditionFurnace');
    const waterValue = ws.values.conditionWater;
    const shaftValue = !!ws.values.conditionShaft;
    const furnaceValue = !!ws.values.conditionFurnace;
    const unlocked = !!ws.derived.benchUnlocked;
    return `<div class="workshop-late-scene workshop-condition-scene">
      <div class="workshop-condition-list">
        <section class="workshop-condition-row ${waterValue === 1 ? 'matched' : ''}">
          <div class="workshop-condition-copy"><strong lang="zh-Hant">水量</strong><small>물의 양 · 가운데가 조건</small>${matchBadge(waterValue === 1)}</div>
          <div class="workshop-mini-level" data-level="${waterValue}" role="img" aria-label="물의 양 3단계 중 ${waterValue + 1}단계"><span></span><div>${levelDots(waterValue)}</div></div>
          ${levelControls(water, waterValue)}
        </section>
        <section class="workshop-condition-row ${shaftValue ? 'matched' : ''}">
          <div class="workshop-condition-copy"><strong lang="zh-Hant">工作軸</strong><small>작업축 · 연결이 조건</small>${matchBadge(shaftValue)}</div>
          <div class="workshop-condition-symbol coupling ${shaftValue ? 'on' : ''}" aria-hidden="true"><i></i><i></i></div>
          <button type="button" class="workshop-late-toggle" data-workshop-late-action="toggle" data-component="${shaft.id}">${shaftValue ? '분리' : '연결'}</button>
        </section>
        <section class="workshop-condition-row ${!furnaceValue ? 'matched' : ''}">
          <div class="workshop-condition-copy"><strong lang="zh-Hant">火爐</strong><small>화덕 · 꺼짐이 조건</small>${matchBadge(!furnaceValue)}</div>
          <div class="workshop-condition-symbol furnace ${furnaceValue ? 'on' : ''}" aria-hidden="true"><i></i></div>
          <button type="button" class="workshop-late-toggle" data-workshop-late-action="toggle" data-component="${furnace.id}">${furnaceValue ? '끄기' : '켜기'}</button>
        </section>
      </div>
      <div class="workshop-bench ${unlocked ? 'unlocked' : ''}" role="img" aria-label="${unlocked ? '열린 작업대' : '잠긴 작업대'}">
        <span class="workshop-bench-lock">${unlocked ? '✓' : '▣'}</span>
        <div><strong>${unlocked ? '工作臺打開' : '工作臺鎖住'}</strong><small>${unlocked ? '세 조건이 모두 맞았어.' : '세 조건이 모두 맞아야 열려.'}</small></div>
      </div>
    </div>`;
  }

  function renderBlueFlameScene(cfg) {
    const ws = state.workshop;
    const fire = componentById(cfg, 'flameFire');
    const air = componentById(cfg, 'flameAir');
    const fireValue = ws.values.flameFire;
    const airValue = ws.values.flameAir;
    const blue = !!ws.derived.blueFlameVisible;
    const smokeGone = !!ws.derived.blackSmokeGone;
    return `<div class="workshop-late-scene workshop-blueflame-scene">
      <div class="workshop-blueflame-result ${blue ? 'blue' : ''} ${smokeGone ? 'clear' : ''}">
        <div class="workshop-smoke" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="workshop-flame-large" role="img" aria-label="${blue ? '나타난 푸른 불꽃' : '주황색 불꽃과 검은 연기'}"><span></span></div>
        <div class="workshop-blueflame-copy"><strong>${blue ? '藍色火焰出現' : '黑煙還在'}</strong><small>${smokeGone ? '黑煙消失' : airValue === 1 ? '연기가 조금 줄었어.' : '바람이 부족해 연기가 많아.'}</small></div>
      </div>
      <div class="workshop-two-controls">
        <section class="workshop-late-control-card">
          <div><strong lang="zh-Hant">火力</strong><small>불의 세기 · 保持</small></div>
          <div class="workshop-mini-flame" data-level="${fireValue}" aria-hidden="true"><i></i>${levelDots(fireValue)}</div>
          ${levelControls(fire, fireValue)}
        </section>
        <section class="workshop-late-control-card">
          <div><strong lang="zh-Hant">風量</strong><small>바람의 세기 · 調整</small></div>
          <div class="workshop-mini-wind" data-level="${airValue}" aria-hidden="true"><i></i><i></i><i></i>${levelDots(airValue)}</div>
          ${levelControls(air, airValue)}
        </section>
      </div>
      <div class="workshop-board-note">직접 出現·消失을 누르는 게 아니야. 불과 바람의 결과를 봐.</div>
    </div>`;
  }

  function renderGear(component) {
    const damaged = !!state.workshop.values[component.id];
    const identified = !!state.workshop.identified?.[component.id];
    const repairable = damaged && identified && (current().workshop.repairTargets || []).includes(component.id);
    return `<section class="workshop-gear-card ${damaged ? 'damaged' : ''} ${identified ? 'identified' : ''}">
      <button type="button" class="workshop-gear-inspect" data-workshop-inspect="${component.id}" aria-label="${component.labelKo} 살펴보기">
        <span class="workshop-gear" aria-hidden="true"><i></i></span>
        <strong lang="zh-Hant">${component.labelZh}</strong><small>${component.labelKo}</small>
      </button>
      <div class="workshop-gear-state">${identified ? (damaged ? '損壞' : '正常') : '？'}</div>
      ${repairable ? `<button type="button" class="workshop-repair-button" data-workshop-late-action="repair" data-component="${component.id}">修復 · 수리하기</button>` : ''}
    </section>`;
  }

  function renderGearScene(cfg) {
    const recovered = !!state.workshop.derived.machineRecovered;
    const gears = (cfg.components || []).map(renderGear).join('');
    return `<div class="workshop-late-scene workshop-gears-scene">
      <div class="workshop-gears-row">${gears}</div>
      <div class="workshop-machine-output ${recovered ? 'running' : ''}" role="img" aria-label="${recovered ? '기능이 회복되어 움직이는 장치' : '멈춰 있는 장치'}">
        <span class="workshop-output-wheel"><i></i></span>
        <div><strong>${recovered ? '功能恢復' : '機器停止'}</strong><small>${recovered ? '수리 결과로 기능이 돌아왔어.' : '설정이 아니라 부품 상태를 살펴봐.'}</small></div>
      </div>
      <div class="workshop-board-note">톱니를 눌러 상태를 확인해. 정상 부품은 굳이 수리할 필요가 없어.</div>
    </div>`;
  }

  function regulatorLevel(component, value, keep = false) {
    return `<section class="workshop-regulator-cell ${keep ? 'keep' : ''}">
      <div><strong lang="zh-Hant">${component.labelZh}</strong><small>${component.labelKo}${keep ? ' · 保持' : ''}</small></div>
      <div class="workshop-regulator-level" data-level="${value}" aria-hidden="true"><span></span>${levelDots(value)}</div>
      ${levelControls(component, value)}
    </section>`;
  }

  function regulatorLink(component, value) {
    return `<section class="workshop-regulator-cell">
      <div><strong lang="zh-Hant">${component.labelZh}</strong><small>${component.labelKo}</small></div>
      <div class="workshop-regulator-link ${value ? 'on' : ''}" aria-hidden="true"><i></i><i></i></div>
      <button type="button" class="workshop-late-toggle" data-workshop-late-action="toggle" data-component="${component.id}">${value ? '분리' : '연결'}</button>
    </section>`;
  }

  function renderRegulatorScene(cfg) {
    const ws = state.workshop;
    const recovered = !!ws.derived.systemRecovered;
    const indicator = !!ws.derived.oldIndicatorVisible;
    const noiseGone = !!ws.derived.knockingGone;
    const gate = componentById(cfg, 'regulatorGate');
    const balance = componentById(cfg, 'regulatorBalance');
    const mainLink = componentById(cfg, 'regulatorMainLink');
    const idleLink = componentById(cfg, 'regulatorIdleLink');
    const gear = componentById(cfg, 'regulatorGear');
    const gearDamaged = !!ws.values.regulatorGear;
    return `<div class="workshop-late-scene workshop-regulator-scene ${recovered ? 'recovered' : ''}">
      <div class="workshop-regulator-head">
        <span class="workshop-old-indicator ${indicator ? 'visible' : ''}">${indicator ? '舊標記 ✦' : '· · ·'}</span>
        <div><strong>${recovered ? '舊裝置穩定' : '舊裝置不穩定'}</strong><small>${noiseGone ? '거슬리던 덜컹임이 사라졌어.' : '덜컹, 덜컹… 아직 소리가 나.'}</small></div>
      </div>
      <div class="workshop-regulator-grid">
        ${regulatorLevel(gate, ws.values.regulatorGate)}
        ${regulatorLevel(balance, ws.values.regulatorBalance, true)}
        ${regulatorLink(mainLink, !!ws.values.regulatorMainLink)}
        ${regulatorLink(idleLink, !!ws.values.regulatorIdleLink)}
        <section class="workshop-regulator-cell workshop-regulator-gear ${gearDamaged ? 'damaged' : ''}">
          <div><strong lang="zh-Hant">${gear.labelZh}</strong><small>${gear.labelKo}</small></div>
          <span class="workshop-gear" aria-hidden="true"><i></i></span>
          <button type="button" class="workshop-repair-button" data-workshop-late-action="repair" data-component="${gear.id}" ${gearDamaged ? '' : 'disabled'}>${gearDamaged ? '修復 · 수리' : '修復完成'}</button>
        </section>
      </div>
      <div class="workshop-board-note">순서는 정해져 있지 않아. 하나를 바꿀 때마다 전체 상태가 어떻게 달라지는지 봐.</div>
    </div>`;
  }

  function bindLateActions() {
    gridEl.querySelectorAll('[data-workshop-late-action]').forEach(button => {
      button.addEventListener('click', () => runLateAction(button.dataset.component, button.dataset.workshopLateAction));
    });
    gridEl.querySelectorAll('[data-workshop-inspect]').forEach(button => {
      button.addEventListener('click', () => inspectGear(button.dataset.workshopInspect));
    });
  }

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
    return { text: '상태가 달라졌어. 다른 조건과 결과도 함께 확인해봐.', type: 'info' };
  }

  function finishIfSolved(stage, cfg, componentId, actionType) {
    const solved = M.isSolved(cfg, state.workshop);
    const feedback = feedbackFor(stage, componentId, actionType, state.workshop.values[componentId], solved);
    setStatus(feedback.text, feedback.type);
    if (!solved) return;
    if (stageSession.mode !== 'replay') completed.add(stage.id);
    window.GameFlow?.recordStageComplete(stage.id, stageSession);
    save();
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === stage.id && isWin()) showComplete();
    }, 480);
  }

  function runLateAction(componentId, actionType) {
    const stage = current(), cfg = cfgFor(stage);
    if (!isLateStage(stage) || screen !== 'tutorial' || isWin()) return;
    ensureLateState();
    const result = M.applyAction(cfg, state.workshop, { component: componentId, type: actionType });
    if (!result.changed) {
      const limit = cfg.feedback?.limit?.[`${componentId}:${actionType}`];
      setStatus(limit?.text || '이 장치는 그 방향으로 더 움직이지 않아.', limit?.type || 'info');
      return;
    }
    history.push(clone(state));
    state.workshop = result.state;
    state.workshop.identified = state.workshop.identified || {};
    state.turn++;
    save();
    render();
    finishIfSolved(stage, cfg, componentId, actionType);
  }

  function inspectGear(componentId) {
    const stage = current(), cfg = cfgFor(stage);
    if (!isLateStage(stage) || cfg.scene !== 'gears' || screen !== 'tutorial' || isWin()) return;
    ensureLateState();
    const component = componentById(cfg, componentId);
    if (!component) return;
    state.workshop.identified[componentId] = true;
    save();
    render();
    if (state.workshop.values[componentId]) {
      setStatus('這個齒輪損壞了。 이 톱니가 실제로 손상됐어. 이제 수리할 수 있어.', 'info');
    } else {
      setStatus('這個沒有損壞。 이 톱니는 정상이라 수리할 필요가 없어.', 'info');
    }
  }

  const baseRender = render;
  render = function workshopLateRender() {
    const stage = current();
    if (!isLateStage(stage)) {
      gridEl.classList.remove('workshop-late-board');
      return baseRender();
    }
    ensureLateState();
    $('#stageKicker').textContent = stage.kicker || '1장 · 장인골';
    $('#stageTitle').textContent = stage.subtitle;
    renderLateGoal(stage);
    gridEl.style.gridTemplateColumns = '';
    gridEl.className = 'grid workshop-board workshop-late-board';
    gridEl.setAttribute('role', 'group');
    gridEl.setAttribute('aria-label', stage.workshop.boardLabel || '장인골 장치판');
    if (stage.workshop.scene === 'conditions') gridEl.innerHTML = renderConditionScene(stage.workshop);
    else if (stage.workshop.scene === 'blue-flame') gridEl.innerHTML = renderBlueFlameScene(stage.workshop);
    else if (stage.workshop.scene === 'gears') gridEl.innerHTML = renderGearScene(stage.workshop);
    else gridEl.innerHTML = renderRegulatorScene(stage.workshop);
    bindLateActions();
    renderLateWords(stage);
    const controls = $('.controls');
    $('#waitBtn').hidden = true;
    $('#inspectBtn').hidden = true;
    $('#undoBtn').hidden = false;
    $('#undoBtn').disabled = !history.length;
    controls.style.gridTemplateColumns = '1fr';
  };
})();