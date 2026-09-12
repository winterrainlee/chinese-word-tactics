/* Small world-map sublocation unlocked by market M4 and settled after market M8. */
(() => {
  const MILESTONE = 'inn-unlocked';
  const ROOM_KEY_MILESTONE = 'market-core';
  const progress = () => globalThis.GameFlow?.progress?.() || {};
  const hasMilestone = (milestone, value = progress()) =>
    Array.isArray(value.completedMilestones) && value.completedMilestones.includes(milestone);
  const unlocked = (value = progress()) => hasMilestone(MILESTONE, value);
  const hasRoomKey = (value = progress()) => unlocked(value) && hasMilestone(ROOM_KEY_MILESTONE, value);

  function openInnSheet() {
    const roomKey = hasRoomKey();
    const meaning = roomKey
      ? '장터 일을 함께 마친 뒤, 소년에게 방 열쇠가 맡겨진 생활 거점이야.'
      : '장터 일을 도운 뒤 생긴 소년의 첫 머물 곳이야.';
    const state = roomKey ? '방 열쇠가 생긴 돌아올 곳' : '오늘부터 돌아올 수 있는 곳';
    const detail = roomKey
      ? '<strong>방 열쇠</strong><br>여관 주인이 맡긴 작은 나무패와 황동 열쇠가 처마 아래 달려 있어. 이제 이 방은 소년이 마을 일을 마치고 돌아오는 자리야.'
      : '<strong>지금은</strong><br>장터 일을 더 둘러봐도 괜찮아. 여관 주인이 빈방 하나를 남겨 두었어.';
    globalThis.TacticalGame?.openSheet?.(`<h2>여관</h2><div class="regionSheetNameZh">客棧</div><div class="meaning">${meaning}</div><div class="worldInnPlaceState${roomKey ? ' has-room-key' : ''}">${state}</div><div class="gamerule">${detail}</div><div class="sheetactions"><button id="worldInnClose">확인</button></div>`);
    const close = document.getElementById('worldInnClose');
    if (close) close.onclick = () => globalThis.TacticalGame?.closeSheet?.();
  }

  function createMarker() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'worldSubplace worldInnMarker';
    button.dataset.subplaceId = 'inn';
    button.innerHTML = '<span class="worldInnIcon" aria-hidden="true"><span class="worldInnWarmth"></span><img class="worldInnBuilding" src="./icons/world/regions/subplace-inn.svg" alt=""><img class="worldInnKeyCharm" src="./icons/world/regions/subplace-room-key.svg" alt=""></span><span class="worldInnNames"><strong>여관</strong><small lang="zh-Hant">客棧</small></span>';
    button.onclick = openInnSheet;
    return button;
  }

  function syncMarkerState(marker, value = progress()) {
    const roomKey = hasRoomKey(value);
    marker.classList.toggle('has-room-key', roomKey);
    marker.setAttribute('aria-label', roomKey
      ? '여관, 客棧. 방 열쇠를 받은 생활 거점.'
      : '여관, 客棧. 오늘부터 돌아올 수 있는 생활 거점.');
  }

  function syncInnMarker() {
    const map = document.getElementById('worldRegions');
    if (!map) return;
    const value = progress();
    let existing = map.querySelector('.worldInnMarker');
    if (!unlocked(value)) {
      existing?.remove();
      return;
    }
    if (!existing) {
      existing = createMarker();
      map.appendChild(existing);
    }
    syncMarkerState(existing, value);
  }

  const map = document.getElementById('worldRegions');
  if (map) new MutationObserver(syncInnMarker).observe(map, { childList: true });
  window.addEventListener('pageshow', syncInnMarker);
  setTimeout(syncInnMarker, 0);

  globalThis.WorldInn = Object.freeze({
    MILESTONE, ROOM_KEY_MILESTONE, unlocked, hasRoomKey, syncMarkerState, syncInnMarker, openInnSheet
  });
})();
