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
  function sheet(zh,ko,note) {
    // Existing labels/descriptions; no inferred pronunciation for missing learning entries.
    InnSceneUtils.info('innLobbyScene',{zh,ko,note,pronunciation:zh==='茶壺'?'ㄔㄚˊ ㄏㄨˊ':''});
  }
  function interact(kind) {
    if (kind === 'room') return WorldInn.openRoom();
    if (kind === 'outside') return GameFlow.showWorld();
    if (kind === 'board') return FirstFreeQuest.openBoardSheet();
    if (kind === 'talk') {
      if (globalThis.Chapter1Finale?.isReady?.()) return Chapter1Finale.openFinaleInnSheet();
      if (globalThis.Chapter2Rain?.needsIntro?.()) return WorldInn.openRoom();
      const progress = GameFlow.progress(), id = Chapter2Fields.reportId;
      if (progress.seenStories.includes('chapter2-council-first-result') && !progress.seenStories.includes(id)) {
        InnSceneUtils.info('innLobbyScene',{note:'여관주인이 회의 소식을 기다리고 있어.'});
        const panel = $('innLobbyInfo').querySelector('.innInfo');
        const choice = (label,open) => {
          const button=document.createElement('button'); button.type='button'; button.className='innTranslation';
          button.textContent=label; button.onclick=open; panel.append(button);
        };
        choice('회의 이야기 전하기',()=>GameFlow.playStory(id,{
          beat:progress.lastLocation?.nodeId==='story:'+id ? progress.lastLocation.beat : 0
        }));
        if (FirstFreeQuest.needsOffer(progress)) choice('자유 의뢰 듣기',()=>FirstFreeQuest.openOfferSheet());
        if (FirstFreeQuest.needsReport(progress)) choice('자유 의뢰 보고하기',()=>FirstFreeQuest.openReportSheet());
        return;
      }
      if (FirstFreeQuest.needsOffer(GameFlow.progress())) return FirstFreeQuest.openOfferSheet();
      if (FirstFreeQuest.needsReport(GameFlow.progress())) return FirstFreeQuest.openReportSheet();
      return InnSceneUtils.info('innLobbyScene',{dialogue:true,zh:stateFor().rain?'回來了。外面還是濕的，小心一點。':'回來了。坐一會兒，休息一下吧。',ko:stateFor().rain?'돌아왔구나. 밖은 아직 젖어 있으니 조심하렴.':'돌아왔구나. 잠깐 앉아 쉬어 가렴.'});
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
    view.innerHTML=`<header class="innRoomTopbar globalNavHeader"><button id="innLobbyBack" class="iconbtn" aria-label="물길마을 지도로 돌아가기">←</button><div class="innRoomHeading"><div class="stagekicker">여관 · 客棧</div><h1>1층 로비</h1></div><button id="innLobbyMenu" class="iconbtn" aria-label="여행 메뉴">☰</button></header><section id="innLobbyScene" class="innLayerScene" aria-label="여관 로비"><div id="innLobbyLayers"></div><div id="innLobbyTargets"></div></section><div id="innLobbyStatus" class="innSceneStatus" role="status"></div><div id="innLobbyInfo"></div>`;
    $('app').append(view);
    $('innLobbyBack').onclick=()=>GameFlow.showWorld();
    $('innLobbyMenu').onclick=()=>GameFlow.showMenu();
    InnSceneUtils.panel($('innLobbyScene'),$('innLobbyInfo'));
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
          status.replaceChildren(document.createTextNode('그림 일부를 불러오지 못했어. '),retryButton());
        },asset.clipPath);
        if(o.interaction)img.dataset.hintFor=o.interaction;
        layers.append(img);
      }
      for(const [id,action] of Object.entries(scene.interactions)) {
        if(!active.has(id)) continue;
        const target=InnSceneUtils.target(id,action.label,action.hit,action.priority,()=>interact(action.kind));
        if(!objects.some(o=>o.interaction===id&&o.asset))InnSceneUtils.point(target,50,id==='stairs'?75:50);
        targets.append(target);
      }
      $('innLobbyLayers').replaceChildren(layers);$('innLobbyTargets').replaceChildren(targets);
      status.textContent='';
      InnSceneUtils.visit($('innLobbyScene'),['keeper','pot','stairs']);
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
