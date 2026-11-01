/* Real progress adapter for the approved C illustration. No fixture state or quests. */
(() => {
  const $ = id => document.getElementById(id);
  let scenePromise;
  const stateFor = (value = globalThis.GameFlow?.progress?.() || {}) => ({
    board: !!globalThis.FirstFreeQuest?.boardUnlocked?.(value),
    rain: !!globalThis.JourneyProgress?.hasRainPassed?.(value),
    newQuest: !!globalThis.NorthForestWorld?.hasNewBoardQuest?.(value)
  });
  const visible = (condition, state) => (condition.all || []).every(k => state[k]) &&
    (condition.none || []).every(k => !state[k]);
  function sheet(zh, ko, note) {
    TacticalGame.openSheet(`<h2 lang="zh-Hant">${zh}</h2><div class="meaning">${ko}</div><p>${note}</p><div class="sheetactions"><button id="innInspectClose" data-action-role="close">닫기</button></div>`);
    $('innInspectClose').onclick = () => TacticalGame.closeSheet();
  }
  function interact(kind) {
    if (kind === 'room') return WorldInn.openRoom();
    if (kind === 'outside') return GameFlow.showWorld();
    if (kind === 'board') return FirstFreeQuest.openBoardSheet();
    if (kind === 'talk') {
      if (globalThis.Chapter1Finale?.isReady?.()) return Chapter1Finale.openFinaleInnSheet();
      if (globalThis.Chapter2Rain?.needsIntro?.()) return WorldInn.openRoom();
      if (FirstFreeQuest.needsOffer(GameFlow.progress())) return FirstFreeQuest.openOfferSheet();
      if (FirstFreeQuest.needsReport(GameFlow.progress())) return FirstFreeQuest.openReportSheet();
      return sheet('客棧主人', '여관 주인', stateFor().rain ? '돌아왔구나. 밖은 아직 젖어 있으니 조심하렴.' : '돌아왔구나. 잠깐 앉아 쉬어 가렴.');
    }
    const words = {
      table:['餐桌','식탁','빈자리에 앉아 잠깐 쉴 수 있겠네.'],
      pot:['茶壺','찻주전자','차가 남아 있는 주전자야.'],
      cup:['茶杯','찻잔','작은 잔이 식탁 위에 놓여 있어.'],
      ledger:['帳簿','장부','여관 주인이 쓰는 장부야.'],
      wet:['濕行李','젖은 짐','비에 젖은 짐을 문 옆에 두고 말리는 중이야.'],
      water:['水跡','물기','문 옆 바닥에 물기가 남아 있어.']
    };
    if (words[kind]) sheet(...words[kind]);
  }
  function ensure() {
    if ($('innLobbyView')) return;
    const view = document.createElement('main');
    view.id='innLobbyView'; view.className='innRoomShell appView'; view.hidden=true;
    view.innerHTML=`<header class="innRoomTopbar globalNavHeader"><button id="innLobbyBack" class="iconbtn" aria-label="물길마을 지도로 돌아가기">←</button><div class="innRoomHeading"><div class="stagekicker">여관 · 客棧</div><h1>1층 로비</h1></div><button id="innLobbyMenu" class="iconbtn" aria-label="여행 메뉴">☰</button></header><section id="innLobbyScene" class="innLayerScene" aria-label="여관 로비"><div id="innLobbyLayers"></div><div id="innLobbyTargets"></div></section><div id="innLobbyStatus" class="innSceneStatus" role="status"></div><div class="innSceneFooter"><span>물건이나 사람을 눌러봐.</span><button id="innLobbyHints" aria-pressed="false">위치 보기</button></div>`;
    $('app').append(view);
    $('innLobbyBack').onclick=()=>GameFlow.showWorld();
    $('innLobbyMenu').onclick=()=>GameFlow.showMenu();
    $('innLobbyHints').onclick=()=>{
      const on=$('innLobbyScene').classList.toggle('show-hints');
      $('innLobbyHints').setAttribute('aria-pressed', String(on));
      $('innLobbyHints').textContent=on?'위치 숨기기':'위치 보기';
    };
  }
  function loadScene() {
    if (!scenePromise) scenePromise=(async()=>{
      const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),12000);
      try {
        const res=await fetch('./inn-layer-test/scene.json',{signal:controller.signal});
        if(!res.ok) throw Error('scene');
        return await res.json();
      } finally {clearTimeout(timer);}
    })().catch(e=>{scenePromise=null;throw e;});
    return scenePromise;
  }
  async function render() {
    const status=$('innLobbyStatus');
    status.textContent='로비를 불러오는 중…';
    try {
      const scene=await loadScene(), state=stateFor();
      $('innLobbyScene').dataset.state=`${+state.board}${+state.rain}${+state.newQuest}`;
      const objects=scene.objects.filter(o=>visible(scene.conditions[o.condition],state));
      const active=new Set(objects.map(o=>o.interaction).filter(Boolean));
      const layers=document.createDocumentFragment(), targets=document.createDocumentFragment();
      for(const o of objects) {
        if(!o.asset) continue;
        const asset=scene.assets[o.asset];
        const img=InnSceneUtils.image(o.id,'./inn-layer-test/'+asset.src,scene.placements[o.placement],o.z,()=>{
          status.replaceChildren(document.createTextNode('그림 일부를 불러오지 못했어. 위치 보기로 이동할 수 있어. '),retryButton());
        },asset.clipPath);
        layers.append(img);
      }
      for(const [id,action] of Object.entries(scene.interactions)) {
        if(!active.has(id)) continue;
        targets.append(InnSceneUtils.target(id,action.label,action.hit,action.priority,()=>interact(action.kind)));
      }
      $('innLobbyLayers').replaceChildren(layers);$('innLobbyTargets').replaceChildren(targets);
      status.textContent='';
    } catch {
      status.replaceChildren(document.createTextNode('로비를 불러오지 못했어. '),retryButton());
      const room=document.createElement('button');room.textContent='소년의 방';room.onclick=()=>WorldInn.openRoom();status.append(room);
    }
  }
  function retryButton() {const b=document.createElement('button');b.textContent='다시 불러오기';b.onclick=render;return b;}
  function open() {
    ensure();GameFlow.visitInn();TacticalGame.closeSheet();TacticalGame.showView('innLobby');
    render();window.scrollTo(0,0);
  }
  globalThis.InnLobby=Object.freeze({open,stateFor,visible,interact});
})();
