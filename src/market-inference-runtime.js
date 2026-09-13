/* First-use scaffold for market information concepts.
 * M2 hides the already-computed remaining stock until the player has read
 * 原來數量 / 已送出 and explicitly confirms what 剩下 means. Later stages
 * keep the normal market UI and show current quantities immediately.
 */
(() => {
  const inferenceFor = stage => stage?.market?.remainingInference || null;
  const inferenceFlag = cfg => cfg?.flag || 'remainingConfirmed';
  const isConfirmed = (cfg, marketState) => !cfg || !!marketState?.flags?.[inferenceFlag(cfg)];
  const appliesToLocation = (stage, locationId) => inferenceFor(stage)?.location === locationId;
  const shouldHideStock = (stage, marketState, locationId) => {
    const cfg = inferenceFor(stage);
    return !!cfg && appliesToLocation(stage, locationId) && !isConfirmed(cfg, marketState);
  };

  globalThis.MarketInferenceMechanic = Object.freeze({
    inferenceFor,
    inferenceFlag,
    isConfirmed,
    appliesToLocation,
    shouldHideStock
  });

  if (typeof document === 'undefined' || typeof current !== 'function' || typeof render !== 'function') return;

  const locationFor = (stage, id) => (stage?.market?.locations || []).find(location => location.id === id) || null;
  const itemMeta = (stage, item) => stage?.market?.items?.[item] || { labelZh: item, labelKo: item };
  const quantityAt = (locationId, item) => Number(state?.market?.locations?.[locationId]?.stock?.[item] || 0);

  function remainingRows(stage, cfg, confirmed) {
    const items = Array.isArray(cfg.items) ? cfg.items : [];
    return items.map(item => {
      const meta = itemMeta(stage, item);
      const value = confirmed ? `×${quantityAt(cfg.location, item)}` : '？';
      const note = confirmed ? meta.labelKo : (cfg.hiddenHintKo || '원래 수량과 이미 보낸 수량을 비교해봐.');
      return `<div class="market-info-row market-inference-row"><span>${cfg.labelZh || '剩下'}</span><strong lang="zh-Hant">${meta.labelZh} ${value}</strong><small>${note}</small></div>`;
    }).join('');
  }

  function hideBoardQuantity(stage, cfg, confirmed) {
    if (confirmed) return;
    const location = locationFor(stage, cfg.location);
    if (!location) return;
    const cell = gridEl.querySelector(`.market-cell[data-row="${location.pos[0]}"][data-col="${location.pos[1]}"]`);
    if (!cell) return;
    cell.querySelectorAll('.market-stock-badge').forEach(node => node.remove());
    cell.classList.remove('market-stock-source', 'market-stock-full', 'market-stock-short');
    cell.setAttribute('aria-label', `${location.labelKo}, ${location.labelZh}`);
  }

  function confirmRemaining(stage, cfg) {
    if (!state?.market || isConfirmed(cfg, state.market)) return;
    const location = locationFor(stage, cfg.location);
    if (!location || dist(state.hero, location.pos) !== 1) {
      setStatus('아주머니 가까이에서 원래 수량과 이미 보낸 수량을 다시 확인해봐.', 'info');
      return;
    }
    history.push(clone(state));
    state.market.flags = state.market.flags || {};
    state.market.flags[inferenceFlag(cfg)] = true;
    state.turn++;
    save();
    render();
    setStatus(cfg.confirmStatus || '原來的數量減去已送出的數量，就是現在剩下的數量。 원래 수량에서 이미 보낸 수량을 빼면 지금 남은 수량이 보여.', 'good');
  }

  function applyInferenceUI() {
    const stage = current(), cfg = inferenceFor(stage);
    if (!cfg || !state?.market || !gridEl.classList.contains('market-board')) return;
    const confirmed = isConfirmed(cfg, state.market);
    hideBoardQuantity(stage, cfg, confirmed);

    const panel = gridEl.querySelector(`.market-panel[data-focus="${cfg.location}"]`);
    if (!panel) return;
    const infoList = panel.querySelector('.market-info-list');
    if (infoList) infoList.innerHTML = remainingRows(stage, cfg, confirmed);
    if (confirmed) return;

    const location = locationFor(stage, cfg.location);
    const adjacent = !!location && dist(state.hero, location.pos) === 1;
    const actions = panel.querySelector('.market-panel-actions');
    const hint = panel.querySelector('.market-action-hint');
    if (!adjacent) {
      if (actions) actions.remove();
      return;
    }

    const html = `<div class="market-panel-actions market-inference-actions"><button type="button" data-market-inference-confirm>${cfg.confirmLabelZh || '確認剩下'} · ${cfg.confirmLabelKo || '남은 수량 확인하기'}</button></div>`;
    if (actions) actions.outerHTML = html;
    else if (hint) hint.outerHTML = html;
    else panel.insertAdjacentHTML('beforeend', html);
    panel.querySelector('[data-market-inference-confirm]')?.addEventListener('click', event => {
      event.stopPropagation();
      confirmRemaining(stage, cfg);
    });
  }

  const baseRender = render;
  render = function marketInferenceRender() {
    const value = baseRender();
    applyInferenceUI();
    return value;
  };

  // market-state-visuals schedules one decoration pass of its own. Run after it
  // as well so a resumed M2 never flashes the hidden quantity as a map badge.
  setTimeout(applyInferenceUI, 0);
})();
