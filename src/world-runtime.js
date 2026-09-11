(() => {
  const regionByChineseName = new Map(WORLD.regions.map(region => [region.name, region]));
  const regionIconPath = region => `./icons/world/regions/${region.icon}.svg`;
  const chineseNameFromLabel = text => text.replace(/^✓\s*/, '').trim();

  function enhanceWorldHeader() {
    const view = document.getElementById('worldView');
    if (!view) return;

    const kicker = view.querySelector('.worldHeading .stagekicker');
    const heading = view.querySelector('.worldHeading h1');
    const compass = view.querySelector('.worldCompass');
    if (kicker) kicker.textContent = '1장 · 세 갈래 길';
    if (heading) heading.textContent = '물길마을';
    if (compass) compass.textContent = '≋';

    const origin = view.querySelector('.worldOrigin');
    if (!origin) return;
    origin.setAttribute('aria-label', '현재 지역 물길마을, 三溪鎮');
    origin.classList.add('worldSettlement');
    const label = origin.querySelector('.worldOriginLabel');
    const ko = origin.querySelector('.worldOriginNames strong');
    const zh = origin.querySelector('.worldOriginZh');
    const note = origin.querySelector(':scope > small');
    if (label) label.textContent = '첫 정착지';
    if (ko) ko.textContent = '물길마을';
    if (zh) zh.textContent = '三溪鎮';
    if (note) note.textContent = '세 물줄기가 만나는 곳. 숲에서 올라온 길이 마을 안에서 세 방향으로 이어진다.';
  }

  function ensureMapDecor() {
    const map = document.getElementById('worldRegions');
    if (!map) return;
    map.classList.add('villageMap');
    map.setAttribute('aria-label', '물길마을 三溪鎮 지도');
    if (map.querySelector('.villageMapDecor')) return;

    const decor = document.createElement('div');
    decor.className = 'villageMapDecor';
    decor.setAttribute('aria-hidden', 'true');
    decor.innerHTML = `
      <svg class="villageMapLines" viewBox="0 0 360 520" preserveAspectRatio="none">
        <path class="mapRiver mapRiverWest" d="M58 0 C70 70 92 126 104 190 C119 270 145 315 180 353 C181 399 180 455 180 520"/>
        <path class="mapRiver mapRiverNorth" d="M180 0 C180 82 180 164 180 353"/>
        <path class="mapRiver mapRiverEast" d="M302 0 C290 70 268 126 256 190 C241 270 215 315 180 353"/>
        <path class="mapRoad mapRoadWest" d="M180 430 C158 390 131 355 103 314 C84 287 72 257 70 229"/>
        <path class="mapRoad mapRoadNorth" d="M180 430 C180 355 180 279 180 148 C180 95 180 56 180 16"/>
        <path class="mapRoad mapRoadEast" d="M180 430 C202 390 229 355 257 314 C276 287 288 257 290 229"/>
      </svg>
      <span class="mapOutsideLabel">마을 밖</span>
      <span class="mapConfluence"><b>三溪</b><small>세 물줄기가 만나는 곳</small></span>
      <span class="mapForestLabel">숲</span>
      <span class="mapBridge" title="작은 다리">⌒</span>
      <span class="mapTrailLabel">걸어온 길</span>
      <span class="mapOriginMarker">
        <img src="./icons/world/regions/region-origin.svg" alt="">
        <span><strong>작은 마을</strong><small>小村</small></span>
      </span>`;
    map.prepend(decor);
  }

  function enhanceRegionCards() {
    document.querySelectorAll('#worldRegions .regionCard:not([data-world-presented])').forEach(card => {
      const title = card.querySelector('strong');
      const subtitle = card.querySelector('small');
      const state = card.querySelector('.regionState');
      if (!title || !subtitle || !state) return;

      const region = regionByChineseName.get(chineseNameFromLabel(title.textContent));
      if (!region) return;

      const visited = /^✓/.test(title.textContent.trim());
      const stateText = state.textContent;
      const mapName = region.mapNameKo || region.nameKo || region.name;

      const icon = document.createElement('img');
      icon.className = 'regionIcon';
      icon.src = regionIconPath(region);
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');

      const koName = document.createElement('strong');
      koName.textContent = `${visited ? '✓ ' : ''}${mapName}`;

      const chineseName = document.createElement('small');
      chineseName.className = 'regionNameZh';
      chineseName.textContent = region.name;

      const names = document.createElement('span');
      names.className = 'regionNames';
      names.append(koName, chineseName);

      const head = document.createElement('span');
      head.className = 'regionHead';
      head.append(icon, names);

      const mapState = document.createElement('span');
      mapState.className = 'regionState';
      mapState.textContent = stateText;

      const detail = document.createElement('small');
      detail.className = 'regionMapSubtitle';
      detail.textContent = region.subtitle;

      card.replaceChildren(head, mapState, detail);
      card.dataset.worldPresented = 'true';
      card.dataset.regionId = region.id;
      card.dataset.mapKind = region.map?.kind || 'district';
      card.style.setProperty('--map-x', `${region.map?.x ?? 50}%`);
      card.style.setProperty('--map-y', `${region.map?.y ?? 50}%`);
      card.setAttribute('aria-label', `${mapName}, ${region.name}. ${region.subtitle}. ${stateText}`);
    });
  }

  function enhanceRegionSheet() {
    const sheet = document.getElementById('sheet');
    const title = sheet?.querySelector('h2');
    if (!title || title.dataset.worldPresented) return;

    const region = regionByChineseName.get(title.textContent.trim());
    if (!region) return;

    title.textContent = region.nameKo || region.name;
    title.dataset.worldPresented = 'true';
    const chineseName = document.createElement('div');
    chineseName.className = 'regionSheetNameZh';
    chineseName.textContent = region.name;
    title.insertAdjacentElement('afterend', chineseName);
  }

  function enhanceWorldHint() {
    const hint = document.getElementById('worldHint');
    if (hint) hint.textContent = '세 길은 모두 물길마을 안으로 이어져. 먼저 걷고 싶은 곳을 골라봐.';
  }

  function syncWorldPresentation() {
    enhanceWorldHeader();
    ensureMapDecor();
    enhanceRegionCards();
    enhanceRegionSheet();
    enhanceWorldHint();
  }

  const map = document.getElementById('worldRegions');
  const sheet = document.getElementById('sheet');
  const observer = new MutationObserver(syncWorldPresentation);
  if (map) observer.observe(map, { childList: true });
  if (sheet) observer.observe(sheet, { childList: true, subtree: false });

  syncWorldPresentation();
})();
