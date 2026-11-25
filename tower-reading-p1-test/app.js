'use strict';
(function initApp(){
  const M=globalThis.TowerReadingModel, root=document.getElementById('app');
  let state=null, helpOpen=false;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function highlight(str,markers){if(!markers.length)return esc(str);const sorted=[...markers].sort((a,b)=>b.length-a.length);let out='',i=0;while(i<str.length){const w=sorted.find(x=>str.startsWith(x,i));if(w){out+='<mark>'+esc(w)+'</mark>';i+=w.length;}else{out+=esc(str[i]);i++;}}return out;}
  const header=(title,sub,step='')=>'<header><button class="back" data-action="home" aria-label="연구 목록">‹</button><div class="head"><h1>'+esc(title)+'</h1><small>'+esc(sub)+'</small></div><span class="step">'+esc(step)+'</span></header>';
  function render(){
    if(!state){root.innerHTML='<header><div class="head"><small>學術塔 · 試閱</small><h1>문장의 방향</h1></div></header><p class="caption">03 시리즈 독립 시험판</p><div class="rooms">'+M.studies.map(s=>'<button class="room" data-action="start" data-study="'+s.id+'"><span class="num">'+s.id+'</span><span><strong>'+esc(s.title)+'</strong><small lang="zh-Hant">'+esc(s.zh)+' · '+s.tasks.length+'개 기록</small></span></button>').join('')+'</div><p class="quiet">연구를 자유롭게 고를 수 있어. 본편 저장은 사용하지 않아.</p>';return;}
    const st=M.studies.find(s=>s.id===state.study),t=M.current(state);
    if(state.done){root.innerHTML=header(st.title,st.id)+'<section class="complete"><h2>연구 기록을 마쳤어.</h2><p>마지막 기록은 별도 표시 없이 읽었어. 다른 연구도 살펴보거나 같은 연구를 다시 해볼 수 있어.</p><button class="primary" data-action="home">연구 목록</button><button class="primary" data-action="start" data-study="'+st.id+'">다시 연구하기</button></section>';return;}
    const read=t.kind==='reading',shown=highlight(t.prefix,t.markers)+(t.tail?(state.attempted?highlight(t.tail,t.markers):'<span class="pending">……</span>'):'');
    let work='';
    if(t.options){
      const options='<div class="options">'+t.options.map(o=>'<button data-action="answer" data-id="'+esc(o.id)+'" '+(state.solved?'disabled ':'')+(state.solved&&o.id===t.answer?'class="good"':'')+'>'+esc(o.text)+'</button>').join('')+'</div>';
      work=t.kind==='route'?'<div class="route '+(t.anchor?'fork':'')+'">'+(t.anchor?'<div class="anchor" lang="zh-Hant">'+esc(t.anchor)+'</div><div class="branch" aria-hidden="true"></div>':'')+options+'</div>':options;
    }else{
      work='<div class="rows '+(t.kind==='evidence'?'evidence':'')+'">'+t.rows.map(r=>'<div class="row"><p lang="zh-Hant">'+esc(r.text)+'</p><div class="choices" role="group" aria-label="'+esc(r.text)+'">'+t.columns.map(c=>'<button data-action="set" data-row="'+esc(r.id)+'" data-id="'+esc(c.id)+'" aria-pressed="'+(state.selected[r.id]===c.id)+'" '+(state.solved?'disabled ':'')+(state.selected[r.id]===c.id?'class="selected"':'')+'>'+esc(c.text)+'</button>').join('')+'</div></div>').join('')+'</div>';
      if(!state.solved)work+='<button class="primary" data-action="check" '+(t.rows.every(r=>state.selected[r.id])?'':'disabled')+'>기록 확인</button>';
    }
    const feedback=state.last?'<div role="status" class="feedback '+(state.last.correct?'':'wrong')+'"><strong>'+(state.last.correct?'✓ 확인했어':'다시 살펴보자')+'</strong>'+esc(state.last.feedback)+'</div>':'<div role="status"></div>';
    const help=t.help?'<details class="help" '+(helpOpen?'open':'')+'><summary>표현 뜻 보기</summary><p>'+esc(t.help)+'</p></details>':'';
    root.innerHTML=header(st.title,st.id+' · '+(read?'연속 독해':'연구 기록'),(state.index+1)+' / '+st.tasks.length)+
      '<section class="source '+(read?'final':'')+'" aria-label="원문"><span class="caption">'+(read?'전체 기록':'원문 기록')+'</span><p lang="zh-Hant" id="source">'+shown+'</p></section><section class="work"><h2>'+esc(t.question)+'</h2>'+work+feedback+(state.solved?'<button class="primary" data-action="next">'+(state.index+1===st.tasks.length?'연구 마치기':'다음 기록')+'</button>':'')+help+'</section>';
  }
  root.addEventListener('toggle',e=>{if(e.target.tagName==='DETAILS')helpOpen=e.target.open;},true);
  root.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b||b.disabled)return;const {action,id,row,study}=b.dataset;
    if(action==='home'){state=null;helpOpen=false;render();window.scrollTo(0,0);return;}
    if(action==='start'){state=M.fresh(study);helpOpen=false;render();window.scrollTo(0,0);return;}
    if(!state)return;
    const oldIndex=state.index,oldDone=state.done;
    helpOpen=Boolean(root.querySelector('details')?.open);
    state=M.apply(state,{type:action,id,row});if(state.index!==oldIndex||state.done!==oldDone)helpOpen=false;
    render();
    if(action==='next'){window.scrollTo(0,0);}
    else if(state.solved){root.querySelector('[data-action="next"]')?.focus({preventScroll:true});}
    else {const same=[...root.querySelectorAll('button[data-action]')].find(x=>x.dataset.action===action&&x.dataset.id===id&&x.dataset.row===row);same?.focus({preventScroll:true});}
  });
  render();
})();
