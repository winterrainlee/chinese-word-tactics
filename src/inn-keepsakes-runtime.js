/* Persistent keepsakes placed on the inn-room desk after they are actually received in story. */
(() => {
  const ROUTE_STORY_ID = 'gate-after-route';
  const ROUTE_STAGE_ID = 'gate-stage-3';
  const WORKSHOP_STORY_ID = 'workshop-finale';

  const progress = () => globalThis.GameFlow?.progress?.() || {};
  const strings = value => Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string'))] : [];
  const hasSeenStory = (storyId, value = progress()) => strings(value.seenStories).includes(storyId);

  const KEEPERS = Object.freeze({
    'west-pass': Object.freeze({
      id: 'west-pass',
      mark: '西',
      zh: '西哨通行牌',
      ko: '서쪽 초소 통행패',
      note: '서쪽 길을 거쳐 북쪽 출구까지 왔다는 것을 보여주는 나무패야.'
    }),
    'east-pass': Object.freeze({
      id: 'east-pass',
      mark: '東',
      zh: '東哨通行牌',
      ko: '동쪽 초소 통행패',
      note: '동쪽 길을 거쳐 북쪽 출구까지 왔다는 것을 보여주는 나무패야.'
    }),
    'repair-plaque': Object.freeze({
      id: 'repair-plaque',
      mark: '修',
      zh: '修繕牌',
      ko: '공방 수리패',
      note: '장인골 사람들이 간단한 수리 일을 맡겨도 된다는 뜻으로 건넨 작은 신뢰의 표식이야.'
    })
  });

  function keepsakes(value = progress()) {
    const result = [];
    if (hasSeenStory(ROUTE_STORY_ID, value)) {
      const viaIds = strings(value.stageOutcomes?.[ROUTE_STAGE_ID]?.viaIds);
      if (viaIds.includes('west-post')) result.push(KEEPERS['west-pass']);
      if (viaIds.includes('east-post')) result.push(KEEPERS['east-pass']);
    }
    if (hasSeenStory(WORKSHOP_STORY_ID, value)) result.push(KEEPERS['repair-plaque']);
    return result;
  }

  function showKeepsake(item) {
    globalThis.TacticalGame?.openSheet?.(`
      <h2 lang="zh-Hant">${item.zh}</h2>
      <div class="meaning">${item.ko}</div>
      <div class="gamerule">${item.note}</div>
      <div class="tiny">소년이 여행 중 실제로 받아 책상 위에 둔 물건</div>
      <div class="sheetactions"><button id="innKeepsakeClose">닫기</button></div>
    `);
    const close = document.getElementById('innKeepsakeClose');
    if (close) close.onclick = () => globalThis.TacticalGame?.closeSheet?.();
  }

  function createKeepsakeButton(item) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `innDeskKeepsake ${item.id}`;
    button.dataset.keepsakeId = item.id;
    button.setAttribute('aria-label', `${item.zh}, ${item.ko}`);
    button.innerHTML = `<span class="innDeskKeepsakeHole" aria-hidden="true"></span><span class="innDeskKeepsakeMark" lang="zh-Hant">${item.mark}</span>`;
    button.onclick = () => showKeepsake(item);
    return button;
  }

  function ensureLayer() {
    const scene = document.getElementById('innRoomScene');
    if (!scene) return null;
    let layer = scene.querySelector('.innDeskKeepsakes');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.className = 'innDeskKeepsakes';
    layer.setAttribute('role', 'group');
    layer.setAttribute('aria-label', '책상 위 여행의 흔적');
    scene.appendChild(layer);
    return layer;
  }

  function renderDeskKeepsakes(value = progress()) {
    const layer = ensureLayer();
    if (!layer) return [];
    const items = keepsakes(value);
    layer.replaceChildren(...items.map(createKeepsakeButton));
    layer.hidden = items.length === 0;
    return items;
  }

  function syncVisibleRoom() {
    const room = document.getElementById('innRoomView');
    if (!room || room.hidden) return;
    renderDeskKeepsakes();
  }

  function mutationOpensOrCreatesRoom(record) {
    if (record.type === 'attributes') return record.target?.id === 'innRoomView';
    if (record.type !== 'childList') return false;
    return Array.from(record.addedNodes || []).some(node =>
      node?.id === 'innRoomView' || node?.querySelector?.('#innRoomView')
    );
  }

  const app = document.getElementById('app');
  if (app) {
    new MutationObserver(records => {
      if (records.some(mutationOpensOrCreatesRoom)) syncVisibleRoom();
    }).observe(app, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden']
    });
  }
  window.addEventListener('pageshow', syncVisibleRoom);
  setTimeout(syncVisibleRoom, 0);

  globalThis.InnKeepsakes = Object.freeze({
    ROUTE_STORY_ID, ROUTE_STAGE_ID, WORKSHOP_STORY_ID, KEEPERS,
    hasSeenStory, keepsakes, renderDeskKeepsakes, syncVisibleRoom, mutationOpensOrCreatesRoom
  });
})();
