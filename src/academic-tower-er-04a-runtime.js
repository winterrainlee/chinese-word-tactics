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
          // Correct observation, but do not show a green task-complete stamp.
          next.lastCheck=null;
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
      : '위에서 아래로 흐르는 공방 수로. 왼쪽 수풀 가까운 낮은 둑에 다른 물소리와 젖은 돌 흔적이 있고, 오른쪽에는 안전한 점검길이 있어.') +
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
    (found ? '' : '<path d="M76 84q-11 9 0 18 M83 87q-7 6 0 13" fill="none" stroke="#4a7785" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 3"/>' +
      '<path d="M83 118q6-4 9-2v10q-9-3-13 0" fill="#879d9e" opacity=".7"/>') +
    '<g fill="#475a53" font-size="12" text-anchor="middle"><text x="43" y="153">수풀</text>' +
    '<text x="161" y="150">수로</text><text x="277" y="90">점검길</text></g></svg></div>';

  // Field observations are part of the original/evidence surface, not answers
  // discovered by reading a multiple-choice button.
  const upstreamDiagram = state => '<figure class="academicErScene academicErUpstream" role="img" aria-label="' +
    (state.t1Focus==='a-grass-high'
      ? '상류 돌벽. 높은 물 자국 근처의 석틈에 풀잎이 걸린 것을 확인했어. 지금 수면은 아래에 있어.'
      : state.t1Focus==='a-current-level'
        ? '상류 돌벽. 오늘의 수면이 지난 큰비의 높은 물 자국보다 아래에 있어.'
        : '상류 돌벽의 높은 물 자국과 아래쪽 현재 수면. 자국 근처 높은 석틈에 작은 녹색 흔적이 보이지만 아직 자세히 살피지 않았어.') +
    '"><svg viewBox="0 0 340 208" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><linearGradient id="erWall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#dcd5c2"/><stop offset="1" stop-color="#bab5a5"/></linearGradient>' +
    '<linearGradient id="erWater" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#87b3c1"/><stop offset="1" stop-color="#b4d3d5"/></linearGradient></defs>' +
    '<rect x="2" y="2" width="336" height="204" rx="6" fill="url(#erWall)"/>' +
    '<g stroke="#a6a18e" fill="none" stroke-width="1.7"><path d="M4 46H336 M4 94H336 M4 143H336"/>' +
    '<path d="M85 4V46 M182 4V46 M277 4V46 M44 46V94 M151 46V94 M268 46V94 M102 94V143 M205 94V143 M304 94V143 M54 143V202 M175 143V202 M284 143V202"/></g>' +
    '<path d="M10 82Q52 78 93 82T174 82T258 81T330 81" stroke="#837b68" stroke-width="7" fill="none" opacity=".8"/>' +
    '<path d="M10 88Q72 84 117 89T231 88T331 87" stroke="#b39a7a" stroke-width="3" fill="none" opacity=".9"/>' +
    '<path d="M5 158Q57 153 106 159T218 157T335 158V205H5Z" fill="url(#erWater)"/>' +
    '<g stroke="#dfedf0" fill="none" stroke-width="2"><path d="M15 176Q37 171 62 176T111 176 M136 187Q157 182 180 187T236 187 M252 169Q270 164 286 169T324 169"/></g>' +
    '<g stroke="#736c59" stroke-width="3" stroke-linecap="round" fill="none"><path d="M198 59L211 51L224 60L245 53L263 62"/></g>' +
    '<g stroke="#557d61" stroke-width="2.5" stroke-linecap="round" fill="none"><path d="M231 57L223 33 M231 57L241 30 M231 57L254 44"/></g>' +
    '<g fill="#6d986c"><ellipse cx="223" cy="36" rx="5" ry="10" transform="rotate(-36 223 36)"/><ellipse cx="242" cy="35" rx="5" ry="10" transform="rotate(22 242 35)"/><ellipse cx="251" cy="44" rx="5" ry="9" transform="rotate(63 251 44)"/></g>' +
    '<g fill="#4e5047" font-size="12" font-family="sans-serif"><text x="14" y="70">지난 큰비의 물 자국</text><text x="14" y="192">지금 수면</text></g>' +
    (state.t1Focus==='a-grass-high'
      ? '<circle cx="234" cy="47" r="30" fill="none" stroke="#3d6c50" stroke-width="2.5" stroke-dasharray="5 4"/>'
      : state.t1Focus==='a-current-level'
        ? '<path d="M6 158Q82 153 160 158T335 158" fill="none" stroke="#2e6880" stroke-width="3.5"/>' : '') +
    '</svg></figure>';

  const routeDiagram = () =>
    '<figure class="academicErRoute" role="img" aria-label="B 수문에서는 현재 물이 유입되고 있고 C 공방 쪽에서는 소년의 예상보다 물살이 약해. B와 C 사이의 상태는 아직 확인하지 않았어.">' +
    '<div class="academicErRoutePoint"><strong>B · 수문</strong><span>현재 유입 확인</span></div>' +
    '<div class="academicErRouteGap"><span aria-hidden="true">··· → ···</span><small>아직 확인하지 않은 구간</small></div>' +
    '<div class="academicErRoutePoint"><strong>C · 공방</strong><span>소년 예상보다 약함</span></div>' +
    '</figure>';

  const stoneDiagram = inspected => '<figure class="academicErScene academicErStone" role="img" aria-label="' +
    (inspected
      ? 'D 통로 가까이 다듬어진 네모난 모서리와 일정하게 반복된 도구 자국이 보여.'
      : 'T3에서 발견했던 D 통로의 같은 입구. 가까이서 돌벽 표면을 살펴볼 수 있어.') +
    '"><svg viewBox="0 0 340 166" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect width="340" height="166" rx="5" fill="#c8c2b1"/>' +
    '<path d="M0 48H340 M0 112H340 M85 0V48 M234 0V48 M163 48V112 M73 112V166 M266 112V166" stroke="#a5a090" stroke-width="2" fill="none"/>' +
    '<path d="M115 48H230V139H115Z" fill="#5c747e" stroke="#747064" stroke-width="8"/>' +
    '<path d="M122 58H221V131H122Z" fill="#769ba9"/>' +
    '<path d="M128 76Q159 69 186 78T218 77 M129 111Q165 105 190 113T220 110" fill="none" stroke="#b4d0d5" stroke-width="2"/>' +
    (inspected
      ? '<g stroke="#756c5e" stroke-width="3" stroke-linecap="round"><path d="M105 47l8 -9 M105 62l8 -9 M105 78l8 -9 M105 94l8 -9 M230 49l9 -8 M230 65l9 -8 M230 81l9 -8 M230 97l9 -8"/></g>' +
        '<circle cx="238" cy="54" r="31" fill="none" stroke="#466e56" stroke-width="2.5" stroke-dasharray="5 3"/>' : '') +
    '</svg></figure>';

  const planComparison = () =>
    '<div class="academicErPlans" aria-label="같은 위치를 현장과 원래 도면에서 대조">' +
    '<div class="academicErPlan"><small>현장에서 확인</small><div class="academicErPlanLine marked" aria-hidden="true"><span></span></div><strong>통로가 있어</strong></div>' +
    '<div class="academicErPlan"><small>원래 설계도</small><div class="academicErPlanLine" aria-hidden="true"></div><strong>표시가 없어</strong></div></div>';

  const finalReport = drafts => {
    const next = drafts.inquiry==='inquiry-outlet'
      ? '先記下孔口的位置和水流方向，進而規劃在確認安全後觀察下游出口。'
      : '先記下孔口的位置和水流方向，進而安排查閱後來的修繕紀錄。';
    return '<div class="academicErFinalReport" aria-label="소년과 연구원이 완성한 현장 조사 기록">' +
      '<div><small>확인한 결과 · 從而</small><p lang="zh-Hant">我們對照現場和原圖，從而確認這裡有一條原圖沒有標出的通道。</p></div>' +
      '<div><small>필요한 조치 · 因而</small><p lang="zh-Hant">現場發現有水從原圖未標出的通道流出，因而需要通知管理人員，請他們核對紀錄。</p></div>' +
      '<div><small>다음 조사 · 進而</small><p lang="zh-Hant">' + html(next) + '</p></div></div>';
  };
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
      original='<p class="academicErSubinfo">A · 상류 수위 눈금과 돌벽</p>' +
        upstreamDiagram(s) +
        '<p class="academicErHint">높은 물 자국은 이미 봤어. 돌벽 주변을 더 살펴보자.</p>' +
        '<div class="academicErLookOptions academicErT1Looks">' +
        choice('er-observe','a-grass-high','높은 석틈 살펴보기',s.t1Focus) +
        choice('er-observe','a-current-level','현재 수면 살펴보기',s.t1Focus) +
        '</div>' +
        (s.t1Focus==='a-grass-high'
          ? '<div class="academicErFound" aria-live="polite"><strong>석틈에서 찾았어</strong><p>높은 틈에 풀잎이 걸려 있어. 큰물이 그 높이까지 올라왔다는 걸 뒷받침하는 별도의 흔적이야.</p></div>'
          : s.t1Focus==='a-current-level'
            ? '<div class="academicErFound" aria-live="polite"><strong>오늘의 수위도 관찰했어</strong><p>지금 수면은 물 자국보다 아래에 있어. 오늘의 기록에 따로 남겼어.</p></div>' : '');
      work=source('소년이 이미 기록한 관찰','石壁上留著這次大雨的高水位痕跡。') +
        question('큰물이 여기까지 올라왔음을 보여 주는 또 다른 흔적은?') +
        (done
          ? tentative('石壁上留著這次大雨的高水位痕跡，而且高處的石縫裡還卡著草葉。')
          : s.t1ObservedIds.includes('a-grass-high')
            ? '<p class="academicErHint">방금 살펴본 높은 석틈의 풀잎을 지난 큰물의 흔적에 더할 수 있어.</p>'
            : '<p class="academicErHint">그림에서 높은 석틈을 관찰하면 새 흔적을 메모에 더할 수 있어.</p>') +
        (s.t1CurrentRecorded
          ? '<p class="academicErToday"><strong>오늘의 관측</strong> · 지금 수면은 지난 물 자국보다 낮아.</p>'
          : '') +
        '<div class="academicErWordHelp">' + wordBtn('而且') + '</div>' + verdict(s);
    } else if (s.taskIndex===1) {
      original=routeDiagram() +
        source('B · 수문 관리 담당자의 기록','管理人員在雨後調整過進水口，現在仍有水流進工坊水道。') +
        source('C · 소년의 현재 관찰','到了工坊附近，水流沒有我原先想的那麼急。',
          '큰비 뒤 더 거셀 줄 알았지만 소년의 예상보다 약했어. 평소보다 낮다고 측정한 것은 아니야.');
      work=question('두 사실을 함께 기록한다면 어디까지 말할 수 있을까?') +
        (done
          ? tentative('進水口還有水流入工坊水道。然而，到了工坊附近，水流沒有少年預想的那麼急。') +
            '<p class="academicErHint">둘 다 사실이지만 원인은 아직 몰라. 연구원은 B~C의 안전한 점검길을 확인하자고 해.</p>'
          : controls([
            ['check-between-b-c','B의 유입과 C의 예상 밖 흐름을 둘 다 남기고, 원인은 보류한다.'],
            ['deny-b-intake','C의 흐름이 약하니 B의 유입 기록은 잘못됐을 거야.'],
            ['conclude-gate-broken','수문 조절이 고장의 원인이라고 확정해 보고한다.']
          ],'er-select',s.selected)) +
        '<div class="academicErWordHelp">' + wordBtn('然而') + '</div>' + verdict(s);
    } else if(s.taskIndex===2) {
      original='<p class="academicErSubinfo">B~C 사이 · 조금 전 도식의 미조사 구간</p>' +
        waterDiagram(s.openingFound) +
        '<p class="academicErHint">' + (s.openingFound
          ? '작은 틈이 보여. 잎이 수로 가운데에서 벽의 틈 쪽으로 움직이고 있어.'
          : '소년: “저쪽에서도 물소리가 나요.” 수풀 가까운 곳에서는 돌이 젖은 흔적도 보여.') + '</p>' +
        (s.step==='search' ? '<div class="academicErLookOptions">' +
          ALLOWED.zones.map((z,i)=>choice('er-search',z,['상류 돌벽','수풀 옆 낮은 둑','수차 쪽'][i],
            s.inspectedZoneIds.includes(z)?z:null)).join('') + '</div>' : '');
      work=question(s.openingFound ? '소년은 유입을 예상했어. 실제로 물은 어느 쪽으로 움직일까?' : '소리가 나는 쪽을 살펴보자.') +
        (s.openingFound ? (done ?
          '<p class="academicErPreview"><span>소년의 예상 · 유입</span><span>실제 관측 · 유출</span></p>' +
          tentative('原以為水會從草叢流進水道，沒想到水反而從水道往草叢下方流去。') :
          controls([
            ['flow-out','수로 안 → 벽의 틈 → 수풀 아래'],
            ['flow-in','수풀 아래 → 벽의 틈 → 수로 안']
          ],'er-select',s.selected)) :
          '<p class="academicErHint">소년은 수풀의 빗물이 수로로 들어오는 것일지도 모른다고 예상했어. 아직 확인한 사실은 아니야.</p>') +
        '<div class="academicErWordHelp">' + wordBtn('反而') + '</div>' + verdict(s);
    } else if(s.taskIndex===3) {
      if(s.step==='correct') {
        original='<p class="academicErSubinfo">D · T3에서 찾은 바로 그 입구</p>' +
          stoneDiagram(s.t4Inspected) +
          (s.t4Inspected
            ? source('가까이서 확인한 돌벽','石壁上的孔口很整齊，還留著反覆鑿刻的痕跡。',
                '네모난 모서리를 따라 도구 자국이 반복돼.')
            : '<p class="academicErHint">이 틈이 비로 생겼을까? 돌벽의 표면을 더 가까이 살펴볼 수 있어.</p>' +
              '<button type="button" class="academicMvpChoice academicErInspect" data-academic-action="er-inspect-d">돌벽의 모서리와 표면 살펴보기</button>');
        work=question('이 틈은 비로 생긴 균열일까?') +
          (s.t4Inspected
            ? controls([['artificial-passage','자연 균열이 아니라 사람이 도구로 만든 통로'],
                        ['natural-crack','큰비에 자연히 깨진 돌벽']],
                'er-select',s.selected)
            : '<p class="academicErHint">그림을 더 자세히 관찰한 뒤 어느 해석에 근거가 있는지 정해 보자.</p>') +
          '<div class="academicErWordHelp">' + wordBtn('而是') + '</div>' + verdict(s);
      } else {
        original=stoneDiagram(true)+planComparison() +
          source('연구원이 가진 원래 설계도','原圖沒有標出這個孔。',
            '이후에 만든 변경·보수 기록이 있는지는 아직 조사하지 않았어.');
        work=tentative('這不是大雨沖出的裂縫，而是有人鑿出的通道。') +
          question('원래 설계도 한 장으로 어디까지 말할 수 있지?') +
          (done
            ? tentative('圖上沒有標這條通道而已。後來有沒有修改紀錄，還需要再查。')
            : controls([
              ['scope-original-only','원래 도면에 표시가 없어. 이후 변경 기록은 아직 몰라.'],
              ['scope-all-records-missing','원래 도면에 없으니 이후 변경 기록도 전혀 없을 거야.'],
              ['scope-theft-certain','사람이 팠고 물이 나가니 절도가 확실해.']
            ],'er-select',s.selected)) +
          '<div class="academicErWordHelp">' + wordBtn('而是') + wordBtn('而已') + '</div>' + verdict(s);
      }
    } else if(s.taskIndex===4) {
      original='<details class="academicErEvidence"><summary>확인한 관측 근거 다시 보기 (A~D)</summary>' +
        source('A · 직접 관찰 · 지난 큰비','石壁上留著這次大雨的高水位痕跡，而且高處的石縫裡還卡著草葉。') +
        source('B · 수문 담당자의 기록 · 현재','進水口還有水流入工坊水道。') +
        source('C · 소년의 관찰 · 현재','水流沒有少年預想的那麼急。') +
        source('D · 현장과 원래 설계도 대조','原圖沒有標出這個孔，但現場有水從這裡流出。') +
        '</details>';
      work=question('확인한 결과와 다음 계획을 구별해 기록하자.') +
        (done ? finalReport(d) : (
        '<div class="academicErRecordRow"><small>從而 · 조사로 실제 확인한 결과</small>' +
        controls([['method-compare','D 현장과 원래 도면을 대조해 미표시 통로를 확인했어.'],
          ['method-guess','C의 흐름이 예상보다 약한 것만으로 새 통로를 확인했어.']],
          'er-note',d.method || '').replaceAll('data-value="method-compare"','data-value="method:method-compare"')
          .replaceAll('data-value="method-guess"','data-value="method:method-guess"') +
        '</div><div class="academicErRecordRow"><small>因而 · 지금 필요한 전달</small>' +
        controls([['notify-manager','관리자에게 새 통로와 현재 유출을 알리고 변경 기록 확인을 요청해.'],
          ['close-opening','D가 C의 원인이라고 단정해서 수문 조절을 요구해.']],
          'er-note',d.action || '').replaceAll('data-value="notify-manager"','data-value="action:notify-manager"')
          .replaceAll('data-value="close-opening"','data-value="action:close-opening"') +
        '</div><div class="academicErRecordRow"><small>進而 · 다음 조사 질문 (둘 다 가능한 계획)</small>' +
        controls([['inquiry-records','나중의 변경·보수 기록을 찾아볼 계획'],
          ['inquiry-outlet','안전을 확인한 뒤 하류 출구를 살펴볼 계획']],
          'er-note',d.inquiry || '').replaceAll('data-value="inquiry-records"','data-value="inquiry:inquiry-records"')
          .replaceAll('data-value="inquiry-outlet"','data-value="inquiry:inquiry-outlet"') +
        '<p class="academicErHint">두 선택 모두 타당해. 아직 완료한 조사가 아니라 앞으로의 계획이야.</p></div>')) +
        '<div class="academicErWordHelp">' + wordBtn('從而') + wordBtn('因而') + wordBtn('進而') + '</div>' + verdict(s);
    }
    const evidenceTitle=['현장 관찰','관측 자료','현장 관찰','현장·도면 대조','관측 기록'][s.taskIndex];
    return taskLabel(s)+section(evidenceTitle,original,'original') +
      section(['소년의 상류 관찰 메모','연구원과 함께 검토할 점검 메모','소년의 물길 관찰',
        '연구원의 도면 대조 메모','소년과 연구원의 현장 조사 기록'][s.taskIndex],work,'work',
        ['observe','decision','observe','decision','restore'][s.taskIndex]);
  }
  function footer(state) {
    const s=normalizeState(state);
    if(s.phase==='complete')return '<button id="academicMvpConfirm" type="button" class="control academicConfirm" data-academic-action="finish-mvp">결과 이야기로</button>';
    if(s.phase==='review')return '<button id="academicMvpConfirm" type="button" class="control academicConfirm" data-academic-action="er-next">다음 기록</button>';
    if(s.taskIndex===2 && s.step==='search')return '<p class="academicErFooterPrompt">위쪽 관찰 지점을 눌러 물소리의 근원을 찾아봐.</p>';
    const label = s.taskIndex===0?'관찰 메모 남기기':s.taskIndex===1?'점검 메모 남기기':
      s.taskIndex===2?(s.step==='search'?'구간을 살펴보자':'물의 방향 기록'):
      s.taskIndex===3?(s.step==='correct'?'형태 판단 확인':'판단의 범위 기록'):'현장 기록 마무리';
    const ready=s.taskIndex===0
      ? s.t1ObservedIds.includes('a-grass-high') && s.selected==='a-grass-high'
      : s.taskIndex===2 ? s.step==='direction' && !!s.selected
      : s.taskIndex===3 && s.step==='correct' ? s.t4Inspected && !!s.selected
      : s.taskIndex===4 ? !!s.drafts.method && !!s.drafts.action && !!s.drafts.inquiry
      : !!s.selected;
    return '<button id="academicMvpConfirm" type="button" class="control academicConfirm" data-academic-action="er-confirm"' +
      (ready?'':' disabled') + '>' + label + '</button>';
  }
  globalThis.AcademicTowerEr04A = Object.freeze({
    STAGE_ID,TASK_IDS,SCENES,WORDS_BY_TASK,createState,validState,normalizeState,validProgressMap,progressMap,
    applyAction,isSolved,renderWorkbench,footer,titleFor,revealedWords
  });
})();