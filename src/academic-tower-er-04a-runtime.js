/* Academic Tower 04A: independent fieldwork meaning/reveal logic.
   Pure state and a small mobile workbench renderer; no storage writes here. */
(() => {
  const STAGE_ID = 'academic-tower-turn-04a-er-family';
  const TASK_IDS = Object.freeze([
    'er-rain-01-upstream', 'er-rain-02-contrast', 'er-rain-03-side-flow',
    'er-rain-04-scope', 'er-rain-05-next'
  ]);
  const SCENES = Object.freeze({ retrace: 'academic-tower-er-scene-retrace', record: 'academic-tower-er-scene-record' });
  const WORDS_BY_TASK = Object.freeze([
    ['而且'], ['然而'], ['反而'], ['而是', '而已'], ['從而', '因而', '進而']
  ]);
  const ALLOWED = Object.freeze({
    t1: ['a-grass-high', 'a-current-level', 'a-gate-failure-theory'],
    t2: ['check-between-b-c', 'deny-b-intake', 'conclude-gate-broken'],
    zones: ['top-stone', 'low-bank', 'near-wheel'],
    t3: ['flow-out', 'flow-in'],
    t4a: ['artificial-passage', 'natural-crack'],
    t4b: ['scope-original-only', 'scope-all-records-missing', 'scope-theft-certain'],
    method: ['method-compare', 'method-guess'],
    action: ['notify-manager', 'close-opening'],
    inquiry: ['inquiry-records', 'inquiry-outlet']
  });
  const clone = value => JSON.parse(JSON.stringify(value));
  const html = text => String(text ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
  const includes = (name, value) => ALLOWED[name].includes(value);
  const titleFor = index => ['남은 흔적', '예상과 다른 물', '물소리의 방향', '도면에 없는 길', '다음 질문'][index] || '';
  const taskStep = index => index === 2 ? 'search' : index === 3 ? 'correct' : index === 4 ? 'summary' : 'choice';
  const taskWords = index => WORDS_BY_TASK[index] || [];

  function createState() {
    return {
      kind: 'er-fieldwork', schemaVersion: 1, taskIndex: 0, phase: 'work', step: 'choice',
      completedTaskIds: [], seenScenes: [], sceneId: null, sceneIndex: 0,
      introVariantId: 'ordinary', selected: null, inspectedZoneIds: [],
      openingFound: false, drafts: {}, lastCheck: null,
      // Optional v1 extension. Legacy 04A saves without these fields are valid.
      t1ObservedIds: [], t1Focus: null, t1CurrentRecorded: false, t4Inspected: false
    };
  }
  function validState(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        value.kind !== 'er-fieldwork' || value.schemaVersion !== 1 ||
        !Number.isInteger(value.taskIndex) || value.taskIndex < 0 || value.taskIndex > 4 ||
        !['work', 'review', 'scene', 'complete'].includes(value.phase) ||
        !['choice', 'search', 'direction', 'correct', 'scope', 'summary'].includes(value.step) ||
        !['ordinary', 'familiar'].includes(value.introVariantId) ||
        !Array.isArray(value.completedTaskIds) || !Array.isArray(value.seenScenes) ||
        !Array.isArray(value.inspectedZoneIds) || value.openingFound !== true && value.openingFound !== false ||
        !value.drafts || typeof value.drafts !== 'object' || Array.isArray(value.drafts) ||
        !Number.isInteger(value.sceneIndex) || value.sceneIndex < 0 || value.sceneIndex > 10) return false;
    if (value.t1ObservedIds !== undefined && (!Array.isArray(value.t1ObservedIds) ||
        value.t1ObservedIds.length > 2 ||
        new Set(value.t1ObservedIds).size !== value.t1ObservedIds.length ||
        !value.t1ObservedIds.every(id=>['a-grass-high','a-current-level'].includes(id)))) return false;
    if (value.t1Focus !== undefined && value.t1Focus !== null &&
        !['a-grass-high','a-current-level'].includes(value.t1Focus)) return false;
    if (value.t1CurrentRecorded !== undefined && typeof value.t1CurrentRecorded !== 'boolean') return false;
    if (value.t4Inspected !== undefined && typeof value.t4Inspected !== 'boolean') return false;
    if (value.seenScenes.length > 2 || new Set(value.seenScenes).size !== value.seenScenes.length ||
        !value.seenScenes.every(v => Object.hasOwn(SCENES, v))) return false;
    if (value.inspectedZoneIds.length > 3 || new Set(value.inspectedZoneIds).size !== value.inspectedZoneIds.length ||
        !value.inspectedZoneIds.every(v => includes('zones',v))) return false;
    const n = value.phase === 'complete' ? 5 :
      value.phase === 'review' ? value.taskIndex + 1 : value.taskIndex;
    if (value.completedTaskIds.length !== n || value.completedTaskIds.some((v,i)=>v!==TASK_IDS[i])) return false;
    if (value.phase === 'scene' && !((value.taskIndex===2 && value.sceneId==='retrace') ||
        (value.taskIndex===3 && value.sceneId==='record'))) return false;
    if (value.phase !== 'scene' && (value.sceneId !== null || value.sceneIndex !== 0)) return false;
    if (value.phase !== 'complete' && value.phase !== 'scene' &&
        value.step !== (value.taskIndex===2 ? (value.openingFound ? 'direction' : 'search') :
        value.taskIndex===3 ? (value.drafts.t4a==='artificial-passage' ? 'scope' : 'correct') : taskStep(value.taskIndex))) return false;
    if (value.taskIndex < 2 && value.openingFound) return false;
    if (value.openingFound && !value.inspectedZoneIds.includes('low-bank')) return false;
    const selected = value.selected;
    if (selected !== null && !(value.phase === 'work' && (
      value.taskIndex===0 && includes('t1',selected) ||
      value.taskIndex===1 && includes('t2',selected) ||
      value.taskIndex===2 && value.step==='direction' && includes('t3',selected) ||
      value.taskIndex===3 && includes(value.step==='correct'?'t4a':'t4b',selected)
    ))) return false;
    for (const [key, list] of Object.entries({
      t1:'t1',t2:'t2',t3:'t3',t4a:'t4a',t4b:'t4b',method:'method',action:'action',inquiry:'inquiry'
    })) {
      if (value.drafts[key] !== undefined && !includes(list,value.drafts[key])) return false;
    }
    if (Object.keys(value.drafts).some(key=>!['t1','t2','t3','t4a','t4b','method','action','inquiry'].includes(key))) return false;
    if (value.lastCheck !== null && (!value.lastCheck || typeof value.lastCheck !== 'object' ||
      typeof value.lastCheck.correct !== 'boolean' ||
      typeof value.lastCheck.feedbackKo !== 'string' || value.lastCheck.feedbackKo.length>240)) return false;
    if (value.phase === 'complete' && (!value.drafts.method || !value.drafts.action ||
      !includes('inquiry',value.drafts.inquiry))) return false;
    return true;
  }
  function normalizeState(value) {
    if (!validState(value)) return createState();
    const saved=clone(value);
    const fresh=createState();
    saved.t1ObservedIds ||= [];
    saved.t1Focus ??= null;
    saved.t1CurrentRecorded ??= false;
    saved.t4Inspected ??= false;
    // Previous completed records remain complete, not re-opened for new artwork.
    if (saved.completedTaskIds.includes(TASK_IDS[0]) &&
        !saved.t1ObservedIds.includes('a-grass-high')) saved.t1ObservedIds.push('a-grass-high');
    if (saved.completedTaskIds.includes(TASK_IDS[3]) ||
        saved.drafts.t4a==='artificial-passage') saved.t4Inspected=true;
    return saved;
  }
  function validProgressMap(raw) {
    return !!raw && typeof raw==='object' && !Array.isArray(raw) &&
      Object.keys(raw).every(key=>key===STAGE_ID && validState(raw[key]));
  }
  function progressMap(raw) {
    return validProgressMap(raw) ? clone(raw) : {};
  }
  function revealedWords(state) {
    if (!validState(state)) return [];
    const max = state.taskIndex;
    return [...new Set(WORDS_BY_TASK.flatMap((words,i)=>i<=max ? words : []))];
  }
  function applyAction(config, current, action) {
    const next = normalizeState(current);
    if (next.phase === 'complete') return { state:next, changed:false };
    let changed=false, correct=null, feedback='';
    const wrong = message => {
      correct=false; feedback=message;
      next.lastCheck={correct:false,feedbackKo:message}; changed=true;
    };
    const accept = message => {
      correct=true; feedback=message;
      next.lastCheck={correct:true,feedbackKo:message};
      next.completedTaskIds.push(TASK_IDS[next.taskIndex]);
      next.phase=next.taskIndex===4 ? 'complete' : 'review';
      next.selected=null; changed=true;
    };
    const select = (list,value) => {
      if (!includes(list,value) || next.selected===value) return;
      next.selected=value; next.lastCheck=null; changed=true;
    };
    if (next.phase === 'scene') {
      if (action.type==='er-scene-finish') {
        next.seenScenes=[...new Set([...next.seenScenes,next.sceneId])];
        next.phase='work';next.sceneId=null;next.sceneIndex=0;
        next.selected=null;next.lastCheck=null;changed=true;
      }
    } else if (next.phase === 'review') {
      if (action.type==='er-next') {
        next.taskIndex++;next.phase='work';next.step=taskStep(next.taskIndex);
        next.selected=null;next.lastCheck=null;
        if(next.taskIndex===2 || next.taskIndex===3) {
          next.phase='scene';next.sceneId=next.taskIndex===2?'retrace':'record';
          next.sceneIndex=0;
        }
        changed=true;
      }
    } else if (next.phase === 'work') {
      if (action.type==='er-observe' && next.taskIndex===0 &&
          ['a-grass-high','a-current-level'].includes(action.value)) {
        if (!next.t1ObservedIds.includes(action.value)) next.t1ObservedIds.push(action.value);
        next.t1Focus=action.value;
        // A current-level observation is true and belongs to today's record.
        if (action.value==='a-current-level') {
          next.t1CurrentRecorded=true; next.selected=null;
          next.lastCheck={correct:true,feedbackKo:'지금 수위도 관찰했어. 오늘의 수위에 따로 적어 두었어.'};
        } else {
          next.selected='a-grass-high'; next.lastCheck=null;
        }
        changed=true;
      } else if (action.type==='er-inspect-d' && next.taskIndex===3 &&
          next.step==='correct' && !next.t4Inspected) {
        next.t4Inspected=true;next.lastCheck=null;changed=true;
      } else if (action.type==='er-select') {
        const list=next.taskIndex===0?'t1':next.taskIndex===1?'t2':
          next.taskIndex===2?'t3':next.taskIndex===3?(next.step==='correct'?'t4a':'t4b'):null;
        if (list && (next.taskIndex!==2 || next.step==='direction') &&
            (next.taskIndex!==0 || next.t1ObservedIds.includes('a-grass-high')) &&
            (next.taskIndex!==3 || next.step!=='correct' || next.t4Inspected)) select(list,action.value);
      } else if (action.type==='er-search' && next.taskIndex===2 && next.step==='search' && includes('zones',action.value)) {
        if (!next.inspectedZoneIds.includes(action.value)) next.inspectedZoneIds.push(action.value);
        if (action.value==='low-bank') {
          next.openingFound=true;next.step='direction';next.lastCheck=null;
        } else {
          next.lastCheck={correct:false,feedbackKo:'여기는 평소의 수로 소리가 들려. 다른 방향도 살펴보자.'};
        }
        changed=true;
      } else if (action.type==='er-note' && next.taskIndex===4 &&
          [['method','method'],['action','action'],['inquiry','inquiry']].some(([key])=>key===action.value?.split(':')[0])) {
        const [key,id]=String(action.value).split(':');
        if (includes(key,id) && next.drafts[key]!==id) {
          next.drafts[key]=id;next.lastCheck=null;changed=true;
        }
      } else if (action.type==='er-confirm') {
        const selected=next.selected;
        if (next.taskIndex===0 && selected && next.t1ObservedIds.includes('a-grass-high')) {
          next.drafts.t1=selected;
          if (selected==='a-grass-high') accept('물 자국에 다른 큰물 흔적을 더했어. 지금 수위와는 시점이 달라.');
          else wrong(selected==='a-current-level'
            ? '현재 수위도 사실이야. 하지만 이번에는 지난 높은 물자국을 뒷받침할 또 다른 흔적을 찾아.'
            : '비가 많이 왔다는 사실만으로 수문 고장을 확인할 수는 없어.');
        } else if (next.taskIndex===1 && selected) {
          next.drafts.t2=selected;
          if (selected==='check-between-b-c') accept('B에서 물이 들어가는 사실과 C의 예상 밖 흐름을 둘 다 남겼어.');
          else wrong(selected==='deny-b-intake'
            ? 'B에서는 지금도 물이 들어가고 있어. C의 관측 때문에 그 사실을 지우면 안 돼.'
            : '수문 고장은 확인되지 않았어. B와 C 사이를 더 살펴볼 이유는 있지.');
        } else if (next.taskIndex===2 && next.step==='direction' && selected) {
          next.drafts.t3=selected;
          if (selected==='flow-out') accept('수풀에서 들어올 줄 알았던 물이 오히려 수로 밖으로 나가고 있었어.');
          else wrong('잎은 수로 가운데에서 벽의 틈으로 움직여. 물이 어디로 향하는지 다시 확인해 보자.');
        } else if (next.taskIndex===3 && selected &&
            (next.step!=='correct' || next.t4Inspected)) {
          if (next.step==='correct') {
            next.drafts.t4a=selected;
            if(selected==='artificial-passage') {
              next.step='scope';next.selected=null;next.lastCheck=null;changed=true;
            } else wrong('네모난 모양만이 아니라 돌에 반복된 도구 자국이 있는지도 살펴보자.');
          } else if(next.step==='scope') {
            next.drafts.t4b=selected;
            if(selected==='scope-original-only') accept('원래 도면에는 이 통로가 없어. 이후 변경 기록은 아직 확인하지 못했어.');
            else wrong(selected==='scope-theft-certain'
              ? '누가 왜 만들었는지는 알 수 없어. 물이 나간다는 사실만으로 절도라고 할 수는 없지.'
              : '원래 도면에 없더라도 나중에 작성한 보수·변경 기록이 있을 수 있어.');
          }
        } else if (next.taskIndex===4) {
          const d=next.drafts;
          if (!d.method || !d.action || !d.inquiry) return {state:next,changed:false};
          if (d.method!=='method-compare') wrong('C의 예상과 다른 흐름만으로 새 통로를 확인할 수는 없어. D 현장과 원래 도면을 대조했지.');
          else if(d.action!=='notify-manager') wrong('D가 C의 흐름을 전부 설명한다는 근거는 없어. 관측한 사실부터 관리자에게 전달하자.');
          else accept('확인한 결과, 필요한 조치, 다음 조사 계획을 구분해 한 장의 기록으로 남겼어.');
        }
      }
    }
    return { state:next, changed, correct, feedback };
  }
  function isSolved(state) { return validState(state) && state.phase==='complete' &&
    state.completedTaskIds.length===TASK_IDS.length &&
    state.drafts.method==='method-compare' && state.drafts.action==='notify-manager'; }

  const wordBtn = word => '<button type="button" class="academicMvpWord" data-academic-word="' +
    html(word) + '" lang="zh-Hant" aria-label="' + html(word) + ' 뜻 보기">' + html(word) + '</button>';
  const source = (label,zh,ko='') => '<div class="academicErSourceLine"><small>' + html(label) +
    '</small><p lang="zh-Hant">' + html(zh) + '</p>' +
    (ko ? '<p class="academicErTranslation">' + html(ko) + '</p>' : '') + '</div>';
  const choice = (action,id,text,state,extra='') => '<button type="button" class="academicMvpChoice academicErChoice' +
    (state===id ? ' selected' : '') + '" data-academic-action="' + html(action) +
    '" data-value="' + html(id) + '" aria-pressed="' + (state===id) +
    '">' + html(text) + (extra ? '<small>' + html(extra) + '</small>' : '') + '</button>';
  const controls = (list,action,state) => '<div class="academicErChoices">' +
    list.map(([id,label,sub])=>choice(action,id,label,state,sub)).join('') + '</div>';
  const waterDiagram = (found) => '<div class="academicErWaterDiagram' + (found?' found':'') +
    '" role="img" aria-label="' + (found
      ? '공방 수로 왼쪽 돌벽에 작은 네모난 틈이 드러났어. 실제 방향은 잎의 움직임을 관찰해야 해.'
      : '위에서 아래로 흐르는 공방 수로. 왼쪽에 수풀과 낮은 둑, 오른쪽에 안전한 점검길이 있어.') +
    '"><span class="academicErMapCaption">B 상류 ↓ C 하류</span>' +
    '<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="92" y="0" width="134" height="160" fill="#abcbd8" opacity=".43"/>' +
    '<path d="M92 0V' + (found?'57 M92 92V160':'160') +
    ' M226 0V160" fill="none" stroke="#9b9b8e" stroke-width="7"/>' +
    (found ? '<rect x="80" y="58" width="28" height="33" rx="2" fill="#799098" stroke="#5c6a68" stroke-width="2"/>' +
      '<path d="M143 55q-18 17-32 18 M153 96q-22-16-42-15" fill="none" stroke="#5896a8" stroke-width="2" opacity=".6"/>' +
      '<ellipse cx="153" cy="77" rx="7" ry="3" fill="#a39163"/><ellipse cx="132" cy="74" rx="6" ry="2.5" fill="#a39163" opacity=".6"/>' : '') +
    '<path d="M124 24Q139 30 157 25 M158 123Q180 127 200 122" stroke="#64a4ba" stroke-width="2" fill="none"/>' +
    '<g fill="#77987c"><ellipse cx="51" cy="36" rx="29" ry="14"/><ellipse cx="44" cy="70" rx="31" ry="14"/>' +
    '<ellipse cx="53" cy="106" rx="30" ry="14"/><ellipse cx="43" cy="140" rx="26" ry="13"/></g>' +
    '<g fill="#475a53" font-size="12" text-anchor="middle"><text x="43" y="153">수풀</text>' +
    '<text x="161" y="150">수로</text><text x="277" y="90">점검길</text></g></svg></div>';
  const section = (name,body,kind,author='') => '<section class="' + (kind==='original'?'academicOriginal':'academicMvpMemo') +
    ' academicErZone" data-academic-zone="' + kind + '"' +
    (kind==='work' ? ' data-academic-work-kind="' + html(author || 'decision') + '"' : '') +
    '><div class="academicRegionLabel">' + html(name) + '</div>' + body + '</section>';
  const verdict = state => '<div class="academicMvpFeedback" aria-live="polite">' +
    (state.lastCheck ? html(state.lastCheck.feedbackKo) : '') + '</div>';
  const question = text => '<h2 class="academicTaskTitle">' + html(text) + '</h2>';
  const tentative = text => '<p class="academicErPreview" lang="zh-Hant">' + html(text) + '</p>';
  const taskLabel = state => '<div class="academicCaseProgress">04A · ' + (state.taskIndex+1) + ' / 5</div>';

  function renderWorkbench(config, state) {
    const s=normalizeState(state);
    if(s.phase==='scene')return '';
    let original='',work='';
    const d=s.drafts, done=s.phase==='review' || s.phase==='complete';
    if (s.taskIndex===0) {
      original=source('A · 상류 수위 눈금','石壁上留著這次大雨的高水位痕跡。','지금 수위는 그때의 자국보다 낮아.');
      work=question('이 물 자국과 함께 기록할 다른 흔적은?') +
        (done ? tentative('石壁上留著高水痕，而且高處的石縫裡還卡著草葉。') :
          controls([
            ['a-grass-high','높은 석틈에 걸린 풀잎'],['a-current-level','지금은 낮아진 물높이'],
            ['a-gate-failure-theory','물이 높았으니 수문 고장']
          ],'er-select',s.selected) + (s.selected ? '<p class="academicErHint">선택한 관찰을 메모에 추가할 거야.</p>' : '')) +
        '<div class="academicErWordHelp">' + wordBtn('而且') + '</div>' + verdict(s);
    } else if (s.taskIndex===1) {
      original=source('B · 수문 관리 기록','管理人員在雨後調整過進水口，現在仍有水流進工坊水道。')+
        source('C · 소년의 현재 관찰','到了工坊附近，水流沒有我原先想的那麼急。','비가 많이 와서 물살도 거셀 줄 알았는데 예상보다 약했어.');
      work=question('두 기록을 함께 읽으면 어디를 더 살펴봐야 할까?') +
        (done ? tentative('進水口還有水流入工坊水道。然而，到了工坊附近，水流沒有少年預想的那麼急。') :
          controls([
            ['check-between-b-c','B와 C 사이를 더 살펴본다'],
            ['deny-b-intake','C가 약하니 B에는 물이 들어오지 않는다'],
            ['conclude-gate-broken','수문이 반드시 고장 났다']
          ],'er-select',s.selected)) + '<div class="academicErWordHelp">' + wordBtn('然而') + '</div>' + verdict(s);
    } else if(s.taskIndex===2) {
      original='<p class="academicErSubinfo">B~C 사이의 안전한 점검길</p>' +
        waterDiagram(s.openingFound) +
        '<p class="academicErHint">' + (s.openingFound
          ? '작은 틈이 보여. 잎이 수로 가운데에서 벽의 틈 쪽으로 움직이고 있어.'
          : '소년: “잠깐, 저쪽에서도 물소리가 나요.”') + '</p>' +
        (s.step==='search' ? '<div class="academicErLookOptions">' +
          ALLOWED.zones.map((z,i)=>choice('er-search',z,['상류 돌벽','수풀 옆 낮은 둑','수차 쪽'][i],
            s.inspectedZoneIds.includes(z)?z:null)).join('') + '</div>' : '');
      work=question(s.openingFound ? '실제로 물은 어느 쪽으로 움직일까?' : '소리가 나는 쪽을 살펴보자.') +
        (s.openingFound ? (done ?
          '<p class="academicErPreview"><span>소년의 예상 · 유입</span><span>실제 관측 · 유출</span></p>' +
          tentative('原以為水會從草叢流進水道，沒想到水反而從水道往草叢下方流去。') :
          controls([
            ['flow-out','수로 안 → 벽의 틈 → 수풀 아래'],
            ['flow-in','수풀 아래 → 벽의 틈 → 수로 안']
          ],'er-select',s.selected)) :
          '<p class="academicErHint">소년은 수풀의 빗물이 수로 안으로 들어오는 걸지도 모른다고 생각했어.</p>') +
        '<div class="academicErWordHelp">' + wordBtn('反而') + '</div>' + verdict(s);
    } else if(s.taskIndex===3) {
      original=source('D · 입구의 돌벽','石壁上的孔口很整齊，還留著反覆鑿刻的痕跡。','돌벽에 가지런한 모서리와 반복된 도구 자국이 있어.')+
        source('연구원이 가진 원래 설계도','原圖沒有標出這個孔。');
      if(s.step==='correct') {
        work=question('이 틈은 비로 생긴 균열일까?') +
          controls([['artificial-passage','사람이 도구로 만든 통로'],['natural-crack','큰비에 자연히 깨진 돌벽']],
            'er-select',s.selected) + '<div class="academicErWordHelp">' + wordBtn('而是') + '</div>' + verdict(s);
      } else {
        work=tentative('這不是大雨沖出的裂縫，而是有人鑿出的通道。') +
          question('원래 설계도 한 장으로 어디까지 알 수 있지?') +
          (done ? tentative('圖上沒有標這條通道而已。後來有沒有修改紀錄，還需要再查。') :
            controls([
              ['scope-original-only','원래 도면에 표시가 없어. 이후 변경은 아직 몰라.'],
              ['scope-all-records-missing','다른 변경 기록도 전혀 없는 게 확실해.'],
              ['scope-theft-certain','누군가 몰래 물을 가져가는 게 확실해.']
            ],'er-select',s.selected)) +
          '<div class="academicErWordHelp">' + wordBtn('而是') + wordBtn('而已') + '</div>' + verdict(s);
      }
    } else if(s.taskIndex===4) {
      original='<details class="academicErEvidence"><summary>관측 근거 4개 다시 보기</summary>' +
        source('A · 높은 물 자국','石壁上留著這次大雨的高水位痕跡。') +
        source('B · 수문 관리','進水口還有水流入工坊水道。')+
        source('C · 예상과 다른 흐름','水流沒有少年預想的那麼急。')+
        source('D · 발견한 통로','原圖沒有標出這個孔，但現場有水從這裡流出。')+
        '</details>';
      work=question('확인한 결과와 다음 계획을 구별해 기록하자.')+
        '<div class="academicErRecordRow"><small>從而 · 조사로 확인한 결과</small>' +
        controls([['method-compare','현장과 도면을 대조해 새로운 통로를 확인했어.'],
          ['method-guess','구멍을 만든 사람이 누구인지 알아냈어.']],
          'er-note',d.method || '') .replaceAll('data-value="method-compare"','data-value="method:method-compare"')
          .replaceAll('data-value="method-guess"','data-value="method:method-guess"') +
        '</div><div class="academicErRecordRow"><small>因而 · 필요한 조치</small>' +
        controls([['notify-manager','관리자에게 발견 사실을 알리고 기록 확인을 요청해.'],
          ['close-opening','소년이 직접 구멍을 막고 조사를 마치자.']],
          'er-note',d.action || '').replaceAll('data-value="notify-manager"','data-value="action:notify-manager"')
          .replaceAll('data-value="close-opening"','data-value="action:close-opening"') +
        '</div><div class="academicErRecordRow"><small>進而 · 다음 조사 질문</small>' +
        controls([['inquiry-records','나중의 변경·보수 기록을 찾아볼 계획'],
          ['inquiry-outlet','안전을 확인한 뒤 하류 출구를 살펴볼 계획']],
          'er-note',d.inquiry || '').replaceAll('data-value="inquiry-records"','data-value="inquiry:inquiry-records"')
          .replaceAll('data-value="inquiry-outlet"','data-value="inquiry:inquiry-outlet"') +
        '<p class="academicErHint">둘 다 가능한 다음 질문이야. 오늘 이미 알아낸 결과는 아니지.</p></div>' +
        '<div class="academicErWordHelp">' + wordBtn('從而') + wordBtn('因而') + wordBtn('進而') + '</div>' + verdict(s);
      if(done) work+='<p class="academicErPreview">✓ 확인한 사실·필요한 통보·다음 질문을 구별해서 남겼어.</p>';
    }
    return taskLabel(s)+section(s.taskIndex===2?'현장 관찰':'원본 기록',original,'original') +
      section(['소년의 상류 관찰 메모','연구원과 함께 검토할 점검 메모','소년의 물길 관찰',
        '연구원의 도면 대조 메모','소년과 연구원의 현장 조사 기록'][s.taskIndex],work,'work',
        ['observe','decision','observe','decision','restore'][s.taskIndex]);
  }
  function footer(state) {
    const s=normalizeState(state);
    if(s.phase==='complete')return '<button id="academicMvpConfirm" type="button" class="control academicConfirm" data-academic-action="finish-mvp">결과 이야기로</button>';
    if(s.phase==='review')return '<button id="academicMvpConfirm" type="button" class="control academicConfirm" data-academic-action="er-next">다음 기록</button>';
    const label = s.taskIndex===0?'관찰 메모 남기기':s.taskIndex===1?'점검 메모 남기기':
      s.taskIndex===2?(s.step==='search'?'구간을 살펴보자':'물의 방향 기록'):
      s.taskIndex===3?(s.step==='correct'?'형태 판단 확인':'판단의 범위 기록'):'현장 기록 마무리';
    const ready=s.taskIndex===2 ? s.step==='direction' && !!s.selected :
      s.taskIndex===4 ? !!s.drafts.method && !!s.drafts.action && !!s.drafts.inquiry :
      !!s.selected;
    return '<button id="academicMvpConfirm" type="button" class="control academicConfirm" data-academic-action="er-confirm"' +
      (ready?'':' disabled') + '>' + label + '</button>';
  }
  globalThis.AcademicTowerEr04A = Object.freeze({
    STAGE_ID,TASK_IDS,SCENES,WORDS_BY_TASK,createState,validState,normalizeState,validProgressMap,progressMap,
    applyAction,isSolved,renderWorkbench,footer,titleFor,revealedWords
  });
})();