(() => {
  const $ = id => document.getElementById(id);
  const speakers = { narrator: ['旁白', '이야기'], boy: ['少年', '소년'], merchant: ['行商阿姨', '행상 아주머니'], marketkeeper: ['市集管理人', '장터지기'], innkeeper: ['客棧主人', '여관 주인'], gatekeeper: ['守門人', '길지기'], driver: ['車夫', '수레꾼'], artisan: ['工匠', '장인'], collector: ['採集人', '채집인'], resident: ['居民', '주민'], unknown: ['遠處的聲音', '멀리서 들리는 목소리'] };
  const portraits = Object.freeze({
    boy: './icons/world/world-hero.svg',
    merchant: './icons/characters/character-merchant.svg',
    gatekeeper: './icons/characters/character-gatekeeper.svg',
    artisan: './icons/characters/character-artisan.svg',
    marketkeeper: './icons/characters/character-marketkeeper.svg',
    innkeeper: './icons/characters/character-innkeeper.svg',
    driver: './icons/characters/character-driver.svg',
    collector: './icons/characters/character-collector.svg',
    resident: './icons/characters/character-resident.svg'
  });
  const backgrounds = { origin: 'region-origin', forest: 'region-origin', roadside: 'region-gate-town', gate: 'region-gate-town', workshop: 'region-workshop-town', market: 'region-market-town', inn: 'subplace-inn' };
  const isHan = character => /\p{Script=Han}/u.test(character);
  let session = null;
  function pronunciationEnabled() { return globalThis.SettingsRuntime?.showPronunciation?.() === true; }
  function renderChinese(element, text, storyId, ariaLabel = text) {
    const syllables = pronunciationEnabled() ? globalThis.StoryPronunciation?.readingFor?.(storyId, text) : null;
    element.dataset.pronunciation = syllables ? 'true' : 'false';
    element.setAttribute('aria-label', ariaLabel);
    if (!syllables) {
      element.textContent = text;
      return;
    }
    const fragment = document.createDocumentFragment();
    let readingIndex = 0;
    for (const character of text) {
      if (!isHan(character)) {
        fragment.append(document.createTextNode(character));
        continue;
      }
      const ruby = document.createElement('ruby');
      const base = document.createElement('rb');
      const reading = document.createElement('rt');
      base.textContent = character;
      reading.textContent = syllables[readingIndex++] || '';
      reading.setAttribute('aria-hidden', 'true');
      ruby.append(base, reading);
      fragment.append(ruby);
    }
    element.replaceChildren(fragment);
  }
  function render() {
    if (!session) return;
    const { story, index, options } = session, beat = story.beats[index];
    $('storyTitle').textContent = story.titleKo;
    renderChinese($('storyPlace'), story.placeZh, story.id, `${story.placeZh} · ${story.placeKo}`);
    $('storyPlace').append(document.createTextNode(` · ${story.placeKo}`));
    $('storyBackdrop').src = `./icons/world/regions/${backgrounds[story.background] || 'region-origin'}.svg`;
    $('storyScene').dataset.place = story.background;
    const portraitEl = $('storyPortrait'), portrait = portraits[beat.speaker];
    portraitEl.hidden = !portrait;
    if (portrait) {
      portraitEl.src = portrait;
      portraitEl.dataset.speaker = beat.speaker;
    } else {
      portraitEl.removeAttribute('data-speaker');
    }
    const speaker = speakers[beat.speaker] || [beat.speaker];
    renderChinese($('storySpeaker'), speaker[0], story.id, speaker.join(' · '));
    renderChinese($('storyZh'), beat.zh, story.id);
    $('storyKo').textContent = beat.ko;
    $('storyKo').hidden = true;
    $('storyTranslate').textContent = '한국어 뜻 보기';
    $('storyTranslate').setAttribute('aria-expanded', 'false');
    $('storyCount').textContent = `${index + 1} / ${story.beats.length}`;
    $('storyPrev').disabled = index === 0;
    $('storyNext').textContent = index === story.beats.length - 1 ? options.endLabel : '다음';
    $('storySkip').hidden = !options.seen;
    $('storyReading').scrollTop = 0;
    options.onPosition(index);
  }
  function finish() {
    if (!session) return;
    const callback = session.options.onFinish;
    session = null;
    callback();
  }
  $('storyTranslate').onclick = () => {
    const open = $('storyKo').hidden;
    $('storyKo').hidden = !open;
    $('storyTranslate').textContent = open ? '한국어 뜻 접기' : '한국어 뜻 보기';
    $('storyTranslate').setAttribute('aria-expanded', String(open));
  };
  $('storyPrev').onclick = () => { if (session?.index > 0) { session.index--; render(); } };
  $('storyNext').onclick = () => {
    if (!session) return;
    if (session.index + 1 < session.story.beats.length) { session.index++; render(); }
    else finish();
  };
  $('storySkip').onclick = () => { if (session?.options.seen) finish(); };
  $('storyMenu').onclick = () => GameFlow.showMenu();
  globalThis.StoryRuntime = Object.freeze({
    play(story, options) {
      if (!story?.beats?.length) return false;
      session = { story, options, index: Math.min(Math.max(0, options.beat || 0), story.beats.length - 1) };
      render(); return true;
    },
    stop() { session = null; },
    refresh() { if (session) render(); }
  });
})();
