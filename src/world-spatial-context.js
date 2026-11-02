/* G3: lazy, read-only world context for existing map, stories and quests.
   The catalog describes facts, never game travel, unlocks or a physical route. */
(() => {
  'use strict';
  const engine=globalThis.WorldSpatialCatalog ||
    (typeof require==='function' ? require('./world-spatial-catalog.js') : null);
  if(!engine) return;
  // Bind only confirmed content IDs. A background image or Chinese label is NOT a place ID.
  const storyBindings=Object.freeze({
    'gate-arrival':'gate-town',
    'first-free-quest-accepted':'inn',
    'first-free-quest-report':'inn',
    'quest-board-installed':'inn',
    'chapter2-rain-opening':'inn'
  });
  // The northern forest is a real game place, but NOT yet registered in G2's
  // surveyed catalog; it must stay unresolved instead of inventing geometry.
  const questBindings=Object.freeze({
    'north-forest-mushrooms':Object.freeze({originPlaceId:'inn',activityPlaceId:'north-forest'})
  });
  const observationBindings=Object.freeze({'academic-tower-04a':'academic-tower'});
  const has=(items,key)=>Object.prototype.hasOwnProperty.call(items,key);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const freeze=value=>{
    if(value && typeof value==='object' && !Object.isFrozen(value)){
      for(const item of Object.values(value))freeze(item);
      Object.freeze(value);
    }
    return value;
  };
  function create({readCatalog}={}){
    const reader=readCatalog || (async()=>{
      const res=await fetch('./data/world-spatial-catalog-v0.1.json?v=20261102-g3');
      if(!res.ok)throw new Error('world spatial catalog unavailable');
      return res.json();
    });
    let loading=null;
    function load(){
      if(!loading){
        loading=Promise.resolve().then(reader).then(raw=>{
          const checked=engine.validate(raw);
          if(!checked.ok)throw new Error('invalid spatial catalog: '+checked.errors.join(', '));
          return freeze(clone(raw));
        }).catch(error=>{loading=null;throw error;});
      }
      return loading;
    }
    async function place(placeId,progress=null){
      if(typeof placeId!=='string'||!placeId)return null;
      const catalog=await load();
      const found=engine.worldPlace(catalog,placeId);
      if(!found)return null;
      const observations=catalog.observations.filter(item=>
        observationBindings[item.context]===placeId &&
        !!engine.observation(catalog,item.id,{viewer:'player',progress}));
      const unknowns=[
        ...engine.unknownFor(catalog,placeId),
        ...observations.flatMap(item=>engine.unknownFor(catalog,item.id))
      ];
      return freeze({
        place:found,
        relations:engine.relationsFor(catalog,placeId),
        observations,
        unknowns,
        physicalRoadEdges:[],
        physicalWaterEdges:[],
        movementAuthority:'legacy-game-system',
        eventAuthority:'not-active-in-g3'
      });
    }
    async function story(storyId,progress=null){
      if(!has(storyBindings,storyId))return null;
      const context=await place(storyBindings[storyId],progress);
      return context && freeze({storyId,placeId:storyBindings[storyId],context});
    }
    async function quest(questId,progress=null){
      if(!has(questBindings,questId))return null;
      const binding=questBindings[questId];
      const origin=await place(binding.originPlaceId,progress);
      if(!origin)return null;
      const activity=await place(binding.activityPlaceId,progress);
      return freeze({
        questId,originPlaceId:binding.originPlaceId,origin,
        activityPlaceId:binding.activityPlaceId,activity,
        activityCatalogued:!!activity,
        movementAuthority:'legacy-game-system'
      });
    }
    async function planningRule(id){
      const catalog=await load();
      const item=engine.futureRule(catalog,id);
      return item ? freeze({id:item.id,implementation:item.implementation,
        sourceRule:item,active:false}) : null;
    }
    // Decoration is additive metadata for future consumers, NEVER a navigation gate.
    // Markers/stories remain fully usable if the catalog has not loaded or failed.
    async function annotateRegion(element,regionId){
      try{
        const result=await place(regionId);
        if(result && element?.isConnected && element.dataset.regionId===regionId){
          element.dataset.spatialPlaceId=result.place.id;
          element.dataset.spatialPlaceKind=result.place.kind;
        }
        return result;
      }catch{return null;}
    }
    async function annotateStory(element,storyId){
      if(!element)return null;
      delete element.dataset.spatialStoryPlaceId;
      element.dataset.spatialStoryLookupId=storyId;
      try{
        const result=await story(storyId);
        if(result && element.isConnected && element.dataset.spatialStoryLookupId===storyId)
          element.dataset.spatialStoryPlaceId=result.placeId;
        return result;
      }catch{return null;}
    }
    async function annotateQuest(element,questId){
      try{
        const result=await quest(questId);
        if(result && element?.isConnected){
          element.dataset.spatialQuestId=questId;
          element.dataset.spatialQuestOrigin=result.originPlaceId;
          element.dataset.spatialQuestAreaCatalogued=String(result.activityCatalogued);
        }
        return result;
      }catch{return null;}
    }
    return Object.freeze({load,place,story,quest,planningRule,
      annotateRegion,annotateStory,annotateQuest});
  }
  const live=create();
  const api=Object.freeze({...live,create,storyBindings,questBindings});
  globalThis.WorldSpatialContext=api;
  if(typeof module!=='undefined' && module.exports)module.exports=api;
})();
