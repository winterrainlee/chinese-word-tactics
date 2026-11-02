/* G2 internal world catalog. Does not own drawing coordinates, navigation or saves. */
(() => {
  'use strict';
  const legacyIds = Object.freeze([
    'gate-town','workshop-town','market-town','council-town','academic-tower','border-village'
  ]);
  const arr = value => Array.isArray(value) ? value : [];
  const find = (items,id) => arr(items).find(item => item.id === id) || null;
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const sourcesOK = value => Array.isArray(value) && value.length > 0 &&
    value.every(path => typeof path === 'string' && /^(docs|src)\/[-\w./]+$/.test(path));
  const worldPlace = (catalog,id) => find(catalog?.places,id);
  const relation = (catalog,id) => find(catalog?.relations,id);
  const relationsFor = (catalog,id) => arr(catalog?.relations).filter(item => item.from === id || item.to === id);
  const unknownFor = (catalog,id) => arr(catalog?.unknowns).filter(item => item.subject === id);
  const hasDiscovered = (item,progress) => {
    if (!item?.revealBy || !isObject(progress)) return false;
    const {stageId,partialFlag} = item.revealBy;
    if (arr(progress.completedStages).includes(stageId)) return true;
    const partial = progress.sideResearchProgress?.[stageId];
    return isObject(partial) && partial[partialFlag] === true;
  };
  function observation(catalog,id,{viewer='world',progress=null}={}) {
    const item=find(catalog?.observations,id);
    if (!item) return null;
    if (viewer === 'player') return hasDiscovered(item,progress) ? item : null;
    if (viewer === 'world') return item;
    return null;
  }
  const futureRule = (catalog,id) => find(catalog?.futureRules,id);
  const physicalEdge = (catalog,network,id) => find(catalog?.networks?.[network]?.edges,id);
  function validate(catalog) {
    const errors=[];
    if (!isObject(catalog) || catalog.schemaVersion !== 1 ||
        catalog.status !== 'partial-confirmed' || catalog.scope !== 'internal-data-only' ||
        catalog.mapGeometry !== 'undetermined') errors.push('catalog identity/status');
    const places=arr(catalog?.places),relations=arr(catalog?.relations);
    const observations=arr(catalog?.observations),rules=arr(catalog?.futureRules),unknowns=arr(catalog?.unknowns);
    const groups=[places,relations,observations,rules,unknowns],seen=new Set();
    if (groups.some(group => !group.length)) errors.push('missing category');
    for (const items of groups) for (const item of items) {
      if (!isObject(item) || typeof item.id !== 'string' || !item.id ||
          seen.has(item.id)) errors.push('duplicate/invalid id');
      else seen.add(item.id);
      if (!sourcesOK(item?.sources)) errors.push('missing provenance: ' + item?.id);
    }
    const placeIds=new Set(places.map(item=>item.id));
    for (const id of legacyIds) if (!placeIds.has(id)) errors.push('legacy region missing: '+id);
    if (!placeIds.has('three-streams-town') || !placeIds.has('inn')) errors.push('settlement/inn missing');
    for (const place of places) {
      if (place.geometry !== null || 'x' in place || 'xPct' in place ||
          'y' in place || 'yPct' in place) errors.push('world place has presentation geometry: '+place.id);
      if (place.parentId != null && !placeIds.has(place.parentId)) errors.push('unresolved parent: '+place.id);
      if (place.id === 'border-village' &&
          (place.mapAnchorRole !== 'outside-direction' || place.parentId !== null))
        errors.push('outside settlement incorrectly placed');
      if (place.id !== 'border-village' && place.id !== 'three-streams-town' &&
          place.parentId !== 'three-streams-town') errors.push('inside place has wrong settlement: '+place.id);
    }
    for (const item of relations) {
      if (!placeIds.has(item.from) || !placeIds.has(item.to) || item.from === item.to)
        errors.push('relation endpoint: '+item.id);
      if (item.geometry !== null || item.physicalEdgeId !== null)
        errors.push('relation mistaken for surveyed route: '+item.id);
    }
    for (const net of ['road','water']) {
      if (catalog?.networks?.[net]?.status !== 'topology-unconfirmed' ||
          !Array.isArray(catalog?.networks?.[net]?.edges) ||
          catalog.networks[net].edges.length) errors.push('unapproved topology: '+net);
    }
    for (const item of observations) {
      if (item.geometry !== null || !Array.isArray(item.observedFacts) ||
          !item.observedFacts.length || !Array.isArray(item.unknownFields) ||
          !item.unknownFields.length || !isObject(item.revealBy) ||
          typeof item.revealBy.stageId !== 'string' ||
          typeof item.revealBy.partialFlag !== 'string') errors.push('observation evidence/geometry: '+item.id);
    }
    for (const item of rules) if (
      item.implementation !== 'approved-story-not-active-game-rule' ||
      item.affectedEdgeId !== null || item.preciseSection !== null ||
      !placeIds.has(item.nearPlaceId)
    ) errors.push('scenario leaked into running game: '+item.id);
    for (const item of unknowns) if (
      !seen.has(item.subject) || typeof item.question !== 'string' || !item.question
    ) errors.push('unknown subject: '+item.id);
    return {ok:errors.length===0,errors};
  }
  const api=Object.freeze({legacyIds,worldPlace,relation,relationsFor,unknownFor,
    observation,hasDiscovered,futureRule,physicalEdge,validate});
  globalThis.WorldSpatialCatalog=api;
  if(typeof module!=='undefined' && module.exports) module.exports=api;
})();
