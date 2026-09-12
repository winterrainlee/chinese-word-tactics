/* Small world-map sublocation unlocked by market M4. */
(() => {
  const MILESTONE = 'inn-unlocked';
  const progress = () => globalThis.GameFlow?.progress?.() || {};
  const unlocked = (value = progress()) => Array.isArray(value.completedMilestones) && value.completedMilestones.includes(MILESTONE);

  function openInnSheet() {
    globalThis.TacticalGame?.openSheet?.(`<h2>여관</h2><div class="regionSheetNameZh">客棧</div><div class="meaning">장터 일을 도운 뒤 생긴 소년의 첫 머물 곳이야.</div><div class="worldPlaceState done">✓ 오늘부터 돌아올 수 있는 곳</div><div class="gamerule"><strong>지금은</strong><br>장터 일을 더 둘러봐도 괜찮아. 여관 주인이 빈방 하나를 남겨 두었어.</div><div class="sheetactions"><button id="worldInnClose">확인</button></div>`);
    const close = document.getElementById('worldInnClose');
    if (close) close.onclick = () => globalThis.TacticalGame?.closeSheet?.();
  }

  function createMarker() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'worldSubplace worldInnMarker';
    button.dataset.subplaceId = 'inn';
    button.setAttribute('aria-label', '여관, 客棧. 오늘부터 돌아올 수 있는 생활 거점.');
    button.innerHTML = '<span class="worldInnIcon" aria-hidden="true">客</span><span class="worldInnNames"><strong>여관</strong><small lang="zh-Hant">客棧</small></span>';
    button.onclick = openInnSheet;
    return button;
  }

  function syncInnMarker() {
    const map = document.getElementById('worldRegions');
    if (!map) return;
    const existing = map.querySelector('.worldInnMarker');
    if (!unlocked()) {
      existing?.remove();
      return;
    }
    if (!existing) map.appendChild(createMarker());
  }

  const map = document.getElementById('worldRegions');
  if (map) new MutationObserver(syncInnMarker).observe(map, { childList: true });
  window.addEventListener('pageshow', syncInnMarker);
  setTimeout(syncInnMarker, 0);

  globalThis.WorldInn = Object.freeze({ MILESTONE, unlocked, syncInnMarker, openInnSheet });
})();
