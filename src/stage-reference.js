/* Stable, user-facing stage references. Internal IDs and progression order stay unchanged. */
(() => {
  const entries = new Map();

  function addGroup(groupId, groupLabel, pairs, groupTotal = pairs.length) {
    for (const [stageId, number, optional = false] of pairs) {
      if (entries.has(stageId)) throw new Error(`Duplicate stage reference: ${stageId}`);
      entries.set(stageId, Object.freeze({
        stageId, groupId, groupLabel, number, groupTotal, optional
      }));
    }
  }

  addGroup('tutorial', '튜토리얼', [
    ['stage-0', '01'], ['stage-1', '02'], ['stage-2', '03'],
    ['stage-3', '04'], ['stage-4', '05'], ['stage-5', '06']
  ]);
  addGroup('gate-town', '길목', [
    ['gate-stage-1', '01'], ['gate-stage-2', '02'], ['gate-stage-3', '03'],
    ['gate-stage-4', '04'], ['gate-stage-5', '05'], ['gate-stage-6', '06'],
    ['gate-stage-7', '07']
  ]);
  addGroup('workshop-town', '장인골', [
    ['workshop-stage-1', '01'], ['workshop-stage-2', '02'], ['workshop-stage-3', '03'],
    ['workshop-stage-4', '04'], ['workshop-stage-5', '05'], ['workshop-stage-6', '06'],
    ['workshop-stage-7', '07']
  ]);
  addGroup('market-town', '장터', [
    ['market-stage-1', '01'], ['market-stage-2', '02'], ['market-stage-3', '03'],
    ['market-stage-4', '04'], ['market-stage-5', '05'], ['market-stage-6', '06'],
    ['market-stage-7', '07'], ['market-stage-8', '08']
  ]);
  addGroup('north-forest', '북쪽 숲', [
    ['first-free-quest-forest', '01'], ['north-forest-stage-2', '02'],
    ['north-forest-stage-3', '03'], ['north-forest-stage-4', '04'],
    ['north-forest-stage-5', '05'], ['north-forest-stage-6', '06'],
    ['north-forest-stage-7', '07'], ['north-forest-stage-8', '08']
  ]);

  // The research-room data remains the single source for 01–05 and optional 03A.
  const towerRooms = globalThis.AcademicTowerContent?.bundle?.rooms || [];
  addGroup('academic-tower-turning-directions', '방향이 바뀌는 문장', towerRooms.map(room => [
    room.id, room.number, Boolean(room.optional)
  ]), towerRooms.filter(room => !room.optional).length);

  globalThis.JourneyStageReference = Object.freeze({
    get(stageId) { return entries.get(stageId) || null; },
    all() { return [...entries.values()]; }
  });
})();
