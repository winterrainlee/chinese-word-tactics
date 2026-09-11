(() => {
  const gateTacticalIcons = Object.freeze({
    cart: './icons/tactical/gate-town/cart.png',
    crate: './icons/tactical/gate-town/crate.png',
    obstacle: './icons/tactical/gate-town/obstacle-rock.png',
    bellTower: './icons/tactical/gate-town/bell-tower.png',
    outpost: './icons/tactical/gate-town/outpost.png',
    gate: './icons/tactical/gate-town/gate.png',
    gateClosed: './icons/tactical/gate-town/gate-closed.png',
    signpost: './icons/tactical/gate-town/signpost.png',
    narrowPass: './icons/tactical/gate-town/narrow-pass.png'
  });
  globalThis.GATE_TACTICAL_ICONS = gateTacticalIcons;

  if (typeof document === 'undefined') return;

  const iconProperties = {
    cart: '--gate-icon-cart',
    crate: '--gate-icon-crate',
    obstacle: '--gate-icon-obstacle',
    bellTower: '--gate-icon-bell-tower',
    outpost: '--gate-icon-outpost',
    gate: '--gate-icon-gate',
    gateClosed: '--gate-icon-gate-closed',
    signpost: '--gate-icon-signpost',
    narrowPass: '--gate-icon-narrow-pass'
  };
  for (const [kind, property] of Object.entries(iconProperties)) {
    const url = new URL(gateTacticalIcons[kind], document.baseURI).href;
    document.documentElement.style.setProperty(property, `url("${url}")`);
  }

  const rotations = {
    '→': '0deg',
    '↓': '90deg',
    '←': '180deg',
    '↑': '-90deg'
  };

  const HERO_REACTION_MS = 450;
  const heroPanicPreload = new Image();
  heroPanicPreload.decoding = 'async';
  heroPanicPreload.src = new URL('./icons/world/world-hero-panic.svg', document.baseURI).href;
  let heroReactionKind = null;
  let heroReactionUntil = 0;
  let heroReactionTimer = null;

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

  function reactionIsActive() {
    return heroReactionKind && performance.now() < heroReactionUntil;
  }

  function syncHeroReaction(root = document) {
    const active = reactionIsActive();
    root.querySelectorAll('.hero').forEach((hero) => {
      if (active) hero.dataset.mood = heroReactionKind;
      else hero.removeAttribute('data-mood');
    });
  }

  function finishHeroReactionWhenDue() {
    clearTimeout(heroReactionTimer);
    const remaining = heroReactionUntil - performance.now();
    if (remaining > 0) {
      heroReactionTimer = setTimeout(finishHeroReactionWhenDue, remaining + 16);
      return;
    }
    heroReactionKind = null;
    heroReactionUntil = 0;
    heroReactionTimer = null;
    syncHeroReaction(document);
  }

  window.flashHeroReaction = (kind = 'panic') => {
    if (kind !== 'panic') return;
    heroReactionKind = kind;
    heroReactionUntil = performance.now() + HERO_REACTION_MS;
    syncHeroReaction(document);
    finishHeroReactionWhenDue();
  };

  function sync(root = document) {
    syncMoveArrows(root);
    syncInspectButton();
    syncSheetButtons(root);
    syncHeroReaction(root);
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
