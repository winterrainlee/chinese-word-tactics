/* Small world-map sublocation unlocked by market M4 and settled after market M8. */
(() => {
  const MILESTONE = 'inn-unlocked';
  const ROOM_KEY_MILESTONE = 'market-core';
  const ROOM_CHUNK_BASE = './images/inn/room-v0.2';
  const ROOM_CHUNK_COUNT = 3;
  const ROOM_HOTSPOTS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536" role="img" aria-label="침대, 책상, 의자, 옷상자, 문을 위한 상호작용 레이어">
    <defs><filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#2d241c" flood-opacity="0.28"/></filter></defs>
    <g fill="none" stroke="none" class="inn-room-hotspots">
      <g id="hotspot-bed" data-word="床" data-ko="침대" tabindex="0" role="button" aria-label="침대, 床"><rect x="58" y="430" width="410" height="395" rx="28" fill="transparent"/><circle cx="278" cy="642" r="28" fill="#f3ebdd" fill-opacity="0.92" stroke="#6d5640" stroke-width="2" filter="url(#softShadow)"/><path d="M261 650v-16m34 16v-16M260 638h36v12h-36zM263 632v-8h12v8m9 0v-8h10v8" stroke="#55473b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g id="hotspot-desk" data-word="桌子" data-ko="책상" tabindex="0" role="button" aria-label="책상, 桌子"><rect x="636" y="440" width="290" height="300" rx="24" fill="transparent"/><circle cx="785" cy="570" r="28" fill="#f3ebdd" fill-opacity="0.92" stroke="#6d5640" stroke-width="2" filter="url(#softShadow)"/><path d="M767 562h36M771 562v20m28-20v20m-22-20v8h16v-8" stroke="#55473b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g id="hotspot-chair" data-word="椅子" data-ko="의자" tabindex="0" role="button" aria-label="의자, 椅子"><rect x="690" y="520" width="220" height="250" rx="24" fill="transparent"/><circle cx="815" cy="690" r="28" fill="#f3ebdd" fill-opacity="0.92" stroke="#6d5640" stroke-width="2" filter="url(#softShadow)"/><path d="M804 676v28m22-28v28m-22-16h22m-18-20v20m14-20v20m-14-20h14" stroke="#55473b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g id="hotspot-chest" data-word="箱子" data-ko="상자" tabindex="0" role="button" aria-label="옷상자, 箱子"><rect x="48" y="700" width="300" height="330" rx="28" fill="transparent"/><circle cx="190" cy="865" r="28" fill="#f3ebdd" fill-opacity="0.92" stroke="#6d5640" stroke-width="2" filter="url(#softShadow)"/><path d="M172 861h36v17h-36zM176 854h28l4 7h-36zM190 861v17" stroke="#55473b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g id="hotspot-door" data-action="leave-room" tabindex="0" role="button" aria-label="방에서 나가기"><rect x="888" y="520" width="136" height="1016" rx="28" fill="transparent"/><circle cx="938" cy="830" r="28" fill="#f3ebdd" fill-opacity="0.92" stroke="#6d5640" stroke-width="2" filter="url(#softShadow)"/><path d="M929 819l18 11-18 11M947 830h-25" stroke="#55473b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
    </g>
  </svg>`;

  let roomObjectUrl = null;
  let roomAssetPromise = null;

  const progress = () => globalThis.GameFlow?.progress?.() || {};
  const hasMilestone = (milestone, value = progress()) =>
    Array.isArray(value.completedMilestones) && value.completedMilestones.includes(milestone);
  const unlocked = (value = progress()) => hasMilestone(MILESTONE, value);
  const hasRoomKey = (value = progress()) => unlocked(value) && hasMilestone(ROOM_KEY_MILESTONE, value);

  function roomChunkUrls() {
    return Array.from({ length: ROOM_CHUNK_COUNT }, (_, index) => `${ROOM_CHUNK_BASE}/${String(index).padStart(2, '0')}.txt`);
  }

  async function decodeRoomObjectUrl(url) {
    if (typeof Image !== 'function') return;
    const preload = new Image();
    preload.decoding = 'async';
    preload.src = url;
    if (typeof preload.decode === 'function') {
      try { await preload.decode(); return; } catch {}
    }
    await new Promise((resolve, reject) => {
      preload.onload = resolve;
      preload.onerror = reject;
    });
  }

  function preloadRoomBackground() {
    if (roomObjectUrl) return Promise.resolve(roomObjectUrl);
    if (roomAssetPromise) return roomAssetPromise;
    if (typeof fetch !== 'function' || typeof atob !== 'function' || typeof Blob === 'undefined' || !globalThis.URL?.createObjectURL) {
      return Promise.resolve(null);
    }
    roomAssetPromise = (async () => {
      const responses = await Promise.all(roomChunkUrls().map(url => fetch(url, { cache: 'force-cache' })));
      if (responses.some(response => !response.ok)) throw new Error('room image chunk request failed');
      const parts = await Promise.all(responses.map(response => response.text()));
      const binary = atob(parts.join('').replace(/\s+/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      roomObjectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
      await decodeRoomObjectUrl(roomObjectUrl);
      return roomObjectUrl;
    })().catch(error => {
      roomAssetPromise = null;
      console.warn('여관 방 배경을 미리 불러오지 못했어.', error);
      return null;
    });
    return roomAssetPromise;
  }

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
    const back = view.querySelector('#innRoomBack');
    if (back) back.onclick = () => globalThis.GameFlow?.showWorld?.();
    return view;
  }

  async function loadRoomBackground() {
    const image = document.getElementById('innRoomBackdrop');
    const loading = document.getElementById('innRoomLoading');
    if (!image || image.dataset.loaded === 'true') return;
    const url = await preloadRoomBackground();
    if (!url) {
      if (loading) loading.textContent = '방 그림을 불러오지 못했어.';
      return;
    }
    image.src = url;
    if (typeof image.decode === 'function') {
      try { await image.decode(); } catch {}
    }
    image.dataset.loaded = 'true';
    if (loading) loading.hidden = true;
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
    const close = document.getElementById('innRoomWordClose');
    if (close) close.onclick = () => globalThis.TacticalGame?.closeSheet?.();
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

  function loadRoomHotspots() {
    const host = document.getElementById('innRoomHotspots');
    if (!host || host.dataset.loaded === 'true') return;
    host.innerHTML = ROOM_HOTSPOTS_SVG;
    host.dataset.loaded = 'true';
    host.querySelectorAll('[data-word],[data-action]').forEach(bindHotspot);
  }

  function openRoom() {
    ensureRoomView();
    globalThis.TacticalGame?.closeSheet?.();
    globalThis.TacticalGame?.showView?.('innRoom');
    loadRoomHotspots();
    loadRoomBackground();
    window.scrollTo(0, 0);
  }

  function openInnSheet() {
    preloadRoomBackground();
    const roomKey = hasRoomKey();
    const meaning = roomKey
      ? '장터 일을 함께 마친 뒤, 소년에게 방 열쇠가 맡겨진 생활 거점이야.'
      : '장터 일을 도운 뒤 생긴 소년의 첫 머물 곳이야.';
    const state = roomKey ? '방 열쇠가 생긴 돌아올 곳' : '오늘부터 돌아올 수 있는 곳';
    const detail = roomKey
      ? '<strong>방 열쇠</strong><br>여관 주인이 남는 방 하나를 맡겨 두었어. 화려하진 않지만, 이제 소년이 돌아와 자기 물건을 둘 수 있는 자리야.'
      : '<strong>지금은</strong><br>장터 일을 더 둘러봐도 괜찮아. 여관 주인이 빈방 하나를 남겨 두었어.';
    globalThis.TacticalGame?.openSheet?.(`<h2>여관</h2><div class="regionSheetNameZh">客棧</div><div class="meaning">${meaning}</div><div class="worldInnPlaceState${roomKey ? ' has-room-key' : ''}">${state}</div><div class="gamerule">${detail}</div><div class="sheetactions"><button class="secondary" id="worldInnClose">닫기</button><button id="worldInnEnter">들어가기</button></div>`);
    const close = document.getElementById('worldInnClose');
    if (close) close.onclick = () => globalThis.TacticalGame?.closeSheet?.();
    const enter = document.getElementById('worldInnEnter');
    if (enter) enter.onclick = openRoom;
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
    preloadRoomBackground();
  }

  const map = document.getElementById('worldRegions');
  if (map) new MutationObserver(syncInnMarker).observe(map, { childList: true });
  window.addEventListener('pageshow', syncInnMarker);
  setTimeout(syncInnMarker, 0);

  globalThis.WorldInn = Object.freeze({
    MILESTONE, ROOM_KEY_MILESTONE, unlocked, hasRoomKey, preloadRoomBackground,
    syncMarkerState, syncInnMarker, openInnSheet, openRoom
  });
})();