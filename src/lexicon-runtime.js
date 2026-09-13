/* Regional comparison-first word book. The tactical word sheet remains the fast in-stage reference. */
(() => {
  const C = globalThis.LexiconContent;
  if (!C || typeof WORDS === 'undefined' || typeof STAGES === 'undefined') return;

  const KEY = 'chinese-word-tactics-lexicon-v1';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const regionById = id => C.REGIONS.find(region => region.id === id) || null;
  const chapterById = id => C.CHAPTERS.find(chapter => chapter.id === id) || null;
  const groupById = id => C.GROUPS.find(group => group.id === id) || null;

  const buildAppearanceIndex = () => {
    const byWord = new Map(), orderedWords = [];
    STAGES.forEach((stage, stageOrder) => {
      const regionId = C.stageRegionId(stage.id);
      const region = regionById(regionId);
      const chapterId = region?.chapterId || null;
      (Array.isArray(stage.words) ? stage.words : []).forEach(word => {
        if (!byWord.has(word)) { byWord.set(word, []); orderedWords.push(word); }
        byWord.get(word).push({
          word, stageId: stage.id, stageOrder, stageTitle: stage.subtitle || stage.title || stage.id,
          regionId, chapterId
        });
      });
    });
    return { byWord, orderedWords };
  };

  const APPEARANCES = buildAppearanceIndex();

  const emptyStore = () => ({ discovered: [], visitedStages: [], lastChapterId: null, lastRegionId: null });
  function readStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!raw) return emptyStore();
      return {
        discovered: Array.isArray(raw.discovered) ? raw.discovered.filter(word => typeof word === 'string' && WORDS[word]) : [],
        visitedStages: Array.isArray(raw.visitedStages) ? raw.visitedStages.filter(id => typeof id === 'string' && STAGES.some(stage => stage.id === id)) : [],
        lastChapterId: chapterById(raw.lastChapterId) ? raw.lastChapterId : null,
        lastRegionId: regionById(raw.lastRegionId) ? raw.lastRegionId : null
      };
    } catch {
      return emptyStore();
    }
  }

  let store = readStore();
  let discovered = new Set(store.discovered);
  let visitedStages = new Set(store.visitedStages);
  let state = { view: 'home', chapterId: null, regionId: null, groupId: null, word: null, query: '' };
  let history = [];
  let returnView = 'journeyView';
  let mounted = false;

  function storageWarning() {
    const notice = $('flowNotice');
    if (!notice) return;
    notice.hidden = false;
    notice.textContent = '단어 발견 기록을 저장하지 못했어. 이 탭에서는 계속 볼 수 있지만, 새로고침하면 최근 발견 기록을 잃을 수 있어.';
  }

  function saveStore() {
    store.discovered = [...discovered];
    store.visitedStages = [...visitedStages];
    try { localStorage.setItem(KEY, JSON.stringify(store)); }
    catch { storageWarning(); }
  }

  function visitStage(stageId, options = {}) {
    const stage = STAGES.find(item => item.id === stageId);
    if (!stage) return false;
    let changed = false;
    if (!visitedStages.has(stageId)) { visitedStages.add(stageId); changed = true; }
    (Array.isArray(stage.words) ? stage.words : []).forEach(word => {
      if (WORDS[word] && !discovered.has(word)) { discovered.add(word); changed = true; }
    });
    const regionId = C.stageRegionId(stageId), region = regionById(regionId);
    if (options.trackLast !== false && region) {
      if (store.lastRegionId !== region.id || store.lastChapterId !== region.chapterId) changed = true;
      store.lastRegionId = region.id;
      store.lastChapterId = region.chapterId;
    }
    if (changed && options.persist !== false) saveStore();
    if (changed && options.render !== false && $('wordsView') && !$('wordsView').hidden) render();
    return changed;
  }

  function syncProgress(progress) {
    let changed = false;
    const completed = Array.isArray(progress?.completedStages) ? progress.completedStages : [];
    completed.forEach(stageId => { if (visitStage(stageId, { trackLast: false, persist: false, render: false })) changed = true; });
    const nodeId = progress?.lastLocation?.nodeId;
    if (progress?.lastLocation?.view === 'tactical' && typeof nodeId === 'string' && nodeId.startsWith('stage:')) {
      if (visitStage(nodeId.slice(6), { trackLast: true, persist: false, render: false })) changed = true;
    }
    if (changed) saveStore();
  }

  const isDiscovered = word => discovered.has(word);
  const appearancesFor = word => APPEARANCES.byWord.get(word) || [];
  const encounteredAppearances = word => appearancesFor(word).filter(item => visitedStages.has(item.stageId));
  const regionWords = regionId => APPEARANCES.orderedWords.filter(word => appearancesFor(word).some(item => item.regionId === regionId));
  const chapterWords = chapterId => APPEARANCES.orderedWords.filter(word => appearancesFor(word).some(item => item.chapterId === chapterId));
  const discoveredRegionWords = regionId => regionWords(regionId).filter(isDiscovered);
  const discoveredChapterWords = chapterId => chapterWords(chapterId).filter(isDiscovered);

  function initialChapter() {
    if (chapterById(store.lastChapterId)) return store.lastChapterId;
    const lastVisited = [...visitedStages].reverse().map(id => C.stageRegionId(id)).find(Boolean);
    const region = regionById(lastVisited);
    return region?.chapterId || C.CHAPTERS[0]?.id || null;
  }

  function visibleGroupWords(group) { return group.words.filter(isDiscovered); }
  function visibleRelated(group) { return (group.related || []).filter(isDiscovered); }
  function groupIsComplete(group) { return group.words.every(isDiscovered); }

  function wordButton(word, compact = false) {
    const detail = WORDS[word], meta = C.WORD_META[word] || {};
    return `<button class="${compact ? 'lexiconWordRow' : 'lexiconCompareWord'}" data-lexicon-word="${esc(word)}">
      <span class="lexiconWordZh" lang="zh-Hant">${esc(word)}</span>
      <span class="lexiconZhuyin">${esc(detail.p || '')}</span>
      <span class="lexiconMeaning">${esc(detail.k || '')}</span>
      ${compact ? '' : `<span class="lexiconExample" lang="zh-Hant">${esc(detail.ex || '')}</span>${meta.exampleKo ? `<span class="lexiconExampleKo">${esc(meta.exampleKo)}</span>` : ''}`}
    </button>`;
  }

  function setHeader(title, kicker) {
    $('wordsTitle').textContent = title;
    $('wordsKicker').textContent = kicker || '';
    $('wordsSearchBtn').hidden = state.view === 'search';
    $('wordsChapterBar').hidden = state.view !== 'home';
  }

  function renderChapterSelect() {
    const select = $('wordsChapterSelect');
    if (!select) return;
    select.innerHTML = C.CHAPTERS.map(chapter => `<option value="${esc(chapter.id)}"${chapter.id === state.chapterId ? ' selected' : ''}>${esc(chapter.titleKo)}</option>`).join('');
  }

  function renderHome() {
    const chapter = chapterById(state.chapterId) || C.CHAPTERS[0];
    state.chapterId = chapter?.id || null;
    setHeader('단어장', '게임에서 만난 말을 다시 연결하기');
    renderChapterSelect();
    const regions = (chapter?.regions || []).map(regionById).filter(Boolean);
    const cards = regions.map(region => {
      const all = regionWords(region.id), seen = all.filter(isDiscovered);
      return `<button class="lexiconRegionCard" data-lexicon-region="${esc(region.id)}">
        <span class="lexiconRegionNames"><strong>${esc(region.nameKo)}</strong><small lang="zh-Hant">${esc(region.nameZh)}</small></span>
        <span class="lexiconRegionAxis">${esc(region.axisKo)}</span>
        <span class="lexiconProgress">발견 ${seen.length} / ${all.length}</span>
      </button>`;
    }).join('');
    const seen = discoveredChapterWords(chapter?.id);
    $('wordsContent').innerHTML = `<section class="lexiconIntro"><p>${esc(chapter?.subtitleKo || '')}</p></section>
      <div class="lexiconRegionList">${cards}</div>
      <button class="lexiconAllButton" data-lexicon-all="chapter"${seen.length ? '' : ' disabled'}>이 구간에서 발견한 단어 전체 보기 <span>${seen.length}</span></button>`;
  }

  function renderRegion() {
    const region = regionById(state.regionId);
    if (!region) { state.view = 'home'; return renderHome(); }
    const chapter = chapterById(region.chapterId);
    setHeader(region.nameKo, chapter?.titleKo || '단어장');
    const groups = C.GROUPS.filter(group => group.regionId === region.id).map(group => {
      const visible = visibleGroupWords(group);
      if (!visible.length) return '';
      const complete = groupIsComplete(group);
      const display = complete ? group.displayZh : visible.join(' · ');
      const note = complete ? group.noteKo : '지금까지 만난 단어부터 나란히 살펴볼 수 있어.';
      return `<button class="lexiconGroupCard" data-lexicon-group="${esc(group.id)}">
        <strong>${esc(group.titleKo)}</strong>
        <span class="lexiconGroupWords" lang="zh-Hant">${esc(display)}</span>
        <span class="lexiconGroupNote">${esc(note)}</span>
      </button>`;
    }).join('');
    const words = discoveredRegionWords(region.id);
    $('wordsContent').innerHTML = `<section class="lexiconIntro"><p>${esc(region.descriptionKo)}</p></section>
      <div class="lexiconGroupList">${groups || '<p class="lexiconEmpty">아직 이 지역에서 발견한 단어가 없어.</p>'}</div>
      <button class="lexiconAllButton" data-lexicon-all="region"${words.length ? '' : ' disabled'}>${esc(region.nameKo)}에서 발견한 단어 전체 보기 <span>${words.length}</span></button>`;
  }

  function renderGroup() {
    const group = groupById(state.groupId);
    if (!group) { state.view = 'region'; return renderRegion(); }
    const region = regionById(group.regionId), visible = visibleGroupWords(group), complete = groupIsComplete(group);
    setHeader(group.titleKo, region?.nameKo || '단어장');
    const related = visibleRelated(group);
    $('wordsContent').innerHTML = `<div class="lexiconCompareList">${visible.map(word => wordButton(word)).join('')}</div>
      <section class="lexiconCompareNote">
        <h2>비교하면</h2>
        <p>${esc(complete ? group.noteKo : '아직 이 묶음의 모든 단어를 만나지는 않았어. 지금까지 만난 단어의 뜻과 용례부터 비교해봐.')}</p>
        ${complete && group.gameNoteKo ? `<h2>게임에서</h2><p>${esc(group.gameNoteKo)}</p>` : ''}
      </section>
      ${related.length ? `<section class="lexiconRelated"><h2>같이 보면</h2><div>${related.map(word => `<button data-lexicon-word="${esc(word)}" lang="zh-Hant">${esc(word)}</button>`).join('')}</div></section>` : ''}`;
  }

  function relatedWordsFor(word) {
    const result = [];
    C.GROUPS.forEach(group => {
      const pool = [...group.words, ...(group.related || [])];
      if (!pool.includes(word)) return;
      pool.forEach(item => { if (item !== word && isDiscovered(item) && !result.includes(item)) result.push(item); });
    });
    return result;
  }

  function renderWord() {
    const word = state.word, detail = WORDS[word];
    if (!detail || !isDiscovered(word)) { state.view = 'home'; return renderHome(); }
    const meta = C.WORD_META[word] || {}, related = relatedWordsFor(word), appearances = encounteredAppearances(word);
    setHeader(word, '개별 단어');
    const appearanceHtml = appearances.length ? appearances.map((item, index) => {
      const region = regionById(item.regionId), chapter = chapterById(item.chapterId);
      return `<li><span>${index === 0 ? '처음 만난 곳' : '다시 나온 곳'}</span><strong>${esc(region?.nameKo || chapter?.titleKo || '여행')} · ${esc(item.stageTitle)}</strong></li>`;
    }).join('') : '<li><strong>현재 여행에서 발견한 단어</strong></li>';
    $('wordsContent').innerHTML = `<article class="lexiconWordDetail">
      <div class="lexiconDetailHero"><h2 lang="zh-Hant">${esc(word)}</h2><div class="lexiconZhuyin">${esc(detail.p || '')}</div><div class="lexiconDetailMeaning">${esc(detail.k || '')}</div></div>
      <section><h3>일반 용례</h3><p class="lexiconSentence" lang="zh-Hant">${esc(detail.ex || '')}</p>${meta.exampleKo ? `<p class="lexiconTranslation">${esc(meta.exampleKo)}</p>` : ''}${meta.usageKo ? `<p class="lexiconUsage">${esc(meta.usageKo)}</p>` : ''}</section>
      <section><h3>게임에서</h3><p>${esc(detail.rule || '')}</p></section>
      ${related.length ? `<section class="lexiconRelated"><h3>같이 보면</h3><div>${related.map(item => `<button data-lexicon-word="${esc(item)}" lang="zh-Hant">${esc(item)}</button>`).join('')}</div></section>` : ''}
      <section><h3>여정에서 만난 곳</h3><ol class="lexiconAppearances">${appearanceHtml}</ol></section>
    </article>`;
  }

  function wordsForCurrentScope() {
    if (state.regionId) return discoveredRegionWords(state.regionId);
    return discoveredChapterWords(state.chapterId);
  }

  function renderAll() {
    const region = regionById(state.regionId), chapter = chapterById(state.chapterId);
    const title = region ? `${region.nameKo} 전체 단어` : `${chapter?.titleKo || '여행'} 전체 단어`;
    setHeader(title, '처음 만난 순서');
    const words = wordsForCurrentScope();
    $('wordsContent').innerHTML = words.length ? `<div class="lexiconWordRows">${words.map(word => wordButton(word, true)).join('')}</div>` : '<p class="lexiconEmpty">아직 발견한 단어가 없어.</p>';
  }

  function searchWords(query) {
    const q = query.trim().toLowerCase(), compact = q.replace(/\s+/g, '');
    if (!q) return [];
    return APPEARANCES.orderedWords.filter(word => {
      if (!isDiscovered(word)) return false;
      const detail = WORDS[word];
      return word.toLowerCase().includes(q) || String(detail.k || '').toLowerCase().includes(q) || String(detail.p || '').toLowerCase().replace(/\s+/g, '').includes(compact);
    });
  }

  function renderSearchResults() {
    const target = $('lexiconSearchResults');
    if (!target) return;
    const results = searchWords(state.query);
    target.innerHTML = state.query.trim() ? (results.length ? results.map(word => wordButton(word, true)).join('') : '<p class="lexiconEmpty">발견한 단어 중에는 검색 결과가 없어.</p>') : '<p class="lexiconEmpty">번체 중국어, 한국어 뜻, 주음으로 찾을 수 있어.</p>';
  }

  function renderSearch() {
    setHeader('단어 검색', '발견한 단어에서 찾기');
    $('wordsContent').innerHTML = `<section class="lexiconSearch"><label for="lexiconSearchInput">단어 검색</label><input id="lexiconSearchInput" type="search" inputmode="search" autocomplete="off" placeholder="例) 通過 · 통과 · ㄊㄨㄥ" value="${esc(state.query)}"></section><div id="lexiconSearchResults" class="lexiconWordRows"></div>`;
    const input = $('lexiconSearchInput');
    input.addEventListener('input', () => { state.query = input.value; renderSearchResults(); });
    renderSearchResults();
    requestAnimationFrame(() => input.focus());
  }

  function render() {
    if (!$('wordsView')) return;
    if (state.view === 'home') renderHome();
    else if (state.view === 'region') renderRegion();
    else if (state.view === 'group') renderGroup();
    else if (state.view === 'word') renderWord();
    else if (state.view === 'all') renderAll();
    else if (state.view === 'search') renderSearch();
    window.scrollTo(0, 0);
  }

  function navigate(next) {
    history.push({ ...state });
    state = { ...state, ...next };
    render();
  }

  function exit() {
    if (!globalThis.GameFlow) return;
    if (returnView === 'worldView') GameFlow.showWorld();
    else if (returnView === 'journeyView') GameFlow.showJourney();
    else GameFlow.resume();
  }

  function back() {
    if (history.length) { state = history.pop(); render(); return; }
    exit();
  }

  function mount() {
    if (mounted || !$('wordsView')) return;
    mounted = true;
    $('wordsBackBtn').addEventListener('click', back);
    $('wordsSearchBtn').addEventListener('click', () => navigate({ view: 'search', query: '' }));
    $('wordsChapterSelect').addEventListener('change', event => {
      state.chapterId = event.target.value;
      state.regionId = null; state.groupId = null; state.word = null;
      store.lastChapterId = state.chapterId; store.lastRegionId = null; saveStore(); render();
    });
    $('wordsContent').addEventListener('click', event => {
      const regionButton = event.target.closest('[data-lexicon-region]');
      if (regionButton) {
        const region = regionById(regionButton.dataset.lexiconRegion);
        if (!region) return;
        store.lastRegionId = region.id; store.lastChapterId = region.chapterId; saveStore();
        navigate({ view: 'region', chapterId: region.chapterId, regionId: region.id, groupId: null, word: null }); return;
      }
      const groupButton = event.target.closest('[data-lexicon-group]');
      if (groupButton) {
        const group = groupById(groupButton.dataset.lexiconGroup);
        if (!group || !visibleGroupWords(group).length) return;
        navigate({ view: 'group', chapterId: group.chapterId, regionId: group.regionId, groupId: group.id, word: null }); return;
      }
      const wordButtonEl = event.target.closest('[data-lexicon-word]');
      if (wordButtonEl) {
        const word = wordButtonEl.dataset.lexiconWord;
        if (!isDiscovered(word)) return;
        navigate({ view: 'word', word }); return;
      }
      const allButton = event.target.closest('[data-lexicon-all]');
      if (allButton && !allButton.disabled) navigate({ view: 'all', groupId: null, word: null });
    });
  }

  function open(options = {}) {
    mount();
    const visible = [...document.querySelectorAll('.appView')].find(view => !view.hidden && view.id !== 'wordsView');
    if (visible) returnView = visible.id;
    syncProgress(options.progress);
    history = [];
    state = { view: 'home', chapterId: initialChapter(), regionId: null, groupId: null, word: null, query: '' };
    if (options.word && isDiscovered(options.word)) {
      history.push({ ...state });
      state = { ...state, view: 'word', word: options.word };
    }
    TacticalGame.closeSheet();
    TacticalGame.showView('words');
    render();
    return true;
  }

  globalThis.LexiconRuntime = Object.freeze({
    KEY, open, visitStage, syncProgress,
    isDiscovered,
    snapshot: () => ({ discovered: [...discovered], visitedStages: [...visitedStages], lastChapterId: store.lastChapterId, lastRegionId: store.lastRegionId }),
    __test: Object.freeze({ buildAppearanceIndex, searchWords })
  });
})();
