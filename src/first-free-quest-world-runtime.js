/* C08 world/inn orchestration: direct innkeeper request → northern forest → report → quest board. */
(() => {
  const C = globalThis.FirstFreeQuestContent;
  if (!C) return;
  const $ = id => document.getElementById(id);
  const strings = value => Array.isArray(value) ? value : [];
  const progress = () => globalThis.GameFlow?.progress?.() || {};
  const hasMilestone = (id, value = progress()) => strings(value.completedMilestones).includes(id);
  const hasStory = (id, value = progress()) => strings(value.seenStories).includes(id);
  const hasStage = (id, value = progress()) => strings(value.completedStages).includes(id);

  const chapterDone = value => hasMilestone('chapter1-complete', value);
  const accepted = value => hasStory(C.OFFER_STORY_ID, value);
  const forestDone = value => hasStage(C.STAGE_ID, value);
  const reported = value => hasMilestone(C.COMPLETE_MILESTONE, value);
  const boardUnlocked = value => hasMilestone(C.BOARD_MILESTONE, value);
  const needsOffer = value => chapterDone(value) && !accepted(value);
  const questActive = value => accepted(value) && !forestDone(value);
  const needsReport = value => forestDone(value) && !boardUnlocked(value);

  function bindMeaningToggle(buttonId, textId) {
    const button = $(buttonId), text = $(textId);
    if (!button || !text) return;
    button.onclick = () => {
      const show = text.hidden;
      text.hidden = !show;
      button.textContent = show ? '뜻 닫기' : '한국어 뜻 보기';
      button.setAttribute('aria-expanded', String(show));
    };
  }

  function openOfferSheet() {
    if (!needsOffer(progress())) return false;
    globalThis.TacticalGame?.openSheet?.(`
      <h2>여관 주인의 부탁</h2>
      <div class="regionSheetNameZh" lang="zh-Hant">客棧</div>
      <p class="firstQuestPromptZh" lang="zh-Hant">北邊森林裡有一種月白菇，我做湯還差三個。你如果要出去走走，可以幫我找嗎？</p>
      <button class="firstQuestMeaningToggle" id="firstQuestOfferMeaning" type="button" aria-expanded="false" aria-controls="firstQuestOfferKo">한국어 뜻 보기</button>
      <p class="firstQuestPromptKo" id="firstQuestOfferKo" hidden>북쪽 숲에 월백버섯이라는 버섯이 있는데, 수프에 쓸 세 개가 더 필요해. 밖에 나갈 일이 있으면 좀 찾아줄래?</p>
      <div class="sheetactions"><button class="secondary" id="firstQuestLater">나중에</button><button id="firstQuestAccept">찾으러 가기</button></div>
    `);
    bindMeaningToggle('firstQuestOfferMeaning', 'firstQuestOfferKo');
    const later = $('firstQuestLater');
    if (later) later.onclick = () => globalThis.TacticalGame?.closeSheet?.();
    const acceptButton = $('firstQuestAccept');
    if (acceptButton) acceptButton.onclick = () => {
      globalThis.TacticalGame?.closeSheet?.();
      globalThis.GameFlow?.enterRegion?.('inn-first-quest');
    };
    return true;
  }

  function openReportSheet() {
    if (!needsReport(progress())) return false;
    globalThis.TacticalGame?.openSheet?.(`
      <h2>여관</h2>
      <div class="regionSheetNameZh" lang="zh-Hant">客棧</div>
      <p class="firstQuestPromptZh" lang="zh-Hant">月白菇三個都找到了。帶給老闆吧。</p>
      <button class="firstQuestMeaningToggle" id="firstQuestReportMeaning" type="button" aria-expanded="false" aria-controls="firstQuestReportKo">한국어 뜻 보기</button>
      <p class="firstQuestPromptKo" id="firstQuestReportKo" hidden>월백버섯 세 개를 모두 찾았다. 여관 주인에게 가져가자.</p>
      <div class="sheetactions"><button class="secondary" id="firstQuestReportLater">잠깐 둘러보기</button><button id="firstQuestReport">보고하기</button></div>
    `);
    bindMeaningToggle('firstQuestReportMeaning', 'firstQuestReportKo');
    const later = $('firstQuestReportLater');
    if (later) later.onclick = () => globalThis.TacticalGame?.closeSheet?.();
    const reportButton = $('firstQuestReport');
    if (reportButton) reportButton.onclick = () => {
      globalThis.TacticalGame?.closeSheet?.();
      globalThis.GameFlow?.enterRegion?.('inn-first-quest-report');
    };
    return true;
  }

  function openForestSheet() {
    const value = progress();
    if (!accepted(value)) return false;
    const done = forestDone(value);
    const board = boardUnlocked(value);
    const meaning = !done
      ? '여관 주인이 부탁한 월백버섯 세 개를 찾을 수 있는 북쪽 숲이야.'
      : !board
        ? '월백버섯 세 개를 찾았다. 이제 여관 주인에게 가져가면 돼.'
        : '첫 자유 의뢰에서 다녀온 북쪽 숲이야. 지금은 새로 맡은 일이 없어.';
    const action = !done
      ? '<button class="secondary" id="northForestClose">닫기</button><button id="northForestGo">숲으로 들어가기</button>'
      : board
        ? '<button class="secondary" id="northForestClose">닫기</button><button id="northForestReplay">다시 연습하기</button>'
        : '<button id="northForestClose">확인</button>';
    globalThis.TacticalGame?.openSheet?.(`
      <h2>북쪽 숲</h2>
      <div class="regionSheetNameZh" lang="zh-Hant">北邊森林</div>
      <div class="meaning">${meaning}</div>
      <div class="sheetactions">${action}</div>
    `);
    const close = $('northForestClose');
    if (close) close.onclick = () => globalThis.TacticalGame?.closeSheet?.();
    const go = $('northForestGo');
    if (go) go.onclick = () => {
      globalThis.TacticalGame?.closeSheet?.();
      globalThis.GameFlow?.enterRegion?.('north-forest');
    };
    const replay = $('northForestReplay');
    if (replay) replay.onclick = () => {
      globalThis.TacticalGame?.closeSheet?.();
      globalThis.GameFlow?.playStage?.(C.STAGE_ID, { mode: 'replay', returnTo: 'world' });
    };
    return true;
  }

  function createForestMarker() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'worldForestQuestMarker';
    button.dataset.subplaceId = 'north-forest';
    button.innerHTML = `
      <span class="worldForestQuestIconWrap" aria-hidden="true">
        <img class="worldForestQuestIcon" src="./icons/world/regions/subplace-north-forest.svg" alt="">
        <span class="worldForestQuestBadge">✓</span>
      </span>
      <span class="worldForestQuestNames"><strong>북쪽 숲</strong><small lang="zh-Hant">北邊森林</small></span>
    `;
    button.onclick = openForestSheet;
    return button;
  }

  function syncForestMarker() {
    const map = $('worldRegions');
    if (!map) return;
    const value = progress();
    let marker = map.querySelector('.worldForestQuestMarker');
    if (!accepted(value)) {
      marker?.remove();
      return;
    }
    if (!marker) {
      marker = createForestMarker();
      map.appendChild(marker);
    }
    const done = forestDone(value);
    marker.classList.toggle('completed', done);
    marker.classList.toggle('active-quest', questActive(value));
    marker.setAttribute('aria-label', done
      ? `북쪽 숲, 北邊森林. ${boardUnlocked(value) ? '첫 의뢰 완료. 다시 살펴볼 수 있음.' : '월백버섯 세 개를 찾음. 여관으로 돌아갈 차례.'}`
      : '북쪽 숲, 北邊森林. 여관 주인의 부탁을 수행할 장소.');
  }

  function openBoardSheet() {
    if (!boardUnlocked(progress())) return false;
    globalThis.TacticalGame?.openSheet?.(`
      <h2>의뢰 게시판</h2>
      <div class="regionSheetNameZh" lang="zh-Hant">委託板</div>
      <div class="questBoardNote">
        <div class="questBoardNoteHead"><strong>북쪽 숲의 버섯</strong><span>완료</span></div>
        <div class="questBoardNoteZh" lang="zh-Hant">北邊森林 · 月白菇三個</div>
      </div>
      <p class="questBoardEmpty">지금은 새로 적힌 부탁이 없다.</p>
      <div class="sheetactions"><button id="questBoardClose">닫기</button></div>
    `);
    const close = $('questBoardClose');
    if (close) close.onclick = () => globalThis.TacticalGame?.closeSheet?.();
    return true;
  }

  function injectBoardEntry() {
    if (!boardUnlocked(progress())) return;
    const sheet = $('sheet');
    if (!sheet?.querySelector('.worldInnPlaceState') || sheet.querySelector('#questBoardOpen')) return;
    const actions = sheet.querySelector('.sheetactions');
    if (!actions) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'questBoardOpen';
    button.className = 'questBoardEntry';
    button.innerHTML = '<span><strong>의뢰 게시판</strong><small lang="zh-Hant">委託板</small></span><span class="questBoardMark" aria-hidden="true">▤</span>';
    button.onclick = openBoardSheet;
    actions.before(button);
  }

  function interceptInnMarker(event) {
    const marker = event.target?.closest?.('.worldInnMarker');
    if (!marker) return;
    const value = progress();
    if (!needsOffer(value) && !needsReport(value)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (needsOffer(value)) openOfferSheet();
    else openReportSheet();
  }

  function interceptRoomLeave(event) {
    const target = event.target?.closest?.('#innRoomHotspots [data-action="leave-room"]');
    if (!target || !needsOffer(progress())) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    globalThis.GameFlow?.showWorld?.();
    setTimeout(openOfferSheet, 0);
  }

  const map = $('worldRegions');
  if (map) {
    map.addEventListener('click', interceptInnMarker, true);
    new MutationObserver(syncForestMarker).observe(map, { childList: true });
  }

  document.addEventListener('click', interceptRoomLeave, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    interceptRoomLeave(event);
  }, true);

  const world = $('worldView');
  if (world) {
    new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes' && record.target === world && !world.hidden)) syncForestMarker();
    }).observe(world, { attributes: true, attributeFilter: ['hidden'] });
  }

  const sheet = $('sheet');
  if (sheet) new MutationObserver(injectBoardEntry).observe(sheet, { childList: true });

  window.addEventListener('pageshow', () => { syncForestMarker(); injectBoardEntry(); });
  setTimeout(() => { syncForestMarker(); injectBoardEntry(); }, 0);

  globalThis.FirstFreeQuest = Object.freeze({
    chapterDone, accepted, forestDone, reported, boardUnlocked, needsOffer, questActive, needsReport,
    openOfferSheet, openReportSheet, openForestSheet, openBoardSheet, syncForestMarker
  });
})();
