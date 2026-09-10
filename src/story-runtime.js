(() => {
  const $ = id => document.getElementById(id);
  const speakers = { narrator: ['旁白', '이야기'], boy: ['少年', '소년'], merchant: ['行商', '행상인'], gatekeeper: ['守門人', '길지기'], unknown: ['遠處的聲音', '멀리서 들리는 목소리'] };
  const backgrounds = { origin: 'region-origin', forest: 'region-origin', roadside: 'region-gate-town', gate: 'region-gate-town' };
  let session = null;
  function render() {
    if (!session) return;
    const { story, index, options } = session, beat = story.beats[index];
    $('storyTitle').textContent = story.titleKo;
    $('storyPlace').textContent = `${story.placeZh} · ${story.placeKo}`;
    $('storyBackdrop').src = `./icons/world/regions/${backgrounds[story.background] || 'region-origin'}.svg`;
    $('storyScene').dataset.place = story.background;
    $('storyPortrait').hidden = beat.speaker !== 'boy';
    $('storySpeaker').textContent = (speakers[beat.speaker] || [beat.speaker])[0];
    $('storySpeaker').setAttribute('aria-label', (speakers[beat.speaker] || [beat.speaker]).join(' · '));
    $('storyZh').textContent = beat.zh;
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
    session = null; // A repeated tap cannot complete the same scene twice.
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
    stop() { session = null; }
  });
})();
