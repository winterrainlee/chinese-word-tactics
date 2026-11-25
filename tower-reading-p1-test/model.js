'use strict';
const buildStudies = function buildStudies(){
  const opt=(id,text,feedback='')=>({id,text,feedback});
  const row=(id,text,answer,feedback)=>({id,text,answer,feedback});
  return [
    {id:'03A',title:'문장이 갈라지는 길',zh:'句子的岔路',intro:'색인 옆에 놓인 기록을 읽으며, 다음에 이어질 내용을 어떤 관계로 받아들일지 살펴본다.',tasks:[
      {id:'a-premise',kind:'route',prefix:'既然已經找到漏水的地方，',tail:'就先把位置記下來吧。',markers:['既然','就'],question:'어느 쪽으로 이어질까?',options:[opt('condition','아직 모르는 조건을 가정한다','既然은 여기서 받아들인 상황에서 출발해.'),opt('premise','받아들인 전제에서 판단한다'),opt('sequence','시간 순서만 이어 간다','단순히 먼저와 나중을 말하는 것이 아니라, 찾았다는 전제에서 판단해.')],answer:'premise',result:'누수 지점을 찾았다는 전제에서 위치를 기록하자고 한다.',help:'既然 (ㄐㄧˋ ㄖㄢˊ): 이미 그러한 이상. 받아들인 전제에서 다음 판단으로 이어 준다.'},
      {id:'a-otherwise',kind:'route',prefix:'先把窗戶關上，不然',tail:'雨水會淋濕桌上的地圖。',markers:['不然'],anchor:'關上窗戶',question:'어느 경우의 결과를 이어 받을까?',options:[opt('done','창문을 닫으면','不然은 앞에서 권한 행동을 하지 않을 경우를 이어 줘.'),opt('notdone','창문을 닫지 않으면')],answer:'notdone',result:'지도가 비에 젖는다는 결과는 창문을 닫지 않은 경우에 붙는다. 닫았을 때의 결과는 명시하지 않았다.',help:'不然 (ㄅㄨˋ ㄖㄢˊ): 그렇지 않으면.'},
      {id:'a-sequence',kind:'route',prefix:'先把窗戶關上，然後',tail:'把地圖放進抽屜裡。',markers:['然後'],anchor:'關上窗戶',question:'같은 행동에서 이번에는 어디로 이어질까?',options:[opt('notdone','창문을 닫지 않으면','然後는 앞 행동을 하지 않은 경우가 아니라, 그다음 행동을 이어 줘.'),opt('next','창문을 닫은 다음')],answer:'next',result:'창문을 닫은 뒤 지도를 서랍에 넣는다. 不然과 달리 행동의 순서다.',help:'然後 (ㄖㄢˊ ㄏㄡˋ): 그런 뒤, 그다음에.'},
      {id:'a-transfer',kind:'route',prefix:'把資料收好，要不然',tail:'明天可能找不到。',markers:['要不然'],question:'어느 상황을 염두에 두고 뒤를 읽을까?',options:[opt('notdone','자료를 정리하지 않은 경우'),opt('done','자료를 정리한 뒤','要不然은 이 문장에서 앞의 행동을 하지 않을 경우의 결과를 말해.')],answer:'notdone',result:'정리하지 않을 경우 내일 찾지 못할 가능성을 말한다. 실제로 자료를 잃어버렸다는 뜻은 아니다.',help:'要不然 (ㄧㄠˋ ㄅㄨˋ ㄖㄢˊ): 그렇지 않으면. 이 문맥에서는 不然과 비슷하다.'},
      {id:'a-read',kind:'reading',prefix:'既然已經找到漏水的地方，就先記下位置。然後把地圖收好，不然雨水可能會淋濕地圖。',markers:[],question:'소년의 다음 행동으로 알맞은 것은?',options:[opt('later','先記下位置，再收好地圖。'),opt('wet','等地圖被雨水淋濕，再記下位置。','젖을 때까지 기다리는 것이 아니라 젖지 않게 조치하자는 말이야.'),opt('lost','地圖已經被雨水淋濕了。','可能은 아직 발생하지 않은 가능성을 나타내.')],answer:'later',result:'받아들인 전제 → 기록 → 지도 정리 → 정리하지 않을 경우의 위험. 여러 관계를 이어 읽었어.'}
    ]},
    {id:'03B',title:'변하는 것과 남는 것',zh:'改變與延續',intro:'옛 기록을 읽고 지금의 모습과 비교한다. 한 부분이 달라져도 다른 사실은 그대로 남을 수 있다.',tasks:[
      {id:'b-still',kind:'matrix',prefix:'舊記錄提到，很多人沿著那條路前往市集。少年說，那條路現在仍然有人走。',markers:['仍然'],question:'두 기록에서 확인할 수 있는 범위를 표시해 보자.',columns:[opt('same','이어짐'),opt('unknown','알 수 없음')],rows:[row('path','那條路有人走','same','과거 기록과 현재 증언 모두 길을 이용하는 사람이 있다는 뜻이야.'),row('count','每天的人數跟以前一樣','unknown','사람 수가 같다고 말하지는 않았어.')],result:'이어지는 것은 길의 이용이다. 이용자 수가 예전과 같은지는 확인할 수 없다.',help:'仍然 (ㄖㄥˊ ㄖㄢˊ): 여전히, 아직도. 특정 상태나 행동이 이어짐을 알린다.'},
      {id:'b-despite',kind:'matrix',prefix:'雖然路旁的一間店已經換了主人，那條路依然有人走。',markers:['雖然','依然'],question:'달라진 것과 이어지는 것을 나누어 보자.',columns:[opt('changed','달라짐'),opt('same','이어짐')],rows:[row('shop','路旁店家的主人','changed','店已經換了主人은 주인이 바뀌었다는 사실이야.'),row('road','有人走那條路','same','依然 뒤에서 길의 이용이 이어진다는 걸 읽어.')],result:'가게 주인은 달라졌고 길을 이용하는 사람은 여전히 있다. 雖然 뒤의 사실도 지우지 않는다.',help:'依然 (ㄧ ㄖㄢˊ): 여전히 그러하다. 이 문맥에서는 仍然과 바꾸어 쓸 수 있어.'},
      {id:'b-concede',kind:'route',prefix:'舊地圖固然很有參考價值，',tail:'但是不能只靠它了解現在的市集。',markers:['固然','但是'],question:'뒤에 이어질 내용을 어떻게 받을까?',options:[opt('deny','앞 내용을 전부 부정한다','固然은 앞의 타당한 점을 인정하고 다른 면을 읽게 해.'),opt('add','앞의 타당한 점을 인정하고 다른 면도 본다'),opt('order','그다음 사건을 말한다','시간 순서가 아니라 두 측면을 함께 읽는 문장이야.')],answer:'add',result:'옛 지도의 가치는 인정하면서, 지금의 장터를 이해하는 데에는 한계가 있다고 덧붙인다.',help:'固然 (ㄍㄨˋ ㄖㄢˊ): 이 양보 용법에서는 앞의 타당함을 인정하고 다른 측면도 이어 준다.'},
      {id:'b-even',kind:'route',prefix:'縱然以後那條路不再有人走，',tail:'這份記錄依然值得保存。',markers:['縱然','依然'],question:'어떤 마음으로 뒤의 결론을 기다릴까?',options:[opt('known','길을 더 이상 이용하지 않는 사실이 이미 확인됐다','縱然은 여기서 앞으로 일어날 수도 있는 상황을 양보의 대상으로 삼고 있어.'),opt('hypo','설령 그런 상황이어도 뒤의 결론은 유지된다')],answer:'hypo',result:'앞으로 길이 쓰이지 않더라도 기록은 보존할 가치가 있다는 판단이다. 길이 실제로 폐쇄되었다는 말이 아니다.',help:'縱然 (ㄗㄨㄥˋ ㄖㄢˊ): 설령 그렇더라도.'},
      {id:'b-read',kind:'reading',prefix:'雖然路旁的一間店已經換了主人，那條路依然有人走。舊記錄固然不能說明今天所有的情況，但是仍然有參考價值。縱然將來那條路不再有人走，我們也應該保存這份記錄。',markers:[],question:'이 글에 맞는 해석은?',options:[opt('all','舊記錄和現在的情況完全一樣。','가게 주인은 달라졌고 옛 기록은 현재 전체를 설명하지 못해.'),opt('value','有些情況改變了，但舊記錄還是值得保存。'),opt('discard','那條路已經沒有人走了，舊記錄也沒用了。','길은 지금도 이용 중이고, 앞으로의 가정은 현재 사실이 아니야.')],answer:'value',result:'달라진 사실, 이어지는 상태, 가정과 유지되는 결론을 함께 남겼어.'}
    ]},
    {id:'03C',title:'어디까지 그렇게 말할 수 있을까',zh:'可以這樣說嗎？',intro:'기록과 사진, 연구원의 메모를 읽는다. 실제 관찰과 글쓴이의 판단을 구별한다.',tasks:[
      {id:'c-evidence',kind:'evidence',prefix:'二十年前的照片裡已經有這座橋了。顯然，這座橋不是最近才蓋的。',markers:['顯然'],question:'사진에서 직접 확인한 내용과 그에 따른 판단을 구별하자.',columns:[opt('observation','직접 관찰'),opt('judgment','자료에서 내린 판단')],rows:[row('photo','二十年前的照片裡已經有這座橋','observation','사진에 다리가 있다는 관찰 자료야.'),row('age','這座橋不是最近才蓋的','judgment','顯然 뒤는 앞의 관찰에 근거해 도출한 판단이야.')],result:'顯然은 뒤의 내용을 명백하다고 여기는 판단으로 제시한다. 판단의 근거는 앞 사진이다.',help:'顯然 (ㄒㄧㄢˇ ㄖㄢˊ): 명백히, 분명히. 그 표현만으로 판단의 진실이 보증되지는 않아.'},
      {id:'c-inevitable',kind:'evidence',prefix:'研究員看見齒輪上有一條裂縫。他說：「如果一直不修理，齒輪必然會斷掉。」',markers:['如果','必然'],question:'어느 내용이 지금 확인됐고 어느 내용이 조건에 따른 판단일까?',columns:[opt('observed','지금 확인'),opt('projected','조건부 판단')],rows:[row('crack','齒輪上有一條裂縫','observed','연구원이 실제로 본 것은 금이 가 있다는 사실이야.'),row('break','齒輪會斷掉','projected','수리하지 않을 경우의 결과로 제시했지, 실제로 부러졌다고 관찰한 것은 아니야.')],result:'必然은 화자가 결과를 필연적인 것으로 제시하는 말이다. 조건의 성립이나 사건의 발생과는 별개다.',help:'必然 (ㄅㄧˋ ㄖㄢˊ): 반드시 그렇게 됨, 필연적임.'},
      {id:'c-confidence',kind:'evidence',prefix:'舊圖上畫著三條路。有人在圖旁寫道：「這三條路當然都還在。」',markers:['當然'],question:'옛 지도가 알려주는 것과 쪽지 작성자의 판단을 나누자.',columns:[opt('source','옛 지도에 있는 내용'),opt('claim','쪽지 작성자의 판단')],rows:[row('three','舊圖上畫著三條路','source','지도에는 세 길이 그려져 있어.'),row('all','這三條路都還在','claim','當然은 쪽지 작성자가 당연하게 여긴다는 말이야. 현재 세 길의 상태는 별도 확인해야 해.')],result:'當然은 발화자의 확신을 드러낸다. 그렇다고 그 판단이 자동으로 사실이나 오류가 되는 것은 아니다.',help:'當然 (ㄉㄤ ㄖㄢˊ): 당연히, 물론.'},
      {id:'c-scope',kind:'matrix',prefix:'「舊圖完全沒有參考價值。」少年說：「也不盡然。至少那條路現在還有人走。」',markers:['不盡然','至少'],question:'소년의 말이 어디까지 판단을 제한하는지 표시해 보자.',columns:[opt('keep','남긴다'),opt('reject','그대로 받아들이지 않는다')],rows:[row('path','那條路現在還有人走','keep','소년이 예로 든 사실은 남겨야 해.'),row('none','舊圖完全沒有參考價值','reject','不盡然은 전적으로 그렇다고 받아들이지 않는 말이야.')],result:'옛 지도에 아무 가치도 없다는 전체 판단을 제한한다. 그렇다고 옛 지도가 전부 정확하다고 단정하지 않는다.',help:'不盡然 (ㄅㄨˋ ㄐㄧㄣˋ ㄖㄢˊ): 꼭 그렇지만은 않다.'},
      {id:'c-surprise',kind:'route',prefix:'研究員原以為水車已經不能用了。它居然',tail:'還能正常運轉。',markers:['居然'],question:'이제 실제 결과를 어떤 관점에서 읽을까?',options:[opt('matched','예상과 같다고 본다','居然은 뜻밖이라는 평가를 붙여. 예상과 맞았다는 果然과 구별해.'),opt('surprise','예상과 다르다고 본다')],answer:'surprise',result:'실제로 정상 작동했다는 결과는 예상과 달랐다. 竟然도 이 문맥에서 자연스럽다. 좋은 결과인지 나쁜 결과인지는 기준이 아니다.',help:'居然 (ㄐㄩ ㄖㄢˊ): 뜻밖에도. 竟然과 의미가 가까워.'},
      {id:'c-read',kind:'reading',prefix:'研究員原以為水車已經不能用了。它竟然還能正常運轉。檢查後，研究員發現齒輪上有一條裂縫。他說，如果一直不修理，齒輪必然會斷掉。有人認為水車現在完全沒有問題，這也不盡然。',markers:[],question:'이 기록을 관리자에게 어떻게 전할까?',options:[opt('broken','齒輪已經斷掉了，水車完全不能用。','아직 부러졌다는 관찰이 없어. 실제로는 작동하고 있어.'),opt('safe','水車能運轉，所以完全沒有問題。','작동하는 사실과 금이 있다는 사실을 둘 다 남겨야 해.'),opt('report','水車還能運轉，但齒輪有裂縫，需要檢查和修理。')],answer:'report',result:'뜻밖의 실제 결과, 확인된 균열, 조건에 따른 판단, 지나친 확신의 제한을 구분했어.'}
    ]}
  ];
};
const buildModel = function buildModel(studies){
  const tasks=studies.flatMap(s=>s.tasks);
  const lookup=(sid,tid)=>studies.find(s=>s.id===sid)?.tasks.find(t=>t.id===tid);
  function fresh(study){if(!studies.some(s=>s.id===study))throw Error('unknown study');return {study,index:0,attempted:false,solved:false,selected:{},last:null,done:false};}
  function current(s){return studies.find(x=>x.id===s.study)?.tasks[s.index];}
  function apply(state,action){
    const s={...state,selected:{...state.selected}},t=current(s);
    if(s.done||!t)return s;
    if(action.type==='next'&&s.solved){const list=studies.find(x=>x.id===s.study).tasks;if(s.index+1===list.length)return {...s,done:true};return {...fresh(s.study),index:s.index+1};}
    if(s.solved)return s;
    if(action.type==='answer'&&t.options?.some(o=>o.id===action.id)){
      const o=t.options.find(o=>o.id===action.id);
      s.attempted=true;s.solved=o.id===t.answer;s.last={correct:s.solved,feedback:s.solved?t.result:o.feedback};return s;
    }
    if(action.type==='set'&&t.rows?.some(r=>r.id===action.row)&&t.columns.some(c=>c.id===action.id)){
      s.selected[action.row]=action.id;s.last=null;return s;
    }
    if(action.type==='check'&&t.rows&&t.rows.every(r=>s.selected[r.id])){
      const wrong=t.rows.find(r=>s.selected[r.id]!==r.answer);
      s.attempted=true;s.solved=!wrong;s.last={correct:s.solved,feedback:wrong?wrong.feedback:t.result};return s;
    }
    return s;
  }
  function visible(s){const t=current(s);return t?t.prefix+(t.tail?(s.attempted?t.tail:'……'):''):'';}
  function validate(){
    const ids=new Set();
    for(const t of tasks){if(ids.has(t.id)||!t.prefix||!t.result)throw Error('invalid task '+t.id);ids.add(t.id);
      if(t.kind==='route'&&!t.tail)throw Error('route without tail '+t.id);
      if(t.kind==='reading'&&(t.markers.length||t.tail))throw Error('assisted reading '+t.id);
      if(t.markers.some(m=>!(t.prefix+(t.tail||'')).includes(m)))throw Error('missing marker '+t.id);
      if(t.options){if(!t.options.some(o=>o.id===t.answer)||new Set(t.options.map(o=>o.id)).size!==t.options.length||t.options.some(o=>o.id!==t.answer&&!o.feedback))throw Error('invalid options '+t.id);}
      else if(!t.rows?.length||t.rows.some(r=>!t.columns.some(c=>c.id===r.answer)||!r.feedback)||new Set(t.rows.map(r=>r.id)).size!==t.rows.length)throw Error('invalid rows '+t.id);
    }
    return true;
  }
  return {studies,lookup,fresh,current,apply,visible,validate};
};
const TowerReadingModel = buildModel(buildStudies());
if(typeof module!=='undefined' && module.exports)module.exports=TowerReadingModel;
else globalThis.TowerReadingModel=TowerReadingModel;
