/* Persistent on-board resource state after a location has been inspected. */
(() => {
  if (typeof document === 'undefined' || typeof render !== 'function' || !globalThis.MarketMechanic) return;

  const M = globalThis.MarketMechanic;
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  let previousStageId = null;
  let previousStocks = null;

  const cfgLocations = cfg => Array.isArray(cfg?.locations) ? cfg.locations : [];
  const stockFor = id => ({ ...(state?.market?.locations?.[id]?.stock || {}) });
  const stockTotal = record => Object.values(record || {}).reduce((sum, qty) => sum + number(qty), 0);
  const stockKey = record => JSON.stringify(Object.fromEntries(Object.entries(record || {}).sort(([a], [b]) => a.localeCompare(b))));
  const stockSnapshot = cfg => Object.fromEntries(cfgLocations(cfg).map(location => [location.id, stockFor(location.id)]));
  const cellFor = location => gridEl.querySelector(`.market-cell[data-row="${location.pos[0]}"][data-col="${location.pos[1]}"]`);

  function needState(cfg, location) {
    const needs = Object.entries(location.needs || {});
    if (!needs.length) return null;
    let current = 0;
    let required = 0;
    let shortage = 0;
    let sufficient = true;
    for (const [item, needValue] of needs) {
      const need = number(needValue);
      const stock = M.stockAt(state.market, location.id, item);
      current += stock;
      required += need;
      shortage += Math.max(0, need - stock);
      if (stock < need) sufficient = false;
    }
    return { current, required, shortage, sufficient };
  }

  function badgeFor(cfg, location) {
    const inspected = (state.market.inspected || []).includes(location.id);
    if (!inspected) return null;

    const need = needState(cfg, location);
    if (need) {
      return {
        text: `${need.current}/${need.required}`,
        className: need.sufficient ? 'market-stock-full' : 'market-stock-short',
        aria: need.sufficient
          ? `현재 ${need.current}, 필요 ${need.required}, 충분`
          : `현재 ${need.current}, 필요 ${need.required}, 부족 ${need.shortage}`
      };
    }

    const stock = stockFor(location.id);
    const hasStockMeaning = Object.keys(stock).length > 0 || location.allowTake || location.sell || location.exchange;
    if (!hasStockMeaning) return null;
    const total = stockTotal(stock);
    return { text: `×${total}`, className: 'market-stock-source', aria: `남은 물건 ${total}` };
  }

  function changedLocations(cfg, nextStocks) {
    const result = new Map();
    if (previousStageId !== current().id || !previousStocks) return result;
    for (const location of cfgLocations(cfg)) {
      const before = previousStocks[location.id] || {};
      const after = nextStocks[location.id] || {};
      if (stockKey(before) === stockKey(after)) continue;
      const beforeTotal = stockTotal(before);
      const afterTotal = stockTotal(after);
      result.set(location.id, afterTotal > beforeTotal ? 'up' : afterTotal < beforeTotal ? 'down' : 'changed');
    }
    return result;
  }

  function decorateMarketState() {
    const stage = current();
    const cfg = stage?.market;
    if (!cfg || !state?.market || !gridEl.classList.contains('market-board')) {
      previousStageId = null;
      previousStocks = null;
      return;
    }

    const nextStocks = stockSnapshot(cfg);
    const changes = changedLocations(cfg, nextStocks);

    for (const location of cfgLocations(cfg)) {
      const cell = cellFor(location);
      if (!cell) continue;
      const badge = badgeFor(cfg, location);
      if (badge) {
        cell.classList.add(badge.className);
        const marker = document.createElement('span');
        marker.className = 'market-stock-badge';
        marker.textContent = badge.text;
        marker.setAttribute('aria-hidden', 'true');
        cell.append(marker);
        const baseLabel = cell.getAttribute('aria-label') || `${location.labelKo}, ${location.labelZh}`;
        cell.setAttribute('aria-label', `${baseLabel}, ${badge.aria}`);
      }

      const direction = changes.get(location.id);
      if (direction) {
        cell.classList.add('market-resource-changed', `market-resource-${direction}`);
      }
    }

    previousStageId = stage.id;
    previousStocks = nextStocks;
  }

  const baseRender = render;
  render = function marketStateVisualRender() {
    const value = baseRender();
    decorateMarketState();
    return value;
  };

  setTimeout(decorateMarketState, 0);
  globalThis.MarketStateVisuals = Object.freeze({ decorateMarketState, needState });
})();
