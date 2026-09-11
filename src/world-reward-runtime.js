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
  const hasReward = reward => Array.isArray(progress().seenStories) && progress().seenStories.includes(reward.storyId);

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

  const map = document.getElementById('worldRegions');
  if (map) new MutationObserver(syncWorldRewards).observe(map, { childList: true, subtree: true });
  window.addEventListener('pageshow', syncWorldRewards);
  setTimeout(syncWorldRewards, 0);

  globalThis.WorldRewards = Object.freeze({ REWARDS, syncWorldRewards });
})();
