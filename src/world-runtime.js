(() => {
  const regionByChineseName = new Map(WORLD.regions.map((region) => [region.name, region]));
  const regionIconPath = (region) => `./icons/world/regions/${region.icon}.svg`;
  const chineseNameFromLabel = (text) => text.replace(/^✓\s*/, '').trim();

  function enhanceRegionCards() {
    document.querySelectorAll('#worldRegions .regionCard:not([data-world-presented])').forEach((card) => {
      const title = card.querySelector('strong');
      const subtitle = card.querySelector('small');
      const state = card.querySelector('.regionState');
      if (!title || !subtitle || !state) return;

      const region = regionByChineseName.get(chineseNameFromLabel(title.textContent));
      if (!region) return;

      const visited = /^✓/.test(title.textContent.trim());
      title.textContent = `${visited ? '✓ ' : ''}${region.nameKo || region.name}`;

      const icon = document.createElement('img');
      icon.className = 'regionIcon';
      icon.src = regionIconPath(region);
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');

      const chineseName = document.createElement('small');
      chineseName.className = 'regionNameZh';
      chineseName.textContent = region.name;

      const names = document.createElement('span');
      names.className = 'regionNames';
      names.append(title, chineseName, subtitle);

      const head = document.createElement('span');
      head.className = 'regionHead';
      head.append(icon, names);
      state.insertAdjacentElement('afterend', head);

      card.dataset.worldPresented = 'true';
      card.dataset.regionId = region.id;
    });
  }

  function enhanceRegionSheet() {
    const sheet = document.getElementById('sheet');
    const title = sheet?.querySelector('h2');
    if (!title) return;

    const region = regionByChineseName.get(title.textContent.trim());
    if (!region) return;

    title.textContent = region.nameKo || region.name;
    const chineseName = document.createElement('div');
    chineseName.className = 'regionSheetNameZh';
    chineseName.textContent = region.name;
    title.insertAdjacentElement('afterend', chineseName);
  }

  function syncWorldPresentation() {
    enhanceRegionCards();
    enhanceRegionSheet();
  }

  const observer = new MutationObserver(syncWorldPresentation);
  observer.observe(document.getElementById('worldRegions'), { childList: true });
  observer.observe(document.getElementById('sheet'), { childList: true, subtree: false });

  syncWorldPresentation();
})();
