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
    const completeCount = mainRooms.filter(room => progress.completedStages.includes(room.id)).length;
    const optionalRooms = bundle.rooms.filter(room => room.optional);
    const optionalCount = optionalRooms.filter(room => progress.completedStages.includes(room.id)).length;
    summary.textContent = `연구한 방 ${completeCount} / ${mainRooms.length} · 선택 연구 ${optionalCount} / ${optionalRooms.length} · 탑 전체 완료 조건 없음`;
    list.replaceChildren();
    const note = document.createElement('p');
    note.className = 'academicHubNote';
    note.textContent = progress.completedMilestones.includes('academic-tower-turn-foundation')
      ? '네 기록 칸 · 첫 관찰 메모를 보관했다. 전달용 사본은 장인골로 보낼 묶음에 넣었다. 다음 비교 자료를 모으는 중이다.'
      : '수로 기록 연구실 · 표식이 남은 기록을 살펴보는 중이다. 01 뒤에는 02와 03 중 어느 쪽부터 연구해도 된다.';
    list.append(note);

    for (const room of bundle.rooms) {
      const state = roomState(room, progress);
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'academicTowerRoom';
      button.dataset.roomId = room.id; button.dataset.state = state;
      button.disabled = state === 'locked' || state === 'planned';

      const number = document.createElement('span');
      number.className = 'academicTowerRoomNumber'; number.textContent = room.number;
      const names = document.createElement('span');
      names.className = 'academicTowerRoomNames';
      const ko = document.createElement('strong'); ko.textContent = room.titleKo;
      if (room.optional && state === 'complete') ko.textContent = '같은 然';
      const zh = document.createElement('small'); zh.lang = 'zh-Hant'; zh.textContent = room.titleZh;
      const terms = document.createElement('span');
      terms.className = 'academicTowerRoomTerms'; terms.lang = 'zh-Hant';
      terms.textContent = room.expressions.join(' · ') || (room.optional ? '선택 연구' : '종합');
      names.append(ko, zh, terms);
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
      stateLabel.textContent = state === 'complete' ? '다시 연구' : state === 'available' ? '열림' : state === 'planned' ? '준비 중' : '잠김';
      button.append(number, names, stateLabel);
      if (!button.disabled) {
        button.onclick = () => room.optional && !progress.seenStories?.includes('academic-tower-ran-intro')
          ? globalThis.GameFlow?.playStory?.('academic-tower-ran-intro', { returnTo: REGION_ID })
          : globalThis.GameFlow?.playStage?.(room.id, {
          mode: state === 'complete' ? 'replay' : 'first-play',
          returnTo: REGION_ID
        });
      }
      list.append(button);
    }
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
