/* Market learning scaffolds and difficulty balance.
 * M2 hides the already-computed remaining stock until the player has read
 * 原來數量 / 已送出 and explicitly confirms what 剩下 means.
 * M4 makes price comparison matter before buying.
 * M7 removes automatic overfill protection so exact distribution is the
 * player's responsibility. Later stages keep normal quantity visibility.
 */
(() => {
  function applyDifficultyBalance() {
    if (typeof STAGES === 'undefined') return;

    const m4 = STAGES.find(stage => stage.id === 'market-stage-4');
    if (m4?.market) {
      const priceCheck = { type: 'inspected-all', locations: ['vegetable-stall', 'bread-shop', 'bread-shop-premium'] };
      m4.rule = '먼저 세 좌판의 가격(價格)을 비교해. 같은 거래는 소년에게는 買, 상인에게는 賣야.';
      m4.market.revision = 2;
      m4.market.boardLabel = '가격이 다른 세 좌판과 여관 주인';
      m4.market.capacity = 2;
      m4.market.coins = 8;
      m4.market.startStatus = '錢幣有八個。先看完三個攤子的價格，再決定怎麼買。 동전은 8개야. 세 좌판의 가격을 모두 본 뒤 무엇을 살지 정해봐.';
      m4.market.locations = [
        {
          id: 'vegetable-stall', labelZh: '菜攤', labelKo: '채소 좌판', icon: '🥬', pos: [0, 0],
          stock: { vegetable: 1 }, sell: { item: 'vegetable', price: 3, requires: priceCheck }
        },
        {
          id: 'bread-shop', labelZh: '平價麵包攤', labelKo: '빵 좌판', icon: '🥖', pos: [0, 4],
          stock: { bread: 1 }, sell: { item: 'bread', price: 4, requires: priceCheck }
        },
        {
          id: 'bread-shop-premium', labelZh: '另一家麵包攤', labelKo: '다른 빵 좌판', icon: '🥐', pos: [4, 4],
          stock: { bread: 1 }, sell: { item: 'bread', price: 6, requires: priceCheck }
        },
        {
          id: 'innkeeper', kind: 'npc', labelZh: '客棧主人', labelKo: '여관 주인', icon: '🧑', pos: [4, 0],
          stock: { vegetable: 0, bread: 0 }, needs: { vegetable: 1, bread: 1 }, allowPut: true, accepts: ['vegetable', 'bread']
        }
      ];
      m4.market.predicates = [
        priceCheck,
        { type: 'location-at-least', location: 'innkeeper', item: 'vegetable', amount: 1 },
        { type: 'location-at-least', location: 'innkeeper', item: 'bread', amount: 1 }
      ];
      m4.market.goalMarks = [
        { word: '價格', ...priceCheck },
        { word: '買', type: 'flag', flag: 'bought', eq: true },
        { word: '賣', type: 'flag', flag: 'sold', eq: true }
      ];
    }

    const m7 = STAGES.find(stage => stage.id === 'market-stage-7');
    if (m7?.market) {
      m7.rule = '현재 수량과 필요 수량을 보고 정확히 補充해. 너무 많이 넣었다면 초과분을 다시 가져와 다른 곳에 分配할 수 있어.';
      m7.story = '밀가루는 두 곳에 필요한 만큼 나누어 보내고, 등잔기름과 천도 제자리에 채웠다. 쓰지 않은 밀가루 한 자루는 늦게 온 짐에 그대로 남았다.';
      m7.market.revision = 5;
      m7.market.boardLabel = '같은 밀가루를 두 곳에 나누고 다른 물건도 맞춰 보내는 장터';
      m7.market.capacity = 3;
      m7.market.startStatus = '先看需求和現在數量。麵粉要分到兩個地方，還有一袋要剩下。 먼저 각 장소의 필요량과 현재 수량을 확인해. 밀가루는 두 곳에 나눠 보내고 한 자루는 남아야 해.';
      m7.market.locations = [
        {
          id: 'bakery', labelZh: '麵包坊', labelKo: '빵집', icon: '🥖', pos: [0, 0],
          stock: { flour: 1 }, needs: { flour: 3 }, allowTake: true, allowPut: true, accepts: ['flour']
        },
        {
          id: 'noodle-stall', labelZh: '麵攤', labelKo: '국수 좌판', icon: '🍜', pos: [0, 5],
          stock: { flour: 1 }, needs: { flour: 2 }, allowTake: true, allowPut: true, accepts: ['flour']
        },
        {
          id: 'late-goods', labelZh: '晚到的貨', labelKo: '늦게 온 짐', icon: '📦', pos: [2, 3],
          stock: { flour: 4, oil: 3, cloth: 1 }, allowTake: true, allowPut: true,
          accepts: ['flour', 'oil', 'cloth'], stockLabelZh: '剩下', stockLabelKo: '현재 남은 것'
        },
        {
          id: 'oil-stall', labelZh: '燈油攤', labelKo: '등잔기름 좌판', icon: '🪔', pos: [4, 0],
          stock: { oil: 1 }, needs: { oil: 4 }, allowTake: true, allowPut: true, accepts: ['oil']
        },
        {
          id: 'warehouse', labelZh: '倉庫', labelKo: '창고', icon: '🏚️', pos: [4, 5],
          stock: { cloth: 0 }, allowPut: true, accepts: ['cloth']
        }
      ];
      const needsRead = { type: 'inspected-all', locations: ['bakery', 'noodle-stall', 'oil-stall'] };
      const flourDistributed = {
        type: 'all', conditions: [
          { type: 'location-equals', location: 'bakery', item: 'flour', amount: 3 },
          { type: 'location-equals', location: 'noodle-stall', item: 'flour', amount: 2 },
          { type: 'location-equals', location: 'late-goods', item: 'flour', amount: 1 }
        ]
      };
      const replenishedExactly = {
        type: 'all', conditions: [
          { type: 'location-equals', location: 'bakery', item: 'flour', amount: 3 },
          { type: 'location-equals', location: 'noodle-stall', item: 'flour', amount: 2 },
          { type: 'location-equals', location: 'oil-stall', item: 'oil', amount: 4 }
        ]
      };
      m7.market.predicates = [
        needsRead,
        { type: 'inspected', location: 'late-goods' },
        { type: 'location-equals', location: 'bakery', item: 'flour', amount: 3 },
        { type: 'location-equals', location: 'noodle-stall', item: 'flour', amount: 2 },
        { type: 'location-equals', location: 'oil-stall', item: 'oil', amount: 4 },
        { type: 'location-equals', location: 'warehouse', item: 'cloth', amount: 1 },
        { type: 'location-equals', location: 'late-goods', item: 'flour', amount: 1 }
      ];
      m7.market.goalMarks = [
        { word: '需求', ...needsRead },
        { word: '數量', type: 'inspected', location: 'late-goods' },
        { word: '剩下', type: 'location-equals', location: 'late-goods', item: 'flour', amount: 1 },
        { word: '補充', ...replenishedExactly },
        { word: '分配', ...flourDistributed }
      ];
      m7.market.feedback = {
        solved: '需要的數量都剛剛好，還有一袋麵粉剩在原處。 각 장소를 정확한 수량으로 채우고, 밀가루 한 자루는 원래 짐에 남겨뒀어.'
      };
    }

    if (typeof JourneyContent !== 'undefined' && JourneyContent?.STORIES) {
      const m4Story = JourneyContent.STORIES['market-m4-setup'];
      if (m4Story) m4Story.beats = [
        { speaker: 'narrator', zh: '少年再走進市集時，客棧主人拿著空籃子，正站在幾個賣菜和麵包的攤子附近。', ko: '소년이 다시 장터로 들어오자, 여관 주인이 빈 바구니를 들고 채소와 빵을 파는 좌판들 근처에 서 있었다.' },
        { speaker: 'innkeeper', zh: '今晚還少一份菜和一個麵包。這八個錢幣給你，可以幫我買回來嗎？', ko: '오늘 저녁에 채소 한 묶음과 빵 하나가 더 필요해. 동전 여덟 개를 줄 테니 대신 사다 줄래?' },
        { speaker: 'innkeeper', zh: '菜只有一攤，麵包有兩攤，價格不一樣。先把三個價格都看清楚再買。', ko: '채소는 한 좌판에서 팔고, 빵은 두 좌판에서 파는데 가격이 서로 달라. 세 곳의 가격을 모두 확인한 뒤 사렴.' },
        { speaker: 'boy', zh: '同樣是麵包，價格也可能不一樣。我要先看完再決定。', ko: '같은 빵이어도 가격이 다를 수 있군요. 먼저 전부 보고 결정할게요.' }
      ];

      const m7Story = JourneyContent.STORIES['market-m7-setup'];
      if (m7Story) m7Story.beats = [
        { speaker: 'narrator', zh: '傍晚前，最後一批晚到的貨終於送進市集。這次主要是麵粉、燈油和布。', ko: '해가 기울기 전, 마지막으로 늦었던 짐이 장터에 들어왔다. 이번에는 주로 밀가루와 등잔기름, 천이었다.' },
        { speaker: 'marketkeeper', zh: '麵包坊和麵攤都缺麵粉，可是缺的數量不一樣。先看需求，再分配。', ko: '빵집과 국수 좌판 모두 밀가루가 부족한데, 부족한 양은 서로 달라. 먼저 필요량을 보고 나누자.' },
        { speaker: 'marketkeeper', zh: '送來的麵粉比缺的還多一袋。不要硬塞進去，該補充的補充，該剩下的就留下。', ko: '도착한 밀가루는 부족한 양보다 한 자루 더 많아. 억지로 다 넣지 말고, 보충할 만큼만 채우고 남을 건 남겨 둬.' },
        { speaker: 'boy', zh: '我先看現在有多少、各處需要多少，再決定每一份送去哪裡。', ko: '현재 몇 개가 있고 각 장소에 몇 개가 필요한지 본 다음, 하나씩 어디로 보낼지 정해볼게요.' }
      ];
    }
  }

  applyDifficultyBalance();

  const inferenceFor = stage => stage?.market?.remainingInference || null;
  const inferenceFlag = cfg => cfg?.flag || 'remainingConfirmed';
  const isConfirmed = (cfg, marketState) => !cfg || !!marketState?.flags?.[inferenceFlag(cfg)];
  const appliesToLocation = (stage, locationId) => inferenceFor(stage)?.location === locationId;
  const shouldHideStock = (stage, marketState, locationId) => {
    const cfg = inferenceFor(stage);
    return !!cfg && appliesToLocation(stage, locationId) && !isConfirmed(cfg, marketState);
  };
  const purchaseUnlocked = (location, marketState, marketCfg) => {
    const requirement = location?.sell?.requires;
    if (!requirement) return true;
    return !!globalThis.MarketMechanic?.conditionMet(requirement, marketState, marketCfg);
  };

  globalThis.MarketInferenceMechanic = Object.freeze({
    inferenceFor,
    inferenceFlag,
    isConfirmed,
    appliesToLocation,
    shouldHideStock
  });
  globalThis.MarketLearningScaffold = Object.freeze({
    applyDifficultyBalance,
    purchaseUnlocked
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
      setStatus('走近阿姨，再確認原來數量和已送出的數量。 아주머니 가까이에서 원래 수량과 이미 보낸 수량을 다시 확인해봐.', 'info');
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

  function applyPurchaseGuardUI() {
    const stage = current(), cfg = stage?.market;
    if (!cfg || !state?.market || !gridEl.classList.contains('market-board')) return;
    for (const location of cfg.locations || []) {
      if (!location?.sell?.requires || purchaseUnlocked(location, state.market, cfg)) continue;
      const button = gridEl.querySelector(`[data-market-action="buy"][data-location="${location.id}"]`);
      if (!button) continue;
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.textContent = '先看完價格 · 가격 비교 후 구매';
    }
  }

  const baseRender = render;
  render = function marketLearningScaffoldRender() {
    const value = baseRender();
    applyInferenceUI();
    applyPurchaseGuardUI();
    return value;
  };

  // market-state-visuals schedules one decoration pass of its own. Run after it
  // as well so a resumed M2 never flashes the hidden quantity as a map badge.
  setTimeout(() => {
    applyInferenceUI();
    applyPurchaseGuardUI();
  }, 0);
})();
