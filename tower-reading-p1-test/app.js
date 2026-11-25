'use strict';
(function initApp(){
  const M=globalThis.TowerReadingModel, root=document.getElementById('app');
  let state=null, helpOpen=false;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function highlight(str,markers){if(!markers.length)return esc(str);const sorted=[...markers].sort((a,b)=>b.length-a.length);let out='',i=0;while(i<str.length){const w=sorted.find(x=>str.startsWith(x,i));if(w){out+='<mark>'+esc(w)+'</mark>';i+=w.length;}else{out+=esc(str[i]);i++;}}return out;}
  const header=(title,sub,step='')=>'<header><button class="back" data-action="home" aria-label="연구 목록">‹</button><div class="head"><h1>'+esc(title)+'</h1><small>'+esc(sub)+'</small></div><span class="step">'+esc(step)+'</span></header>';
  function lessonVisual(v){
    const d=v.visual;
    const cell=(label,value,cls='')=>'<div class="learn-cell '+cls+'"><small>'+esc(label)+'</small><span lang="zh-Hant">'+esc(value)+'</span></div>';
    if(d.type==='flow')return '<div class="learn-flow">'+cell(d.leftLabel,d.left)+'<div class="learn-link"><span aria-hidden="true">↓</span><strong>'+esc(d.link)+'</strong></div>'+cell(d.rightLabel,d.right,'emphasis')+'</div>';
    if(d.type==='fork')return '<div class="learn-fork"><div class="anchor" lang="zh-Hant">'+esc(d.anchor)+'</div><div class="branch" aria-hidden="true"></div><div class="learn-branches">'+cell(d.leftLabel,d.left,d.active==='left'?'emphasis':'unasserted')+cell(d.rightLabel,d.right,d.active==='right'?'emphasis':'unasserted')+'</div></div>';
    if(d.type==='timeline')return '<div class="learn-timeline"><div class="time-labels"><span>과거</span><span></span><span>현재</span></div>'+d.rows.map(r=>'<div class="time-row '+esc(r.tone)+'"><div class="time-title">'+esc(r.label)+' <small>'+esc(r.status)+'</small></div><div class="time-cells"><div lang="zh-Hant">'+esc(r.past)+'</div><span aria-hidden="true">'+(r.tone==='same'?'━':'→')+'</span><div lang="zh-Hant">'+esc(r.now)+'</div></div></div>').join('')+'</div>';
    if(d.type==='scope')return '<div class="learn-scope">'+d.rows.map(r=>'<div class="scope-row '+esc(r.tone)+'"><div><small>'+esc(r.label)+'</small><p lang="zh-Hant">'+esc(r.text)+'</p></div><span>'+esc(r.status)+'</span></div>').join('')+'</div>';
    return '';
  }
  function renderLesson(st,t){
    const v=M.lessonVariant(state);
    const tabs=t.variants.map(w=>'<button data-action="explore" data-id="'+esc(w.id)+'" aria-pressed="'+(w.id===v.id)+'" class="'+(w.id===v.id?'selected':'')+'">'+esc(w.label)+'</button>').join('');
    const next=st.tasks[state.index+1];
    return header(st.title,st.id+' · 표현 관찰',(state.index+1)+' / '+st.tasks.length)+
      '<section class="lesson"><h2>'+esc(t.title)+'</h2><p class="lesson-intro">'+esc(t.intro)+'</p><div class="learn-tabs" role="group" aria-label="비교할 표현">'+tabs+'</div>'+
      '<div class="learn-definition">'+(v.pron?'<small>'+esc(v.pron)+'</small>':'')+'<span>'+esc(v.meaning)+'</span></div>'+
      '<section class="source learn-source" aria-label="원문"><p lang="zh-Hant" id="source">'+highlight(v.sentence,v.markers)+'</p></section>'+
      lessonVisual(v)+'<p class="lesson-note" aria-live="polite">'+esc(v.note)+'</p>'+
      '<button class="primary" data-action="next">'+(next?.kind==='lesson'?'다음 관찰':'적용으로')+'</button></section>';
  }
  function render(){
    if(!state){root.innerHTML='<header><div class="head"><small>學術塔 · 試閱</small><h1>문장의 방향</h1></div></header><p class="caption">03 시리즈 독립 시험판</p><div class="rooms">'+M.studies.map(s=>'<button class="room" data-action="start" data-study="'+s.id+'"><span class="num">'+s.id+'</span><span><strong>'+esc(s.title)+'</strong><small lang="zh-Hant">'+esc(s.zh)+' · '+s.tasks.filter(t=>t.kind==='lesson').length+'개 관찰 · '+s.tasks.filter(t=>t.kind!=='lesson').length+'개 적용</small></span></button>').join('')+'</div><p class="quiet">연구를 자유롭게 고를 수 있어. 본편 저장은 사용하지 않아.</p>';return;}
    const st=M.studies.find(s=>s.id===state.study),t=M.current(state);
    if(state.done){root.innerHTML=header(st.title,st.id)+'<section class="complete"><h2>연구 기록을 마쳤어.</h2><p>마지막 기록은 별도 표시 없이 읽었어. 표현을 비교하고 새 문장에 적용해 봤어. 다른 연구를 살펴보거나 같은 연구를 다시 해볼 수 있어.</p><button class="primary" data-action="home">연구 목록</button><button class="primary" data-action="start" data-study="'+st.id+'">다시 연구하기</button></section>';return;}
    if(t.kind==='lesson'){root.innerHTML=renderLesson(st,t);return;}
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
    root.innerHTML=header(st.title,st.id+' · '+(read?'연속 독해':'의미 적용'),(state.index+1)+' / '+st.tasks.length)+
      '<section class="source '+(read?'final':'')+'" aria-label="원문"><span class="caption">'+(read?'전체 기록':'원문 기록')+'</span><p lang="zh-Hant" id="source">'+shown+'</p></section><section class="work"><h2>'+esc(t.question)+'</h2>'+work+feedback+(state.solved?'<button class="primary" data-action="next">'+(state.index+1===st.tasks.length?'연구 마치기':st.tasks[state.index+1]?.kind==='lesson'?'다음 관찰':'다음 기록')+'</button>':'')+help+'</section>';
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
    else if(action==='explore'){root.querySelector('[data-action="explore"][aria-pressed="true"]')?.focus({preventScroll:true});}
    else if(state.solved){root.querySelector('[data-action="next"]')?.focus({preventScroll:true});}
    else {const same=[...root.querySelectorAll('button[data-action]')].find(x=>x.dataset.action===action&&x.dataset.id===id&&x.dataset.row===row);same?.focus({preventScroll:true});}
  });
  render();
})();
