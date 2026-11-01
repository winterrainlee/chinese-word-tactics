/* C room assets and placements. Words and keepsake eligibility remain owned by their runtimes. */
(() => {
  const ROOT='./assets/inn-room-c/mobile/';
  const objects=Object.freeze([
    {id:'bed',word:'床',ko:'침대',box:{x:4,y:30,w:46,h:43},hit:{x:8,y:43,w:37,h:20},z:10},
    {id:'desk',word:'桌子',ko:'책상',box:{x:57,y:31,w:35,h:29},hit:{x:59,y:42,w:14,h:11},z:10},
    {id:'chair',word:'椅子',ko:'의자',box:{x:66,y:48,w:21,h:27},hit:{x:67,y:56,w:18,h:17},z:20},
    {id:'chest',word:'箱子',ko:'상자',box:{x:5,y:67,w:35,h:25},hit:{x:8,y:79,w:31,h:11},z:30}
  ]);
  const preloaded=new Map();
  function preload() {
    if(!preloaded.has('background')){
      const image=new Image();image.src=ROOT+'background.webp';preloaded.set('background',image);
    }
    return Promise.resolve(ROOT+'background.webp');
  }
  function mount() {
    const scene=document.getElementById('innRoomScene');if(!scene||scene.dataset.cRoom)return;
    scene.dataset.cRoom='true';scene.classList.add('innLayerScene');
    const old=document.getElementById('innRoomBackdrop');old.src=ROOT+'background.webp';old.dataset.objectId='inn.room.structure';
    const status=document.getElementById('innRoomLoading');status.className='innRoomAssetStatus';
    let failed=false;
    function failure(){failed=true;status.hidden=false;status.replaceChildren(document.createTextNode('그림을 불러오지 못했어. '));
      const b=document.createElement('button');b.textContent='다시 불러오기';b.onclick=retry;status.append(b);scene.classList.add('show-hints');}
    function retry(){failed=false;status.hidden=false;status.textContent='방 안을 살펴보는 중…';
      for(const img of scene.querySelectorAll('img[data-object-id]'))img.src=img.src.split('?')[0]+'?retry='+Date.now();}
    function loaded(){if(failed)return;const all=[...scene.querySelectorAll('img[data-object-id]')];
      if(all.every(i=>i.complete&&i.naturalWidth>0)){status.hidden=true;old.dataset.loaded='true';}}
    old.onerror=failure;old.onload=loaded;
    const layers=document.createElement('div');layers.id='innRoomLayers';scene.insertBefore(layers,document.getElementById('innRoomHotspots'));
    const host=document.getElementById('innRoomHotspots');host.replaceChildren();host.dataset.loaded='true';
    for(const o of objects){
      const img=InnSceneUtils.image('inn.room.'+o.id,ROOT+o.id+'.webp',o.box,o.z,failure);img.onload=loaded;layers.append(img);
      const b=InnSceneUtils.target(o.id,o.ko+' 살펴보기',o.hit,10,()=>WorldInn.showRoomWord(b));
      b.id='hotspot-'+o.id;b.dataset.word=o.word;b.dataset.ko=o.ko;host.append(b);
    }
    const door=InnSceneUtils.target('door','문을 열고 로비로 내려가기',{x:86,y:59,w:14,h:33},5,()=>WorldInn.openLobby());
    door.id='hotspot-door';door.dataset.action='leave-room';host.append(door);
    const hint=document.getElementById('innRoomHint');hint.className='innSceneFooter';hint.replaceChildren(document.createTextNode('눈에 들어오는 물건을 눌러봐.'));
    const b=document.createElement('button');b.id='innRoomHints';b.textContent='위치 보기';b.setAttribute('aria-pressed','false');b.onclick=()=>{
      const on=scene.classList.toggle('show-hints');b.setAttribute('aria-pressed',String(on));b.textContent=on?'위치 숨기기':'위치 보기';};hint.append(b);
    loaded();
  }
  globalThis.InnRoomScene=Object.freeze({objects,mount,preload});
})();
