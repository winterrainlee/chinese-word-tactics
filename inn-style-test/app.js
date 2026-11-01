(() => {
 'use strict';
 const $=id=>document.getElementById(id), data=globalThis.InnComparison;
 let style='a', active=null, beat=0, translated=false, lastFocus=null, sheetFocus=null;
 const state={place:'lobby'};
 function showView(name){document.querySelectorAll('.appView').forEach(el=>el.hidden=el.id!==name+'View');state.place=name;window.scrollTo(0,0);}
 function lobby(){globalThis.StoryRuntime?.stop();$('sheet').close();showView('lobby');lastFocus?.focus({preventScroll:true});}
 function navigate(place){history.pushState({innTest:place},'',location.href);if(place==='room'){globalThis.WorldInn.openRoom();$('innRoomBack').setAttribute('aria-label','여관 로비로 돌아가기');$('innRoomMenu').hidden=true;$('innRoomHint').textContent='기존 소년의 방 · 문을 누르면 로비로 돌아가.';}else showView(place);}
 function returnLobby(){if(history.state?.innTest && history.state.innTest!=='lobby')history.back();else lobby();}
 history.replaceState({innTest:'lobby'},'',location.href);
 window.addEventListener('popstate',()=>{if(history.state?.innTest==='room'){globalThis.WorldInn.openRoom();}else lobby();});
 globalThis.GameFlow={progress:()=>({completedMilestones:[]}),showWorld:returnLobby,showMenu:returnLobby};
 globalThis.TacticalGame={showView,closeSheet:()=>{$('sheet').close();},openSheet:html=>{sheetFocus=document.activeElement;$('sheetContent').innerHTML=html;$('sheet').showModal();}};
 $('sheet').addEventListener('close',()=>sheetFocus?.focus());
 $('sheet').addEventListener('click',e=>{if(e.target===$('sheet'))$('sheet').close();});
 function button(text,fn,cls){const b=document.createElement('button');b.textContent=text;b.className=cls||'';b.onclick=fn;return b;}
 function render(){
  $('actions').replaceChildren();$('closeTalk').hidden=!active;
  document.querySelectorAll('.hotspot').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===active)));
  if(!active){$('speaker').textContent='여관 안에서';$('zh').textContent='햇빛이 식탁 위에 머물고 있어.';$('zh').lang='ko';$('ko').hidden=true;return;}
  const line=active==='keeper'?data.talk[beat]:data[active];$('speaker').textContent=line.speaker;$('zh').textContent=line.zh;$('zh').lang='zh-Hant';$('ko').textContent=line.ko;$('ko').hidden=!translated;
  const t=button(translated?'한국어 뜻 접기':'한국어 뜻 보기',()=>{translated=!translated;render();document.querySelector('#actions .translate').focus({preventScroll:true});},'translate');t.setAttribute('aria-expanded',String(translated));t.setAttribute('aria-controls','ko');$('actions').append(t);
  if(active==='keeper'){
   const prev=button('이전',()=>{beat--;translated=false;render();});prev.disabled=beat===0;$('actions').append(prev);
   $('actions').append(button(beat===data.talk.length-1?'대화 마치기':'다음',()=>{if(beat<data.talk.length-1){beat++;translated=false;render();document.querySelector('#actions .next').focus({preventScroll:true});}else closeTalk();},'next'));
  }
  if(active==='door')$('actions').append(button('문밖으로',()=>{navigate('outside');},'next'));
 }
 function closeTalk(){active=null;translated=false;render();lastFocus?.focus({preventScroll:true});}
 $('closeTalk').onclick=closeTalk;
 for(const h of data.hotspots){const b=button('',()=>{lastFocus=b;if(h.id==='stairs'){navigate('room');return;}active=h.id;beat=0;translated=false;render();});b.className='hotspot';b.dataset.id=h.id;b.setAttribute('aria-label',h.label);b.style.cssText=`left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%`;const hint=document.createElement('span');hint.textContent=h.hint;b.append(hint);$('hotspots').append(b);}
 function setStyle(next){style=next;$('imageError').hidden=true;$('backdrop').src=`inn-style-test/assets/lobby-${style}.webp`;$('scene').dataset.style=style;$('styleName').textContent=`${style.toUpperCase()} · ${data.styles[style]}`;document.querySelectorAll('[data-style]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(b.dataset.style===style));});}
 document.querySelectorAll('button[data-style]').forEach(b=>b.onclick=()=>setStyle(b.dataset.style));
 $('backdrop').onerror=()=>{$('imageError').hidden=false;};
 $('hint').onclick=()=>{const on=$('scene').classList.toggle('show-hints');$('hint').setAttribute('aria-pressed',String(on));$('hint').textContent=on?'위치 숨기기':'위치 보기';};
 const outside=document.createElement('main');outside.id='outsideView';outside.className='appView outside';outside.hidden=true;outside.innerHTML='<small>客棧門口 · 여관 문앞</small><h1>거리에 잠깐 나왔어.</h1><p>이번 비교는 여관 안에서 이어가자.</p><button id="reenter">여관으로 들어가기</button>';$('app').append(outside);$('reenter').onclick=returnLobby;
 $('focusStory').onclick=()=>{lastFocus=$('focusStory');navigate('story');globalThis.StoryRuntime.play({id:'inn-style-fixture',titleKo:'돌아온 오후 · 시험 대사',placeZh:'客棧',placeKo:'여관',background:'inn',beats:data.talk.map((l,i)=>({speaker:i===1?'boy':'innkeeper',zh:l.zh,ko:l.ko}))},{beat:0,endLabel:'로비로',seen:false,onPosition:()=>{},onFinish:returnLobby});};
 for(const k of Object.keys(data.styles)){const img=new Image();img.src=`inn-style-test/assets/lobby-${k}.webp`;}
 setStyle(new URLSearchParams(location.search).get('style') in data.styles?new URLSearchParams(location.search).get('style'):'a');render();
})();
