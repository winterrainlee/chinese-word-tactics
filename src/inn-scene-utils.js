/* Shared only by the two actual inn scenes: placement, images, touch targets. */
(() => {
  function rect(el,p) {
    Object.assign(el.style,{left:p.x+'%',top:p.y+'%',width:p.w+'%',height:p.h+'%'});
    if(p.rotate) el.style.transform=`rotate(${p.rotate}deg)`;
  }
  function image(id,src,p,z,onError,clipPath) {
    const el=document.createElement('img');el.className='innSceneLayer';el.alt='';el.draggable=false;
    el.dataset.objectId=id;el.style.zIndex=z;rect(el,p);
    if(clipPath)el.style.clipPath=clipPath;
    if(onError)el.onerror=onError;
    el.src=src;return el;
  }
  function target(id,label,p,priority,activate) {
    const el=document.createElement('button');el.type='button';el.className='innSceneTarget';
    el.dataset.interaction=id;el.setAttribute('aria-label',label);el.style.zIndex=100+priority;rect(el,p);
    const text=document.createElement('span');text.textContent=label.replace(/살펴보기|과 이야기하기/g,'');el.append(text);
    el.onclick=activate;return el;
  }
  const timers=new WeakMap(), seen=new Set();
  function panel(scene,host) {
    if(host.dataset.innPanel)return;
    host.dataset.innPanel='true';host.className='innSceneFooter';
    host.replaceChildren();
    const content=document.createElement('div');content.className='innInfo';
    content.setAttribute('role','status');content.setAttribute('aria-live','polite');content.setAttribute('aria-atomic','true');
    content.tabIndex=0;content.setAttribute('aria-label','조사 내용');
    const help=document.createElement('button');help.type='button';help.className='innHelp';help.textContent='?';
    help.setAttribute('aria-label','조사할 수 있는 위치 잠깐 보기');help.onclick=()=>hints(scene);
    host.append(content,help);reset(scene);
  }
  function info(sceneId,{zh='',pronunciation='',ko='',note='',dialogue=false}={}) {
    const scene=document.getElementById(sceneId),content=scene?.parentElement.querySelector('.innInfo');
    if(!content)return;
    content.replaceChildren();
    function line(text,cls,lang){if(!text)return;const el=document.createElement('div');el.className=cls;el.textContent=text;if(lang)el.lang=lang;content.append(el);return el;}
    line(zh,dialogue?'innDialogue':'innWord','zh-Hant');line(pronunciation,'innPronunciation','zh-Bopo');
    if(dialogue){
      const button=document.createElement('button');button.type='button';button.className='innTranslation';button.textContent='한국어 뜻 보기';button.setAttribute('aria-expanded','false');
      const meaning=line(ko,'innMeaning','ko');meaning.hidden=true;
      button.onclick=()=>{meaning.hidden=!meaning.hidden;button.setAttribute('aria-expanded',String(!meaning.hidden));button.textContent=meaning.hidden?'한국어 뜻 보기':'한국어 뜻 숨기기';};
      content.append(button);
    }else line(ko,'innMeaning','ko');
    line(note,'innNote','ko');content.scrollTop=0;
    content.scrollIntoView({block:'nearest',behavior:'instant'});
  }
  function reset(scene){const content=scene.parentElement.querySelector('.innInfo');if(content){content.textContent='물건이나 사람을 눌러봐.';content.scrollTop=0;}}
  function point(target,x=50,y=50){const dot=document.createElement('i');dot.className='innHintPoint';dot.setAttribute('aria-hidden','true');dot.style.left=x+'%';dot.style.top=y+'%';target.append(dot);}
  function hints(scene,representatives) {
    clearTimeout(timers.get(scene));
    scene.querySelectorAll('.innHalo').forEach(el=>el.classList.remove('innHalo'));
    const ids=representatives||[...scene.querySelectorAll('[data-interaction]')].map(el=>el.dataset.interaction);
    for(const id of ids){
      scene.querySelectorAll('[data-hint-for]').forEach(el=>{if(el.dataset.hintFor===id)el.classList.add('innHalo');});
      scene.querySelectorAll('[data-interaction]').forEach(el=>{if(el.dataset.interaction===id)el.querySelector('.innHintPoint')?.classList.add('innHalo');});
    }
    if(!representatives)scene.querySelectorAll('.innDeskKeepsakeMark').forEach(el=>el.classList.add('innHalo'));
    timers.set(scene,setTimeout(()=>scene.querySelectorAll('.innHalo').forEach(el=>el.classList.remove('innHalo')),1500));
  }
  async function visit(scene,representatives){
    reset(scene);
    const key='inn-exploration-help-v1:'+scene.id;
    try{if(GameStorage.getItem(key))return;}catch{}
    if(seen.has(key))return;
    await Promise.all([...scene.querySelectorAll('img')].map(img=>img.decode?.().catch(()=>{})));
    if(scene.closest('[hidden]'))return;
    seen.add(key);try{GameStorage.setItem(key,'1');}catch{}
    hints(scene,representatives);
  }
  globalThis.InnSceneUtils=Object.freeze({rect,image,target,panel,info,point,hints,visit});
})();
