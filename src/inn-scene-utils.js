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
  globalThis.InnSceneUtils=Object.freeze({rect,image,target});
})();
