/* Academic Tower claim-revision workbench. Pure transitions stay testable without a browser. */
(() => {
  const copy = value => JSON.parse(JSON.stringify(value));
  const orderKey = (caseId, step) => `${caseId}:${step}`;

  function orderedIds(items, correctId, correctSlot) {
    const ids = items.map(item => item.id);
    const wrong = ids.filter(id => id !== correctId);
    const result = new Array(ids.length);
    result[correctSlot] = correctId;
    let wrongIndex = 0;
    for (let index = 0; index < result.length; index += 1) {
      if (result[index] === undefined) result[index] = wrong[wrongIndex++];
    }
    return result;
  }

  function optionOrders(config, rng = Math.random) {
    const result = {};
    const baseFraction = Math.max(0, Math.min(.999999, Number(rng()) || 0));
    let challengeIndex = 0;
    for (const item of config.cases || []) {
      if (item.mode === 'guided') {
        const baseSlot = Math.floor(baseFraction * item.claims.length);
        result[orderKey(item.id, 'claim')] = orderedIds(
          item.claims, item.repairTargetId, (baseSlot + challengeIndex++) % item.claims.length
        );
      }
      const baseSlot = Math.floor(baseFraction * item.revisions.length);
      result[orderKey(item.id, 'revision')] = orderedIds(
        item.revisions, item.correctRevisionId, (baseSlot + challengeIndex++) % item.revisions.length
      );
    }
    return result;
  }

  function openingPhase(item) {
    return item.mode === 'guided' ? 'claim' : 'revision';
  }

  function createState(config, rng) {
    const item = config?.cases?.[0];
    if (config?.kind !== 'claim-revision' || !item) return null;
    return {
      schemaVersion: config.schemaVersion,
      kind: config.kind,
      caseIndex: 0,
      phase: openingPhase(item),
      claimId: null,
      revisionId: null,
      completedCaseIds: [],
      optionOrders: optionOrders(config, rng),
      lastCheck: null
    };
  }

  function isValidState(config, workbench) {
    return !!workbench && workbench.kind === config?.kind &&
      workbench.schemaVersion === config?.schemaVersion &&
      Number.isInteger(workbench.caseIndex) &&
      workbench.optionOrders && typeof workbench.optionOrders === 'object';
  }

  function caseFor(config, workbench) {
    return config?.cases?.[workbench?.caseIndex] || null;
  }

  function applyAction(config, currentState, action) {
    const next = copy(isValidState(config, currentState) ? currentState : createState(config));
    const item = caseFor(config, next);
    if (!next || !item || !action?.type || next.phase === 'complete') {
      return { changed: false, state: next, feedback: '' };
    }
    let changed = false;
    let feedback = '';
    let correct = null;

    if (action.type === 'select-claim' && next.phase === 'claim' &&
      item.claims.some(option => option.id === action.value)) {
      if (next.claimId !== action.value || next.lastCheck) changed = true;
      next.claimId = action.value;
      next.lastCheck = null;
    } else if (action.type === 'submit-claim' && next.phase === 'claim' && next.claimId) {
      const selected = item.claims.find(option => option.id === next.claimId);
      correct = next.claimId === item.repairTargetId;
      next.lastCheck = { step: 'claim', id: next.claimId, correct };
      feedback = selected?.feedbackKo || '';
      if (correct) {
        next.phase = 'revision';
        next.revisionId = null;
      }
      changed = true;
    } else if (action.type === 'select-revision' && next.phase === 'revision' &&
      item.revisions.some(option => option.id === action.value)) {
      if (next.revisionId !== action.value || next.lastCheck) changed = true;
      next.revisionId = action.value;
      next.lastCheck = null;
    } else if (action.type === 'submit-revision' && next.phase === 'revision' && next.revisionId) {
      const selected = item.revisions.find(option => option.id === next.revisionId);
      correct = next.revisionId === item.correctRevisionId;
      next.lastCheck = { step: 'revision', id: next.revisionId, correct };
      feedback = correct ? item.successFeedbackKo : (selected?.feedbackKo || '두 사실을 모두 남겼는지 다시 살펴봐.');
      if (correct) {
        if (!next.completedCaseIds.includes(item.id)) next.completedCaseIds.push(item.id);
        next.phase = next.caseIndex === config.cases.length - 1 ? 'complete' : 'review';
      }
      changed = true;
    } else if (action.type === 'next-case' && next.phase === 'review') {
      const nextIndex = next.caseIndex + 1;
      const nextCase = config.cases[nextIndex];
      if (nextCase) {
        next.caseIndex = nextIndex;
        next.phase = openingPhase(nextCase);
        next.claimId = null;
        next.revisionId = null;
        next.lastCheck = null;
        changed = true;
        feedback = '같은 방법이 새 기록에서도 통하는지 확인해 보자.';
      }
    }
    return { changed, state: next, feedback, correct };
  }

  function isSolved(config, workbench) {
    if (!isValidState(config, workbench) || workbench.phase !== 'complete') return false;
    return (config.cases || []).every(item => workbench.completedCaseIds.includes(item.id));
  }

  const Mechanic = Object.freeze({
    createState, applyAction, isSolved, isValidState, optionOrders,
    __test: Object.freeze({ openingPhase, orderedIds })
  });
  globalThis.AcademicTowerMechanic = Mechanic;

  if (typeof initialState !== 'function' || typeof render !== 'function' || typeof isWin !== 'function') return;

  const configFor = stage => stage?.academicTower || null;
  const baseInitialState = initialState;
  initialState = function academicTowerInitialState(stage) {
    const next = baseInitialState(stage);
    const config = configFor(stage);
    if (config) next.academicTower = createState(config);
    return next;
  };

  const baseIsWin = isWin;
  isWin = function academicTowerIsWin() {
    const config = configFor(current());
    return config ? isSolved(config, state?.academicTower) : baseIsWin();
  };

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const selected = (value, expected) => value === expected ? ' selected' : '';
  const pressed = (value, expected) => String(value === expected);

  function orderedItems(workbench, item, step) {
    const options = step === 'claim' ? item.claims : item.revisions;
    const ids = workbench.optionOrders[orderKey(item.id, step)] || options.map(option => option.id);
    return ids.map(id => options.find(option => option.id === id)).filter(Boolean);
  }

  function markedText(source) {
    const text = escapeHtml(source.text);
    const marker = source.connectorZh;
    if (!marker) return text;
    return text.replace(escapeHtml(marker), `<strong class="academicConnector">${escapeHtml(marker)}</strong>`);
  }

  function renderSources(item) {
    const relation = item.sources.length > 1
      ? `<div class="academicSourceRelation" aria-label="${escapeHtml(item.connectorZh)}로 이어지는 기록"><span aria-hidden="true">↳</span><small>${item.scope === 'sentence' ? '한 문장 안의 대조' : '두 기록 사이의 전환'}</small></div>`
      : '';
    const cards = item.sources.map(source => `<article class="academicSourceCard" data-source-id="${escapeHtml(source.id)}"><p lang="zh-Hant">${markedText(source)}</p><small>${escapeHtml(source.labelKo)}</small></article>`);
    const content = cards.length > 1 ? `${cards[0]}${relation}${cards.slice(1).join('')}` : cards.join('');
    return `<div class="academicSources ${item.scope === 'sentence' ? 'sentence' : 'records'}">${content}</div>`;
  }

  function renderOptions(workbench, item, step) {
    const isClaim = step === 'claim';
    const value = isClaim ? workbench.claimId : workbench.revisionId;
    const selectAction = isClaim ? 'select-claim' : 'select-revision';
    const submitAction = isClaim ? 'submit-claim' : 'submit-revision';
    const heading = isClaim ? '고칠 주장 찾기' : (item.mode === 'guided' ? '메모 수정' : '두 사실을 반영한 메모');
    const submitLabel = isClaim ? '이 주장 검토' : '이 메모로 수정';
    const buttons = orderedItems(workbench, item, step).map(option => `<button type="button" class="academicMemoChoice${selected(value, option.id)}" data-academic-action="${selectAction}" data-value="${escapeHtml(option.id)}" aria-pressed="${pressed(value, option.id)}">${escapeHtml(option.labelKo)}</button>`).join('');
    return `<section class="academicStep"><h2>${heading}</h2><div class="academicMemoChoices">${buttons}</div></section><button type="button" class="academicConfirm" data-academic-action="${submitAction}" ${value ? '' : 'disabled'}>${submitLabel}</button>`;
  }

  function renderReview(item, workbench, finalReview = false) {
    const corrected = item.revisions.find(option => option.id === item.correctRevisionId);
    return `<section class="academicReview" aria-live="polite"><div class="academicReviewLabel">검토 완료</div><p class="academicReviewBefore">${escapeHtml(item.draftKo)}</p><div class="academicReviewArrow" aria-hidden="true">↓</div><p class="academicReviewAfter">${escapeHtml(corrected?.labelKo || '')}</p><div class="academicEvidenceMap"><strong lang="zh-Hant">${escapeHtml(item.connectorZh)}</strong><span>${escapeHtml(item.connectionKo)}</span></div></section>${finalReview ? '' : '<button type="button" class="academicConfirm" data-academic-action="next-case">새 기록 확인</button>'}`;
  }

  function renderWorkbench(config, workbench) {
    const item = caseFor(config, workbench);
    if (!item) return '';
    const progress = item.mode === 'guided' ? '연습 · 1 / 2' : '새 기록 · 2 / 2';
    let action = '';
    if (workbench.phase === 'claim') {
      action = renderOptions(workbench, item, 'claim');
    } else if (workbench.phase === 'revision') {
      action = renderOptions(workbench, item, 'revision');
    } else if (workbench.phase === 'review' || workbench.phase === 'complete') {
      action = renderReview(item, workbench, workbench.phase === 'complete');
    }
    return `<div class="academicCaseProgress">${progress}</div><h2 class="academicQuestion">${escapeHtml(item.questionKo)}</h2>${renderSources(item)}<p class="academicDraft">${escapeHtml(item.draftKo)}</p>${action}`;
  }

  function goalHtml(workbench) {
    if (workbench.phase === 'claim') return '기록이 직접 말한 사실과 <span class="hot">성급한 판단</span>을 구별해.';
    if (workbench.phase === 'revision') return '앞뒤 사실을 함께 남기는 <span class="hot">메모</span>로 고쳐.';
    if (workbench.phase === 'review') return '고친 방법을 <span class="done">새 기록</span>에도 적용해.';
    return '두 사실을 보존하고 <span class="done">판단만 수정</span>했어.';
  }

  function renderWords(stage, workbench) {
    const solved = isSolved(stage.academicTower, workbench);
    $('#words').innerHTML = '';
    stage.words.forEach(word => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wordbtn';
      button.textContent = word;
      if (solved) button.classList.add('done');
      button.onclick = () => showWord(word);
      $('#words').append(button);
    });
  }

  function bindActions() {
    gridEl.querySelectorAll('[data-academic-action]').forEach(button => {
      button.addEventListener('click', () => runAction(button.dataset.academicAction, button.dataset.value));
    });
  }

  function runAction(type, value) {
    const stage = current();
    const config = configFor(stage);
    if (!config || screen !== 'tutorial' || isWin()) return;
    const result = applyAction(config, state.academicTower, { type, value });
    if (!result.changed) return;
    history.push(clone(state));
    state.academicTower = result.state;
    state.turn += 1;
    save();
    render();
    const solved = isSolved(config, state.academicTower);
    if (result.feedback) setStatus(result.feedback, result.correct === false ? 'info' : 'good');
    if (!solved) return;
    if (stageSession.mode !== 'replay') completed.add(stage.id);
    window.GameFlow?.recordStageComplete(stage.id, stageSession);
    save();
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === stage.id && isWin()) showComplete();
    }, 220);
  }

  const baseRender = render;
  render = function academicTowerRender() {
    const stage = current();
    const config = configFor(stage);
    const view = document.getElementById('tutorialView');
    view?.classList.toggle('academicTowerStage', !!config);
    if (!config) {
      gridEl.classList.remove('academicTowerWorkbench');
      return baseRender();
    }
    if (!isValidState(config, state.academicTower)) state.academicTower = createState(config);
    const workbench = state.academicTower;
    $('#stageKicker').textContent = stage.kicker;
    $('#stageTitle').textContent = stage.subtitle;
    $('#goal').innerHTML = goalHtml(workbench);
    $('#ruleLine').textContent = stage.rule;
    gridEl.style.gridTemplateColumns = '';
    gridEl.className = 'grid academicTowerWorkbench';
    gridEl.setAttribute('role', 'group');
    gridEl.setAttribute('aria-label', '학술탑 기록 검토 작업대');
    gridEl.innerHTML = renderWorkbench(config, workbench);
    bindActions();
    renderWords(stage, workbench);
    $('#waitBtn').hidden = true;
    $('#inspectBtn').hidden = true;
    $('#undoBtn').hidden = false;
    $('#undoBtn').disabled = !history.length;
    $('.controls').style.gridTemplateColumns = '1fr';
  };
})();
