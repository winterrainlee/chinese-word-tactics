/* Market resource runtime: walkable boards plus stock, exchange, buying, choice, defer, and distribution. */
(() => {
  const copy = value => JSON.parse(JSON.stringify(value));
  const cfgLocations = cfg => Array.isArray(cfg?.locations) ? cfg.locations : [];
  const locationCfg = (cfg, id) => cfgLocations(cfg).find(location => location.id === id) || null;
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const getQty = (record, item) => number(record?.[item]);
  const configKey = cfg => `${number(cfg?.revision) || 1}|${cfgLocations(cfg).map(location => location.id).join('|')}`;

  function createState(cfg) {
    const marketState = {
      configKey: configKey(cfg),
      locations: {},
      inventory: { ...(cfg?.initialInventory || {}) },
      coins: number(cfg?.coins),
      inspected: [],
      flags: {},
      decisions: {},
      capacityOverride: null,
      focus: null
    };
    for (const location of cfgLocations(cfg)) marketState.locations[location.id] = { stock: { ...(location.stock || {}) } };
    return marketState;
  }

  const capacityUsed = marketState => Object.values(marketState?.inventory || {}).reduce((sum, qty) => sum + number(qty), 0);
  const capacityLimit = (cfg, marketState) => marketState?.capacityOverride == null ? number(cfg?.capacity) : number(marketState.capacityOverride);
  const capacityLeft = (cfg, marketState) => Math.max(0, capacityLimit(cfg, marketState) - capacityUsed(marketState));
  const stockAt = (marketState, locationId, item) => getQty(marketState?.locations?.[locationId]?.stock, item);
  const needAt = (cfg, locationId, item) => getQty(locationCfg(cfg, locationId)?.needs, item);
  const isSufficient = (cfg, marketState, locationId, item) => stockAt(marketState, locationId, item) >= needAt(cfg, locationId, item);
  const allNeedsMet = (cfg, marketState) => cfgLocations(cfg).every(location =>
    Object.keys(location.needs || {}).every(item => isSufficient(cfg, marketState, location.id, item)));
  const decisionRequirementMet = (requirement, marketState) => {
    if (!requirement) return true;
    const value = marketState?.decisions?.[requirement.key];
    return Object.prototype.hasOwnProperty.call(requirement, 'value') ? value === requirement.value : value !== undefined;
  };
  const choiceState = (location, marketState) => {
    const option = location?.choose;
    if (!option) return null;
    const decided = marketState?.decisions?.[option.decisionKey || 'choice'];
    if (decided === undefined) return 'open';
    if (decided === option.value) return 'chosen';
    return option.deferredKey ? 'deferred' : 'closed';
  };

  function conditionMet(condition, marketState, cfg) {
    if (!condition || !marketState) return false;
    if (condition.type === 'location-at-least') return stockAt(marketState, condition.location, condition.item) >= number(condition.amount);
    if (condition.type === 'location-equals') return stockAt(marketState, condition.location, condition.item) === number(condition.amount);
    if (condition.type === 'inventory-at-least') return getQty(marketState.inventory, condition.item) >= number(condition.amount);
    if (condition.type === 'flag') return !!marketState.flags?.[condition.flag] === (condition.eq !== false);
    if (condition.type === 'inspected') return (marketState.inspected || []).includes(condition.location);
    if (condition.type === 'inspected-all') return (condition.locations || []).every(id => (marketState.inspected || []).includes(id));
    if (condition.type === 'decision-set') return marketState.decisions?.[condition.key] !== undefined;
    if (condition.type === 'decision-equals') return marketState.decisions?.[condition.key] === condition.value;
    if (condition.type === 'all') return (condition.conditions || []).every(item => conditionMet(item, marketState, cfg));
    if (condition.type === 'any') return (condition.conditions || []).some(item => conditionMet(item, marketState, cfg));
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
      if (!decisionRequirementMet(location.takeRequiresDecision, next)) return { state: marketState, changed: false, reason: 'choice-required' };
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
      const before = stockAt(next, location.id, item);
      const need = needAt(cfg, location.id, item);
      if (location.limitToNeed && need > 0 && before + qty > need) {
        return { state: marketState, changed: false, reason: 'need-filled', item, qty };
      }
      next.inventory[item] = getQty(next.inventory, item) - qty;
      locState.stock[item] = before + qty;
      if (need > 0 && before < need && locState.stock[item] >= need) next.flags.replenished = true;
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
      if (capacityUsed(next) - giveQty + receiveQty > capacityLimit(cfg, next)) return { state: marketState, changed: false, reason: 'capacity' };
      next.inventory[offer.give] = getQty(next.inventory, offer.give) - giveQty;
      next.inventory[offer.receive] = getQty(next.inventory, offer.receive) + receiveQty;
      locState.stock[offer.give] = stockAt(next, location.id, offer.give) + giveQty;
      locState.stock[offer.receive] = stockAt(next, location.id, offer.receive) - receiveQty;
      next.flags[offer.flag || 'exchanged'] = true;
      next.focus = location.id;
      return { state: next, changed: true, reason: 'exchanged', give: offer.give, receive: offer.receive, giveQty, receiveQty };
    }

    if (action.type === 'buy') {
      const offer = location.sell;
      if (!offer) return { state: marketState, changed: false, reason: 'no-sale' };
      const buyItem = offer.item;
      const buyQty = Math.max(1, number(offer.qty) || 1);
      const price = Math.max(0, number(offer.price));
      const total = price * buyQty;
      if (stockAt(next, location.id, buyItem) < buyQty) return { state: marketState, changed: false, reason: 'sold-out' };
      if (next.coins < total) return { state: marketState, changed: false, reason: 'insufficient-coins' };
      if (capacityLeft(cfg, next) < buyQty) return { state: marketState, changed: false, reason: 'capacity' };
      next.coins -= total;
      locState.stock[buyItem] = stockAt(next, location.id, buyItem) - buyQty;
      next.inventory[buyItem] = getQty(next.inventory, buyItem) + buyQty;
      next.flags.bought = true;
      next.flags.sold = true;
      next.flags[`bought:${buyItem}`] = true;
      next.focus = location.id;
      return { state: next, changed: true, reason: 'bought', item: buyItem, qty: buyQty, price, total };
    }

    if (action.type === 'choose') {
      const option = location.choose;
      if (!option) return { state: marketState, changed: false, reason: 'no-choice' };
      const key = option.decisionKey || 'choice';
      if (next.decisions[key] !== undefined) return { state: marketState, changed: false, reason: 'choice-locked' };
      if (option.requires && !conditionMet(option.requires, next, cfg)) return { state: marketState, changed: false, reason: 'choice-requires' };
      const cost = Math.max(0, number(option.cost));
      if (next.coins < cost) return { state: marketState, changed: false, reason: 'insufficient-coins' };
      next.coins -= cost;
      next.decisions[key] = option.value;
      if (option.deferredKey) next.decisions[option.deferredKey] = option.deferredValue;
      if (option.capacity != null) next.capacityOverride = number(option.capacity);
      next.flags[option.flag || 'chosen'] = true;
      next.focus = location.id;
      return {
        state: next, changed: true, reason: 'chosen', value: option.value,
        deferredValue: option.deferredValue, cost, capacity: option.capacity, location: location.id
      };
    }

    return { state: marketState, changed: false, reason: 'unknown-action' };
  }

  globalThis.MarketMechanic = Object.freeze({
    configKey, createState, capacityUsed, capacityLimit, capacityLeft, stockAt, needAt, isSufficient, allNeedsMet,
    decisionRequirementMet, choiceState, conditionMet, isSolved, inspectLocation, applyAction
  });

  if (typeof document === 'undefined' || typeof current !== 'function' || typeof render !== 'function') return;

  const M = globalThis.MarketMechanic;
  const cfgFor = stage => stage?.market || null;
  const coordKey = pos => `${pos[0]},${pos[1]}`;
  const itemCfg = (cfg, item) => cfg?.items?.[item] || { labelZh: item, labelKo: item, unitZh: '' };
  const marketLocationAt = (cfg, pos) => cfgLocations(cfg).find(location => coordKey(location.pos) === coordKey(pos)) || null;
  const ensureMarketState = () => {
    const cfg = cfgFor(current());
    if (!cfg) return;
    // Market locations are inspected directly. Clear legacy saved mode state so
    // it cannot suppress movement or turn the board into a second input mode.
    if (inspect) inspect = false;
    if (!state.market || state.market.configKey !== M.configKey(cfg)) {
      state.market = M.createState(cfg);
      const start = locate(current().grid, 'S');
      if (start) state.hero = start;
      state.turn = 0;
      history = [];
    }
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
    if (!quiet) setStatus('');
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

  function inventoryMarkup(cfg) {
    const held = Object.entries(state.market.inventory || {}).filter(([, qty]) => number(qty) > 0);
    const items = held.length
      ? held.map(([item, qty]) => `<strong class="market-held-item" lang="zh-Hant">${itemCfg(cfg, item).labelZh} ×${qty}</strong>`).join('')
      : '<strong class="market-held-empty">없음</strong>';
    const coins = Object.prototype.hasOwnProperty.call(cfg || {}, 'coins')
      ? `<span class="market-coins"><span class="market-coins-icon" aria-hidden="true">🪙</span><strong lang="zh-Hant">錢幣 ${state.market.coins}</strong></span>`
      : '';
    return `<span class="market-carry-main"><span class="market-carry-icon" aria-hidden="true">🎒</span><span class="market-carry-label" lang="zh-Hant">手上</span><span class="market-held-items">${items}</span>${coins}</span><small class="market-carry-meta"><span>짐 ${M.capacityUsed(state.market)}/${M.capacityLimit(cfg, state.market)}</span></small>`;
  }

  function commerceRows(cfg, location) {
    if (!location.sell) return '';
    const meta = itemCfg(cfg, location.sell.item);
    return `<div class="market-commerce-list">
      <div class="market-info-row"><span>賣</span><strong lang="zh-Hant">${meta.labelZh}</strong><small>${meta.labelKo}</small></div>
      <div class="market-info-row"><span>價格</span><strong lang="zh-Hant">${number(location.sell.price)}</strong><small>錢幣 · 동전</small></div>
    </div>`;
  }

  function needRows(cfg, location) {
    const rows = [];
    const locState = state.market.locations[location.id];
    for (const [item, need] of Object.entries(location.needs || {})) {
      const meta = itemCfg(cfg, item), stock = getQty(locState.stock, item), shortage = Math.max(0, number(need) - stock);
      rows.push(`<div class="market-info-row"><span>需求</span><strong lang="zh-Hant">${meta.labelZh} ×${need}</strong><small>${meta.labelKo}</small></div>`);
      rows.push(`<div class="market-info-row"><span>現在</span><strong lang="zh-Hant">${meta.labelZh} ×${stock}</strong><small>${stock >= need ? '足夠 · 충분함' : `不足 ×${shortage} · 부족`}</small></div>`);
    }
    if (!Object.keys(location.needs || {}).length && !location.sell) {
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

  function actionButtons(cfg, location, adjacent, options = {}) {
    const keepDistant = options.keepDistant === true;
    const compact = options.compact === true;
    const omitPrice = options.omitPrice === true;
    if (!adjacent && !keepDistant) return '<p class="market-action-hint">가까이 가면 물건을 주고받거나 선택할 수 있어.</p>';
    const buttons = [];
    const locState = state.market.locations[location.id];
    const enabledAttr = enabled => enabled && adjacent ? '' : 'disabled';

    if (location.choose) {
      const option = location.choose;
      const key = option.decisionKey || 'choice';
      const decided = state.market.decisions?.[key];
      const requirementsMet = !option.requires || M.conditionMet(option.requires, state.market, cfg);
      if (decided === undefined) {
        const suffix = option.cost && !compact ? ` · ${number(option.cost)}` : '';
        buttons.push(`<button type="button" data-market-action="choose" data-location="${location.id}" ${enabledAttr(requirementsMet)}>選擇 ${location.labelZh}${suffix}</button>`);
      } else if (decided === option.value) {
        buttons.push(`<button type="button" disabled>已選擇 ${location.labelZh}</button>`);
      }
    }

    if (location.sell) {
      const offer = location.sell, meta = itemCfg(cfg, offer.item), available = M.stockAt(state.market, location.id, offer.item) > 0;
      const requirementsMet = !offer.requires || M.conditionMet(offer.requires, state.market, cfg);
      buttons.push(`<button type="button" data-market-action="buy" data-location="${location.id}" ${enabledAttr(available && requirementsMet)}>買 ${meta.labelZh}${omitPrice ? '' : ` · ${number(offer.price)}`}</button>`);
    }

    if (location.exchange) {
      const offer = location.exchange, give = itemCfg(cfg, offer.give), receive = itemCfg(cfg, offer.receive);
      const held = getQty(state.market.inventory, offer.give), giveQty = number(offer.giveQty), available = M.stockAt(state.market, location.id, offer.receive), receiveQty = number(offer.receiveQty);
      const canExchange = held >= giveQty && available >= receiveQty;
      const shortage = compact ? '' : held < giveQty ? ` · ${give.labelZh} ${held}/${giveQty}` : available < receiveQty ? ` · ${receive.labelZh} ${available}/${receiveQty}` : '';
      buttons.push(`<button type="button" data-market-action="exchange" data-location="${location.id}" ${enabledAttr(canExchange)}>交換 ${give.labelZh} → ${receive.labelZh}${shortage}</button>`);
    }

    if (location.allowTake && M.decisionRequirementMet(location.takeRequiresDecision, state.market)) {
      for (const [item, qty] of Object.entries(locState.stock || {})) {
        const need = M.needAt(cfg, location.id, item);
        if (number(qty) <= 0 || (need > 0 && number(qty) <= need)) continue;
        const meta = itemCfg(cfg, item);
        buttons.push(`<button type="button" data-market-action="take" data-location="${location.id}" data-item="${item}" ${enabledAttr(true)}>拿 ${meta.labelZh}${compact ? '' : ' ×1'}</button>`);
      }
    }

    if (location.allowPut) {
      for (const [item, qty] of Object.entries(state.market.inventory || {})) {
        if (number(qty) <= 0) continue;
        const meta = itemCfg(cfg, item);
        buttons.push(`<button type="button" data-market-action="put" data-location="${location.id}" data-item="${item}" ${enabledAttr(true)}>放 ${meta.labelZh}${compact ? '' : ' ×1'}</button>`);
      }
    }

    const multiple = buttons.length > 1 ? ' market-actions-multiple' : '';
    return buttons.length ? `<div class="market-panel-actions${multiple}">${buttons.join('')}</div>` : '<p class="market-action-hint">지금 여기서 할 수 있는 행동은 없어.</p>';
  }

  function renderPanel(cfg) {
    const focus = locationCfg(cfg, state.market.focus);
    if (current()?.id === 'market-stage-8') return renderM8Panel(cfg, focus);
    return renderMarketDecisionPanel(current(), cfg, focus);
  }

  const wasInspected = location => !!location && (state.market.inspected || []).includes(location.id);
  const decisionLabel = (label, value, reason = '') => `<span class="market-decision-label" lang="zh-Hant">${label}</span><strong lang="zh-Hant">${value}</strong>${reason}`;
  const proximityReason = adjacent => adjacent ? '' : '<small class="market-decision-reason">인접 필요</small>';

  function needDecisionSummary(cfg, location, adjacent) {
    const entries = Object.entries(location.needs || {});
    if (!entries.length) return '';
    const values = entries.map(([item, need]) => {
      const meta = itemCfg(cfg, item), stock = M.stockAt(state.market, location.id, item);
      if (entries.length === 1) {
        const shortage = Math.max(0, number(need) - stock);
        return `${meta.labelZh} · ${shortage ? `不足 ×${shortage}` : '足夠'}`;
      }
      return `${meta.labelZh} ${stock}/${number(need)}`;
    });
    return decisionLabel('需求', values.join('　'), proximityReason(adjacent));
  }

  function stockDecisionSummary(cfg, location, adjacent) {
    const stocks = Object.entries(state.market.locations[location.id]?.stock || {})
      .filter(([, qty]) => number(qty) > 0)
      .map(([item, qty]) => `${itemCfg(cfg, item).labelZh} ×${number(qty)}`);
    return decisionLabel(location.stockLabelZh || '現在', stocks.join('　') || '沒有貨', proximityReason(adjacent));
  }

  function marketDecisionSummary(stage, cfg, location, adjacent) {
    if (!location) return '';
    const stageId = stage?.id;

    if (stageId === 'market-stage-2' && location.id === 'merchant') {
      const confirmed = !!state.market.flags?.remainingConfirmed;
      const formula = (cfg.remainingInference?.items || []).map(item => {
        const meta = itemCfg(cfg, item);
        const factQty = label => {
          const fact = (location.facts || []).find(row => row.labelZh === label && row.textZh.startsWith(meta.labelZh));
          return number(fact?.textZh.match(/×\s*(\d+)/)?.[1]);
        };
        const left = factQty('原來數量'), sent = factQty('已送出');
        const result = confirmed ? M.stockAt(state.market, location.id, item) : '?';
        return `${meta.labelZh} ${left}−${sent}=${result}`;
      }).join('　');
      return decisionLabel('數量', formula, proximityReason(adjacent));
    }

    if (location.exchange) {
      const offer = location.exchange, give = itemCfg(cfg, offer.give), receive = itemCfg(cfg, offer.receive);
      const held = getQty(state.market.inventory, offer.give), available = M.stockAt(state.market, location.id, offer.receive);
      let reason = proximityReason(adjacent);
      if (adjacent && held < number(offer.giveQty)) reason = `<small class="market-decision-reason" lang="zh-Hant">${give.labelZh} ${held}/${number(offer.giveQty)}</small>`;
      else if (adjacent && available < number(offer.receiveQty)) reason = `<small class="market-decision-reason" lang="zh-Hant">${receive.labelZh} ${available}/${number(offer.receiveQty)}</small>`;
      return decisionLabel('交換', `${give.labelZh} ×${number(offer.giveQty)} → ${receive.labelZh} ×${number(offer.receiveQty)}`, reason);
    }

    if (location.sell) {
      const meta = itemCfg(cfg, location.sell.item);
      if (stageId === 'market-stage-4') {
        const sellers = cfgLocations(cfg).filter(candidate => candidate.sell);
        const seen = sellers.filter(wasInspected).length;
        return decisionLabel('價格', `已查看 ${seen}/${sellers.length}`, proximityReason(adjacent));
      }
      const locked = location.sell.requires && !M.conditionMet(location.sell.requires, state.market, cfg);
      return decisionLabel('價格', `${meta.labelZh} · ${number(location.sell.price)}`, locked ? '<small class="market-decision-reason">가격 비교 전</small>' : proximityReason(adjacent));
    }

    if (location.choose) {
      const option = location.choose, choice = state.market.decisions?.[option.decisionKey || 'choice'];
      if (stageId === 'market-stage-5') {
        const tools = cfgLocations(cfg).filter(candidate => candidate.choose);
        const seen = tools.filter(wasInspected).length;
        const comparison = seen === tools.length ? '兩個都能完成' : `已查看 ${seen}/${tools.length}`;
        return decisionLabel('價值', comparison, proximityReason(adjacent));
      }
      if (stageId === 'market-stage-6') {
        return decisionLabel(choice === undefined ? '選擇' : '放棄', choice === undefined ? '一件先送' : '另一件下一趟', proximityReason(adjacent));
      }
      const status = choice === option.value ? ' · 先送' : choice === undefined ? '' : ' · 放棄';
      return decisionLabel('選擇', `${location.labelZh}${status}`, proximityReason(adjacent));
    }

    return needDecisionSummary(cfg, location, adjacent) || stockDecisionSummary(cfg, location, adjacent);
  }

  function supplementCard(label, explanation, icon = '') {
    return `<article class="market-supplement-card"><span class="market-supplement-icon" aria-hidden="true">${icon}</span><strong lang="zh-Hant">${label}</strong><span>${explanation}</span></article>`;
  }

  function priceSupplementCards(cfg) {
    return cfgLocations(cfg).filter(location => location.sell).map(location => {
      const price = wasInspected(location) ? number(location.sell.price) : '?';
      return supplementCard(`${itemCfg(cfg, location.sell.item).labelZh} · ${price}`, wasInspected(location) ? '已查看' : '未查看', location.icon);
    }).join('');
  }

  function toolSupplementCards(cfg) {
    return cfgLocations(cfg).filter(location => location.choose).map(location => {
      const option = location.choose, known = wasInspected(location);
      const choice = state.market.decisions?.[option.decisionKey || 'choice'];
      const selected = choice === option.value ? ' · 已選擇' : '';
      const facts = known ? `價格 ${number(option.cost)} · 容量 ${number(option.capacity)}${selected}` : '價格／容量 ?';
      return supplementCard(location.labelZh, facts, location.icon);
    }).join('');
  }

  function distributionSupplementCards(cfg, focus) {
    const ids = ['bakery', 'warehouse', 'noodle-stall', 'oil-stall'];
    return ids.map(id => locationCfg(cfg, id)).filter(location => location && location.id !== focus?.id).map(location => {
      const [item, need] = Object.entries(location.needs || {})[0] || [];
      const value = item ? `${itemCfg(cfg, item).labelZh} ${M.stockAt(state.market, location.id, item)}/${number(need)}` : '沒有需求';
      return supplementCard(location.labelZh, `需求 · ${value}`, location.icon);
    }).join('');
  }

  function marketSupplementCards(stage, cfg, focus) {
    switch (stage?.id) {
      case 'market-stage-4': return priceSupplementCards(cfg);
      case 'market-stage-5': return toolSupplementCards(cfg);
      case 'market-stage-7': return distributionSupplementCards(cfg, focus);
      default: return '';
    }
  }

  function renderMarketDecisionPanel(stage, cfg, focus) {
    const adjacent = focus && dist(state.hero, focus.pos) === 1;
    const supplements = marketSupplementCards(stage, cfg, focus);
    const target = focus
      ? `<span class="market-decision-icon" aria-hidden="true">${focus.icon || '📦'}</span><span aria-label="${focus.labelKo}, ${focus.labelZh}"><strong lang="zh-Hant">${focus.labelZh}</strong></span>`
      : '<span class="market-decision-icon" aria-hidden="true">↔</span><span><strong lang="zh-Hant">選一個地方</strong></span>';
    const action = focus
      ? actionButtons(cfg, focus, adjacent, { compact: true, keepDistant: true, omitPrice: stage.id === 'market-stage-4' })
      : '<p class="market-action-hint">판의 사람이나 좌판을 눌러봐.</p>';
    return `<section class="market-panel market-decision-panel market-decision-${stage.id} ${supplements ? '' : 'market-decision-lean'} ${focus ? '' : 'market-panel-empty'}" ${focus ? `data-focus="${focus.id}"` : ''}>
      <div class="market-decision-top"><div class="market-carry">${inventoryMarkup(cfg)}</div></div>
      <div class="market-decision-main"><div class="market-decision-target">${target}</div><div class="market-decision-summary">${marketDecisionSummary(stage, cfg, focus, adjacent)}</div></div>
      <div class="market-decision-actions"><div class="market-decision-undo-slot"></div><div class="market-decision-action">${action}</div></div>
      ${supplements ? `<div class="market-supplement-rail" role="region" aria-label="비교 정보, 좌우로 스크롤 가능" tabindex="0">${supplements}</div>` : ''}
    </section>`;
  }

  function m8Summary(cfg, location) {
    if (!location) return '<strong lang="zh-Hant">選一個地方</strong>';
    const locState = state.market.locations[location.id];
    const needs = Object.entries(location.needs || {}).map(([item, need]) => `${itemCfg(cfg, item).labelZh} ${getQty(locState.stock, item)}/${need}`);
    const stock = Object.entries(locState.stock || {}).filter(([, qty]) => number(qty) > 0).map(([item, qty]) => `${itemCfg(cfg, item).labelZh} ×${qty}`);
    return `<strong lang="zh-Hant">${location.labelZh} · ${(needs.length ? needs : stock).join('　') || '沒有貨'}</strong>`;
  }

  function renderM8Panel(cfg, focus) {
    const adjacent = focus && dist(state.hero, focus.pos) === 1;
    const action = focus
      ? actionButtons(cfg, focus, adjacent, { compact: true, keepDistant: true })
      : '<p class="market-action-hint">대상을 눌러 수량을 확인해.</p>';
    return `<section class="market-panel market-m8-compact ${focus ? '' : 'market-panel-empty'}" ${focus ? `data-focus="${focus.id}"` : ''}>
      <div class="market-m8-meta">
        <div class="market-carry">${inventoryMarkup(cfg)}</div>
        <div class="market-m8-summary"><span aria-hidden="true">${focus?.icon || '📦'}</span>${m8Summary(cfg, focus)}</div>
      </div>
      <button class="market-m8-detail" type="button" data-market-detail="true" aria-label="장터 대상과 규칙 자세히 보기">상세</button>
      <div class="market-m8-actions"><div class="market-decision-undo-slot"></div><div class="market-decision-action">${action}</div></div>
    </section>`;
  }

  function openM8Detail() {
    const cfg = cfgFor(current()), focus = locationCfg(cfg, state.market.focus);
    const title = focus ? `${focus.labelZh} · ${focus.labelKo}` : '장터 수량과 규칙';
    const body = focus ? `${factRows(focus)}${commerceRows(cfg, focus)}<div class="market-info-list">${needRows(cfg, focus)}</div>` : '<p>각 대상을 누르면 필요한 중국어 품목과 수량이 기본 화면에 표시돼. 가까이 가면 행동할 수 있어.</p>';
    openSheet(`<h2>${title}</h2><div class="example">${body}</div><div class="gamerule">${current().rule || ''}</div><div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>`);
  }

  function renderMapCell(stage, cfg, r, c) {
    const pos = [r, c], location = marketLocationAt(cfg, pos), heroHere = coordKey(state.hero) === coordKey(pos);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'market-cell';
    button.dataset.row = String(r); button.dataset.col = String(c);
    if (location) {
      const inspected = (state.market.inspected || []).includes(location.id);
      const choice = M.choiceState(location, state.market);
      button.classList.add('market-location');
      if (location.kind) button.classList.add(`market-${location.kind}`);
      if (inspected) button.classList.add('inspected');
      if (choice === 'deferred') {
        button.classList.add('market-deferred');
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      }
      if (state.market.focus === location.id) button.classList.add('focused');
      if (choice !== 'deferred') button.classList.add('interactable');
      button.setAttribute('aria-label', `${location.labelKo}, ${location.labelZh}${choice === 'deferred' ? ', 이번에는 미루고 다음 차례' : ''}`);
      button.innerHTML = `<span class="market-location-icon" aria-hidden="true">${location.icon || '📦'}</span><small lang="zh-Hant">${location.labelZh}</small>${choice === 'deferred' ? '<span class="market-deferred-tag" aria-hidden="true">放棄</span>' : ''}`;
    } else {
      button.classList.add('market-floor');
      const moveable = dist(state.hero, pos) === 1;
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
    document.querySelectorAll('[data-market-detail]').forEach(button => button.addEventListener('click', openM8Detail));
  }

  function restoreMarketUndoControl() {
    const controls = $('.controls'), undo = $('#undoBtn');
    if (controls && undo && undo.parentElement !== controls) controls.append(undo);
    controls?.classList.remove('market-controls-embedded');
  }

  const baseRender = render;
  render = function marketRender() {
    const stage = current(), cfg = cfgFor(stage);
    if (!cfg) {
      restoreMarketUndoControl();
      gridEl.classList.remove('market-board');
      gridEl.removeAttribute('data-market-stage');
      $('#inspectBtn').hidden = false;
      return baseRender();
    }
    restoreMarketUndoControl();

    ensureMarketState();
    $('#stageKicker').textContent = stage.kicker || '1장 · 장터';
    $('#stageTitle').textContent = stage.subtitle;
    renderMarketGoal(stage);
    gridEl.style.gridTemplateColumns = '';
    gridEl.className = 'grid market-board';
    gridEl.dataset.marketStage = stage.id;
    gridEl.setAttribute('role', 'group');
    gridEl.setAttribute('aria-label', cfg.boardLabel || '장터 자원판');

    const scene = document.createElement('div');
    scene.className = 'market-scene';
    const map = document.createElement('div');
    map.className = 'market-grid';
    if (stage.grid[0].length >= 6) map.classList.add('market-grid-wide');
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
    $('#inspectBtn').hidden = true;
    $('#undoBtn').hidden = false;
    $('#undoBtn').disabled = !history.length;
    const slot = gridEl.querySelector('.market-decision-undo-slot');
    const undo = $('#undoBtn');
    if (slot && undo) {
      slot.append(undo);
      controls.classList.add('market-controls-embedded');
    } else {
      controls.classList.remove('market-controls-embedded');
      controls.style.gridTemplateColumns = '1fr';
    }
  };

  function marketTap(pos) {
    const stage = current(), cfg = cfgFor(stage);
    if (!cfg || screen !== 'tutorial' || isWin()) return;
    ensureMarketState();
    const location = marketLocationAt(cfg, pos);
    if (location) {
      if (M.choiceState(location, state.market) === 'deferred') {
        setStatus('這一趟先放棄。 이번에는 미뤘어. 다음 차례에 다시 가져오면 돼.', 'info');
        return;
      }
      const result = M.inspectLocation(cfg, state.market, location.id);
      state.market = result.state;
      save(); render();
      if (stage.id !== 'market-stage-8') setStatus('');
      else setStatus(`${location.labelZh} — ${location.labelKo}의 현재 상태를 확인했어.`, 'info');
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
        'choice-required': '먼저 이번에 사용할 도구나 가져갈 물건을 선택해야 해.',
        'choice-locked': '이미 이번 선택을 정했어. 바꾸려면 되돌리기를 사용해.',
        'choice-requires': '두 선택지를 먼저 모두 살펴봐야 해.',
        'needed-here': '這裡剛好需要這些。 여기는 지금 필요한 만큼만 있어서 가져갈 수 없어.',
        'need-filled': '這裡已經足夠了。 여기는 필요한 만큼 다 채웠어. 남는 물건은 원래 짐에 남겨두거나 다른 필요한 곳을 확인해봐.',
        empty: '여기에는 지금 가져갈 물건이 없어.',
        'wrong-destination': '這裡需要的不是這個。 이 물건은 여기서 필요한 물건이 아니야.',
        'missing-give': '교환하려면 먼저 상대가 원하는 물건을 가지고 있어야 해.',
        'missing-receive': '상대에게 지금 교환해 줄 물건이 없어.',
        'insufficient-coins': '錢幣不夠。 가진 돈으로는 지금 이 선택을 할 수 없어.',
        'sold-out': '這個已經賣完了。 이 좌판에는 지금 살 수 있는 물건이 남아 있지 않아.',
        'no-sale': '여기서는 물건을 팔고 있지 않아.',
        'no-choice': '여기서는 선택할 수 있는 것이 없어.'
      })[result.reason] || '지금은 그 행동을 할 수 없어.';
    }
    if (solved && cfg.feedback?.solved) return cfg.feedback.solved;
    if (result.reason === 'chosen') {
      const location = locationCfg(cfg, result.location);
      if (result.deferredValue) {
        const deferred = itemCfg(cfg, result.deferredValue);
        return `選擇了${location.labelZh}先送。${deferred.labelZh}這一趟先放棄，留到下一趟。 이번에는 ${location.labelKo}을 먼저 보내고 ${deferred.labelKo}은 다음 차례로 미뤘어.`;
      }
      const capacityText = result.capacity != null ? ` 一次可以帶 ${number(result.capacity)} 件。` : '';
      const coinText = Object.prototype.hasOwnProperty.call(cfg || {}, 'coins') ? ` 剩下錢幣 ${result.state.coins}。` : '';
      return `選擇了${location.labelZh}。${capacityText}${coinText} ${location.labelKo}을 선택했어.`;
    }
    if (result.reason === 'exchanged') {
      return `交換完成。你獲得了${itemCfg(cfg, result.receive).labelZh}。 교환이 끝났어. ${itemCfg(cfg, result.receive).labelKo}을 얻었어.`;
    }
    if (result.reason === 'bought') {
      const meta = itemCfg(cfg, result.item);
      return `攤主賣出${meta.labelZh}，你買了${meta.labelZh}。價格 ${result.total}。 좌판은 ${meta.labelKo}을 팔았고, 소년은 샀어. 남은 돈은 ${result.state.coins}이야.`;
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
    const location = locationCfg(cfg, action?.location);
    if (!location || dist(state.hero, location.pos) !== 1) {
      setStatus('물건을 주고받거나 선택하려면 그 장소 가까이 가야 해.', 'info');
      return;
    }
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
      stageOutcome(id) {
        const stage = STAGES.find(item => item.id === id);
        const cfg = cfgFor(stage);
        if (cfg?.outcomeDecisions && current()?.id === id && state?.market) {
          const outcome = {};
          for (const [outputKey, decisionKey] of Object.entries(cfg.outcomeDecisions)) {
            const value = state.market.decisions?.[decisionKey];
            if (typeof value === 'string' || typeof value === 'boolean' || Number.isFinite(value)) outcome[outputKey] = value;
          }
          if (Object.keys(outcome).length) return outcome;
        }
        return baseAdapter.stageOutcome?.(id) || null;
      },
      resumeStage(id, options = {}) {
        const ok = baseAdapter.resumeStage(id, options);
        if (ok && cfgFor(current())) setStatus('');
        return ok;
      }
    });
  }
})();
