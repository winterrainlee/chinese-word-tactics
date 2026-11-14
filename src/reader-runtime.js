(() => {
  if (!globalThis.ReaderMatcher || !globalThis.ReaderContent) return;
  const KEY = 'chinese-word-tactics-reader-draft-v1';
  const $ = id => document.getElementById(id);
  let draft = {schemaVersion:1,title:'',text:'',showMarkers:false,showPunctuation:false,updatedAt:0};
  let loaded = false, origin = null, timer, reading = false, readingScroll = 0;
  const valid = d => d && d.schemaVersion === 1 && typeof d.title === 'string' &&
    typeof d.text === 'string' && typeof d.showMarkers === 'boolean' &&
    (d.showPunctuation === undefined || typeof d.showPunctuation === 'boolean') &&
    Number.isFinite(d.updatedAt) && [...d.title].length <= 100 && [...d.text].length <= 5000 && d.text.trim();
  const message = value => { $('readerStorageStatus').textContent = value; };
  function save() {
    clearTimeout(timer);
    if (!valid(draft)) return;
    try { localStorage.setItem(KEY, JSON.stringify(draft)); message(''); }
    catch { message('임시 저장을 하지 못했어. 이 화면에서는 계속 읽을 수 있어.'); }
  }
  function update() {
    const text = $('readerText').value, title = $('readerTitle').value;
    draft = {...draft,title,text,updatedAt:Date.now()};
    const count = [...text].length;
    $('readerCount').textContent = `${count.toLocaleString()} / 5,000자`;
    $('readerInputStatus').textContent = [...title].length > 100 ? '제목은 100자까지 입력할 수 있어.' :
      count > 5000 ? '본문은 5,000자까지 읽을 수 있어. 입력은 잘라내지 않았어.' :
      !text.trim() ? '읽을 글을 붙여 넣어줘.' : '';
    $('readerRead').disabled = !valid(draft);
    clearTimeout(timer); timer = setTimeout(save, 350);
  }
  function appendText(fragment, text) {
    // Separate presentation spans; punctuation is not a discourse-marker match.
    let at = 0;
    for (const match of text.matchAll(/[，；：]/g)) {
      fragment.append(document.createTextNode(text.slice(at, match.index)));
      const span = document.createElement('span');
      span.className = 'readerPunctuation'; span.textContent = match[0];
      fragment.append(span); at = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(at)));
  }
  function renderText() {
    const body = $('readerBody'), fragment = document.createDocumentFragment();
    let at = 0;
    const spans = ReaderMatcher.detect(draft.text);
    for (const span of spans) {
      appendText(fragment, draft.text.slice(at,span.start));
      const mark = document.createElement('mark');
      mark.textContent = draft.text.slice(span.start,span.end); fragment.append(mark); at = span.end;
    }
    appendText(fragment, draft.text.slice(at));
    body.replaceChildren(fragment);
    $('readerEmpty').hidden = spans.length > 0 || !draft.showMarkers;
    body.classList.toggle('readerMarked',draft.showMarkers);
    $('readerToggle').checked = draft.showMarkers;
    body.classList.toggle('readerPunctuated',draft.showPunctuation);
    $('readerPunctuationToggle').checked = draft.showPunctuation;
    $('readerHeading').textContent = draft.title || '내 글 읽기';
  }
  function mode(next) {
    reading = next;
    $('readerInput').hidden = next; $('readerOutput').hidden = !next;
    $('readerEdit').hidden = !next;
    if (next) renderText();
    else $('readerHeading').textContent = '내 글 읽기';
  }
  function open(options = {}) {
    if (options.returnContext?.viewId === 'readerView') { TacticalGame.closeSheet(); return true; }
    origin = options.returnContext || GameFlow.captureViewContext();
    TacticalGame.showView('reader');
    if (!loaded) {
      loaded = true;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!valid(parsed)) throw Error('Invalid draft');
          draft = {...parsed,showPunctuation:parsed.showPunctuation ?? false}; reading = true;
        }
      } catch { message('임시 글을 불러오지 못했어. 새 글을 붙여 넣어 읽을 수 있어.'); }
      $('readerTitle').value = draft.title; $('readerText').value = draft.text;
      // Validation only: opening an invalid stored value must not overwrite it.
      $('readerRead').disabled = !valid(draft);
      $('readerCount').textContent = `${[...draft.text].length.toLocaleString()} / 5,000자`;
    }
    mode(reading); window.scrollTo(0,reading ? readingScroll : 0);
    return true;
  }
  $('readerText').addEventListener('input',update);
  $('readerTitle').addEventListener('input',update);
  $('readerRead').onclick = () => { update(); if (!valid(draft)) return; save(); mode(true); window.scrollTo(0,readingScroll); $('readerHeading').focus({preventScroll:true}); };
  $('readerEdit').onclick = () => { readingScroll = window.scrollY; mode(false); window.scrollTo(0,0); $('readerText').focus({preventScroll:true}); };
  $('readerToggle').onchange = () => {
    draft.showMarkers = $('readerToggle').checked; draft.updatedAt = Date.now();
    // CSS only: preserve text nodes, selection, focus, line breaks and scroll.
    $('readerBody').classList.toggle('readerMarked',draft.showMarkers);
    $('readerEmpty').hidden = !draft.showMarkers || $('readerBody').querySelector('mark') !== null;
    save();
  };
  $('readerPunctuationToggle').onchange = () => {
    draft.showPunctuation = $('readerPunctuationToggle').checked; draft.updatedAt = Date.now();
    $('readerBody').classList.toggle('readerPunctuated',draft.showPunctuation);
    save();
  };
  $('readerBack').onclick = () => {
    if (reading) readingScroll = window.scrollY;
    save(); if (!GameFlow.restoreViewContext(origin)) GameFlow.showLanding();
  };
  $('readerDelete').onclick = () => {
    $('readerDeleteConfirm').hidden = false; $('readerDeleteCancel').focus();
  };
  $('readerDeleteCancel').onclick = () => { $('readerDeleteConfirm').hidden = true; $('readerDelete').focus(); };
  $('readerDeleteYes').onclick = () => {
    clearTimeout(timer);
    try { localStorage.removeItem(KEY); }
    catch { message('임시 글을 지우지 못했어. 브라우저 저장 권한을 확인해줘.'); return; }
    draft = {schemaVersion:1,title:'',text:'',showMarkers:false,showPunctuation:false,updatedAt:0}; readingScroll = 0;
    $('readerTitle').value = ''; $('readerText').value = '';
    $('readerDeleteConfirm').hidden = true; message(''); update(); mode(false); $('readerText').focus();
  };
  document.addEventListener('visibilitychange',() => { if (document.hidden) save(); });
  window.addEventListener('pagehide',save);
  globalThis.ReaderRuntime = Object.freeze({open});
})();
