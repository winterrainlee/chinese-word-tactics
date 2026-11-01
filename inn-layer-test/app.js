(async () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const M = globalThis.InnLayersModel;
  const query = new URLSearchParams(location.search);
  const state = M.defaultState();
  for (const key of Object.keys(state)) state[key] = query.get(key) === '1';
  const hiddenLayers = new Set(), hiddenObjects = new Set();
  let scene, active = null, beat = 0, translated = false, lastFocus, sheetFocus;
  let currentPlace = 'lobby', original = false;
  const images = new Map(), targets = new Map();

  function showView(name) {
    document.querySelectorAll('.appView').forEach(el => { el.hidden = el.id !== name + 'View'; });
    currentPlace = name;
    window.scrollTo(0, 0);
  }
  function showLobby() {
    globalThis.StoryRuntime?.stop();
    $('sheet').close();
    showView('lobby');
    if (lastFocus?.isConnected && !lastFocus.hidden) lastFocus.focus({preventScroll:true});
  }
  function showRoom() {
    globalThis.WorldInn.openRoom();
    $('innRoomBack').setAttribute('aria-label', '여관 로비로 돌아가기');
    $('innRoomMenu').hidden = true;
    $('innRoomHint').textContent = '기존 소년의 방 · 문을 누르면 로비로 돌아가.';
  }
  function showStory() {
    showView('story');
    const lines = globalThis.InnLayerDialogue.lines('talk', state);
    globalThis.StoryRuntime.play({id:'inn-layer-fixture',titleKo:'돌아온 오후 · 시험 장면',placeZh:'客棧',placeKo:'여관',background:'inn',beats:lines.map(l => ({speaker:'innkeeper',zh:l.zh,ko:l.ko}))},
      {beat:0,endLabel:'로비로',seen:false,onPosition:()=>{},onFinish:returnLobby});
  }
  function enter(place) {
    history.pushState({innLayerPlace:place}, '', location.href);
    if (place === 'room') showRoom();
    else if (place === 'story') showStory();
    else {
      $('outsideText').textContent = state.rain ? '비는 그쳤지만 문앞 바닥은 아직 젖어 있어.' : '거리의 소리가 들려와. 안에는 따뜻한 차가 기다리고 있어.';
      showView('outside');
    }
  }
  function returnLobby() {
    if (history.state?.innLayerPlace && history.state.innLayerPlace !== 'lobby') history.back();
    else showLobby();
  }
  history.replaceState({innLayerPlace:'lobby'}, '', location.href);
  window.addEventListener('popstate', () => {
    const place = history.state?.innLayerPlace;
    if (place === 'room') showRoom();
    else if (place === 'story') showStory();
    else if (place === 'outside') showView('outside');
    else showLobby();
  });
  globalThis.GameFlow = {progress:()=>({completedMilestones:[]}),showWorld:returnLobby,showMenu:returnLobby};
  globalThis.TacticalGame = {
    showView,
    closeSheet:()=>$('sheet').close(),
    openSheet:html => { sheetFocus = document.activeElement; $('sheetContent').innerHTML = html; $('sheet').showModal(); }
  };
  $('sheet').addEventListener('close',()=>sheetFocus?.focus());
  $('sheet').addEventListener('click',e=>{if(e.target===$('sheet')) $('sheet').close();});
  $('reenter').onclick = returnLobby;
  $('focusStory').onclick = () => { lastFocus = $('focusStory'); enter('story'); };

  function button(label, onClick, className = '') {
    const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.className = className; el.onclick = onClick; return el;
  }
  function renderDialogue() {
    $('actions').replaceChildren();
    $('closeTalk').hidden = !active;
    const lines = active ? globalThis.InnLayerDialogue.lines(scene.interactions[active].kind, state) : [{speaker:'여관 안에서',zh:'午後的陽光照進客棧。',ko:'오후 햇빛이 여관 안으로 들어와.'}];
    beat = Math.min(beat, lines.length - 1);
    const line = lines[beat] || lines[0];
    $('speaker').textContent = line.speaker; $('zh').textContent = line.zh; $('ko').textContent = line.ko; $('ko').hidden = !translated;
    const translate = button(translated?'한국어 뜻 접기':'한국어 뜻 보기',()=>{translated=!translated;renderDialogue();document.querySelector('#actions .translate').focus({preventScroll:true});},'translate');
    translate.setAttribute('aria-expanded',String(translated)); translate.setAttribute('aria-controls','ko'); $('actions').append(translate);
    if (lines.length > 1) {
      const previous = button('이전',()=>{beat--;translated=false;renderDialogue();}); previous.disabled = beat === 0; $('actions').append(previous);
      $('actions').append(button(beat === lines.length - 1?'대화 마치기':'다음',()=>{
        if (beat < lines.length - 1) {beat++;translated=false;renderDialogue();document.querySelector('#actions .next').focus({preventScroll:true});}
        else closeTalk();
      },'next'));
    }
  }
  function closeTalk() {active=null;beat=0;translated=false;renderDialogue();lastFocus?.focus({preventScroll:true});}
  $('closeTalk').onclick = closeTalk;

  function project() {
    const visible = M.project(scene, state, [...hiddenLayers], [...hiddenObjects]);
    const ids = new Set(visible.map(o=>o.id));
    const interactions = new Set(visible.map(o=>o.interaction).filter(Boolean));
    for (const [id,img] of images) img.hidden = !ids.has(id);
    for (const [id,el] of targets) el.hidden = original || !interactions.has(id);
    if (active && !interactions.has(active)) {active=null;beat=0;translated=false;}
    $('stateLabel').textContent = M.describe(state);
    $('scene').dataset.state = `${+state.board}${+state.rain}${+state.newQuest}`;
    for (const key of Object.keys(state)) $('state-'+key).checked = state[key];
    renderDialogue();
  }
  function applyRect(el, p) {
    el.style.left = p.x+'%'; el.style.top = p.y+'%'; el.style.width = p.w+'%'; el.style.height = p.h+'%';
    if(p.rotate) el.style.transform = `rotate(${p.rotate}deg)`;
  }
  function checkControl(parent, label, key, onChange) {
    const wrap = document.createElement('label'), input = document.createElement('input');
    input.type = 'checkbox'; input.checked = true; input.dataset.key = key;
    input.onchange = ()=>onChange(input.checked);
    wrap.append(input,document.createTextNode(label)); parent.append(wrap);
  }
  function build() {
    for (const object of scene.objects) {
      if (!object.asset) continue;
      const image = document.createElement('img'); image.className = 'layer'; image.alt = ''; image.draggable = false;
      image.dataset.objectId = object.id; image.dataset.layer = object.layer;
      image.src = 'inn-layer-test/'+scene.assets[object.asset].src;
      image.style.zIndex = String(object.z); applyRect(image,scene.placements[object.placement]);
      images.set(object.id,image); $('layers').append(image);
    }
    for (const [id,interaction] of Object.entries(scene.interactions)) {
      const target = button('',()=>{
        lastFocus = target;
        if (interaction.kind === 'room') return enter('room');
        if (interaction.kind === 'outside') return enter('outside');
        active=id;beat=0;translated=false;renderDialogue();
      });
      target.className='hotspot';target.dataset.interaction=id;target.setAttribute('aria-label',interaction.label);
      target.style.zIndex=String(100+interaction.priority);applyRect(target,interaction.hit);
      const label=document.createElement('span');label.textContent=interaction.label.replace(/살펴보기|과 이야기하기/g,'');target.append(label);
      targets.set(id,target);$('hotspots').append(target);
    }
    for (const [id,label] of Object.entries(scene.layers)) checkControl($('layerChecks'),label,id,on=>{on?hiddenLayers.delete(id):hiddenLayers.add(id);project();});
    for (const o of scene.objects.filter(o=>o.asset)) checkControl($('objectChecks'),o.label,o.id,on=>{on?hiddenObjects.delete(o.id):hiddenObjects.add(o.id);project();});
    project();
  }
  for (const key of Object.keys(state)) $('state-'+key).onchange=e=>{state[key]=e.target.checked;project();};
  $('hint').onclick=()=>{const on=$('scene').classList.toggle('show-hints');$('hint').setAttribute('aria-pressed',String(on));$('hint').textContent=on?'위치 숨기기':'위치 보기';};
  $('original').onclick=()=>{
    original=!original;$('originalImage').hidden=!original;$('originalBadge').hidden=!original;
    $('original').setAttribute('aria-pressed',String(original));$('original').textContent=original?'레이어 합성 보기':'기존 C 보기';
    project();
  };
  $('restoreLayers').onclick=()=>{hiddenLayers.clear();hiddenObjects.clear();document.querySelectorAll('#layerChecks input,#objectChecks input').forEach(el=>el.checked=true);project();};
  $('reset').onclick=()=>{Object.assign(state,M.defaultState());active=null;beat=0;translated=false;project();};
  try {
    const response=await fetch('inn-layer-test/scene.json');if(!response.ok)throw new Error('scene fetch failed');scene=await response.json();build();
    await Promise.all([...images.values()].map(async img=>{if(img.complete&&img.naturalWidth)return;await img.decode();}));
    $('loading').hidden=true;$('scene').dataset.ready='true';
    if(query.get('original')==='1') $('original').click();
  } catch(error) {
    $('loading').textContent='일부 그림을 불러오지 못했어. 새로고침해서 다시 확인해줘.';console.error(error);
  }
})();
