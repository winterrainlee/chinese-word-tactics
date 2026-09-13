/* Small world-map sublocation unlocked by market M4 and settled after market M8. */
(() => {
  const MILESTONE = 'inn-unlocked';
  const ROOM_KEY_MILESTONE = 'market-core';
  const ROOM_CHUNK_BASE = './images/inn/room-v0.2';
  const ROOM_CHUNK_COUNT = 3;
  let roomObjectUrl = null;

  const progress = () => globalThis.GameFlow?.progress?.() || {};
  const hasMilestone = (milestone, value = progress()) =>
    Array.isArray(value.completedMilestones) && value.completedMilestones.includes(milestone);
  const unlocked = (value = progress()) => hasMilestone(MILESTONE, value);
  const hasRoomKey = (value = progress()) => unlocked(value) && hasMilestone(ROOM_KEY_MILESTONE, value);

  function ensureRoomView() {
    let view = document.getElementById('innRoomView');
    if (view) return view;
    view = document.createElement('main');
    view.id = 'innRoomView';
    view.className = 'innRoomShell appView';
    view.hidden = true;
    view.setAttribute('aria-label', '여관 내 방');
    view.innerHTML = `
      <header class="innRoomTopbar">
        <button class="iconbtn" id="innRoomBack" type="button" aria-label="물길마을 지도로 돌아가기">←</button>
        <div class="innRoomHeading"><div class="stagekicker">여관 · 客棧</div><h1>내 방</h1></div>
        <span class="innRoomKey" aria-hidden="true">⌑</span>
      </header>
      <section class="innRoomScene" id="innRoomScene" aria-label="문을 열고 바라본 작은 방">
        <img id="innRoomBackdrop" class="innRoomBackdrop" alt="소박한 여관 방. 침대, 책상, 의자, 나무상자가 놓여 있다.">
        <div id="innRoomHotspots" class="innRoomHotspots" aria-label="방 안 사물"></div>
        <div id="innRoomLoading" class="innRoomLoading">방 안을 살펴보는 중…</div>
      </section>
      <p id="innRoomHint" class="innRoomHint">눈에 들어오는 물건을 눌러봐.</p>
    `;
    document.getElementById('app')?.appendChild(view);
    view.querySelector('#innRoomBack').onclick = () => globalThis.GameFlow?.showWorld?.();
    return view;
  }

  async function loadRoomBackground() {
    const image = document.getElementById('innRoomBackdrop');
    const loading = document.getElementById('innRoomLoading');
    if (!image || image.dataset.loaded === 'true') return;
    try {
      const urls = Array.from({ length: ROOM_CHUNK_COUNT }, (_, index) => `${ROOM_CHUNK_BASE}/${String(index).padStart(2, '0')}.txt`);
      const responses = await Promise.all(urls.map(url => fetch(url)));
      if (responses.some(response => !response.ok)) throw new Error('room image chunk request failed');
      const parts = await Promise.all(responses.map(response => response.text()));
      const encoded = parts.join('').replace(/\s+/g, '');
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      if (roomObjectUrl) URL.revokeObjectURL(roomObjectUrl);
      roomObjectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
      image.onload = () => {
        image.dataset.loaded = 'true';
        loading.hidden = true;
      };
      image.src = roomObjectUrl;
    } catch (error) {
      loading.textContent = '방 그림을 불러오지 못했어.';
      console.warn('여관 방 배경을 불러오지 못했어.', error);
    }
  }

  function showRoomWord(group) {
    const word = group.dataset.word;
    const ko = group.dataset.ko;
    const pronunciation = {
      '床': 'ㄔㄨㄤˊ',
      '桌子': 'ㄓㄨㄛ ㄗ˙',
      '椅子': 'ㄧˇ ㄗ˙',
      '箱子': 'ㄒㄧㄤ ㄗ˙'
    }[word] || '';
    globalThis.TacticalGame?.openSheet?.(`<h2 lang="zh-Hant">${word}</h2><div class="pinyin">${pronunciation}</div><div class="meaning">${ko}</div><div class="tiny">여관 방에서 발견한 생활 단어</div><div class="sheetactions"><button id="innRoomWordClose">닫기</button></div>`);
    document.getElementById('innRoomWordClose')?.addEventListener('click', () => globalThis.TacticalGame?.closeSheet?.());
  }

  function bindHotspot(group) {
    const activate = () => {
      if (group.dataset.action === 'leave-room') {
        globalThis.GameFlow?.showWorld?.();
        return;
      }
      if (group.dataset.word) showRoomWord(group);
    };
    group.addEventListener('click', activate);
    group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  }

  async function loadRoomHotspots() {
    const host = document.getElementById('innRoomHotspots');
    if (!host || host.dataset.loaded === 'true') return;
    try {
      const response = await fetch('./src/inn-room-hotspots.svg?v=20260913-innroom1');
      if (!response.ok) throw new Error('room hotspot SVG request failed');
      const text = await response.text();
      host.innerHTML = text;
      host.dataset.loaded = 'true';
      host.querySelectorAll('[data-word],[data-action]').forEach(bindHotspot);
    } catch (error) {
      console.warn('여관 방 SVG 레이어를 불러오지 못했어.', error);
    }
  }

  function openRoom() {
    ensureRoomView();
    globalThis.TacticalGame?.closeSheet?.();
    globalThis.TacticalGame?.showView?.('innRoom');
    loadRoomBackground();
    loadRoomHotspots();
    window.scrollTo(0, 0);
  }

  function openInnSheet() {
    const roomKey = hasRoomKey();
    const meaning = roomKey
      ? '장터 일을 함께 마친 뒤, 소년에게 방 열쇠가 맡겨진 생활 거점이야.'
      : '장터 일을 도운 뒤 생긴 소년의 첫 머물 곳이야.';
    const state = roomKey ? '방 열쇠가 생긴 돌아올 곳' : '오늘부터 돌아올 수 있는 곳';
    const detail = roomKey
      ? '<strong>방 열쇠</strong><br>여관 주인이 남는 방 하나를 맡겨 두었어. 화려하진 않지만, 이제 소년이 돌아와 자기 물건을 둘 수 있는 자리야.'
      : '<strong>지금은</strong><br>장터 일을 더 둘러봐도 괜찮아. 여관 주인이 빈방 하나를 남겨 두었어.';
    globalThis.TacticalGame?.openSheet?.(`<h2>여관</h2><div class="regionSheetNameZh">客棧</div><div class="meaning">${meaning}</div><div class="worldInnPlaceState${roomKey ? ' has-room-key' : ''}">${state}</div><div class="gamerule">${detail}</div><div class="sheetactions"><button class="secondary" id="worldInnClose">닫기</button><button id="worldInnEnter">들어가기</button></div>`);
    document.getElementById('worldInnClose')?.addEventListener('click', () => globalThis.TacticalGame?.closeSheet?.());
    document.getElementById('worldInnEnter')?.addEventListener('click', openRoom);
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
    MILESTONE, ROOM_KEY_MILESTONE, unlocked, hasRoomKey, syncMarkerState, syncInnMarker, openInnSheet, openRoom
  });
})();
