(() => {
  const regionByChineseName = new Map(WORLD.regions.map(region => [region.name, region]));
  const regionIconPath = region => `./icons/world/regions/${region.icon}.svg`;
  const chineseNameFromLabel = text => text.replace(/^✓\s*/, '').trim();
  let selectedRegionId = null;

  const milestones = () => {
    const values = globalThis.GameFlow?.progress?.()?.completedMilestones;
    return Array.isArray(values) ? values : [];
  };
  const isLocked = region => region.status === 'locked' && !milestones().includes(region.requires);
  const isComplete = region => !!region.completionMilestone && milestones().includes(region.completionMilestone);
  const recommendationNeeded = region => !!region.recommendation && (!region.recommendationMilestone || !milestones().includes(region.recommendationMilestone));
  const regionSection = regionId => globalThis.JourneyContent?.JOURNEY?.flatMap(chapter => chapter.sections || []).find(section => section.regionId === regionId) || null;
  const hasJourneyContent = region => (regionSection(region.id)?.sequence?.length || 0) > 0;

  function enhanceWorldHeader() {
    const view = document.getElementById('worldView');
    if (!view) return;

    const kicker = view.querySelector('.worldHeading .stagekicker');
    const heading = view.querySelector('.worldHeading h1');
    const compass = view.querySelector('.worldCompass');
    if (kicker) kicker.textContent = '1장 · 세 갈래 길';
    if (heading) {
      heading.textContent = '물길마을';
      let zh = view.querySelector('.worldHeadingZh');
      if (!zh) {
        zh = document.createElement('small');
        zh.className = 'worldHeadingZh';
        heading.insertAdjacentElement('afterend', zh);
      }
      zh.textContent = '三溪鎮';
    }
    if (compass) compass.textContent = '≋';

    const origin = view.querySelector('.worldOrigin');
    if (origin) {
      origin.setAttribute('aria-label', '현재 지역 물길마을, 三溪鎮');
      origin.classList.add('worldSettlement');
    }
  }

  function ensureMapBackground() {
    const map = document.getElementById('worldRegions');
    if (!map) return;
    map.classList.add('villageMap');
    map.setAttribute('aria-label', '물길마을 三溪鎮 지도');
    if (map.querySelector('.villageMapDecor')) return;

    const decor = document.createElement('div');
    decor.className = 'villageMapDecor';
    decor.setAttribute('aria-hidden', 'true');

    const image = document.createElement('img');
    image.className = 'villageMapImage';
    image.src = WORLD.settlement?.mapAsset || './images/world/three-streams-map.webp';
    image.alt = '';
    image.decoding = 'async';

    const wash = document.createElement('div');
    wash.className = 'villageMapWash';
    decor.append(image, wash);
    map.prepend(decor);
  }

  function selectMarker(regionId) {
    selectedRegionId = regionId;
    document.querySelectorAll('#worldRegions .regionCard').forEach(card => {
      card.classList.toggle('selected', card.dataset.regionId === regionId);
    });
  }

  function showRegionInfo(region) {
    selectMarker(region.id);
    const locked = isLocked(region);
    const complete = isComplete(region);
    const recommendation = recommendationNeeded(region) ? region.recommendation : '';
    const status = complete ? '<div class="worldPlaceState done">✓ 핵심 의뢰를 완료했어.</div>' : '';
    const advice = recommendation ? `<div class="gamerule worldAdvice"><strong>권장</strong><br>${recommendation}</div>` : '';
    const lock = locked ? `<div class="gamerule worldLockReason"><strong>아직 갈 수 없어</strong><br>${region.lockHint || '앞선 의뢰를 마치면 이곳으로 이어지는 길이 열려.'}</div>` : '';
    const action = locked
      ? '<button id="worldPlaceClose">확인</button>'
      : hasJourneyContent(region)
        ? '<button class="secondary" id="worldPlaceClose">닫기</button><button id="worldPlaceGo">이곳으로 가기</button>'
        : '<button class="secondary" id="worldPlaceClose">닫기</button><button disabled>의뢰 준비 중</button>';

    globalThis.TacticalGame?.openSheet?.(`<h2>${region.nameKo || region.name}</h2><div class="regionSheetNameZh">${region.name}</div><div class="pinyin">${region.subtitle}</div><div class="meaning">${region.note}</div>${status}${advice}${lock}<div class="sheetactions">${action}</div>`);

    const close = document.getElementById('worldPlaceClose');
    if (close) close.onclick = () => globalThis.TacticalGame?.closeSheet?.();
    const go = document.getElementById('worldPlaceGo');
    if (go) go.onclick = () => {
      globalThis.TacticalGame?.closeSheet?.();
      if (!globalThis.GameFlow?.enterRegion?.(region.id)) {
        globalThis.TacticalGame?.openSheet?.(`<h2>${region.nameKo || region.name}</h2><div class="regionSheetNameZh">${region.name}</div><p class="flowNote">지금 이어서 할 새 의뢰는 아직 준비 중이야.</p><div class="sheetactions"><button id="worldNoQuestClose">확인</button></div>`);
        const noQuestClose = document.getElementById('worldNoQuestClose');
        if (noQuestClose) noQuestClose.onclick = () => globalThis.TacticalGame?.closeSheet?.();
      }
    };
  }

  function enhanceRegionCards() {
    document.querySelectorAll('#worldRegions .regionCard:not([data-world-presented])').forEach(card => {
      const title = card.querySelector('strong');
      if (!title) return;

      const region = regionByChineseName.get(chineseNameFromLabel(title.textContent));
      if (!region) return;

      const locked = isLocked(region);
      const complete = isComplete(region);
      const mapName = region.mapNameKo || region.nameKo || region.name;

      const icon = document.createElement('img');
      icon.className = 'regionIcon';
      icon.src = regionIconPath(region);
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');

      const iconWrap = document.createElement('span');
      iconWrap.className = 'regionIconWrap';
      iconWrap.append(icon);
      if (complete || locked) {
        const badge = document.createElement('span');
        badge.className = `regionBadge ${complete ? 'complete' : 'locked'}`;
        badge.textContent = complete ? '✓' : '🔒';
        badge.setAttribute('aria-hidden', 'true');
        iconWrap.append(badge);
      }

      const koName = document.createElement('strong');
      koName.textContent = mapName;
      const chineseName = document.createElement('small');
      chineseName.className = 'regionNameZh';
      chineseName.textContent = region.name;
      const names = document.createElement('span');
      names.className = 'regionNames';
      names.append(koName, chineseName);

      card.replaceChildren(iconWrap, names);
      card.disabled = false;
      card.classList.remove('recommended');
      card.classList.toggle('locked', locked);
      card.classList.toggle('completed', complete);
      card.classList.toggle('selected', selectedRegionId === region.id);
      card.dataset.worldPresented = 'true';
      card.dataset.regionId = region.id;
      card.dataset.mapKind = region.map?.kind || 'district';
      card.style.setProperty('--map-x', `${region.map?.x ?? 50}%`);
      card.style.setProperty('--map-y', `${region.map?.y ?? 50}%`);
      card.setAttribute('aria-disabled', locked ? 'true' : 'false');
      card.setAttribute('aria-label', `${mapName}, ${region.name}. ${locked ? '아직 이동할 수 없음. 눌러서 조건 확인.' : complete ? '핵심 의뢰 완료.' : '눌러서 살펴보기.'}`);
      card.onclick = event => {
        event.preventDefault();
        showRegionInfo(region);
      };
    });
  }

  function enhanceWorldHint() {
    const hint = document.getElementById('worldHint');
    if (hint) hint.textContent = '장소를 눌러 살펴봐. 길은 네가 고르면 돼.';
  }

  function syncWorldPresentation() {
    enhanceWorldHeader();
    ensureMapBackground();
    enhanceRegionCards();
    enhanceWorldHint();
  }

  const map = document.getElementById('worldRegions');
  const sheet = document.getElementById('sheet');
  const observer = new MutationObserver(syncWorldPresentation);
  if (map) observer.observe(map, { childList: true });
  if (sheet) observer.observe(sheet, { childList: true, subtree: false });

  syncWorldPresentation();
})();
