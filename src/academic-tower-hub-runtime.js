/* Permanent Academic Tower hub: room selection is separate from tower-wide completion. */
(() => {
  const REGION_ID = 'academic-tower';
  const ENTERED_MILESTONE = 'academic-tower-entered';
  const bundle = globalThis.AcademicTowerContent?.bundle;

  function roomState(room, progress) {
    const completed = new Set(progress?.completedStages || []);
    if (completed.has(room.id)) return 'complete';
    if (!(room.requires || []).every(id => completed.has(id))) return 'locked';
    const journeyNode = globalThis.JourneyProgress?.getNode?.(`stage:${room.id}`);
    if (journeyNode && !globalThis.JourneyProgress.isAvailable(journeyNode, progress)) {
      const intro = room.optional && globalThis.JourneyProgress.getNode('story:academic-tower-ran-intro');
      if (!intro || !globalThis.JourneyProgress.isAvailable(intro, progress)) return 'locked';
    }
    return room.implemented ? 'available' : 'planned';
  }

  function canEnter(progress) {
    return Array.isArray(progress?.completedMilestones) && progress.completedMilestones.includes(ENTERED_MILESTONE);
  }

  function render() {
    if (!bundle) return false;
    const progress = globalThis.GameFlow?.progress?.() || { completedStages: [], completedMilestones: [] };
    const list = document.getElementById('academicTowerRooms');
    const summary = document.getElementById('academicTowerSummary');
    if (!list || !summary) return false;

    const mainRooms = bundle.rooms.filter(room => !room.optional);
    const optionalRooms = bundle.rooms.filter(room => room.optional);
    const completeCount = mainRooms.filter(room => progress.completedStages.includes(room.id)).length;
    const optionalCount = optionalRooms.filter(room => progress.completedStages.includes(room.id)).length;
    const foundation = progress.completedMilestones.includes('academic-tower-turn-foundation');
    summary.textContent = foundation
      ? '연구 완료 · 첫 관찰 메모를 보관했어.'
      : `연구 ${completeCount}/${mainRooms.length} · ${completeCount === mainRooms.length ? '마지막 이야기를 확인해 보자.' : '기록을 살펴보고 연구를 이어가자.'}`;

    const roomButton = room => {
      const state = roomState(room, progress);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'academicTowerRoom';
      button.dataset.roomId = room.id;
      button.dataset.state = state;
      button.disabled = state === 'locked' || state === 'planned';

      const number = document.createElement('span');
      number.className = 'academicTowerRoomNumber';
      number.textContent = room.optional ? '＋' : room.number;

      const names = document.createElement('span');
      names.className = 'academicTowerRoomNames';
      const ko = document.createElement('strong');
      ko.textContent = room.titleKo;
      if (room.optional && state === 'complete') ko.textContent = '색인 옆의 메모 · 같은 然';

      const terms = document.createElement('span');
      terms.className = 'academicTowerRoomTerms';
      terms.lang = 'zh-Hant';
      terms.textContent = room.expressions.join(' · ') || (room.optional ? '선택 연구' : '종합');
      names.append(ko, terms);

      if (state === 'locked') {
        const prerequisite = document.createElement('small');
        const missing = (room.requires || []).filter(id => !progress.completedStages.includes(id));
        prerequisite.textContent = missing.length
          ? `먼저 연구: ${missing.map(id => bundle.rooms.find(candidate => candidate.id === id)?.titleKo || id).join(' · ')}`
          : '여정에서 앞선 이야기를 먼저 확인해.';
        names.append(prerequisite);
      }

      const stateLabel = document.createElement('span');
      stateLabel.className = 'academicTowerRoomState';
      stateLabel.textContent = state === 'complete' ? '✓ 연구 완료' : state === 'available' ? '연구하기' : state === 'planned' ? '준비 중' : '잠김';
      if (state === 'complete') button.setAttribute('aria-label', `${ko.textContent} · 연구 완료 · 다시 연구`);

      button.append(number, names, stateLabel);
      if (!button.disabled) {
        button.onclick = () => room.optional && !progress.seenStories?.includes('academic-tower-ran-intro')
          ? globalThis.GameFlow?.playStory?.('academic-tower-ran-intro', { returnTo: REGION_ID })
          : globalThis.GameFlow?.playStage?.(room.id, {
          mode: state === 'complete' ? 'replay' : 'first-play',
          returnTo: REGION_ID
        });
      }
      return button;
    };

    const sideRoom = room => {
      const aside = document.createElement('aside');
      aside.className = 'academicHubSideResearch';
      aside.dataset.sideGroup = room.sideGroup || '';

      const heading = document.createElement('h4');
      heading.textContent = '곁가지 연구';

      const note = document.createElement('p');
      note.className = 'academicHubNote';
      const requiredNumbers = (room.requires || [])
        .map(id => bundle.rooms.find(candidate => candidate.id === id)?.number)
        .filter(Boolean)
        .join('·');
      note.textContent = `선택 연구 ${optionalCount}/${optionalRooms.length} · ${requiredNumbers || '관련 연구'}을 마치면 살펴볼 수 있어.`;

      aside.append(heading, note, roomButton(room));
      return aside;
    };

    const groups = [
      { id: 'first', title: '첫 기록', numbers: ['01'] },
      { id: 'branch', title: '두 갈래 연구', numbers: ['02', '03'], note: '어느 쪽부터 살펴봐도 좋아.' },
      { id: 'synthesis', title: '기록 종합', numbers: ['04', '05'] }
    ];

    list.replaceChildren();
    const placedOptionalIds = new Set();

    for (const definition of groups) {
      const group = document.createElement('section');
      group.className = 'academicHubGroup';
      group.dataset.group = definition.id;

      const heading = document.createElement('h3');
      heading.textContent = definition.title;
      group.append(heading);

      if (definition.note) {
        const note = document.createElement('p');
        note.className = 'academicHubNote';
        note.textContent = definition.note;
        group.append(note);
      }

      for (const number of definition.numbers) {
        const room = mainRooms.find(candidate => candidate.number === number);
        if (room) group.append(roomButton(room));
      }

      for (const room of optionalRooms.filter(candidate => candidate.sideGroup === definition.id)) {
        group.append(sideRoom(room));
        placedOptionalIds.add(room.id);
      }

      list.append(group);
    }

    const unplacedOptionalRooms = optionalRooms.filter(room => !placedOptionalIds.has(room.id));
    if (unplacedOptionalRooms.length) {
      const group = document.createElement('section');
      group.className = 'academicHubGroup';
      group.dataset.group = 'optional';
      const heading = document.createElement('h3');
      heading.textContent = '곁가지 연구';
      group.append(heading);
      for (const room of unplacedOptionalRooms) group.append(roomButton(room));
      list.append(group);
    }

    list.scrollTop = 0;
    return true;
  }

  function showHub() {
    if (!bundle) return false;
    globalThis.TacticalGame?.showView?.('academicTower');
    render(); window.scrollTo(0, 0); return true;
  }

  function enter(regionId, progress) {
    if (regionId !== REGION_ID || !canEnter(progress)) return false;
    return showHub();
  }

  for (const id of ['academicTowerBack', 'academicTowerBackFooter']) {
    document.getElementById(id)?.addEventListener('click', () => globalThis.GameFlow?.showWorld?.());
  }
  for (const id of ['academicTowerJourney', 'academicTowerJourneyFooter']) {
    document.getElementById(id)?.addEventListener('click', () => globalThis.GameFlow?.showRegionPractice?.(REGION_ID));
  }

  globalThis.AcademicTowerRuntime = Object.freeze({ REGION_ID, ENTERED_MILESTONE, roomState, canEnter, render, showHub, enter });
})();
