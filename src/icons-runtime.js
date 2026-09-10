(() => {
  const rotations = {
    '→': '0deg',
    '↓': '90deg',
    '←': '180deg',
    '↑': '-90deg'
  };

  function syncMoveArrows(root = document) {
    root.querySelectorAll('.move-arrow:not([data-icon="move"])').forEach((el) => {
      const direction = el.textContent.trim();
      const rotation = rotations[direction];
      if (!rotation) return;
      el.dataset.icon = 'move';
      el.style.setProperty('--move-rotate', rotation);
      el.textContent = '';
    });
  }

  function syncInspectButton() {
    const button = document.getElementById('inspectBtn');
    if (!button) return;
    if (button.textContent.trim() === '살펴보기') button.dataset.icon = 'inspect';
    else button.removeAttribute('data-icon');
  }

  function syncSheetButtons(root = document) {
    root.querySelectorAll('.sheetactions button').forEach((button) => {
      if (button.textContent.trim() === '닫기') button.dataset.icon = 'close';
      else button.removeAttribute('data-icon');
    });
  }

  function sync(root = document) {
    syncMoveArrows(root);
    syncInspectButton();
    syncSheetButtons(root);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        sync(document);
        break;
      }
    }
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true
  });

  sync(document);
})();
