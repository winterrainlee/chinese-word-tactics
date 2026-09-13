/* Lightweight lexicon UI polish: quick-sheet bridge plus learner-facing section copy. */
(() => {
  const sheet = document.getElementById('sheet');
  const wordsContent = document.getElementById('wordsContent');
  if (!sheet || !globalThis.LexiconRuntime || typeof WORDS === 'undefined') return;

  function enhanceSheet() {
    const title = sheet.querySelector(':scope > h2');
    const word = title?.textContent?.trim();
    const actions = sheet.querySelector('.sheetactions');
    if (!word || !WORDS[word] || !actions || actions.querySelector('[data-open-lexicon-word]')) return;

    const link = document.createElement('a');
    link.href = '#';
    link.className = 'lexiconSheetLink';
    link.dataset.openLexiconWord = word;
    link.textContent = '어떻게 다를까?';
    link.onclick = event => {
      event.preventDefault();
      const stageId = globalThis.TacticalGame?.stageId?.();
      if (stageId) LexiconRuntime.visitStage(stageId);
      LexiconRuntime.open({ word, progress: globalThis.GameFlow?.progress?.() });
    };
    actions.prepend(link);
  }

  function polishLexiconCopy() {
    if (!wordsContent) return;
    wordsContent.querySelectorAll('.lexiconCompareNote h2').forEach(heading => {
      if (heading.textContent.trim() === '비교하면') heading.textContent = '어떻게 다를까?';
    });
    wordsContent.querySelectorAll('.lexiconRelated h2, .lexiconRelated h3').forEach(heading => {
      if (heading.textContent.trim() === '같이 보면') heading.textContent = '이것도 참고하자';
    });
  }

  new MutationObserver(enhanceSheet).observe(sheet, { childList: true, subtree: true });
  if (wordsContent) new MutationObserver(polishLexiconCopy).observe(wordsContent, { childList: true, subtree: true });
  enhanceSheet();
  polishLexiconCopy();
})();