/* Market resource runtime: small walkable boards plus inspectable stalls, stock transfers, and exchange. */
(() => {
  const copy = value => JSON.parse(JSON.stringify(value));
  const cfgLocations = cfg => Array.isArray(cfg?.locations) ? cfg.locations : [];
  const locationCfg = (cfg, id) => cfgLocations(cfg).find(location => location.id === id) || null;
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const getQty = (record, item) => number(record?.[item]);

  function createState(cfg) {
    const marketState = {
      locations: {},
      inventory: { ...(cfg?.initialInventory || {}) },
      coins: number(cfg?.coins),
      inspected: [],
      flags: {},
      focus: null
    };
    for (const location of cfgLocations(cfg)) marketState.locations[location.id] = { stock: { ...(location.stock || {}) } };
    return marketState;
  }

  const capacityUsed = marketState => Object.values(marketState?.inventory || {}).reduce((sum, qty) => sum + number(qty), 0);
  const capacityLeft = (cfg, marketState) => Math.max(0, number(cfg?.capacity) - capacityUsed(marketState));
  const stockAt = (marketState, locationId, item) => getQty(marketState?.locations?.[locationId]?.stock, item);
  const needAt = (cfg, locationId, item) => getQty(locationCfg(cfg, locationId)?.needs, item);
  const isSufficient = (cfg, marketState, locationId, item) => stockAt(marketState, locationId, item) >= needAt(cfg, locationId, item);
  const allNeedsMet = (cfg, marketState) => cfgLocations(cfg).every(location =>
    Object.keys(location.needs || {}).every(item => isSufficient(cfg, marketState, location.id, item)));

  function conditionMet(condition, marketState, cfg) {
    if (!condition || !marketState) return false;
    if (condition.type === 'location-at-least') return stockAt(marketState, condition.location, condition.item) >= number(condition.amount);
    if (condition.type === 'location-equals') return stockAt(marketState, condition.location, condition.item) === number(condition.amount);
    if (condition.type === 'inventory-at-least') return getQty(marketState.inventory, condition.item) >= number(condition.amount);
    if (condition.type === 'flag') return !!marketState.flags?.[condition.flag] === (condition.eq !== false);
    if (condition.type === 'inspected') return (marketState.inspected || []).includes(condition.location);
    if (condition.type === 'inspected-all') return (condition.locations || []).every(id => (marketState.inspected || []).includes(id));
    if (condition.type === 'all-needs-met') return allNeedsMet(cfg, marketState);
    return false;
  }

  const isSolved = (cfg, marketState) => (cfg?.predicates || []).every(condition => conditionMet(condition, marketState, cfg));

  function inspectLocation(cfg, marketState, locationId) {
    if (!locationCfg(cfg, locationId) || !marketState) return { state: marketState, changed: false };
    const next = copy(marketState);
    next.focus = locationId;
    if (!(next.inspected || []).includes(locationId)) next.inspected = [...(next.inspected || []), locationId];
    return { state: next, changed: true };
  }

  function acceptsItem(location, item) {
    if (Array.isArray(location?.accepts)) return location.accepts.includes(item);
    return Object.prototype.hasOwnProperty.call(location?.needs || {}, item);
  }

  function applyAction(cfg, marketState, action) {
    const location = locationCfg(cfg, action?.location);
    if (!location || !marketState) return { state: marketState, changed: false, reason: 'invalid-location' };
    const next = copy(marketState);
    const locState = next.locations[location.id];
    const qty = Math.max(1, number(action.qty) || 1);
    const item = action.item;

    if (action.type === 'take') {
      if (!location.allowTake || !item) return { state: marketState, changed: false, reason: 'not-takeable' };
      if (stockAt(next, location.id, item) < qty) return { state: marketState, changed: false, reason: 'empty' };
      if (capacityLeft(cfg, next) < qty) return { state: marketState, changed: false, reason: 'capacity' };
      const need = needAt(cfg, location.id, item);
      if (need > 0 && stockAt(next, location.id, item) - qty < need) return { state: marketState, changed: false, reason: 'needed-here' };
      locState.stock[item] = stockAt(next, location.id, item) - qty;
      next.inventory[item] = getQty(next.inventory, item) + qty;
      next.focus = location.id;
      return { state: next, changed: true, reason: 'taken', item, qty };
    }

    if (action.type === 'put') {
      if (!location.allowPut || !item) return { state: marketState, changed: false, reason: 'not-puttable' };
      if (!acceptsItem(location, item)) return { state: marketState, changed: false, reason: 'wrong-destination' };
      if (getQty(next.inventory, item) < qty) return { state: marketState, changed: false, reason: 'not-held' };
      next.inventory[item] = getQty(next.inventory, item) - qty;
      locState.stock[item] = stockAt(next, location.id, item) + qty;
      next.focus = location.id;
      return { state: next, changed: true, reason: 'put', item, qty };
    }

    if (action.type === 'exchange') {
      const offer = location.exchange;
      if (!offer) return { state: marketState, changed: false, reason: 'no-exchange' };
      const giveQty = Math.max(1, number(offer.giveQty) || 1);
      const receiveQty = Math.max(1, number(offer.receiveQty) || 1);
      if (getQty(next.inventory, offer.give) < giveQty) return { state: marketState, changed: false, reason: 'missing-give' };
      if (stockAt(next, location.id, offer.receive) < receiveQty) return { state: marketState, changed: false, reason: 'missing-receive' };
      if (capacityUsed(next) - giveQty + receiveQty > number(cfg?.capacity)) return { state: marketState, changed: false, reason: 'capacity' };
      next.inventory[offer.give] = getQty(next.inventory, offer.give) - giveQty;
      next.inventory[offer.receive] = getQty(next.inventory, offer.receive) + receiveQty;
      locState.stock[offer.give] = stockAt(next, location.id, offer.give) + giveQty;
      locState.stock[offer.receive] = stockAt(next, location.id, offer.receive) - receiveQty;
      next.flags[offer.flag || 'exchanged'] = true;
      next.focus = location.id;
      return { state: next, changed: true, reason: 'exchanged', give: offer.give, receive: offer.receive, giveQty, receiveQty };
    }

    return { state: marketState, changed: false, reason: 'unknown-action' };
  }

  globalThis.MarketMechanic = Object.freeze({
    createState, capacityUsed, capacityLeft, stockAt, needAt, isSufficient, allNeedsMet,
    conditionMet, isSolved, inspectLocation, applyAction
  });

  if (typeof document === 'undefined' || typeof current !== 'function' || typeof render !== 'function') return;

  const M = globalThis.MarketMechanic;
  const cfgFor = stage => stage?.market || null;
  const coordKey = pos => `${pos[0]},${pos[1]}`;
  const itemCfg = (cfg, item) => cfg?.items?.[item] || { labelZh: item, labelKo: item, unitZh: '' };
  const marketLocationAt = (cfg, pos) => cfgLocations(cfg).find(location => coordKey(location.pos) === coordKey(pos)) || null;
  const ensureMarketState = () => {
    const cfg = cfgFor(current());
    if (cfg && !state.market) state.market = M.createState(cfg);
  };

  const baseInitialState = initialState;
  initialState = function marketInitialState(stage) {
    const next = baseInitialState(stage);
    if (cfgFor(stage)) next.market = M.createState(stage.market);
    return next;
  };

  const baseIsWin = isWin;
  isWin = function marketIsWin() {
    const cfg = cfgFor(current());
    if (!cfg) return baseIsWin();
    ensureMarketState();
    return M.isSolved(cfg, state.market);
  };

  const baseResetStage = resetStage;
  resetStage = function marketResetStage(quiet = false) {
    if (!cfgFor(current())) return baseResetStage(quiet);
    const result = baseResetStage(true);
    if (!quiet) setStatus(current().market.startStatus || '필요한 것과 가진 것을 먼저 살펴봐.', 'info');
    return result;
  };

  function goalMarkMet(mark, cfg) {
    return M.conditionMet(mark, state.market, cfg);
  }

  function renderMarketGoal(stage) {
    const cfg = stage.market;
    let goal = stage.goal;
    for (const mark of cfg.goalMarks || []) goal = markGoal(goal, mark.word, goalMarkMet(mark, cfg));
    $('#goal').innerHTML = goal;
    $('#ruleLine').textContent = stage.rule || '';
  }

  function renderMarketWords(stage) {
    const cfg = stage.market;
    $('#words').innerHTML = '';
    for (const word of stage.words) {
      const button = document.createElement('button');
      button.className = 'wordbtn';
      const mark = (cfg.goalMarks || []).find(item => item.word === word);
      if ((mark && goalMarkMet(mark, cfg)) || (!mark && isWin())) button.classList.add('done');
      button.textContent = word;
      button.onclick = () => showWord(word);
      $('#words').append(button);
    }
  }

  function inventoryText(cfg) {
    const held = Object.entries(state.market.inventory || {}).filter(([, qty]) => number(qty) > 0);
    const items = held.length
      ? held.map(([item, qty]) => `${itemCfg(cfg, item).labelZh} ×${qty}`).join('　')
      : '없음';
    return `手上　${items}　│　짐 ${M.capacityUsed(state.market)}/${number(cfg.capacity)}`;
  }

  function needRows(cfg, location) {
    const rows = [];
    const locState = state.market.locations[location.id];
    for (const [item, need] of Object.entries(location.needs || {})) {
      const meta = itemCfg(cfg, item), stock = getQty(locState.stock, item), shortage = Math.max(0, number(need) - stock);
      rows.push(`<div class="market-info-row"><span>需求</span><strong lang="zh-Hant">${meta.labelZh} ×${need}</strong><small>${meta.labelKo}</small></div>`);
      rows.push(`<div class="market-info-row"><span>現在</span><strong lang="zh-Hant">${meta.labelZh} ×${stock}</strong><small>${stock >= need ? '足夠 · 충분함' : `不足 ×${shortage} · 부족`}</small></div>`);
    }
    if (!Object.keys(location.needs || {}).length) {
      const labelZh = location.stockLabelZh || '現在', labelKo = location.stockLabelKo || '현재';
      const stockRows = Object.entries(locState.stock || {}).filter(([, qty]) => number(qty) > 0)
        .map(([item, qty]) => {
          const meta = itemCfg(cfg, item);
          return `<div class="market-info-row"><span>${labelZh}</span><strong lang="zh-Hant">${meta.labelZh} ×${qty}</strong><small>${labelKo} · ${meta.labelKo}</small></div>`;
        });
      rows.push(...stockRows);
      if (!stockRows.length) rows.push('<div class="market-empty">지금 남아 있는 물건이 없어.</div>');
    }
    return rows.join('');
  }

  function factRows(location) {
    return (location.facts || []).map(fact => `<div class="market-fact-row"><span>${fact.labelZh}<small>${fact.labelKo}</small></span><strong>${fact.textZh}<small>${fact.textKo}</small></strong></div>`).join('');
  }

  function actionButtons(cfg, location, adjacent) {
    if (!adjacent) return '<p class="market-action-hint">가까이 가면 물건을 주고받을 수 있어.</p>';
    const buttons = [];
    const locState = state.market.locations[location.id];

    if (location.exchange) {
      const offer = location.exchange, give = itemCfg(cfg, offer.give), receive = itemCfg(cfg, offer.receive);
      const canExchange = getQty(state.market.inventory, offer.give) >= number(offer.giveQty) && M.stockAt(state.market, location.id, offer.receive) >= number(offer.receiveQty);
      buttons.push(`<button type="button" data-market-action="exchange" data-location="${location.id}" ${canExchange ? '' : 'disabled'}>交換 ${give.labelZh} → ${receive.labelZh}</button>`);
    }

    if (location.allowTake) {
      for (const [item, qty] of Object.entries(locState.stock || {})) {
        const need = M.needAt(cfg, location.id, item);
        if (number(qty) <= 0 || (need > 0 && number(qty) <= need)) continue;
        const meta = itemCfg(cfg, item);
        buttons.push(`<button type="button" data-market-action="take" data-location="${location.id}" data-item="${item}">拿 ${meta.labelZh} ×1</button>`);
      }
    }

    if (location.allowPut) {
      for (const [item, qty] of Object.entries(state.market.inventory || {})) {
        if (number(qty) <= 0 || !((location.accepts || Object.keys(location.needs || {})).includes(item))) continue;
        const meta = itemCfg(cfg, item);
        buttons.push(`<button type="button" data-market-action="put" data-location="${location.id}" data-item="${item}">放 ${meta.labelZh} ×1</button>`);
      }
    }

    return buttons.length ? `<div class="market-panel-actions">${buttons.join('')}</div>` : '<p class="market-action-hint">지금 여기서 옮길 수 있는 물건은 없어.</p>';
  }

  function renderPanel(cfg) {
    const focus = locationCfg(cfg, state.market.focus);
    if (!focus) return `<section class="market-panel market-panel-empty"><div class="market-carry">${inventoryText(cfg)}</div><p>${inspect ? '살펴보기 모드에서는 멀리 있는 좌판이나 사람도 눌러 정보를 확인할 수 있어.' : '좌판·사람·짐·창고 가까이 가서 눌러봐.'}</p></section>`;
    const adjacent = dist(state.hero, focus.pos) === 1;
    return `<section class="market-panel" data-focus="${focus.id}">
      <div class="market-carry">${inventoryText(cfg)}</div>
      <div class="market-panel-head"><span class="market-panel-icon" aria-hidden="true">${focus.icon || '📦'}</span><div><strong lang="zh-Hant">${focus.labelZh}</strong><small>${focus.labelKo}</small></div></div>
      ${factRows(focus)}
      <div class="market-info-list">${needRows(cfg, focus)}</div>
      ${actionButtons(cfg, focus, adjacent)}
    </section>`;
  }

  function renderMapCell(stage, cfg, r, c) {
    const pos = [r, c], location = marketLocationAt(cfg, pos), heroHere = coordKey(state.hero) === coordKey(pos);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'market-cell';
    button.dataset.row = String(r); button.dataset.col = String(c);
    if (location) {
      const inspected = (state.market.inspected || []).includes(location.id);
      button.classList.add('market-location');
      if (location.kind) button.classList.add(`market-${location.kind}`);
      if (inspected) button.classList.add('inspected');
      if (state.market.focus === location.id) button.classList.add('focused');
      if (inspect || dist(state.hero, pos) === 1) button.classList.add('interactable');
      button.setAttribute('aria-label', `${location.labelKo}, ${location.labelZh}`);
      button.innerHTML = `<span class="market-location-icon" aria-hidden="true">${location.icon || '📦'}</span><small lang="zh-Hant">${location.labelZh}</small>`;
    } else {
      button.classList.add('market-floor');
      const moveable = !inspect && dist(state.hero, pos) === 1;
      if (moveable) button.classList.add('moveable');
      button.setAttribute('aria-label', `${String.fromCharCode(65 + c)}${r + 1}, 장터 길`);
      if (moveable) button.innerHTML = `<span class="move-arrow" aria-hidden="true">${arrowFor(pos)}</span>`;
    }
    if (heroHere) {
      button.classList.add('hero-here');
      button.setAttribute('aria-current', 'location');
      const hero = document.createElement('span');
      hero.className = 'hero market-hero'; hero.textContent = '🧑‍🎒'; hero.setAttribute('aria-hidden', 'true');
      button.append(hero);
    }
    button.addEventListener('click', () => marketTap(pos));
    return button;
  }

  function bindMarketActions() {
    gridEl.querySelectorAll('[data-market-action]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        runMarketAction({ type: button.dataset.marketAction, location: button.dataset.location, item: button.dataset.item });
      });
    });
  }

  const baseRender = render;
  render = function marketRender() {
    const stage = current(), cfg = cfgFor(stage);
    if (!cfg) {
      gridEl.classList.remove('market-board');
      $('#inspectBtn').hidden = false;
      return baseRender();
    }

    ensureMarketState();
    $('#stageKicker').textContent = stage.kicker || '1장 · 장터';
    $('#stageTitle').textContent = stage.subtitle;
    renderMarketGoal(stage);
    gridEl.style.gridTemplateColumns = '';
    gridEl.className = 'grid market-board';
    gridEl.setAttribute('role', 'group');
    gridEl.setAttribute('aria-label', cfg.boardLabel || '장터 자원판');

    const scene = document.createElement('div');
    scene.className = 'market-scene';
    const map = document.createElement('div');
    map.className = 'market-grid';
    map.style.setProperty('--market-cols', stage.grid[0].length);
    map.setAttribute('role', 'grid');
    for (let r = 0; r < stage.grid.length; r++) for (let c = 0; c < stage.grid[r].length; c++) map.append(renderMapCell(stage, cfg, r, c));
    scene.append(map);
    scene.insertAdjacentHTML('beforeend', renderPanel(cfg));
    gridEl.replaceChildren(scene);
    bindMarketActions();
    renderMarketWords(stage);

    const controls = $('.controls');
    $('#waitBtn').hidden = true;
    $('#inspectBtn').hidden = false;
    $('#inspectBtn').textContent = inspect ? '이동으로' : '살펴보기';
    $('#inspectBtn').className = 'control' + (inspect ? ' mode' : '');
    $('#undoBtn').hidden = false;
    $('#undoBtn').disabled = !history.length;
    controls.style.gridTemplateColumns = '1fr 1fr';
  };

  function marketTap(pos) {
    const stage = current(), cfg = cfgFor(stage);
    if (!cfg || screen !== 'tutorial' || isWin()) return;
    ensureMarketState();
    const location = marketLocationAt(cfg, pos);
    if (location) {
      if (!inspect && dist(state.hero, pos) !== 1) {
        setStatus('가까이 가면 그곳의 물건과 필요한 수량을 직접 확인할 수 있어.', 'info');
        return;
      }
      const result = M.inspectLocation(cfg, state.market, location.id);
      state.market = result.state;
      save(); render();
      setStatus(`${location.labelZh} — ${location.labelKo}의 현재 상태를 확인했어.`, 'info');
      return;
    }
    if (inspect) {
      setStatus('여기는 장터의 길이야. 좌판이나 사람, 짐을 눌러 정보를 살펴봐.', 'info');
      return;
    }
    if (dist(state.hero, pos) !== 1) {
      setStatus('한 번에 상하좌우 한 칸만 움직일 수 있어.', 'info');
      return;
    }
    history.push(clone(state));
    state.hero = copy(pos);
    state.market.focus = null;
    state.turn++;
    save(); render();
    setStatus('장터 길을 한 칸 이동했어.');
  }

  function actionFeedback(cfg, action, result, solved) {
    if (!result.changed) {
      return ({
        capacity: '짐칸이 가득 찼어. 먼저 들고 있는 물건을 내려놓아야 해.',
        'needed-here': '這裡剛好需要這些。 여기는 지금 필요한 만큼만 있어서 가져갈 수 없어.',
        empty: '여기에는 지금 가져갈 물건이 없어.',
        'wrong-destination': '이 물건은 여기서 필요한 물건이 아니야.',
        'missing-give': '교환하려면 먼저 상대가 원하는 물건을 가지고 있어야 해.',
        'missing-receive': '상대에게 지금 교환해 줄 물건이 없어.'
      })[result.reason] || '지금은 그 행동을 할 수 없어.';
    }
    if (solved && cfg.feedback?.solved) return cfg.feedback.solved;
    if (result.reason === 'exchanged') {
      return `交換完成。你獲得了${itemCfg(cfg, result.receive).labelZh}。 교환이 끝났어. ${itemCfg(cfg, result.receive).labelKo}을 얻었어.`;
    }
    const meta = itemCfg(cfg, result.item);
    if (result.reason === 'taken') return `拿了${meta.labelZh} ×${result.qty}。 ${meta.labelKo}을 가져왔어.`;
    if (result.reason === 'put') {
      const location = locationCfg(cfg, action.location), need = M.needAt(cfg, location.id, result.item), stock = M.stockAt(result.state, location.id, result.item);
      if (need > 0 && stock > need) return `這裡本來就足夠，現在還多了一份。 이미 충분한 곳에 하나 더 놓았어. 필요하면 다시 가져갈 수 있어.`;
      if (need > 0 && stock >= need) return `補上了${meta.labelZh}。這裡現在足夠。 ${meta.labelKo}을 채웠어. 이제 여기는 충분해.`;
      return `放了${meta.labelZh} ×${result.qty}。 ${meta.labelKo}을 내려놓았어.`;
    }
    return '상태가 달라졌어. 다른 장소도 함께 확인해봐.';
  }

  function runMarketAction(action) {
    const stage = current(), cfg = cfgFor(stage);
    if (!cfg || screen !== 'tutorial' || isWin()) return;
    ensureMarketState();
    const result = M.applyAction(cfg, state.market, action);
    if (!result.changed) {
      setStatus(actionFeedback(cfg, action, result, false), 'info');
      return;
    }
    history.push(clone(state));
    state.market = result.state;
    state.turn++;
    const solved = M.isSolved(cfg, state.market);
    save(); render();
    setStatus(actionFeedback(cfg, action, result, solved), solved ? 'good' : 'info');
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
        if (ok && cfgFor(current())) setStatus(current().market.startStatus || '필요한 것과 가진 것을 먼저 살펴봐.', 'info');
        return ok;
      }
    });
  }
})();
