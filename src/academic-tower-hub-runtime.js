/* Permanent Academic Tower hub: room selection is separate from tower-wide completion. */
(() => {
  const REGION_ID = 'academic-tower';
  const ENTERED_MILESTONE = 'academic-tower-entered';
  const bundle = globalThis.AcademicTowerContent?.bundle;

  function roomState(room, progress) {
    const completed = new Set(progress?.completedStages || []);
    if (completed.has(room.id)) return 'complete';
    if (!(room.requires || []).every(id => completed.has(id))) return 'locked';
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
    const completeCount = bundle.rooms.filter(room => progress.completedStages.includes(room.id)).length;
    summary.textContent = `연구한 방 ${completeCount} / ${bundle.rooms.length} · 탑 전체 완료 조건 없음`;
    list.replaceChildren();

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
      const zh = document.createElement('small'); zh.lang = 'zh-Hant'; zh.textContent = room.titleZh;
      const terms = document.createElement('span');
      terms.className = 'academicTowerRoomTerms'; terms.lang = 'zh-Hant';
      terms.textContent = room.expressions.join(' · ') || '종합';
      names.append(ko, zh, terms);
      const stateLabel = document.createElement('span');
      stateLabel.className = 'academicTowerRoomState';
      stateLabel.textContent = state === 'complete' ? '다시 연구' : state === 'available' ? '열림' : state === 'planned' ? '준비 중' : '잠김';
      button.append(number, names, stateLabel);
      if (!button.disabled) {
        button.onclick = () => globalThis.GameFlow?.playStage?.(room.id, {
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
