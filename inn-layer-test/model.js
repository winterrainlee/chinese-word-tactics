/* Pure fixture state projection. No game progress or storage dependency. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InnLayersModel = api;
})(globalThis, () => {
  'use strict';
  const defaultState = () => ({ board: false, rain: false, newQuest: false });
  function visible(condition, state) {
    return (condition.all || []).every(key => state[key] === true) &&
      (condition.none || []).every(key => state[key] !== true);
  }
  function project(scene, state, hiddenLayers = [], hiddenObjects = []) {
    return scene.objects.filter(object => visible(scene.conditions[object.condition], state) &&
      !hiddenLayers.includes(object.layer) && !hiddenObjects.includes(object.id))
      .sort((a, b) => a.z - b.z || a.id.localeCompare(b.id));
  }
  function describe(state) {
    const parts = [state.board ? '게시판 설치 후' : '게시판 설치 전', state.rain ? '큰비 이후' : '평상시'];
    if (state.newQuest) parts.push(state.board ? '새 의뢰' : '새 의뢰 대기 · 게시판 없음');
    return parts.join(' · ');
  }
  return Object.freeze({defaultState, visible, project, describe});
});
