(() => {
  const host=document.createElement('details');host.id='innTestControls';
  host.innerHTML='<summary>여관 탐색 C 시험판 · 시험 저장</summary><div><p>아래 장면은 별도의 시험 기록으로 열려. 본편 저장은 바뀌지 않아.</p><div id="innTestPresets"></div><p id="innTestVersion"></p></div>';
  document.body.append(host);
  const basic={seenStories:[],completedStages:['stage-5'],completedMilestones:['inn-unlocked'],acknowledgedNodes:[],stageOutcomes:{},lastLocation:{view:'world'},innVisited:false};
  const chapter={...basic,innVisited:true,seenStories:['chapter1-room-finale','chapter1-inn-convergence'],completedMilestones:['inn-unlocked','market-core','gate-core','workshop-core','chapter1-complete']};
  const rain={...chapter,seenStories:[...chapter.seenStories,'chapter2-rain-opening'],completedMilestones:[...chapter.completedMilestones,'chapter2-rain-passed']};
  const board={...rain,seenStories:[...rain.seenStories,FirstFreeQuestContent.OFFER_STORY_ID,'first-free-quest-report','quest-board-installed'],completedStages:['stage-5',FirstFreeQuestContent.STAGE_ID],completedMilestones:[...rain.completedMilestones,FirstFreeQuestContent.BOARD_MILESTONE,FirstFreeQuestContent.COMPLETE_MILESTONE]};
  // Use actual journey nodes to create the report checkpoint, including its story prerequisites.
  const report={...rain,seenStories:[...rain.seenStories,FirstFreeQuestContent.OFFER_STORY_ID],completedStages:['stage-5',FirstFreeQuestContent.STAGE_ID]};
  const keepsakes={...board,seenStories:[...board.seenStories,'gate-after-route','gate-after-convoy','workshop-finale','academic-tower-turn-result'],stageOutcomes:{'gate-stage-3':{viaIds:['west-post','east-post']}}};
  for(const [label,seed] of [['첫 방문',basic],['큰비 전',chapter],['첫 부탁',rain],['귀환 보고',report],['게시판',board],['기념품 있는 방',keepsakes]]) {
    const b=document.createElement('button');b.textContent=label;b.type='button';b.onclick=()=>{
      if(!confirm('시험판 진행을 이 장면으로 바꿀까? 본편 기록은 그대로야.')) return;
      SaveData.KEY_LIST.forEach(key=>GameStorage.removeItem(key));
      GameStorage.setItem(JourneyProgress.KEY,JSON.stringify(seed));
      sessionStorage.setItem('cwt-inn-interaction-enter',label==='기념품 있는 방'?'room':'inn');location.reload();
    };document.getElementById('innTestPresets').append(b);
  }
  const go=document.createElement('button');go.textContent='시험 진행 이어가기';go.onclick=()=>{host.open=false;GameFlow.showWorld();WorldInn.enterInn();};document.getElementById('innTestPresets').append(go);
  fetch('./version.json').then(r=>r.json()).then(v=>{document.getElementById('innTestVersion').textContent=v.version+' · '+v.sourceCommit.slice(0,12);});
  const target=sessionStorage.getItem('cwt-inn-interaction-enter');sessionStorage.removeItem('cwt-inn-interaction-enter');
  if(target){GameFlow.showWorld();target==='room'?WorldInn.openRoom():WorldInn.enterInn();}
  else if(!GameFlow.progress().completedMilestones.includes('inn-unlocked')) host.open=true;
})();
