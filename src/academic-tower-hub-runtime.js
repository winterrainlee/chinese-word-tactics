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

  function makeRoomButton(room, progress) {
    const state = roomState(room, progress);
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'academicTowerRoom';
    button.dataset.roomId = room.id; button.dataset.state = state;
    button.disabled = state === 'locked' || state === 'planned';

    const number = document.createElement('span');
    number.className = 'academicTowerRoomNumber'; number.textContent = room.optional ? '＋' : room.number;
    const names = document.createElement('span');
    names.className = 'academicTowerRoomNames';
    const ko = document.createElement('strong'); ko.textContent = room.titleKo;
    if (room.optional && state === 'complete') ko.textContent = '색인 옆의 메모 · 같은 然';
    const terms = document.createElement('span');
    terms.className = 'academicTowerRoomTerms'; terms.lang = 'zh-Hant';
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
  }

  function makeGroup(title, key, noteText = '') {
    const group = document.createElement('section');
    group.className = 'academicHubGroup';
    group.dataset.group = key;
    const heading = document.createElement('h3');
    heading.textContent = title;
    group.append(heading);
    if (noteText) {
      const note = document.createElement('p');
      note.className = 'academicHubNote';
      note.textContent = noteText;
      group.append(note);
    }
    return group;
  }

  function sideRoomsFor(groupKey, optionalRooms) {
    return optionalRooms.filter(room => room.sideGroup === groupKey);
  }

  function makeSideRoomButton(room, progress) {
    const state = roomState(room, progress);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'academicTowerRoom academicTowerSideRoomButton';
    button.dataset.roomId = room.id;
    button.dataset.state = state;
    button.disabled = state === 'locked' || state === 'planned';

    const title = document.createElement('span');
    title.className = 'academicTowerSideRoomTitle';
    title.textContent = room.titleKo;
    button.append(title);

    if (state === 'complete') {
      const check = document.createElement('span');
      check.className = 'academicTowerSideRoomCheck';
      check.textContent = '✓';
      check.setAttribute('aria-hidden', 'true');
      button.append(check);
    }

    const stateText = state === 'complete' ? '연구 완료 · 다시 연구' : state === 'available' ? '연구하기' : state === 'planned' ? '준비 중' : '잠김';
    button.setAttribute('aria-label', `${room.titleKo} · ${stateText}`);

    if (!button.disabled) {
      button.onclick = () => room.optional && !progress.seenStories?.includes('academic-tower-ran-intro')
        ? globalThis.GameFlow?.playStory?.('academic-tower-ran-intro', { returnTo: REGION_ID })
        : globalThis.GameFlow?.playStage?.(room.id, {
        mode: state === 'complete' ? 'replay' : 'first-play',
        returnTo: REGION_ID
      });
    }
    return button;
  }

  function appendSideRoom(group, rooms, progress) {
    if (!rooms.length) return;
    const side = document.createElement('aside');
    side.className = 'academicHubSideRoom';
    side.dataset.sideRoom = 'optional';
    const heading = document.createElement('h4');
    heading.textContent = '곁가지 연구';
    side.append(heading);
    rooms.forEach(room => side.append(makeSideRoomButton(room, progress)));
    group.append(side);
  }

  function render() {
    if (!bundle) return false;
    const progress = globalThis.GameFlow?.progress?.() || { completedStages: [], completedMilestones: [] };
    const list = document.getElementById('academicTowerRooms');
    const summary = document.getElementById('academicTowerSummary');
    if (!list || !summary) return false;
    const mainRooms = bundle.rooms.filter(room => !room.optional);
    const completeCount = mainRooms.filter(room => progress.completedStages.includes(room.id)).length;
    const optionalRooms = bundle.rooms.filter(room => room.optional);
    const foundation = progress.completedMilestones.includes('academic-tower-turn-foundation');
    summary.textContent = foundation
      ? '연구 완료 · 첫 관찰 메모를 보관했어.'
      : `연구 ${completeCount}/${mainRooms.length} · ${completeCount === mainRooms.length ? '마지막 이야기를 확인해 보자.' : '기록을 살펴보고 연구를 이어가자.'}`;
    list.replaceChildren();

    const groups = [
      {
        key: 'first',
        title: '첫 기록',
        rooms: mainRooms.filter(room => room.number === '01')
      },
      {
        key: 'branch',
        title: '두 갈래 연구',
        note: '어느 쪽부터 살펴봐도 좋아.',
        rooms: mainRooms.filter(room => room.number === '02' || room.number === '03')
      },
      {
        key: 'synthesis',
        title: '기록 종합',
        rooms: mainRooms.filter(room => room.number === '04' || room.number === '05')
      }
    ];

    const placedOptionalIds = new Set();
    for (const config of groups) {
      const group = makeGroup(config.title, config.key, config.note || '');
      config.rooms.forEach(room => group.append(makeRoomButton(room, progress)));
      const sideRooms = sideRoomsFor(config.key, optionalRooms)
        .filter(room => !placedOptionalIds.has(room.id));
      sideRooms.forEach(room => placedOptionalIds.add(room.id));
      appendSideRoom(group, sideRooms, progress);
      list.append(group);
    }

    const unplaced = optionalRooms.filter(room => !placedOptionalIds.has(room.id));
    if (unplaced.length) {
      const fallback = makeGroup('곁가지 연구', 'optional-fallback');
      const note = document.createElement('p');
      note.className = 'academicHubNote';
      note.textContent = '여러 연구에서 이어진 선택 연구야.';
      fallback.append(note);
      unplaced.forEach(room => fallback.append(makeRoomButton(room, progress)));
      list.append(fallback);
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
