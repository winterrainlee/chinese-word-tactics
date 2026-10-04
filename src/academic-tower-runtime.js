/* Academic Tower claim-revision workbench. Pure transitions stay testable without a browser. */
(() => {
  const copy = value => JSON.parse(JSON.stringify(value));
  const orderKey = (caseId, step) => `${caseId}:${step}`;

  function shuffledIds(items, rng = Math.random) {
    const ids = items.map(item => typeof item === 'string' ? item : item.id);
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.max(0, Math.min(.999999, Number(rng()) || 0)) * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }

  function optionOrders(config, rng = Math.random) {
    if (config?.kind === 'replacement-link') return replacementOptionOrders(config, rng);
    if (config?.kind === 'connector-cloze') return clozeOptionOrders(config, rng);
    if (config?.kind !== 'claim-revision') return {};
    const result = {};
    for (const item of config.cases || []) {
      if (item.mode === 'guided') {
        result[orderKey(item.id, 'claim')] = shuffledIds(item.claims, rng);
      }
      result[orderKey(item.id, 'revision')] = shuffledIds(item.revisions, rng);
    }
    return result;
  }

  function openingPhase(item) {
    return item.mode === 'guided' ? 'claim' : 'revision';
  }

  function createClaimRevisionState(config, rng) {
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

  function isValidClaimRevisionState(config, workbench) {
    return !!workbench && workbench.kind === config?.kind &&
      workbench.schemaVersion === config?.schemaVersion &&
      Number.isInteger(workbench.caseIndex) &&
      workbench.optionOrders && typeof workbench.optionOrders === 'object';
  }

  function caseFor(config, workbench) {
    return config?.cases?.[workbench?.caseIndex] || null;
  }

  function applyClaimRevisionAction(config, currentState, action) {
    const next = copy(isValidClaimRevisionState(config, currentState) ? currentState : createClaimRevisionState(config));
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

  function isClaimRevisionSolved(config, workbench) {
    if (!isValidClaimRevisionState(config, workbench) || workbench.phase !== 'complete') return false;
    return (config.cases || []).every(item => workbench.completedCaseIds.includes(item.id));
  }

  function createExpectationState(config) {
    if (config?.kind !== 'expectation-sort' || !config.cases?.length || !config.relations?.length) return null;
    return {
      schemaVersion: config.schemaVersion,
      kind: config.kind,
      caseIndex: 0,
      phase: 'sort',
      relationId: null,
      completedCaseIds: [],
      lastCheck: null
    };
  }

  function isValidExpectationState(config, workbench) {
    return !!workbench && workbench.kind === config?.kind &&
      workbench.schemaVersion === config?.schemaVersion &&
      Number.isInteger(workbench.caseIndex) && Array.isArray(workbench.completedCaseIds) &&
      ['sort', 'review', 'complete'].includes(workbench.phase);
  }

  function applyExpectationAction(config, currentState, action) {
    const next = copy(isValidExpectationState(config, currentState) ? currentState : createExpectationState(config));
    const item = caseFor(config, next);
    if (!next || !item || !action?.type || next.phase === 'complete') {
      return { changed: false, state: next, feedback: '' };
    }
    let changed = false;
    let feedback = '';
    let correct = null;

    if (action.type === 'select-relation' && next.phase === 'sort' &&
      config.relations.some(relation => relation.id === action.value)) {
      if (next.relationId !== action.value || next.lastCheck) changed = true;
      next.relationId = action.value;
      next.lastCheck = null;
    } else if (action.type === 'submit-relation' && next.phase === 'sort' && next.relationId) {
      correct = next.relationId === item.relation;
      next.lastCheck = { step: 'relation', id: next.relationId, correct };
      feedback = correct ? item.successFeedbackKo : item.wrongFeedbackKo;
      if (correct) {
        if (!next.completedCaseIds.includes(item.id)) next.completedCaseIds.push(item.id);
        next.phase = next.caseIndex === config.cases.length - 1 ? 'complete' : 'review';
      }
      changed = true;
    } else if (action.type === 'next-case' && next.phase === 'review') {
      const nextIndex = next.caseIndex + 1;
      if (config.cases[nextIndex]) {
        next.caseIndex = nextIndex;
        next.phase = 'sort';
        next.relationId = null;
        next.lastCheck = null;
        changed = true;
        feedback = nextIndex < 2
          ? '다음 안내 기록도 예상과 실제를 비교해 보자.'
          : '이번에는 표지어 없이 두 기록의 관계부터 판단해 보자.';
      }
    }
    return { changed, state: next, feedback, correct };
  }

  function isExpectationSolved(config, workbench) {
    if (!isValidExpectationState(config, workbench) || workbench.phase !== 'complete') return false;
    return config.cases.every(item => workbench.completedCaseIds.includes(item.id));
  }

  function replacementOptionOrders(config, rng = Math.random) {
    const result = {};
    (config?.cases || []).forEach(item => {
      const cards = item.cards || [];
      result[orderKey(item.id, 'results')] = shuffledIds(cards, rng);
      if (item.mode !== 'guided') {
        result[orderKey(item.id, 'links')] = shuffledIds(config.linkOptions || [], rng);
      }
    });
    return result;
  }

  function createReplacementState(config, rng) {
    if (config?.kind !== 'replacement-link' || !config.cases?.length) return null;
    return {
      schemaVersion: config.schemaVersion,
      kind: config.kind,
      caseIndex: 0,
      phase: 'place-results',
      resultSlot: 'absent',
      resultId: null,
      absentResultId: null,
      actualResultId: null,
      linkId: null,
      completedCaseIds: [],
      optionOrders: replacementOptionOrders(config, rng),
      lastCheck: null
    };
  }

  function isValidReplacementState(config, workbench) {
    return !!workbench && workbench.kind === config?.kind &&
      workbench.schemaVersion === config?.schemaVersion && Number.isInteger(workbench.caseIndex) &&
      Array.isArray(workbench.completedCaseIds) && workbench.optionOrders &&
      ['place-results', 'choose-link', 'review', 'complete'].includes(workbench.phase);
  }

  function completeReplacementCase(config, next, item) {
    if (!next.completedCaseIds.includes(item.id)) next.completedCaseIds.push(item.id);
    next.phase = next.caseIndex === config.cases.length - 1 ? 'complete' : 'review';
  }

  function applyReplacementAction(config, currentState, action) {
    const next = copy(isValidReplacementState(config, currentState) ? currentState : createReplacementState(config));
    const item = caseFor(config, next);
    if (!next || !item || !action?.type || next.phase === 'complete') {
      return { changed: false, state: next, feedback: '' };
    }
    let changed = false;
    let feedback = '';
    let correct = null;

    if (action.type === 'select-result' && next.phase === 'place-results' &&
      item.cards.some(card => card.id === action.value)) {
      changed = next.resultId !== action.value || !!next.lastCheck;
      next.resultId = action.value;
      next.lastCheck = null;
    } else if (action.type === 'submit-result' && next.phase === 'place-results' && next.resultId) {
      const slot = next.resultSlot;
      const selectedCard = item.cards.find(card => card.id === next.resultId);
      const expectedId = slot === 'absent' ? item.absentResultId : item.actualResultId;
      correct = next.resultId === expectedId;
      next.lastCheck = { step: slot, id: next.resultId, correct };
      feedback = correct
        ? (slot === 'absent' ? '생기지 않은 예상을 남겼어. 이제 실제로 생긴 결과를 찾아.' : item.successFeedbackKo)
        : (slot === 'absent' ? selectedCard?.absentFeedbackKo : selectedCard?.actualFeedbackKo);
      if (correct && slot === 'absent') {
        next.absentResultId = next.resultId;
        next.resultSlot = 'actual';
        next.resultId = null;
        next.lastCheck = null;
      } else if (correct) {
        next.actualResultId = next.resultId;
        next.resultId = null;
        next.lastCheck = null;
        if (item.mode === 'guided') {
          next.linkId = config.correctLinkId;
          completeReplacementCase(config, next, item);
        } else {
          next.phase = 'choose-link';
        }
      }
      changed = true;
    } else if (action.type === 'select-link' && next.phase === 'choose-link' &&
      config.linkOptions.some(option => option.id === action.value)) {
      changed = next.linkId !== action.value || !!next.lastCheck;
      next.linkId = action.value;
      next.lastCheck = null;
    } else if (action.type === 'submit-link' && next.phase === 'choose-link' && next.linkId) {
      const selectedLink = config.linkOptions.find(option => option.id === next.linkId);
      correct = next.linkId === config.correctLinkId;
      next.lastCheck = { step: 'link', id: next.linkId, correct };
      feedback = correct ? item.successFeedbackKo : selectedLink?.feedbackKo;
      if (correct) completeReplacementCase(config, next, item);
      changed = true;
    } else if (action.type === 'next-case' && next.phase === 'review') {
      const nextIndex = next.caseIndex + 1;
      if (config.cases[nextIndex]) {
        next.caseIndex = nextIndex;
        next.phase = 'place-results';
        next.resultSlot = 'absent';
        next.resultId = null;
        next.absentResultId = null;
        next.actualResultId = null;
        next.linkId = null;
        next.lastCheck = null;
        changed = true;
        feedback = '이번에는 두 결과를 직접 찾고, 알맞은 연결어까지 골라 보자.';
      }
    }
    return { changed, state: next, feedback: feedback || '', correct };
  }

  function isReplacementSolved(config, workbench) {
    return isValidReplacementState(config, workbench) && workbench.phase === 'complete' &&
      config.cases.every(item => workbench.completedCaseIds.includes(item.id));
  }

  function clozeOptionOrders(config, rng = Math.random) {
    const result = {};
    (config?.blanks || []).forEach(item => {
      result[item.id] = shuffledIds(item.options, rng);
    });
    return result;
  }

  function createClozeState(config, rng) {
    if (config?.kind !== 'connector-cloze' || !config.blanks?.length) return null;
    return {
      schemaVersion: config.schemaVersion,
      kind: config.kind,
      blankIndex: 0,
      phase: 'choose-connector',
      selectedConnectorId: null,
      completedBlankIds: [],
      optionOrders: clozeOptionOrders(config, rng),
      lastCheck: null
    };
  }

  function isValidClozeState(config, workbench) {
    return !!workbench && workbench.kind === config?.kind &&
      workbench.schemaVersion === config?.schemaVersion && Number.isInteger(workbench.blankIndex) &&
      Array.isArray(workbench.completedBlankIds) && workbench.optionOrders &&
      ['choose-connector', 'review', 'complete'].includes(workbench.phase);
  }

  function blankFor(config, workbench) {
    return config?.blanks?.[workbench?.blankIndex] || null;
  }

  function applyClozeAction(config, currentState, action) {
    const next = copy(isValidClozeState(config, currentState) ? currentState : createClozeState(config));
    const item = blankFor(config, next);
    if (!next || !item || !action?.type || next.phase === 'complete') {
      return { changed: false, state: next, feedback: '' };
    }
    let changed = false;
    let feedback = '';
    let correct = null;
    if (action.type === 'select-connector' && next.phase === 'choose-connector' && item.options.includes(action.value)) {
      changed = next.selectedConnectorId !== action.value || !!next.lastCheck;
      next.selectedConnectorId = action.value;
      next.lastCheck = null;
    } else if (action.type === 'submit-connector' && next.phase === 'choose-connector' && next.selectedConnectorId) {
      correct = next.selectedConnectorId === item.correctConnectorId;
      next.lastCheck = { step: 'connector', id: next.selectedConnectorId, correct };
      feedback = correct ? item.successFeedbackKo :
        (item.optionFeedback?.[next.selectedConnectorId] || config.connectorFeedback[next.selectedConnectorId]);
      if (correct) {
        if (!next.completedBlankIds.includes(item.id)) next.completedBlankIds.push(item.id);
        next.phase = next.blankIndex === config.blanks.length - 1 ? 'complete' : 'review';
      }
      changed = true;
    } else if (action.type === 'next-blank' && next.phase === 'review') {
      if (config.blanks[next.blankIndex + 1]) {
        next.blankIndex += 1;
        next.phase = 'choose-connector';
        next.selectedConnectorId = null;
        next.lastCheck = null;
        changed = true;
        feedback = config.blanks[next.blankIndex].kind === 'decision'
          ? '필요하면 복원한 기록을 다시 펼쳐 보고, 전달할 판단을 골라.'
          : '다음 빈칸도 문장 전체를 읽고 관계를 확인해 보자.';
      }
    }
    return { changed, state: next, feedback: feedback || '', correct };
  }

  function isClozeSolved(config, workbench) {
    return isValidClozeState(config, workbench) && workbench.phase === 'complete' &&
      config.blanks.every(item => workbench.completedBlankIds.includes(item.id));
  }

  function createState(config, rng) {
    if (config?.kind === 'claim-revision') return createClaimRevisionState(config, rng);
    if (config?.kind === 'expectation-sort') return createExpectationState(config);
    if (config?.kind === 'replacement-link') return createReplacementState(config, rng);
    if (config?.kind === 'connector-cloze') return createClozeState(config, rng);
    return null;
  }

  function isValidState(config, workbench) {
    if (config?.kind === 'claim-revision') return isValidClaimRevisionState(config, workbench);
    if (config?.kind === 'expectation-sort') return isValidExpectationState(config, workbench);
    if (config?.kind === 'replacement-link') return isValidReplacementState(config, workbench);
    if (config?.kind === 'connector-cloze') return isValidClozeState(config, workbench);
    return false;
  }

  function applyAction(config, currentState, action) {
    if (config?.kind === 'claim-revision') return applyClaimRevisionAction(config, currentState, action);
    if (config?.kind === 'expectation-sort') return applyExpectationAction(config, currentState, action);
    if (config?.kind === 'replacement-link') return applyReplacementAction(config, currentState, action);
    if (config?.kind === 'connector-cloze') return applyClozeAction(config, currentState, action);
    return { changed: false, state: null, feedback: '' };
  }

  function isSolved(config, workbench) {
    if (config?.kind === 'claim-revision') return isClaimRevisionSolved(config, workbench);
    if (config?.kind === 'expectation-sort') return isExpectationSolved(config, workbench);
    if (config?.kind === 'replacement-link') return isReplacementSolved(config, workbench);
    if (config?.kind === 'connector-cloze') return isClozeSolved(config, workbench);
    return false;
  }

  const Mechanic = Object.freeze({
    createState, applyAction, isSolved, isValidState, optionOrders,
    __test: Object.freeze({ openingPhase, shuffledIds })
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

  function markedPhrase(value, marker) {
    const text = escapeHtml(value);
    if (!marker) return text;
    return text.replace(escapeHtml(marker), `<strong class="academicConnector">${escapeHtml(marker)}</strong>`);
  }

  function markedText(source) {
    return markedPhrase(source.text, source.connectorZh);
  }

  function renderSources(item) {
    const relation = item.sources.length > 1
      ? `<div class="academicSourceRelation" aria-label="${escapeHtml(item.connectorZh)}로 이어지는 기록"><span aria-hidden="true">↳</span><small>${item.scope === 'sentence' ? '한 문장 안의 대조' : '두 기록 사이의 전환'}</small></div>`
      : '';
    const cards = item.sources.map(source => `<article class="academicSourceCard" data-source-id="${escapeHtml(source.id)}"><p lang="zh-Hant">${markedText(source)}</p>${item.mode === 'guided' ? `<small>${escapeHtml(source.labelKo)}</small>` : `<details class="academicTranslation"><summary>뜻 보기</summary><small>${escapeHtml(source.labelKo)}</small></details>`}</article>`);
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
    const buttons = orderedItems(workbench, item, step).map(option => `<div><button type="button" class="academicMemoChoice${selected(value, option.id)}" data-academic-action="${selectAction}" data-value="${escapeHtml(option.id)}" aria-pressed="${pressed(value, option.id)}" lang="${option.labelZh ? 'zh-Hant' : 'ko'}">${escapeHtml(option.labelZh || option.labelKo)}</button>${option.labelZh ? `<details class="academicTranslation"><summary>뜻 보기</summary><small>${escapeHtml(option.labelKo)}</small></details>` : ''}</div>`).join('');
    return `<section class="academicStep"><h2>${heading}</h2><div class="academicMemoChoices">${buttons}</div></section><button type="button" class="academicConfirm" data-academic-action="${submitAction}" ${value ? '' : 'disabled'}>${submitLabel}</button>`;
  }

  function renderReview(item, workbench, finalReview = false) {
    const corrected = item.revisions.find(option => option.id === item.correctRevisionId);
    return `<section class="academicReview" aria-live="polite"><div class="academicReviewLabel">검토 완료</div><p class="academicReviewBefore">${escapeHtml(item.draftKo)}</p><div class="academicReviewArrow" aria-hidden="true">↓</div><p class="academicReviewAfter">${escapeHtml(corrected?.labelKo || '')}</p><div class="academicEvidenceMap"><strong lang="zh-Hant">${escapeHtml(item.connectorZh)}</strong><span>${escapeHtml(item.connectionKo)}</span></div></section>${finalReview ? '' : '<button type="button" class="academicConfirm" data-academic-action="next-case">새 기록 확인</button>'}`;
  }

  function renderClaimRevisionWorkbench(config, workbench) {
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

  function renderExpectationReview(config, item, finalReview) {
    const relation = config.relations.find(candidate => candidate.id === item.relation);
    return `<section class="academicExpectationReview" aria-live="polite"><div class="academicReviewLabel">분류 완료</div><div class="academicExpectationStamp"><strong lang="zh-Hant">${escapeHtml(relation?.labelZh || item.markerZh)}</strong><span>${escapeHtml(relation?.labelKo || '')}</span></div><p lang="zh-Hant">${markedPhrase(item.reviewZh, item.markerZh)}</p><small>${escapeHtml(item.successFeedbackKo)}</small></section>${finalReview ? '' : '<button type="button" class="academicConfirm" data-academic-action="next-case">다음 기록</button>'}`;
  }

  function renderExpectationWorkbench(config, workbench) {
    const item = caseFor(config, workbench);
    if (!item) return '';
    const current = workbench.caseIndex + 1;
    const progress = `${item.mode === 'guided' ? '안내' : '적용'} · ${current} / ${config.cases.length}`;
    const resultMarker = item.mode === 'guided' ? item.markerZh : null;
    let action = '';
    if (workbench.phase === 'sort') {
      const rails = config.relations.map(relation => `<button type="button" class="academicRelationRail${selected(workbench.relationId, relation.id)}" data-academic-action="select-relation" data-value="${escapeHtml(relation.id)}" aria-pressed="${pressed(workbench.relationId, relation.id)}"><strong>${escapeHtml(relation.labelKo)}</strong><span lang="zh-Hant">${escapeHtml(relation.labelZh)}</span><small>${escapeHtml(relation.hintKo)}</small></button>`).join('');
      action = `<section class="academicStep"><h2>실제 기록을 놓을 곳</h2><div class="academicRelationRails">${rails}</div></section><button type="button" class="academicConfirm" data-academic-action="submit-relation" ${workbench.relationId ? '' : 'disabled'}>이 관계로 분류</button>`;
    } else if (workbench.phase === 'review' || workbench.phase === 'complete') {
      action = renderExpectationReview(config, item, workbench.phase === 'complete');
    }
    return `<div class="academicCaseProgress">${progress}</div><h2 class="academicQuestion">예상 기록과 실제 기록의 관계는?</h2><div class="academicExpectationPair"><article class="academicExpectationCard expectation"><div>예상 기록</div><p lang="zh-Hant">${escapeHtml(item.expectationZh)}</p></article><div class="academicExpectationArrow" aria-hidden="true">↓</div><article class="academicExpectationCard result"><div>실제 기록</div><p lang="zh-Hant">${markedPhrase(item.resultZh, resultMarker)}</p></article></div>${action}`;
  }

  function orderedReplacementCards(workbench, item) {
    const ids = workbench.optionOrders[orderKey(item.id, 'results')] || item.cards.map(card => card.id);
    return ids.map(id => item.cards.find(card => card.id === id)).filter(Boolean);
  }

  function renderReplacementReview(item, finalReview) {
    return `<section class="academicReplacementReview" aria-live="polite"><div class="academicReviewLabel">기록 연결 완료</div><p lang="zh-Hant">${markedPhrase(item.completedZh, '反而')}</p><small>${escapeHtml(item.successFeedbackKo)}</small></section>${finalReview ? '' : '<button type="button" class="academicConfirm" data-academic-action="next-case">새 기록 확인</button>'}`;
  }

  function renderReplacementWorkbench(config, workbench) {
    const item = caseFor(config, workbench);
    if (!item) return '';
    const current = workbench.caseIndex + 1;
    const progress = `${item.mode === 'guided' ? '안내' : '적용'} · ${current} / ${config.cases.length}`;
    const chosenAbsent = item.cards.find(card => card.id === workbench.absentResultId);
    const chosenActual = item.cards.find(card => card.id === workbench.actualResultId);
    const slots = `<div class="academicReplacementSlots"><div class="${chosenAbsent ? 'filled' : ''}"><small>생기지 않은 예상</small><strong lang="zh-Hant">${escapeHtml(chosenAbsent?.textZh || '—')}</strong></div><span aria-hidden="true">→</span><div class="${chosenActual ? 'filled' : ''}"><small>실제로 생긴 결과</small><strong lang="zh-Hant">${escapeHtml(chosenActual?.textZh || '—')}</strong></div></div>`;
    let action = '';
    if (workbench.phase === 'place-results') {
      const heading = workbench.resultSlot === 'absent' ? '생기지 않은 예상 고르기' : '실제로 생긴 결과 고르기';
      const cards = orderedReplacementCards(workbench, item).map(card => `<button type="button" class="academicResultChoice${selected(workbench.resultId, card.id)}" data-academic-action="select-result" data-value="${escapeHtml(card.id)}" aria-pressed="${pressed(workbench.resultId, card.id)}" lang="zh-Hant">${escapeHtml(card.textZh)}</button>`).join('');
      action = `<section class="academicStep"><h2>${heading}</h2><div class="academicResultChoices">${cards}</div></section><button type="button" class="academicConfirm" data-academic-action="submit-result" ${workbench.resultId ? '' : 'disabled'}>이 결과 놓기</button>`;
    } else if (workbench.phase === 'choose-link') {
      const ids = workbench.optionOrders[orderKey(item.id, 'links')] || config.linkOptions.map(option => option.id);
      const links = ids.map(id => config.linkOptions.find(option => option.id === id)).filter(Boolean)
        .map(option => `<button type="button" class="academicConnectorChoice${selected(workbench.linkId, option.id)}" data-academic-action="select-link" data-value="${escapeHtml(option.id)}" aria-pressed="${pressed(workbench.linkId, option.id)}" lang="zh-Hant">${escapeHtml(option.labelZh)}</button>`).join('');
      action = `<section class="academicStep"><h2>두 결과를 잇는 말</h2><div class="academicConnectorChoices">${links}</div></section><button type="button" class="academicConfirm" data-academic-action="submit-link" ${workbench.linkId ? '' : 'disabled'}>이 말로 연결</button>`;
    } else {
      action = renderReplacementReview(item, workbench.phase === 'complete');
    }
    return `<div class="academicCaseProgress">${progress}</div><h2 class="academicQuestion">예상에서 빠진 결과와 실제로 생긴 결과는?</h2><div class="academicReplacementRecords"><article><div>예상 기록</div><p lang="zh-Hant">${escapeHtml(item.expectationZh)}</p></article><article><div>실제 기록</div><p lang="zh-Hant">${escapeHtml(item.actualZh)}</p></article></div>${slots}${action}`;
  }

  function renderClozeSentence(item, connectorId = null) {
    if (item.kind === 'decision') return `<p class="academicClozeSentence" lang="zh-Hant">${escapeHtml(connectorId || item.promptZh)}</p>`;
    const blank = connectorId
      ? `<strong class="academicConnector" lang="zh-Hant">${escapeHtml(connectorId)}</strong>`
      : '<span class="academicClozeBlank" aria-label="빈칸">　　</span>';
    return `<p class="academicClozeSentence" lang="zh-Hant">${escapeHtml(item.beforeZh)}${blank}${escapeHtml(item.afterZh)}${item.tailZh ? `<span>${escapeHtml(item.tailZh)}</span>` : ''}</p>`;
  }

  function renderClozeWorkbench(config, workbench) {
    const item = blankFor(config, workbench);
    if (!item) return '';
    const progress = `${escapeHtml(item.sectionKo)} · ${workbench.blankIndex + 1} / ${config.blanks.length}`;
    const context = item.contextZh ? `<p class="academicClozeContext" lang="zh-Hant">${escapeHtml(item.contextZh)}</p>` : '';
    let action = '';
    if (workbench.phase === 'choose-connector') {
      const ids = workbench.optionOrders[item.id] || item.options;
      const choices = ids.map(id => `<button type="button" class="academicConnectorChoice${selected(workbench.selectedConnectorId, id)}" data-academic-action="select-connector" data-value="${escapeHtml(id)}" aria-pressed="${pressed(workbench.selectedConnectorId, id)}" lang="zh-Hant">${escapeHtml(id)}</button>`).join('');
      action = `${renderClozeSentence(item)}<section class="academicStep"><h2>${escapeHtml(item.questionKo || '빈칸에 들어갈 말')}</h2><div class="academicConnectorChoices${item.kind === 'decision' ? ' academicDecisionChoices' : ''}">${choices}</div></section><button type="button" class="academicConfirm" data-academic-action="submit-connector" ${workbench.selectedConnectorId ? '' : 'disabled'}>${item.kind === 'decision' ? '이 판단을 전달' : '이 말로 복원'}</button>`;
    } else {
      const nextLabel = config.blanks[workbench.blankIndex + 1]?.kind === 'decision' ? '전달할 판단 정리' : '다음 빈칸';
      action = `<section class="academicClozeReview" aria-live="polite"><div class="academicReviewLabel">${item.kind === 'decision' ? '판단 정리 완료' : '복원 완료'}</div>${renderClozeSentence(item, item.correctConnectorId)}<small>${escapeHtml(item.successFeedbackKo)}</small></section>${workbench.phase === 'complete' ? '' : `<button type="button" class="academicConfirm" data-academic-action="next-blank">${nextLabel}</button>`}`;
    }
    const archive = config.blanks.filter(blank => workbench.completedBlankIds.includes(blank.id) && blank.id !== item.id)
      .map(blank => `<details class="academicArchive"><summary>${escapeHtml(blank.sectionKo)} · 다시 읽기</summary>${blank.contextZh ? `<p lang="zh-Hant">${escapeHtml(blank.contextZh)}</p>` : ''}${renderClozeSentence(blank, blank.correctConnectorId)}</details>`).join('');
    return `<div class="academicCaseProgress">${progress}</div><h2 class="academicQuestion">${item.kind === 'decision' ? '기록으로 뒷받침할 수 있는 판단을 골라.' : '문장 전체와 기록 목적을 함께 읽어.'}</h2><div class="academicClozeRecord">${context}${action}</div>${archive}`;
  }

  function isMvp(stage = current()) {
    return ['academic-tower-turn-01-que', 'academic-tower-turn-04-faner'].includes(stage?.id);
  }

  function mvpButton(action, value, label, active = false) {
    return `<button type="button" data-academic-action="${action}" data-value="${escapeHtml(value)}" aria-pressed="${active}" class="academicMvpChoice${active ? ' selected' : ''}">${label}</button>`;
  }

  function mvpWord(word) {
    return `<button type="button" class="academicMvpWord" data-academic-word="${escapeHtml(word)}" lang="zh-Hant" aria-label="${escapeHtml(word)} 뜻 보기">${escapeHtml(word)}</button>`;
  }

  function mvpMarked(text, word) {
    return escapeHtml(text).replace(escapeHtml(word), WORDS[word] ? mvpWord(word) : escapeHtml(word));
  }

  function mvpDetails(key, label, body) {
    return `<details data-mvp-detail="${key}"><summary>${label}</summary>${body}</details>`;
  }

  function renderMvp(config, workbench) {
    const item = caseFor(config, workbench);
    const done = ['review', 'complete'].includes(workbench.phase);
    let body = '';
    if (config.kind === 'claim-revision') {
      const original = item.sources.map(source => source.text).join('，');
      const translation = item.sources.map(source => source.labelKo).join(' / ');
      body = `<article class="academicMvpSource"><h2>원본 기록</h2><p lang="zh-Hant">${mvpMarked(original, item.connectorZh)}</p>${mvpDetails('source-meaning', '뜻 보기', `<p>${escapeHtml(translation)}</p>`)}</article>`;
      if (workbench.phase === 'claim') {
        const claims = orderedItems(workbench, item, 'claim').map(option => mvpButton('select-claim', option.id, escapeHtml(option.labelKo), workbench.claimId === option.id)).join('');
        body += `<section class="academicMvpMemo"><h2>검토 메모 · 고칠 주장을 눌러</h2>${claims}</section>`;
      } else {
        const chosen = item.revisions.find(option => option.id === (done ? item.correctRevisionId : workbench.revisionId));
        const preview = chosen ? chosen.labelZh || chosen.labelKo : item.draftKo;
        const choices = orderedItems(workbench, item, 'revision').map(option => {
          const meaning = option.labelZh ? mvpDetails(`meaning-${option.id}`, '뜻 보기', `<p>${escapeHtml(option.labelKo)}</p>`) : '';
          return mvpButton('select-revision', option.id, `<span lang="${option.labelZh ? 'zh-Hant' : 'ko'}">${escapeHtml(option.labelZh || option.labelKo)}</span>`, workbench.revisionId === option.id) + meaning;
        }).join('');
        body += `<section class="academicMvpMemo"><h2>${done ? '확정한 메모' : '수정 중인 메모'}</h2><p class="academicMvpPreview" lang="${chosen?.labelZh ? 'zh-Hant' : 'ko'}">${escapeHtml(preview)}</p>${done ? `<p>${escapeHtml(item.connectionKo)}</p>` : mvpDetails('edit-memo', '메모를 눌러 수정안 고르기', choices)}</section>`;
      }
    } else {
      // Source spans are explicit: a normalized result such as 恢復正常 may contain 了 in the original.
      const sourceCards = item.cards.filter(card => card.sourceZh);
      const source = (text, title) => {
        let html = escapeHtml(text);
        for (const card of sourceCards) {
          if (!text.includes(card.sourceZh)) continue;
          const label = escapeHtml(card.sourceZh);
          html = html.replace(label, workbench.phase === 'place-results'
            ? mvpButton('select-result', card.id, label, workbench.resultId === card.id)
            : `<span class="academicMvpPhrase">${label}</span>`);
        }
        return `<article class="academicMvpSource"><h2>${title}</h2><p lang="zh-Hant">${html}</p></article>`;
      };
      body = source(item.expectationZh, '예상 기록') + source(item.actualZh, '실제 기록');
      const selectedCard = item.cards.find(card => card.id === workbench.resultId);
      const absent = item.cards.find(card => card.id === workbench.absentResultId);
      const actual = item.cards.find(card => card.id === workbench.actualResultId);
      const absentText = workbench.resultSlot === 'absent' && selectedCard ? selectedCard.textZh : absent?.textZh;
      const actualText = workbench.resultSlot === 'actual' && selectedCard ? selectedCard.textZh : actual?.textZh;
      body += `<section class="academicMvpMemo"><h2>기록에서 찾은 관계 ${mvpWord('反而')}</h2><div class="academicMvpSlots"><div><small>생기지 않은 예상</small><p lang="zh-Hant">${escapeHtml(absentText || '원문 구절을 눌러')}</p></div><div><small>실제로 생긴 결과</small><p lang="zh-Hant">${escapeHtml(actualText || '원문 구절을 눌러')}</p></div></div>`;
      if (workbench.phase === 'place-results') {
        body += `<p class="academicMvpHint">${workbench.resultSlot === 'absent' ? '생기지 않은 예상' : '실제로 생긴 결과'}에 놓을 구절을 원문에서 골라.</p>`;
      } else {
        const link = config.linkOptions.find(option => option.id === workbench.linkId);
        body += `<p class="academicMvpPreview" lang="zh-Hant">${mvpMarked(item.completedZh.replace('反而', link?.labelZh || '＿＿'), link?.labelZh || '＿＿')}</p>`;
        if (!done) body += mvpDetails('edit-link', '연결할 말 고르기', `<div class="academicMvpLinks">${(workbench.optionOrders[orderKey(item.id, 'links')] || config.linkOptions.map(option => option.id)).map(id => {
          const option = config.linkOptions.find(candidate => candidate.id === id);
          return mvpButton('select-link', id, escapeHtml(option.labelZh), workbench.linkId === id);
        }).join('')}</div>`);
      }
      body += '</section>';
    }
    const check = workbench.lastCheck;
    let feedback = done ? item.successFeedbackKo : '';
    if (check && !done) {
      const option = [...(item.claims || []), ...(item.revisions || []), ...(item.cards || []), ...(config.linkOptions || [])].find(option => option.id === check.id);
      feedback = check.step === 'absent' ? option?.absentFeedbackKo : check.step === 'actual' ? option?.actualFeedbackKo : option?.feedbackKo;
    }
    const feedbackHtml = `<p class="academicMvpFeedback" role="status" aria-live="polite">${escapeHtml(feedback || '')}</p>`;
    body = body.replace(/(<section class="academicMvpMemo"><h2>[\s\S]*?<\/h2>)/, `$1${feedbackHtml}`);
    return `<div class="academicCaseProgress">${item.mode === 'guided' ? '연습' : '적용'} · ${workbench.caseIndex + 1} / ${config.cases.length}</div>${body}`;
  }

  function mvpFooter(workbench) {
    const actions = {
      claim: ['submit-claim', '이 주장 검토', workbench.claimId],
      revision: ['submit-revision', '메모 확정', workbench.revisionId],
      'place-results': ['submit-result', '이 구절 놓기', workbench.resultId],
      'choose-link': ['submit-link', '기록 연결', workbench.linkId],
      review: ['next-case', '다음 기록', true],
      complete: ['finish-mvp', '완성 기록 확인 · 계속', true]
    };
    const [action, label, enabled] = actions[workbench.phase];
    return `<button type="button" id="academicMvpConfirm" class="control academicConfirm" data-academic-action="${action}" ${enabled ? '' : 'disabled'}>${label}</button>`;
  }

  function renderWorkbench(config, workbench) {
    if (isMvp()) return renderMvp(config, workbench);
    if (config.kind === 'claim-revision') return renderClaimRevisionWorkbench(config, workbench);
    if (config.kind === 'expectation-sort') return renderExpectationWorkbench(config, workbench);
    if (config.kind === 'replacement-link') return renderReplacementWorkbench(config, workbench);
    if (config.kind === 'connector-cloze') return renderClozeWorkbench(config, workbench);
    return '';
  }

  function claimGoalHtml(workbench) {
    if (workbench.phase === 'claim') return '기록이 직접 말한 사실과 <span class="hot">성급한 판단</span>을 구별해.';
    if (workbench.phase === 'revision') return '앞뒤 사실을 함께 남기는 <span class="hot">메모</span>로 고쳐.';
    if (workbench.phase === 'review') return '고친 방법을 <span class="done">새 기록</span>에도 적용해.';
    return '두 사실을 보존하고 <span class="done">판단만 수정</span>했어.';
  }

  function goalHtml(config, workbench) {
    if (config.kind === 'claim-revision') return claimGoalHtml(workbench);
    if (config.kind === 'expectation-sort') {
      if (workbench.phase === 'sort') return '결과의 좋고 나쁨보다 <span class="hot">예상과 실제</span>를 비교해.';
      if (workbench.phase === 'review') return '분류에 붙은 <span class="done">표지어</span>를 확인해.';
      return '네 기록을 <span class="done">예상대로 / 예상 밖</span>으로 나눴어.';
    }
    if (config.kind === 'replacement-link') {
      if (workbench.phase === 'place-results') return '<span class="hot">생기지 않은 예상</span>과 실제 결과를 따로 찾아.';
      if (workbench.phase === 'choose-link') return '두 결과의 <span class="hot">대체 관계</span>를 남겨.';
      if (workbench.phase === 'review') return '같은 관계를 <span class="done">새 기록</span>에서도 찾아.';
      return '예상 대신 생긴 결과를 <span class="done">反而</span>로 연결했어.';
    }
    if (workbench.phase === 'choose-connector') return blankFor(config, workbench)?.kind === 'decision'
      ? '복원한 기록으로 <span class="hot">어디까지 판단할 수 있는지</span> 확인해.'
      : '빈칸보다 먼저 <span class="hot">문장 전체</span>를 읽어.';
    if (workbench.phase === 'review') return '복원한 말이 앞뒤 관계와 맞는지 <span class="done">확인</span>해.';
    return '기록을 복원하고 <span class="done">전달할 판단</span>을 정했어.';
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
    document.querySelectorAll('#tutorialView [data-academic-action]').forEach(button => {
      button.addEventListener('click', () => runAction(button.dataset.academicAction, button.dataset.value));
    });
  }

  function runAction(type, value) {
    const stage = current();
    if (type === 'finish-mvp' && isMvp(stage) && isWin()) { showComplete(); return; }
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
    if (isMvp(stage)) {
      const feedback = gridEl.querySelector('.academicMvpFeedback');
      if (feedback && result.feedback) {
        feedback.textContent = result.feedback;
        if (result.correct === false) feedback.scrollIntoView({ block: 'nearest' });
      }
    } else if (result.feedback) setStatus(result.feedback, result.correct === false ? 'info' : 'good');
    if (!solved) return;
    if (stageSession.mode !== 'replay') completed.add(stage.id);
    window.GameFlow?.recordStageComplete(stage.id, stageSession);
    save();
    clearTimeout(completionTimer);
    if (isMvp(stage)) return;
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
    view?.classList.toggle('academicTowerMvp', !!config && isMvp(stage));
    const priorFocus = document.activeElement;
    document.getElementById('academicMvpConfirm')?.remove();
    if (!config) {
      gridEl.classList.remove('academicTowerWorkbench');
      return baseRender();
    }
    if (!isValidState(config, state.academicTower)) state.academicTower = createState(config);
    const workbench = state.academicTower;
    $('#stageKicker').textContent = stage.kicker;
    $('#stageTitle').textContent = stage.subtitle;
    $('#goal').innerHTML = goalHtml(config, workbench);
    $('#ruleLine').textContent = stage.rule;
    gridEl.style.gridTemplateColumns = '';
    gridEl.className = 'grid academicTowerWorkbench';
    gridEl.setAttribute('role', 'group');
    gridEl.setAttribute('aria-label', '학술탑 기록 검토 작업대');
    const recordKey = `${stage.id}:${workbench.caseIndex}`;
    const sameRecord = gridEl.dataset.mvpRecord === recordKey;
    const scroll = sameRecord ? gridEl.scrollTop : 0;
    const opened = sameRecord ? [...gridEl.querySelectorAll('details[open][data-mvp-detail]')].map(el => el.dataset.mvpDetail) : [];
    const focused = priorFocus;
    const focusAction = focused?.dataset?.academicAction;
    const focusValue = focused?.dataset?.value;
    gridEl.innerHTML = renderWorkbench(config, workbench);
    gridEl.dataset.mvpRecord = recordKey;
    if (isMvp(stage)) {
      gridEl.querySelectorAll('details[data-mvp-detail]').forEach(el => { el.open = opened.includes(el.dataset.mvpDetail); });
      gridEl.querySelectorAll('[data-academic-word]').forEach(button => {
        button.onclick = () => {
          if (!WORDS[button.dataset.academicWord]) return;
          showWord(button.dataset.academicWord);
          document.querySelector('#sheet .sheetactions button')?.addEventListener('click', () => button.focus({ preventScroll: true }));
        };
      });
      $('.controls').insertAdjacentHTML('beforeend', mvpFooter(workbench));
      gridEl.scrollTop = scroll;
      const target = [...view.querySelectorAll('[data-academic-action]')].find(el => el.dataset.academicAction === focusAction && el.dataset.value === focusValue);
      if (sameRecord && target) target.focus({ preventScroll: true });
      else if (focusAction) {
        const anchor = gridEl.querySelector('.academicMvpMemo');
        anchor?.setAttribute('tabindex', '-1');
        anchor?.focus({ preventScroll: true });
      }
    }
    bindActions();
    renderWords(stage, workbench);
    $('#waitBtn').hidden = true;
    $('#inspectBtn').hidden = true;
    $('#undoBtn').hidden = false;
    $('#undoBtn').disabled = !history.length;
    $('.controls').style.gridTemplateColumns = isMvp(stage) ? 'minmax(80px, 1fr) minmax(0, 2fr)' : '1fr';
  };
})();
