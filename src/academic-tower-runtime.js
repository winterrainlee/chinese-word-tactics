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
      [1, config?.schemaVersion].includes(workbench.schemaVersion) && Number.isInteger(workbench.caseIndex) &&
      Array.isArray(workbench.completedCaseIds) && workbench.optionOrders &&
      ['place-results', 'choose-link', 'review', 'complete'].includes(workbench.phase);
  }

  function upgradeReplacementState(config, workbench) {
    const next = copy(workbench);
    if (next.schemaVersion === 1 && config.schemaVersion === 2) {
      if (next.phase === 'place-results' && next.resultId) {
        next[next.resultSlot === 'actual' ? 'actualResultId' : 'absentResultId'] = next.resultId;
      }
      next.resultId = null;
      next.lastCheck = null;
      next.schemaVersion = 2;
    }
    return next;
  }

  function completeReplacementCase(config, next, item) {
    if (!next.completedCaseIds.includes(item.id)) next.completedCaseIds.push(item.id);
    next.phase = next.caseIndex === config.cases.length - 1 ? 'complete' : 'review';
  }

  function applyReplacementAction(config, currentState, action) {
    const next = upgradeReplacementState(config, isValidReplacementState(config, currentState) ? currentState : createReplacementState(config));
    const item = caseFor(config, next);
    if (!next || !item || !action?.type || next.phase === 'complete') {
      return { changed: false, state: next, feedback: '' };
    }
    let changed = false;
    let feedback = '';
    let correct = null;

    if (action.type === 'select-slot' && next.phase === 'place-results' &&
      ['absent', 'actual'].includes(action.value)) {
      changed = next.resultSlot !== action.value;
      next.resultSlot = action.value;
    } else if (action.type === 'select-result' && next.phase === 'place-results' &&
      item.cards.some(card => card.id === action.value)) {
      const field = next.resultSlot === 'actual' ? 'actualResultId' : 'absentResultId';
      changed = next[field] !== action.value || !!next.lastCheck;
      next[field] = action.value;
      next.lastCheck = null;
    } else if (action.type === 'submit-results' && next.phase === 'place-results' && next.absentResultId && next.actualResultId) {
      const absentCorrect = next.absentResultId === item.absentResultId;
      const actualCorrect = next.actualResultId === item.actualResultId;
      correct = absentCorrect && actualCorrect;
      if (!correct) next.resultSlot = absentCorrect ? 'actual' : 'absent';
      const notes = [];
      if (!absentCorrect) notes.push(`예상 칸: ${item.cards.find(card => card.id === next.absentResultId)?.absentFeedbackKo || '생기지 않은 예상을 다시 찾아.'}`);
      if (!actualCorrect) notes.push(`실제 칸: ${item.cards.find(card => card.id === next.actualResultId)?.actualFeedbackKo || '실제 결과를 다시 찾아.'}`);
      feedback = correct ? item.successFeedbackKo : notes.join(' ');
      next.lastCheck = { step: 'pair', correct, feedbackKo: feedback };
      if (correct) {
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
      }
    }
    return { changed, state: next, feedback: feedback || '', correct };
  }

  function isClozeSolved(config, workbench) {
    return isValidClozeState(config, workbench) && workbench.phase === 'complete' &&
      config.blanks.every(item => workbench.completedBlankIds.includes(item.id));
  }

  function createState(config, rng) {
    if (config?.kind === 'ran-observation') return createRanState(config, rng);
    if (config?.kind === 'claim-revision') return createClaimRevisionState(config, rng);
    if (config?.kind === 'expectation-sort') return createExpectationState(config);
    if (config?.kind === 'replacement-link') return createReplacementState(config, rng);
    if (config?.kind === 'connector-cloze') return createClozeState(config, rng);
    return null;
  }

  function isValidState(config, workbench) {
    if (config?.kind === 'ran-observation') return !!workbench && workbench.kind === config.kind && workbench.schemaVersion === 1 && Number.isInteger(workbench.caseIndex) && Array.isArray(workbench.relationPlacements) && workbench.optionOrders && ['notice', 'discovery', 'compare', 'compare-review', 'apply-premise', 'apply-alternative', 'complete'].includes(workbench.phase);
    if (config?.kind === 'claim-revision') return isValidClaimRevisionState(config, workbench);
    if (config?.kind === 'expectation-sort') return isValidExpectationState(config, workbench);
    if (config?.kind === 'replacement-link') return isValidReplacementState(config, workbench);
    if (config?.kind === 'connector-cloze') return isValidClozeState(config, workbench);
    return false;
  }

  function applyAction(config, currentState, action) {
    if (config?.kind === 'ran-observation') return applyRanAction(config, currentState, action);
    if (config?.kind === 'claim-revision') return applyClaimRevisionAction(config, currentState, action);
    if (config?.kind === 'expectation-sort') return applyExpectationAction(config, currentState, action);
    if (config?.kind === 'replacement-link') return applyReplacementAction(config, currentState, action);
    if (config?.kind === 'connector-cloze') return applyClozeAction(config, currentState, action);
    return { changed: false, state: null, feedback: '' };
  }

  function isSolved(config, workbench) {
    if (config?.kind === 'ran-observation') return isValidState(config, workbench) && workbench.phase === 'complete' && workbench.relationPlacements.length === config.cards.length && workbench.applicationsCompleted === 2 && config.noticeWords.every(word => workbench.selectedCharacter[word] === '然');
    if (config?.kind === 'claim-revision') return isClaimRevisionSolved(config, workbench);
    if (config?.kind === 'expectation-sort') return isExpectationSolved(config, workbench);
    if (config?.kind === 'replacement-link') return isReplacementSolved(config, workbench);
    if (config?.kind === 'connector-cloze') return isClozeSolved(config, workbench);
    return false;
  }

  function createRanState(config, rng) {
    const orders = {};
    config.cards.forEach(card => { orders[card.word] = shuffledIds(card.options, rng); });
    config.applications.forEach(item => { orders[item.id] = shuffledIds(item.options, rng); });
    return { kind: config.kind, schemaVersion: 1, phase: 'notice', introVariant: null, selectedCharacter: {}, relationPlacements: [], caseIndex: 0, selectedPosition: null, selectedRelation: null, selectedWord: null, applicationsCompleted: 0, optionOrders: orders, lastCheck: null };
  }

  function applyRanAction(config, state, action) {
    const next = copy(isValidState(config, state) ? state : createRanState(config, Math.random));
    let changed = false, correct = null, feedback = '';
    const card = config.cards[next.caseIndex];
    if (next.phase === 'notice' && action.type === 'select-character') {
      const [word, character] = String(action.value).split(':');
      if (config.noticeWords.includes(word) && word.includes(character)) {
        next.selectedCharacter[word] = character; next.lastCheck = null; changed = true;
      }
    } else if (next.phase === 'notice' && action.type === 'submit-notice') {
      correct = config.noticeWords.every(word => next.selectedCharacter[word] === '然');
      if (correct) next.phase = 'discovery';
      feedback = correct ? '' : '세 표현에 모두 들어 있는 글자를 각각 골라.';
      changed = true;
    } else if (next.phase === 'discovery' && action.type === 'start-compare') {
      next.phase = 'compare'; changed = true;
    } else if (next.phase === 'compare' && action.type === 'select-position' && ['first', 'last'].includes(action.value)) {
      next.selectedPosition = action.value; next.lastCheck = null; changed = true;
    } else if (next.phase === 'compare' && action.type === 'select-ran-relation' && card.options.includes(action.value)) {
      next.selectedRelation = action.value; next.lastCheck = null; changed = true;
    } else if (next.phase === 'compare' && action.type === 'submit-comparison' && next.selectedPosition && next.selectedRelation) {
      correct = next.selectedPosition === card.position && next.selectedRelation === card.relation;
      if (correct) { next.relationPlacements.push(card.word); next.phase = 'compare-review'; }
      feedback = correct ? card.explanation : next.selectedPosition !== card.position ? '然이 표현의 앞에 있는지 뒤에 있는지 다시 봐.' : '글자 위치와 문장 역할은 달라. 앞뒤 내용을 읽고 관계를 다시 골라.';
      changed = true;
    } else if (next.phase === 'compare-review' && action.type === 'next-comparison') {
      next.caseIndex += 1; next.selectedPosition = null; next.selectedRelation = null; next.lastCheck = null;
      next.phase = next.caseIndex === config.cards.length ? 'apply-premise' : 'compare'; changed = true;
    } else if (['apply-premise', 'apply-alternative'].includes(next.phase)) {
      const item = config.applications[next.phase === 'apply-premise' ? 0 : 1];
      if (action.type === 'select-ran-word' && item.options.includes(action.value)) { next.selectedWord = action.value; next.lastCheck = null; changed = true; }
      if (action.type === 'submit-ran-word' && next.selectedWord) {
        correct = next.selectedWord === item.correct;
        feedback = correct ? '' : item.feedback;
        if (correct) { next.applicationsCompleted += 1; next.phase = next.phase === 'apply-premise' ? 'apply-alternative' : 'complete'; next.selectedWord = null; }
        changed = true;
      }
    }
    if (correct !== null) next.lastCheck = { correct, feedbackKo: feedback };
    return { changed, state: next, correct, feedback };
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
    return !!stage?.academicTower;
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
    if (config.kind === 'ran-observation') return renderRanWorkbench(config, workbench);
    if (config.kind === 'expectation-sort') return renderExpectationMvp(config, workbench);
    if (config.kind === 'connector-cloze') return renderClozeMvp(config, workbench);
    const item = caseFor(config, workbench);
    const done = ['review', 'complete'].includes(workbench.phase);
    let body = '';
    if (config.kind === 'claim-revision') {
      const original = item.sources.map(source => source.text).join('，');
      const translation = item.sources.map(source => source.labelKo).join(' / ');
      body = `<article class="academicMvpSource"><h2>원본 기록</h2><p lang="zh-Hant">${mvpMarked(original, item.connectorZh)}</p>${mvpDetails('source-meaning', '뜻 보기', `<p>${escapeHtml(translation)}</p>`)}</article>`;
      if (item.scope === 'records') body = item.sources.map((source, index) => `<article class="academicMvpSource academicSourceCard"><h2>원본 기록 ${index + 1}</h2><p lang="zh-Hant">${mvpMarked(source.text, item.connectorZh)}</p>${mvpDetails(`source-meaning-${index}`, '뜻 보기', `<p>${escapeHtml(source.labelKo)}</p>`)}</article>`).join('');
      if (workbench.phase === 'claim') {
        const claims = item.draftParts
          ? item.draftParts.map(part => mvpButton('select-claim', part.claimId, escapeHtml(part.text), workbench.claimId === part.claimId)).join('')
          : orderedItems(workbench, item, 'claim').map(option => mvpButton('select-claim', option.id, escapeHtml(option.labelKo), workbench.claimId === option.id)).join('');
        body += `<section class="academicMvpMemo${item.draftParts ? ' academicReportDraft' : ''}"><h2>${item.draftParts ? '복구 보고 초안' : '검토 메모 · 고칠 주장을 눌러'}</h2>${item.draftParts ? '<p class="academicMvpHint">위 두 기록과 맞지 않는 부분을 눌러 고쳐보자.</p>' : ''}${claims}</section>`;
      } else {
        const chosen = item.revisions.find(option => option.id === (done ? item.correctRevisionId : workbench.revisionId));
        const preview = chosen ? chosen.labelZh || chosen.labelKo : item.draftParts ? '수정안을 골라 보고를 완성해.' : item.draftKo;
        const choices = orderedItems(workbench, item, 'revision').map(option => {
          const meaning = option.labelZh ? mvpDetails(`meaning-${option.id}`, '뜻 보기', `<p>${escapeHtml(option.labelKo)}</p>`) : '';
          return mvpButton('select-revision', option.id, `<span lang="${option.labelZh ? 'zh-Hant' : 'ko'}">${escapeHtml(option.labelZh || option.labelKo)}</span>`, workbench.revisionId === option.id) + meaning;
        }).join('');
        body += `<section class="academicMvpMemo"><h2>${done ? '확정한 메모' : '수정 중인 메모'}</h2>${item.draftParts ? `<p class="academicDraftBefore">고치기 전: ${escapeHtml(item.draftParts.map(part => part.text).join(' '))}</p>` : ''}<p class="academicMvpPreview" lang="${chosen?.labelZh ? 'zh-Hant' : 'ko'}">${escapeHtml(preview)}</p>${done ? `<p>${escapeHtml(item.connectionKo)}</p>` : mvpDetails('edit-memo', '수정안 고르기', choices)}</section>`;
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
            ? mvpButton('select-result', card.id, label, (workbench.resultSlot === 'actual' ? workbench.actualResultId : workbench.absentResultId) === card.id)
            : `<span class="academicMvpPhrase">${label}</span>`);
        }
        return `<article class="academicMvpSource"><h2>${title}</h2><p lang="zh-Hant">${html}</p></article>`;
      };
      body = source(item.expectationZh, '예상 기록') + source(item.actualZh, '실제 기록');
      const absent = item.cards.find(card => card.id === workbench.absentResultId);
      const actual = item.cards.find(card => card.id === workbench.actualResultId);
      const slot = (id, title, card) => {
        const content = `<small>${title}</small><span lang="zh-Hant">${escapeHtml(card?.textZh || '—')}</span>`;
        return workbench.phase === 'place-results'
          ? mvpButton('select-slot', id, `${content}<small>${workbench.resultSlot === id ? '지금 고르는 칸' : '눌러서 선택·수정'}</small>`, workbench.resultSlot === id)
          : `<div>${content}</div>`;
      };
      body += `<section class="academicMvpMemo"><h2>기록에서 찾은 관계 ${mvpWord('反而')}</h2><div class="academicMvpSlots">${slot('absent', '생기지 않은 예상', absent)}${slot('actual', '실제로 생긴 결과', actual)}</div>`;
      if (workbench.phase === 'place-results') {
        body += `<p class="academicMvpHint">칸을 누른 뒤 원문 구절을 골라. 두 칸을 모두 채우고 한 번에 검토해.</p>`;
      } else {
        const link = config.linkOptions.find(option => option.id === workbench.linkId);
        body += `<p class="academicMvpPreview" lang="zh-Hant">${mvpMarked(item.completedZh.replace('反而', link?.labelZh || '＿＿'), link?.labelZh || '＿＿')}</p>`;
        if (!done) body += `<section data-mvp-links tabindex="-1"><h3>연결할 말 고르기</h3><div class="academicMvpLinks">${(workbench.optionOrders[orderKey(item.id, 'links')] || config.linkOptions.map(option => option.id)).map(id => {
          const option = config.linkOptions.find(candidate => candidate.id === id);
          return mvpButton('select-link', id, escapeHtml(option.labelZh), workbench.linkId === id);
        }).join('')}</div></section>`;
      }
      body += '</section>';
    }
    const check = workbench.lastCheck;
    let feedback = done || workbench.phase === 'choose-link' ? item.successFeedbackKo : '';
    if (check && !done) {
      const option = [...(item.claims || []), ...(item.revisions || []), ...(item.cards || []), ...(config.linkOptions || [])].find(option => option.id === check.id);
      feedback = check.step === 'pair' ? check.feedbackKo : check.step === 'absent' ? option?.absentFeedbackKo : check.step === 'actual' ? option?.actualFeedbackKo : option?.feedbackKo;
    }
    const feedbackHtml = `<p class="academicMvpFeedback" role="status" aria-live="polite">${escapeHtml(feedback || '')}</p>`;
    body = body.replace(/(<section class="academicMvpMemo(?: [^"]*)?"><h2>[\s\S]*?<\/h2>)/, `$1${feedbackHtml}`);
    return `<div class="academicCaseProgress">${item.mode === 'guided' ? '연습' : '적용'} · ${workbench.caseIndex + 1} / ${config.cases.length}</div>${body}`;
  }

  function mvpFeedback(text) {
    return `<p class="academicMvpFeedback" role="status" aria-live="polite">${escapeHtml(text || '')}</p>`;
  }

  // Region labels describe ownership; the persistent title describes the task.
  // Arrange the existing controls without duplicating source sentences or listeners.
  function renderWorkbenchHierarchy(config, workbench) {
    const label = text => {
      const el = document.createElement('div');
      el.className = 'academicRegionLabel'; el.textContent = text; return el;
    };
    const original = (nodes, name = '원본 기록') => {
      const section = document.createElement('section');
      section.className = 'academicOriginal'; section.dataset.academicZone = 'original';
      section.setAttribute('aria-label', name);
      nodes[0].before(section); section.append(label(name), ...nodes); return section;
    };
    const work = (section, title, name = '나의 해석') => {
      section.dataset.academicZone = 'work'; section.setAttribute('aria-label', name);
      section.classList.add('academicMvpMemo');
      let heading = section.querySelector(':scope > h2');
      if (!heading) { heading = document.createElement('h2'); section.prepend(heading); }
      const words = [...heading.querySelectorAll('[data-academic-word]')];
      heading.className = 'academicTaskTitle'; heading.textContent = title;
      if (words.length) {
        const help = document.createElement('details'), summary = document.createElement('summary');
        help.dataset.mvpDetail = 'task-words'; summary.textContent = '표현 뜻 살펴보기';
        help.append(summary, ...words); heading.after(help);
      }
      section.prepend(label(name));
      const feedback = gridEl.querySelector('.academicMvpFeedback');
      if (feedback) heading.after(feedback);
    };
    if (config.kind === 'connector-cloze') {
      const item = blankFor(config, workbench), record = gridEl.querySelector('.academicClozeRecord');
      record.classList.remove('academicMvpSource');
      const context = record.querySelector('.academicClozeContext');
      if (context) original([context]);
      record.querySelector(':scope > h2')?.remove();
      record.querySelector(':scope > h3')?.remove();
      const section = document.createElement('section');
      section.append(...[...record.children].filter(el => !el.matches('.academicOriginal')));
      record.append(section);
      work(section, item.questionKo || (item.kind === 'decision' ? '기록이 뒷받침하는 판단을 전달해 보자.' : '앞뒤 관계에 맞게 기록을 복원해 보자.'), item.kind === 'decision' ? '전달할 판단' : '원본에 직접 복원');
      return;
    }
    if (config.kind === 'ran-observation') {
      const root = gridEl.querySelector('.academicRanWorkbench');
      root.classList.remove('academicMvpSource');
      if (['compare', 'compare-review'].includes(workbench.phase)) {
        original([root.querySelector(':scope > p'), root.querySelector('[data-mvp-detail="character-sense"]')]);
        work(root.querySelector('.academicMvpMemo'), '글자 위치와 문장 속 역할을 살펴보자.');
      } else if (['apply-premise', 'apply-alternative'].includes(workbench.phase)) {
        original([root.querySelector(':scope > p')]);
        const section = document.createElement('section');
        section.append(...root.querySelectorAll(':scope > .academicMvpPreview, :scope > .academicMvpLinks'));
        root.append(section);
        work(section, workbench.phase === 'apply-premise' ? '확인된 사실에서 다음 판단을 이어보자.' : '앞 행동을 하지 않으면 어떻게 될지 읽어보자.');
      } else {
        // Discovery uses the original characters themselves as controls.
        const title = root.querySelector('h2')?.textContent || '관찰한 내용을 정리해 보자.';
        work(root, title, workbench.phase === 'notice' ? '원본에서 관찰' : workbench.phase === 'discovery' ? '발견한 단서' : '완성한 관찰 메모');
      }
      return;
    }
    const sources = [...gridEl.querySelectorAll(':scope > .academicMvpSource, :scope > .academicExpectationPair')];
    if (sources.length) {
      const region = original(sources);
      region.querySelectorAll('h2').forEach(heading => {
        const text = heading.textContent;
        if (text === '원본 기록') heading.remove();
        else heading.textContent = text.replace('원본 기록 ', '기록 ').replace('예상 기록', '예상').replace('실제 기록', '실제');
      });
    }
    let title;
    if (config.kind === 'claim-revision') {
      const item = caseFor(config, workbench);
      title = workbench.phase === 'claim' ? item.draftParts ? '보고에서 고칠 부분을 찾아보자.' : '기록과 맞지 않는 주장을 찾아보자.'
        : item.scope === 'records' ? '두 기록을 함께 남기는 보고를 만들어 보자.' : '앞뒤 사실을 함께 남기는 메모로 고쳐보자.';
      gridEl.querySelector('.academicReportDraft > .academicMvpHint')?.remove();
    } else if (config.kind === 'expectation-sort') title = '예상과 실제를 비교해 보자.';
    else {
      title = workbench.phase === 'place-results' || caseFor(config, workbench).mode === 'guided'
        ? '생기지 않은 예상과 실제 결과를 나눠 보자.' : '두 결과의 관계를 표현해 보자.';
      gridEl.querySelector('[data-mvp-links] > h3')?.remove();
    }
    work(gridEl.querySelector('.academicMvpMemo'), title);
  }

  // Selection is only a preview. Verdicts are derived from the saved check,
  // so undo/reload never leave a stale red or green mark on a new answer.
  function renderVerdict(config, workbench, message) {
    const feedback = gridEl.querySelector('.academicMvpFeedback');
    if (!feedback) return;
    const check = workbench.lastCheck;
    const finished = ['review', 'compare-review', 'complete'].includes(workbench.phase);
    const pairAccepted = config.kind === 'replacement-link' && workbench.phase === 'choose-link';
    const correct = typeof check?.correct === 'boolean' ? check.correct
      : finished || (pairAccepted && !workbench.linkId) ? true : null;
    const text = message ?? feedback.querySelector('.academicVerdictReason')?.textContent ?? feedback.textContent;
    feedback.id = 'academicVerdict';
    const label = correct === true ? check?.step === 'claim' ? '✓ 고칠 부분을 찾았어'
      : config.kind === 'ran-observation' && workbench.phase === 'apply-alternative' ? '✓ 앞 문장을 완성했어' : '✓ 기록과 맞아'
      : correct === false ? '! 다시 살펴봐' : '';
    feedback.dataset.verdict = correct === null ? 'neutral' : correct ? 'correct' : 'incorrect';
    feedback.innerHTML = `${label ? `<strong class="academicVerdictTitle">${label}</strong>` : ''}${text ? `<span class="academicVerdictReason">${escapeHtml(text)}</span>` : ''}`;
    const mark = (element, matched) => {
      if (!element) return;
      element.dataset.verdict = matched ? 'correct' : 'incorrect';
      element.dataset.verdictLabel = matched ? '✓ 맞아' : '! 다시 살펴봐';
      element.setAttribute('aria-describedby', 'academicVerdict');
      if (element.tagName === 'BUTTON') element.setAttribute('aria-invalid', String(!matched));
    };
    const selected = action => gridEl.querySelector(`[data-academic-action="${action}"].selected`);
    if (config.kind === 'replacement-link') {
      if (check?.step === 'pair' || pairAccepted || finished) {
        const item = caseFor(config, workbench);
        const slots = gridEl.querySelectorAll('.academicMvpSlots > *');
        mark(slots[0], workbench.absentResultId === item.absentResultId);
        mark(slots[1], workbench.actualResultId === item.actualResultId);
      }
      if (check?.step === 'link' || finished) {
        mark(selected('select-link'), correct); mark(gridEl.querySelector('.academicMvpPreview'), correct);
      }
    } else if (config.kind === 'ran-observation') {
      if (correct === null) return;
      if (workbench.phase === 'notice') {
        gridEl.querySelectorAll('[data-academic-action="select-character"].selected').forEach(el => mark(el, el.dataset.value.endsWith(':然')));
      } else if (workbench.phase === 'compare') {
        const card = config.cards[workbench.caseIndex];
        mark(selected('select-position'), workbench.selectedPosition === card.position);
        mark(selected('select-ran-relation'), workbench.selectedRelation === card.relation);
      } else if (workbench.phase === 'compare-review' || workbench.selectedWord) {
        mark(gridEl.querySelector('.academicMvpPreview'), correct); mark(selected('select-ran-word'), correct);
      }
    } else if (correct !== null) {
      if (config.kind === 'claim-revision' && check?.step === 'claim') {
        mark(selected('select-claim'), correct);
      } else {
        mark(gridEl.querySelector('.academicMvpPreview'), correct);
        gridEl.querySelectorAll('button.selected[data-academic-action]').forEach(el => mark(el, correct));
      }
    }
  }

  function renderExpectationMvp(config, workbench) {
    const item = caseFor(config, workbench), done = workbench.phase !== 'sort';
    const relation = config.relations.find(option => option.id === workbench.relationId);
    const preview = item.reviewZh.replace(item.markerZh, relation?.labelZh || '＿＿');
    const feedback = done ? item.successFeedbackKo : workbench.lastCheck?.correct === false ? item.wrongFeedbackKo : '';
    return `<div class="academicCaseProgress">${item.mode === 'guided' ? '연습' : '적용'} · ${workbench.caseIndex + 1} / ${config.cases.length}</div><div class="academicExpectationPair"><article class="academicMvpSource academicExpectationCard"><h2>예상 기록</h2><p lang="zh-Hant">${escapeHtml(item.expectationZh)}</p></article><article class="academicMvpSource academicExpectationCard result"><h2>실제 기록</h2><p lang="zh-Hant">${escapeHtml(item.resultZh)}</p></article></div><section class="academicMvpMemo academicExpectationReview"><h2>예상과 실제를 잇는 말</h2>${mvpFeedback(feedback)}<p class="academicMvpPreview" lang="zh-Hant">${mvpMarked(preview, relation?.labelZh || '')}</p>${done ? '' : mvpDetails('word-help', '표현 뜻 살펴보기', config.relations.map(option => mvpWord(option.labelZh)).join(' · '))}${done ? '' : `<div class="academicMvpLinks">${config.relations.map(option => mvpButton('select-relation', option.id, `<span lang="zh-Hant">${escapeHtml(option.labelZh)}</span><small>${escapeHtml(option.labelKo)}</small>`, workbench.relationId === option.id)).join('')}</div>`}</section>`;
  }

  function renderClozeMvp(config, workbench) {
    const item = blankFor(config, workbench), done = workbench.phase !== 'choose-connector';
    const selected = done ? item.correctConnectorId : workbench.selectedConnectorId;
    const sentence = item.kind === 'decision' ? escapeHtml(selected || item.promptZh) : `${escapeHtml(item.beforeZh)}${selected ? mvpMarked(selected, selected) : '<span class="academicClozeBlank">＿＿</span>'}${escapeHtml(item.afterZh)}${escapeHtml(item.tailZh || '')}`;
    const archive = config.blanks.filter(blank => workbench.completedBlankIds.includes(blank.id) && blank.id !== item.id).map(blank => `<article class="academicArchive"><h3>${escapeHtml(blank.sectionKo)}</h3>${blank.contextZh ? `<p lang="zh-Hant">${escapeHtml(blank.contextZh)}</p>` : ''}${renderClozeSentence(blank, blank.correctConnectorId)}</article>`).join('');
    const feedback = done ? item.successFeedbackKo : workbench.lastCheck?.correct === false ? item.optionFeedback?.[selected] || config.connectorFeedback[selected] : '';
    return `<div class="academicCaseProgress">${escapeHtml(item.sectionKo)} · ${workbench.blankIndex + 1} / ${config.blanks.length}</div>${archive ? mvpDetails('archive', `복원한 기록 ${workbench.completedBlankIds.length}개 다시 읽기`, archive) : ''}<article class="academicMvpSource academicClozeRecord"><h2>${item.kind === 'decision' ? '공방에 전달할 메모' : '현재 복원 중인 기록'}</h2>${item.contextZh ? `<p class="academicClozeContext" lang="zh-Hant">${escapeHtml(item.contextZh)}</p>` : ''}<p class="academicMvpPreview" lang="zh-Hant">${sentence}</p>${mvpFeedback(feedback)}${done ? '' : `<h3>${escapeHtml(item.questionKo || '앞뒤 관계를 잇는 말')}</h3><div class="${item.kind === 'decision' ? 'academicMvpDecisions' : 'academicMvpLinks'}">${(workbench.optionOrders[item.id] || item.options).map(option => mvpButton('select-connector', option, `<span lang="zh-Hant">${escapeHtml(option)}</span>`, selected === option)).join('')}</div>`}</article>`;
  }

  function renderRanWorkbench(config, workbench) {
    let body = '';
    if (workbench.phase === 'notice') {
      body = `<p>${workbench.introVariant === 'late' ? '소년은 자신에게 남겨 둔 칸에서 이전 기록을 꺼냈다.' : '소년은 탁자에 남은 기록을 다시 살펴봤다.'}</p><h2>세 표현에 공통으로 들어 있는 글자를 각각 눌러.</h2>${config.noticeWords.map(word => `<div class="academicRanCharacters" aria-label="${word}">${[...word].map(character => mvpButton('select-character', `${word}:${character}`, escapeHtml(character), workbench.selectedCharacter[word] === character)).join('')}</div>`).join('')}`;
    } else if (workbench.phase === 'discovery') {
      body = '<h2>같은 然</h2><p lang="zh-Hant">……怎麼又有「然」？</p><p>“왜 또 然이지?” 소년이 물었다.</p><p lang="zh-Hant">有同一個字，不代表用法都一樣。</p><p>연구원은 같은 글자가 있어도 쓰임은 다를 수 있다고 답하며 색인 옆의 문장 카드를 꺼냈다.</p><p>글자 풀이를 기억의 단서로 삼되, 뜻을 계산하는 공식으로 보지는 말자.</p>';
    } else if (['compare', 'compare-review'].includes(workbench.phase)) {
      const card = config.cards[workbench.caseIndex], done = workbench.phase === 'compare-review';
      body = `<div class="academicCaseProgress">문장 비교 ${workbench.caseIndex + 1} / ${config.cards.length}</div><p lang="zh-Hant">${mvpMarked(card.sentence, card.word)}</p>${mvpDetails('character-sense', '글자 감각 살펴보기', `<p>${escapeHtml(card.sense)}. 기억 보조일 뿐 현대어의 모든 뜻을 계산하는 공식은 아니야.</p>`)}<section class="academicMvpMemo"><h2>글자 위치와 문장 관계</h2><p class="academicMvpPreview">${workbench.selectedPosition ? workbench.selectedPosition === 'first' ? '然이 앞에 있다.' : '然이 뒤에 있다.' : '글자 위치를 골라.'} ${escapeHtml(workbench.selectedRelation || '')}</p>${done ? `<p>${escapeHtml(card.explanation)}</p>` : `<div class="academicMvpLinks">${mvpButton('select-position', 'first', '然이 앞', workbench.selectedPosition === 'first')}${mvpButton('select-position', 'last', '然이 뒤', workbench.selectedPosition === 'last')}</div><h3>이 문장에서 하는 일</h3>${workbench.optionOrders[card.word].map(option => mvpButton('select-ran-relation', option, escapeHtml(option), workbench.selectedRelation === option)).join('')}`}</section>`;
    } else if (workbench.phase === 'complete') {
      body = `<h2>같은 흔적, 다른 쓰임</h2><p>공통 글자는 단서지만, 문장 전체를 대신 읽어 주지는 않는다.</p><p lang="zh-Hant">既然齒輪損壞，就先修復。</p><p lang="zh-Hant">先綁好，不然紙張會散開。</p><p>확인된 전제와 하지 않았을 경우의 귀결을 구별해 메모를 완성했어.</p>`;
    } else {
      const item = config.applications[workbench.phase === 'apply-premise' ? 0 : 1];
      body = `<div class="academicCaseProgress">새 문장 적용 ${workbench.applicationsCompleted + 1} / 2</div><p lang="zh-Hant">${escapeHtml(item.context)}</p><p class="academicMvpPreview" lang="zh-Hant">${escapeHtml(item.before)}${workbench.selectedWord ? mvpMarked(workbench.selectedWord, workbench.selectedWord) : '＿＿'}${escapeHtml(item.after)}</p><div class="academicMvpLinks">${workbench.optionOrders[item.id].map(word => mvpButton('select-ran-word', word, escapeHtml(word), workbench.selectedWord === word)).join('')}</div>`;
    }
    return `<article class="academicMvpSource academicRanWorkbench">${body}${mvpFeedback(workbench.lastCheck?.feedbackKo)}</article>`;
  }

  function mvpFooter(workbench) {
    const actions = {
      claim: ['submit-claim', '이 주장 검토', workbench.claimId],
      revision: ['submit-revision', '메모 확정', workbench.revisionId],
      'place-results': ['submit-results', '두 결과 검토', workbench.absentResultId && workbench.actualResultId],
      'choose-link': ['submit-link', '기록 연결', workbench.linkId],
      review: ['next-case', '다음 기록', true],
      complete: ['finish-mvp', '완성 기록 확인 · 계속', true]
    };
    const config = current().academicTower;
    if (config.kind === 'connector-cloze') {
      actions['choose-connector'] = ['submit-connector', blankFor(config, workbench).kind === 'decision' ? '이 판단 전달' : '기록 복원', workbench.selectedConnectorId];
      actions.review = ['next-blank', '다음 기록', true];
    }
    actions.sort = ['submit-relation', '관계 확정', workbench.relationId];
    actions.notice = ['submit-notice', '공통 글자 확인', config.noticeWords?.every(word => workbench.selectedCharacter?.[word])];
    actions.discovery = ['start-compare', '문장 비교하기', true];
    actions.compare = ['submit-comparison', '관계 검토', workbench.selectedPosition && workbench.selectedRelation];
    actions['compare-review'] = ['next-comparison', '다음 문장', true];
    actions['apply-premise'] = actions['apply-alternative'] = ['submit-ran-word', '문장 확정', workbench.selectedWord];
    const [action, label, enabled] = actions[workbench.phase];
    return `<button type="button" id="academicMvpConfirm" class="control academicConfirm" data-academic-action="${action}" ${enabled ? '' : 'disabled'}>${label}</button>`;
  }

  function renderWorkbench(config, workbench) {
    if (isMvp()) return `${workbench.ranPrelude && workbench.caseIndex === 0 ? '<p class="academicMvpHint">소년: 이번에는 然이 없네요.<br>연구원: 그러니 글자 하나가 아니라 앞뒤 관계를 봐.</p>' : ''}${renderMvp(config, workbench)}`;
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
    const previousRecord = gridEl.dataset.mvpRecord;
    history.push(clone(state));
    state.academicTower = result.state;
    state.turn += 1;
    save();
    render();
    const solved = isSolved(config, state.academicTower);
    if (isMvp(stage)) {
      const feedback = gridEl.querySelector('.academicMvpFeedback');
      if (feedback && result.feedback) {
        renderVerdict(config, state.academicTower, result.feedback);
        if (result.correct === false) {
          const wrongSlot = type === 'submit-results'
            ? gridEl.querySelector(`[data-academic-action="select-slot"][data-value="${state.academicTower.resultSlot}"]`)
            : null;
          let target = wrongSlot;
          if (type === 'submit-notice') {
            const word = config.noticeWords.find(word => state.academicTower.selectedCharacter[word] !== '然');
            target = [...gridEl.querySelectorAll('[data-academic-action="select-character"]')].find(el => el.dataset.value.startsWith(`${word}:`));
          } else if (type === 'submit-comparison') {
            const card = config.cards[state.academicTower.caseIndex];
            const action = state.academicTower.selectedPosition !== card.position ? 'select-position' : 'select-ran-relation';
            target = gridEl.querySelector(`[data-academic-action="${action}"].selected`);
          }
          target ||= gridEl.querySelector('button.selected[data-academic-action]');
          if (target) { target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'nearest' }); }
          else feedback.scrollIntoView({ block: 'nearest' });
        }
      }
      if (result.correct === true && feedback && state.academicTower.phase !== 'choose-link' && gridEl.dataset.mvpRecord === previousRecord) {
        feedback.setAttribute('tabindex', '-1');
        feedback.focus({ preventScroll: true });
        feedback.scrollIntoView({ block: 'nearest' });
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
    if (config.kind === 'replacement-link') state.academicTower = upgradeReplacementState(config, state.academicTower);
    const workbench = state.academicTower;
    if (config.kind === 'replacement-link' && workbench.ranPrelude === undefined) {
      const progress = window.GameFlow?.progress?.();
      workbench.ranPrelude = stageSession.mode !== 'replay' && progress?.completedStages?.includes('academic-tower-turn-03a-ran-family') && !progress.completedStages.includes(stage.id);
    }
    if (config.kind === 'ran-observation' && !workbench.introVariant) {
      workbench.introVariant = window.GameFlow?.progress?.().completedMilestones?.includes('academic-tower-turn-foundation') ? 'late' : 'early';
      save();
    }
    $('#stageKicker').textContent = stage.kicker;
    $('#stageTitle').textContent = stage.subtitle;
    if (config.kind === 'ran-observation' && workbench.phase !== 'notice') $('#stageTitle').textContent = '같은 然';
    $('#goal').innerHTML = goalHtml(config, workbench);
    $('#ruleLine').textContent = stage.rule;
    gridEl.style.gridTemplateColumns = '';
    gridEl.className = 'grid academicTowerWorkbench';
    gridEl.setAttribute('role', 'group');
    gridEl.setAttribute('aria-label', '학술탑 기록 검토 작업대');
    const observationRecord = ['compare', 'compare-review'].includes(workbench.phase) ? 'compare' : workbench.phase;
    const recordKey = `${stage.id}:${workbench.blankIndex ?? workbench.caseIndex}:${config.kind === 'ran-observation' ? observationRecord : ''}`;
    const sameRecord = gridEl.dataset.mvpRecord === recordKey;
    const enteringLink = workbench.phase === 'choose-link' &&
      (!sameRecord || gridEl.dataset.mvpPhase !== 'choose-link');
    const enteringReportRevision = config.kind === 'claim-revision' && caseFor(config, workbench)?.draftParts && workbench.phase === 'revision' &&
      (!sameRecord || gridEl.dataset.mvpPhase === 'claim');
    const scroll = sameRecord ? gridEl.scrollTop : 0;
    const opened = sameRecord ? [...gridEl.querySelectorAll('details[open][data-mvp-detail]')].map(el => el.dataset.mvpDetail) : [];
    const focused = priorFocus;
    const focusAction = focused?.dataset?.academicAction;
    const focusValue = focused?.dataset?.value;
    gridEl.innerHTML = renderWorkbench(config, workbench);
    renderWorkbenchHierarchy(config, workbench);
    renderVerdict(config, workbench);
    gridEl.dataset.mvpRecord = recordKey;
    gridEl.dataset.mvpPhase = workbench.phase;
    if (isMvp(stage)) {
      gridEl.querySelectorAll('details[data-mvp-detail]').forEach(el => { el.open = opened.includes(el.dataset.mvpDetail); });
      if (enteringReportRevision) gridEl.querySelector('[data-mvp-detail="edit-memo"]').open = true;
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
        const anchor = gridEl.querySelector(sameRecord ? '[data-academic-zone="work"]' : '[data-academic-zone="original"]') || gridEl.querySelector('.academicTaskTitle');
        anchor?.setAttribute('tabindex', '-1');
        anchor?.focus({ preventScroll: true });
      }
      if (enteringLink) {
        const links = gridEl.querySelector('[data-mvp-links]');
        if (links) {
          links.focus({ preventScroll: true });
          links.scrollIntoView({ block: 'nearest' });
        }
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
