/* Adds one bridge from the in-stage quick word sheet to the standalone lexicon without changing tactical rendering. */
(() => {
  const sheet = document.getElementById('sheet');
  if (!sheet || !globalThis.LexiconRuntime || typeof WORDS === 'undefined') return;

  function enhance() {
    const title = sheet.querySelector(':scope > h2');
    const word = title?.textContent?.trim();
    const actions = sheet.querySelector('.sheetactions');
    if (!word || !WORDS[word] || !actions || actions.querySelector('[data-open-lexicon-word]')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.dataset.openLexiconWord = word;
    button.textContent = '단어장에서 비교하기';
    button.onclick = () => {
      const stageId = globalThis.TacticalGame?.stageId?.();
      if (stageId) LexiconRuntime.visitStage(stageId);
      LexiconRuntime.open({ word, progress: globalThis.GameFlow?.progress?.() });
    };
    actions.prepend(button);
  }

  new MutationObserver(enhance).observe(sheet, { childList: true, subtree: true });
  enhance();
})();
