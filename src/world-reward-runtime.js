/* Small persistent world-map reward badges. Rewards appear only after their in-world award story is completed. */
(() => {
  const REWARDS = {
    'gate-town': {
      storyId: 'gate-after-convoy',
      symbol: '🪧',
      nameZh: '貨車引路牌',
      nameKo: '짐수레 길잡이패'
    }
  };

  const progress = () => globalThis.GameFlow?.progress?.() || {};
  const hasReward = (reward, progressValue = progress()) =>
    Array.isArray(progressValue?.seenStories) && progressValue.seenStories.includes(reward.storyId);
  const earnedRewardsForRegion = (regionId, progressValue = progress()) => {
    const reward = REWARDS[regionId];
    return reward && hasReward(reward, progressValue) ? [{ regionId, ...reward }] : [];
  };

  function syncWorldRewards() {
    const map = document.getElementById('worldRegions');
    if (!map) return;

    Object.entries(REWARDS).forEach(([regionId, reward]) => {
      const card = map.querySelector(`.regionCard[data-region-id="${regionId}"]`);
      if (!card) return;
      const wrap = card.querySelector('.regionIconWrap');
      if (!wrap) return;

      const earned = hasReward(reward);
      let badge = wrap.querySelector('.regionRewardBadge');
      if (earned && !badge) {
        badge = document.createElement('span');
        badge.className = 'regionRewardBadge';
        badge.textContent = reward.symbol;
        badge.title = `${reward.nameZh} · ${reward.nameKo}`;
        badge.setAttribute('aria-hidden', 'true');
        wrap.appendChild(badge);
      } else if (!earned && badge) {
        badge.remove();
      }

      card.classList.toggle('has-region-reward', earned);
      const plainLabel = (card.dataset.baseAriaLabel || card.getAttribute('aria-label') || '').replace(/\s*보유:.*$/, '').trim();
      if (!card.dataset.baseAriaLabel && plainLabel) card.dataset.baseAriaLabel = plainLabel;
      card.setAttribute('aria-label', earned ? `${plainLabel} 보유: ${reward.nameKo}.` : plainLabel);
    });
  }

  function syncRewardDetails() {
    const map = document.getElementById('worldRegions');
    const sheet = document.getElementById('sheet');
    if (!map || !sheet) return;

    const existing = sheet.querySelector('.worldRewardDetail');
    const isRegionSheet = !!sheet.querySelector('.regionSheetNameZh');
    if (!isRegionSheet) {
      existing?.remove();
      return;
    }

    const selected = map.querySelector('.regionCard.selected');
    const rewards = earnedRewardsForRegion(selected?.dataset.regionId || '');
    if (!rewards.length) {
      existing?.remove();
      return;
    }

    const detail = existing || document.createElement('div');
    detail.className = 'worldRewardDetail';
    detail.setAttribute('aria-label', '받은 증표');
    detail.replaceChildren();

    const heading = document.createElement('strong');
    heading.className = 'worldRewardDetailTitle';
    heading.textContent = '받은 증표';
    detail.appendChild(heading);

    rewards.forEach(reward => {
      const item = document.createElement('div');
      item.className = 'worldRewardDetailItem';

      const symbol = document.createElement('span');
      symbol.className = 'worldRewardDetailSymbol';
      symbol.textContent = reward.symbol;
      symbol.setAttribute('aria-hidden', 'true');

      const names = document.createElement('span');
      names.className = 'worldRewardDetailNames';
      const zh = document.createElement('b');
      zh.lang = 'zh-Hant';
      zh.textContent = reward.nameZh;
      const ko = document.createElement('small');
      ko.textContent = `${reward.nameKo}를 받았어.`;
      names.append(zh, ko);
      item.append(symbol, names);
      detail.appendChild(item);
    });

    const actions = sheet.querySelector('.sheetactions');
    if (!existing) {
      if (actions) sheet.insertBefore(detail, actions);
      else sheet.appendChild(detail);
    }
  }

  const map = document.getElementById('worldRegions');
  const sheet = document.getElementById('sheet');
  if (map) new MutationObserver(() => {
    syncWorldRewards();
    syncRewardDetails();
  }).observe(map, { childList: true, subtree: true });
  if (sheet) new MutationObserver(syncRewardDetails).observe(sheet, { childList: true });
  window.addEventListener('pageshow', () => {
    syncWorldRewards();
    syncRewardDetails();
  });
  setTimeout(() => {
    syncWorldRewards();
    syncRewardDetails();
  }, 0);

  globalThis.WorldRewards = Object.freeze({ REWARDS, hasReward, earnedRewardsForRegion, syncWorldRewards, syncRewardDetails });
})();
