/* Shared northern-forest mechanics: observations, stateful objects, clues and route reading. */
(() => {
  const list = value => Array.isArray(value) ? value : value ? [value] : [];
  const samePosition = (a, b) => Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
  const manhattan = (a, b) => Array.isArray(a) && Array.isArray(b)
    ? Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) : Infinity;
  const flagsMet = (s, flags) => list(flags).every(flag => !!s?.[flag]);
  const observableVisible = (observable, s) => !!observable && flagsMet(s, observable.visibleRequires);
  const attributeDifferences = (reference = {}, candidate = {}, keys = Object.keys(reference)) =>
    keys.filter(key => reference[key] !== candidate[key]);
  const attributesMatch = (reference, candidate, keys) => attributeDifferences(reference, candidate, keys).length === 0;
  const materialSuitable = (material, requirements) => attributesMatch(requirements, material, Object.keys(requirements || {}));
  function nextDiscreteState(states, currentValue) {
    const values = list(states), index = values.indexOf(currentValue);
    return values.length ? values[(index + 1 + values.length) % values.length] : currentValue;
  }
  function nearby(center, position, radius = 1) { return manhattan(center, position) <= radius; }
  function terrainConnectionDirections(terrain, position) {
    const positions = list(terrain?.positions);
    const neighbors = { n: [-1, 0], e: [0, 1], s: [1, 0], w: [0, -1] };
    return Object.entries(neighbors)
      .filter(([, offset]) => positions.some(candidate => samePosition(candidate, [position[0] + offset[0], position[1] + offset[1]])))
      .map(([direction]) => direction);
  }
  function completionFor(stage, s, atExit = false) {
    const cfg = stage?.northForest;
    if (!cfg) return true;
    if (cfg.kind === 'markers') return cfg.observables.every(item => !item.confirmedFlag || !!s?.[item.confirmedFlag]);
    if (cfg.kind === 'discrete') return flagsMet(s, cfg.discrete.referenceFlags || cfg.discrete.referenceFlag) && s?.[cfg.discrete.stateFlag] === cfg.discrete.target;
    if (cfg.kind === 'attributes') return s?.selectedPatch === cfg.targetId && s?.collectedPatch === cfg.targetId && list(s?.comparedPatchIds).length >= (cfg.minimumComparisons || 1);
    if (cfg.kind === 'materials') {
      const byId = new Map(cfg.observables.map(item => [item.id, item]));
      const suitable = list(s?.carriedMaterials).filter(id => materialSuitable(byId.get(id)?.attributes, cfg.requirements));
      return suitable.length >= cfg.required && (!stage.win?.includes('at_exit') || atExit);
    }
    if (cfg.kind === 'clue-path') return !!s?.lastSeenConfirmed && !!s?.alternativeTraceChecked && !!s?.blueThreadConfirmed && !!s?.relatedTraceConfirmed && !!s?.reachedClearing;
    if (cfg.kind === 'clue-nearby') return !!s?.finalTraceConfirmed && !!s?.bundleThreadFound && !!s?.bundleDiscovered && !!s?.bundleCollected && (!stage.win?.includes('at_exit') || atExit);
    if (cfg.kind === 'route-cart') return !!s?.westSituationConfirmed && !!s?.middleSituationConfirmed && !!s?.eastSituationConfirmed;
    return true;
  }
  function routeSafety(attributes = {}) {
    if (attributes.wet || attributes.narrow) return '危險';
    if (attributes.obstacle) return 'needs-clearing';
    return '安全';
  }
  function retreatFollower({ grid, leader, follower, blockedChars = ['#', '~'] }) {
    if (manhattan(leader, follower) !== 1) return { leader, follower, moved: false };
    const dr = follower[0] - leader[0], dc = follower[1] - leader[1];
    const followerBack = [follower[0] + dr, follower[1] + dc];
    const tile = grid?.[followerBack[0]]?.[followerBack[1]];
    if (!tile || blockedChars.includes(tile)) return { leader, follower, moved: false };
    return { leader: [...follower], follower: followerBack, moved: true };
  }

  globalThis.NorthForestMechanics = Object.freeze({
    list, samePosition, manhattan, flagsMet, observableVisible, attributeDifferences,
    attributesMatch, materialSuitable, nextDiscreteState, nearby, terrainConnectionDirections,
    completionFor, routeSafety, retreatFollower
  });

  if (typeof document === 'undefined' || typeof current !== 'function' || typeof render !== 'function') return;

  const cfgFor = st => st?.northForest || null;
  const observableAt = (st, pos) => {
    const cfg = cfgFor(st), ch = st?.grid?.[pos?.[0]]?.[pos?.[1]];
    return cfg?.observables?.find(item => item.char === ch) || null;
  };
  const observableById = (st, id) => cfgFor(st)?.observables?.find(item => item.id === id) || null;
  const positionOfChar = (st, char) => locate(st.grid, char);
  const terrainAt = (st, pos) => list(cfgFor(st)?.terrain).find(terrain => list(terrain.positions).some(item => samePosition(item, pos))) || null;
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const attributeText = attributes => Object.entries(attributes || {}).map(([, value]) => value).join(' · ');
  const attributeLabels = Object.freeze({ color: '顏色', length: '長度', tip: '葉尖', width: '粗細', habitat: '生長位置', surface: '路面', breadth: '寬窄', obstacle: '障礙' });

  const baseInitialState = initialState;
  initialState = function northForestInitialState(st) {
    const next = baseInitialState(st), cfg = cfgFor(st);
    if (cfg) Object.assign(next, clone(cfg.initialState || {}));
    return next;
  };

  const baseIsWin = isWin;
  isWin = function northForestIsWin() {
    const base = baseIsWin(), st = current(), cfg = cfgFor(st);
    return cfg ? base && completionFor(st, state, atExit()) : base;
  };

  const baseAcceptedMove = acceptedMove;
  acceptedMove = function northForestAcceptedMove(pos) {
    const st = current(), cfg = cfgFor(st), item = observableAt(st, pos);
    if (!cfg || !item || item.blocking === false) return baseAcceptedMove(pos);
    if (!observableVisible(item, state)) return false;
    if (item.passableWhen && state[item.passableWhen]) return baseAcceptedMove(pos);
    if (cfg.kind === 'materials' && list(state.carriedMaterials).includes(item.id)) return baseAcceptedMove(pos);
    return false;
  };

  function completeFromAction(message) {
    const st = current();
    if (!isWin()) return false;
    if (stageSession.mode !== 'replay') completed.add(st.id);
    window.GameFlow?.recordStageComplete(st.id, stageSession);
    save(); render();
    if (message) setStatus(message, 'good');
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === st.id && isWin()) showComplete();
    }, 140);
    return true;
  }

  const baseAttemptMove = attemptMove;
  attemptMove = function northForestAttemptMove(pos, isWait) {
    const st = current(), cfg = cfgFor(st), item = !isWait && observableAt(st, pos);
    if (!cfg) return baseAttemptMove(pos, isWait);
    if (item && !observableVisible(item, state)) {
      setStatus('아직 이 대상을 조사할 단서가 없어. 마지막으로 확인한 위치부터 살펴봐.', 'info');
      return;
    }
    if (item && item.blocking !== false && !(item.passableWhen && state[item.passableWhen]) &&
        !(cfg.kind === 'materials' && list(state.carriedMaterials).includes(item.id))) {
      setStatus('不要直接踩上去。 가까이에서 눌러 살펴보거나 상황형 행동을 사용해.', 'info');
      return;
    }

    // On the wet middle path, stepping back onto the stopped cart retreats both pieces one tile.
    // This preserves an undo-free recovery after the player tests the unsafe path.
    if (cfg.kind === 'route-cart' && samePosition(pos, state.followerPos) && st.grid[state.hero[0]]?.[state.hero[1]] === '~') {
      const retreat = retreatFollower({ grid: st.grid, leader: state.hero, follower: state.followerPos,
        blockedChars: st.follower.blockedChars || ['#', '~'] });
      if (retreat.moved) {
        history.push(clone(state));
        state.hero = retreat.leader; state.followerPos = retreat.follower;
        state.followerStuck = false; state.followerStuckReason = null; state.turn++;
        save(); render();
        setStatus('危險한 가운데 길에서 함께 한 칸 물러났어. 이제 다른 길을 고를 수 있어.', 'info');
        return;
      }
    }

    const oldHero = clone(state.hero), oldTerrain = terrainAt(st, oldHero), result = baseAttemptMove(pos, isWait);
    const newTerrain = terrainAt(st, state.hero);
    if (!isWait && !samePosition(oldHero, state.hero) && newTerrain?.enterMessage && newTerrain !== oldTerrain) {
      setStatus(newTerrain.enterMessage, 'info');
    }
    if (cfg.kind === 'clue-path' && !samePosition(oldHero, state.hero) && tileAt(state.hero) === 'Q' && state.relatedTraceConfirmed) {
      state.reachedClearing = true;
      if (!completeFromAction(cfg.clearingMessage || '痕跡을 따라 작은 빈터까지 도착했어.')) { save(); render(); }
    }
    return result;
  };

  function feedbackForDifference(cfg, item) {
    const differences = attributeDifferences(cfg.reference, item.attributes, cfg.attributeKeys);
    if (!differences.length) return '顏色、長度、葉尖都和樣本相同。 세 특징이 모두 견본과 같아.';
    const key = differences[0], label = attributeLabels[key] || key;
    const value = item.attributes?.[key], expected = cfg.reference?.[key];
    return `很相似，但是${label}不同：這裡是${value}，樣本是${expected}。 비슷하지만 ${label} 특징은 달라.`;
  }

  const handlers = globalThis.ContextActionHandlers = globalThis.ContextActionHandlers || {};
  handlers['north-forest-action'] = (pos, action) => {
    const st = current(), cfg = cfgFor(st);
    if (!cfg || dist(state.hero, pos) !== 1 || !globalThis.ContextActionLogic?.enabled(action, state)) return;
    const item = action.objectId ? observableById(st, action.objectId) : observableAt(st, pos);
    let message = action.message || '', type = 'good', changed = false;
    const checkpoint = () => { if (!changed) { history.push(clone(state)); changed = true; } };

    if (action.operation === 'set-flags') {
      const values = list(action.sets);
      if (values.length) { checkpoint(); values.forEach(flag => { state[flag] = true; }); }
    } else if (action.operation === 'observe' && item) {
      checkpoint();
      if (item.observedFlag) state[item.observedFlag] = true;
      message = `${item.labelZh}：${attributeText(item.attributes)}。 ${item.labelKo}의 특징을 확인했어.`;
    } else if (action.operation === 'select-attribute' && item) {
      checkpoint(); state.comparedSimilar = true;
      state.comparedPatchIds = [...new Set([...list(state.comparedPatchIds), item.id])];
      if (attributesMatch(cfg.reference, item.attributes, cfg.attributeKeys)) {
        state.selectedPatch = item.id;
        state.matchingPlantConfirmed = true;
      } else {
        state.selectedPatch = null; state.matchingPlantConfirmed = false; state.differentObserved = true; type = 'info';
      }
      message = feedbackForDifference(cfg, item);
      if (item.id === cfg.targetId && state.comparedPatchIds.length < (cfg.minimumComparisons || 1)) {
        message += ' 다른 후보 하나와도 비교하면 分辨을 마칠 수 있어.';
      }
    } else if (action.operation === 'collect-attribute' && item) {
      if (item.id !== cfg.targetId || !state.matchingPlantConfirmed) return;
      checkpoint(); state.collectedPatch = item.id; state.plantCollected = true;
      message = '把確認過的植物收好了。 확인한 식물을 한 포기 챙겼어.';
    } else if (action.operation === 'take-material' && item) {
      checkpoint();
      const carried = new Set(list(state.carriedMaterials)); carried.add(item.id); state.carriedMaterials = [...carried];
      state[`material${item.char}Held`] = true;
      const suitable = materialSuitable(item.attributes, cfg.requirements);
      type = suitable ? 'good' : 'info';
      if (suitable) {
        message = `${attributeText(item.attributes)}。 세 조건에 맞는 材料를 챙겼어.`;
      } else {
        const key = attributeDifferences(cfg.requirements, item.attributes, Object.keys(cfg.requirements || {}))[0];
        const label = attributeLabels[key] || key;
        message = `${attributeText(item.attributes)}。 ${label} 조건이 不同해. 다시 놓고 고를 수 있어.`;
      }
    } else if (action.operation === 'return-material' && item) {
      checkpoint();
      state.carriedMaterials = list(state.carriedMaterials).filter(id => id !== item.id);
      state[`material${item.char}Held`] = false;
      message = '材料를 원래 자리로 돌려놓았어. 다른 덩굴의 특징을 비교해보자.'; type = 'info';
    } else if (action.operation === 'nearby-note') {
      const values = list(action.sets);
      if (values.length) { checkpoint(); values.forEach(flag => { state[flag] = true; }); }
      const center = positionOfChar(st, cfg.observables.find(candidate => candidate.id === cfg.centerId)?.char);
      message = action.message || (nearby(center, pos, cfg.radius) ? '마지막 흔적의 附近야.' : '마지막 흔적에서 너무 멀어.');
      type = 'info';
    } else if (action.operation === 'rotate') {
      checkpoint();
      const discrete = cfg.discrete, oldValue = state[discrete.stateFlag];
      state[discrete.stateFlag] = nextDiscreteState(discrete.states, oldValue);
      const correct = state[discrete.stateFlag] === discrete.target;
      const referenceSeen = flagsMet(state, discrete.referenceFlags || discrete.referenceFlag);
      message = correct && referenceSeen
        ? `標記現在指向${discrete.target}，和實際路線一致。 正確한 指示가 됐어.`
        : correct
          ? `標記現在指向${discrete.target}。 실제 장터 길과 맞는지는 길을 확인해 보자.`
        : `標記現在指向${state[discrete.stateFlag]}。 실제 길과 비교해 더 돌려볼 수 있어.`;
      type = correct && referenceSeen ? 'good' : 'info';
    } else if (action.operation === 'retreat-cart') {
      if (!samePosition(pos, state.followerPos) || st.grid[state.hero[0]]?.[state.hero[1]] !== '~') {
        setStatus('貨車還不需要後退。 수레가 젖은 길 앞에서 멈췄을 때 함께 물러날 수 있어.', 'info');
        return;
      }
      const retreat = retreatFollower({ grid: st.grid, leader: state.hero, follower: state.followerPos,
        blockedChars: st.follower.blockedChars || ['#', '~'] });
      if (!retreat.moved) return;
      checkpoint(); state.hero = retreat.leader; state.followerPos = retreat.follower;
      state.followerStuck = false; state.followerStuckReason = null; state.turn++;
      message = '少年和貨車一起後退了一格。 소년과 수레가 함께 한 칸 물러나 다른 길을 고를 수 있어.'; type = 'info';
    }

    if (changed) { save(); render(); }
    if (!completeFromAction(message)) setStatus(message || '상태를 확인했어.', type);
  };

  const baseDescTile = descTile;
  descTile = function northForestDescTile(ch, pos) {
    const st = current(), cfg = cfgFor(st), item = observableAt(st, pos);
    if (!cfg) return baseDescTile(ch, pos);
    if (item) {
      if (!observableVisible(item, state)) return '아직 드러나지 않은 숲 바닥';
      if (cfg.kind === 'materials' && list(state.carriedMaterials).includes(item.id)) return '재료를 챙긴 자리';
      if (cfg.kind === 'attributes' && state.collectedPatch === item.id) return '식물을 챙긴 자리';
      if (cfg.kind === 'clue-nearby' && item.id === 'low-bush' && state.bundleDiscovered && !state.bundleCollected) return '파란 끈 꾸러미가 드러난 낮은 덤불';
      return item.labelKo;
    }
    if (ch === 'E' && cfg.exitLabelKo) return `${cfg.exitLabelKo}${cfg.exitLabelZh ? `, ${cfg.exitLabelZh}` : ''}`;
    const terrain = terrainAt(st, pos);
    return terrain?.labelKo ? `${terrain.labelKo}${terrain.labelZh ? `, ${terrain.labelZh}` : ''}` : baseDescTile(ch, pos);
  };

  function syncReferenceCard(cfg) {
    let card = document.getElementById('northForestReference');
    if (!cfg?.referenceCard && !cfg?.workOrder) {
      if (card) card.hidden = true;
      return;
    }
    if (!card) {
      card = document.createElement('section');
      card.id = 'northForestReference';
      card.className = 'northForestReference';
      document.querySelector('.goalbox')?.insertAdjacentElement('afterend', card);
    }
    const reference = cfg.reference || {}, meta = cfg.referenceCard || cfg.workOrder;
    const values = cfg.workOrder?.values || Object.values(reference);
    const label = meta.labelKo || meta.labelZh || '견본';
    card.className = `northForestReference${cfg.workOrder ? ' northForestWorkOrder' : ''}`;
    card.setAttribute('aria-label', `${label}: ${values.join(' · ')}`);
    card.innerHTML = `<span class="northForestReferenceLabel"><b lang="zh-Hant">${escapeHtml(meta.labelZh || '樣本')}</b>${meta.labelKo ? `<small>${escapeHtml(meta.labelKo)}</small>` : ''}</span>` +
      (cfg.referenceCard ? `<span class="northForestReferenceArt forest-object-${escapeHtml(meta.variant || '')}" aria-hidden="true"></span>` : '') +
      `<span class="northForestReferenceAttributes" lang="zh-Hant">${values.map(value => `<i>${escapeHtml(value)}</i>`).join('')}</span>`;
    card.hidden = false;
  }

  function addObjectMark(cell, item, st) {
    if (!cell || !item || !observableVisible(item, state)) return;
    if (st.northForest.kind === 'materials' && list(state.carriedMaterials).includes(item.id)) return;
    if (st.northForest.kind === 'attributes' && state.collectedPatch === item.id) return;
    const mark = document.createElement('span');
    mark.className = `forest-object-mark forest-object-${item.variant || item.id}`;
    mark.setAttribute('aria-hidden', 'true');
    if (item.variant === 'marker') {
      const direction = item.directionFlag ? state[item.directionFlag] : item.direction;
      const angle = { '上': '-90deg', '右': '0deg', '下': '90deg', '左': '180deg' }[direction] || '0deg';
      mark.style.setProperty('--marker-angle', angle);
      mark.innerHTML = '<i class="forest-marker-post"></i><i class="forest-marker-pointer"></i>' +
        (item.revealedFlag && !state[item.revealedFlag] ? '<i class="forest-marker-leaves"></i>' : '');
    }
    cell.appendChild(mark);
    if (item.confirmedFlag && state[item.confirmedFlag]) cell.classList.add('forest-object-confirmed');
  }

  const baseRender = render;
  render = function northForestRender() {
    baseRender();
    const st = current(), cfg = cfgFor(st);
    syncReferenceCard(cfg);
    if (!cfg) return;
    gridEl.classList.add('northForestStage', `northForest-${cfg.kind}`);
    const cols = st.grid[0].length;
    for (const terrain of list(cfg.terrain)) for (const pos of list(terrain.positions)) {
      const cell = gridEl.children[pos[0] * cols + pos[1]];
      cell?.classList.add(...String(terrain.className).split(/\s+/));
      if (cfg.kind === 'route-cart' && String(terrain.className).includes('forest-path-')) {
        cell?.classList.add('forest-path-cell', ...terrainConnectionDirections(terrain, pos).map(direction => `forest-path-${direction}`));
      }
    }
    for (const item of list(cfg.observables)) {
      const pos = positionOfChar(st, item.char), cell = pos && gridEl.children[pos[0] * cols + pos[1]];
      addObjectMark(cell, item, st);
    }
    if (cfg.kind === 'clue-nearby' && state.bundleThreadFound) {
      const pos = positionOfChar(st, 'C'), cell = pos && gridEl.children[pos[0] * cols + pos[1]];
      if (cell && !cell.querySelector('.forest-bush-thread-mark')) {
        const mark = document.createElement('span'); mark.className = 'forest-bush-thread-mark'; mark.setAttribute('aria-hidden', 'true'); cell.appendChild(mark);
      }
    }
    if (cfg.kind === 'clue-nearby' && state.bundleDiscovered && !state.bundleCollected) {
      const pos = positionOfChar(st, 'C'), cell = pos && gridEl.children[pos[0] * cols + pos[1]];
      if (cell && !cell.querySelector('.forest-bundle-mark')) {
        const mark = document.createElement('span'); mark.className = 'forest-bundle-mark'; mark.setAttribute('aria-hidden', 'true'); cell.appendChild(mark);
      }
    }
    $('#words').querySelectorAll('.wordbtn').forEach(button => {
      const word = button.textContent;
      const done = (word === '確認' && completionFor(st, state, atExit())) ||
        (word === '正確' && cfg.kind === 'discrete' && state[cfg.discrete.stateFlag] === cfg.discrete.target) ||
        (word === '相似' && state.comparedSimilar) ||
        (word === '不同' && state.differentObserved) ||
        (word === '分辨' && state.matchingPlantConfirmed) ||
        (word === '材料' && list(state.carriedMaterials).length >= (cfg.required || Infinity)) ||
        (word === '痕跡' && state.relatedTraceConfirmed) || (word === '發現' && state.bundleDiscovered) ||
        (word === '安全' && cfg.kind === 'route-cart' && completionFor(st, state, atExit()));
      if (done) button.classList.add('done');
    });
  };

  const baseShowInspect = showInspect;
  showInspect = function northForestShowInspect(pos) {
    const st = current(), cfg = cfgFor(st), item = observableAt(st, pos);
    if (!cfg || !item) return baseShowInspect(pos);
    if (!observableVisible(item, state)) {
      setStatus('這個痕跡還看不到。 아직 이 흔적은 보이지 않아. 마지막으로 확인한 곳부터 찾아봐.', 'info');
      return;
    }
    let changed = false;
    for (const flag of list(item.directSets)) if (!state[flag]) {
      if (!changed) history.push(clone(state));
      state[flag] = true; changed = true;
    }
    if (changed) { save(); render(); }
    const currentDirection = item.directionFlag ? state[item.directionFlag] : item.direction;
    const directionVisible = !item.revealedFlag || state[item.revealedFlag];
    const details = [];
    if (item.attributes && (!item.observedFlag || state[item.observedFlag])) {
      for (const [keyName, value] of Object.entries(item.attributes)) details.push(`<strong>${escapeHtml(attributeLabels[keyName] || keyName)}</strong> ${escapeHtml(value)}`);
    }
    if (currentDirection && directionVisible) details.push(`<strong>方向</strong> ${escapeHtml(currentDirection)}`);
    if (item.revealedFlag && !state[item.revealedFlag]) details.push('<strong>상태</strong> 잎에 가려져 방향은 아직 보이지 않음');
    if (cfg.kind === 'clue-nearby' && item.id === 'low-bush' && !state.bundleThreadFound) details.push('<strong>상태</strong> 낮은 가지와 잎이 겹쳐 안쪽은 보이지 않음');
    if (item.pendingHint && !flagsMet(state, item.pendingHintUntil)) details.push(`<strong>확인 전</strong> ${escapeHtml(item.pendingHint)}`);
    openSheet(`<h2>${escapeHtml(item.labelZh)}</h2><div class="meaning">${escapeHtml(item.labelKo)}</div>${details.length ? `<div class="gamerule">${details.join('<br>')}</div>` : ''}<div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>`);
  };
})();
