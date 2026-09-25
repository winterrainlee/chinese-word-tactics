/* Academic Tower reading workbench. Pure transitions stay testable without a browser. */
(() => {
  const copy = value => JSON.parse(JSON.stringify(value));

  function createState(config) {
    if (config?.kind === 'later-focus') {
      return { kind: config.kind, split: null, splitChoice: null, focus: null, confirmed: false };
    }
    if (config?.kind === 'record-contrast') {
      return {
        kind: config.kind, secondRevealed: false, relation: null,
        focus: 'earlier-record', conclusion: 'repair-helped', confirmed: false
      };
    }
    return null;
  }

  function applyAction(config, currentState, action) {
    const next = copy(currentState || createState(config));
    if (!next || !action?.type) return { changed: false, state: next };
    let changed = false;
    if (config.kind === 'later-focus') {
      if (action.type === 'split') {
        const option = (config.splitOptions || []).find(item => item.id === action.value);
        if (option && (next.split !== option.normalized || next.splitChoice !== option.id)) {
          next.split = option.normalized; next.splitChoice = option.id; changed = true;
        }
      } else if (action.type === 'focus' && ['earlier', 'later'].includes(action.value) && next.focus !== action.value) {
        next.focus = action.value; changed = true;
      } else if (action.type === 'confirm' && !next.confirmed) {
        next.confirmed = true; changed = true;
      }
    }
    if (config.kind === 'record-contrast') {
      if (action.type === 'reveal' && !next.secondRevealed) {
        next.secondRevealed = true; changed = true;
      } else if (action.type === 'relation' && ['addition', 'contrast'].includes(action.value) && next.relation !== action.value) {
        next.relation = action.value; changed = true;
      } else if (action.type === 'conclusion' && ['restored', 'not-restored'].includes(action.value) && next.conclusion !== action.value) {
        next.conclusion = action.value; next.focus = action.value === 'not-restored' ? 'later-record' : 'earlier-record'; changed = true;
      } else if (action.type === 'confirm' && !next.confirmed) {
        next.confirmed = true; changed = true;
      }
    }
    if (changed && action.type !== 'confirm') next.confirmed = false;
    return { changed, state: next };
  }

  function isSolved(config, workbenchState) {
    if (!config || !workbenchState?.confirmed) return false;
    if (config.kind === 'later-focus') {
      return workbenchState.split === 'before-marker' && workbenchState.focus === 'later';
    }
    if (config.kind === 'record-contrast') {
      return workbenchState.secondRevealed && workbenchState.relation === 'contrast' &&
        workbenchState.focus === 'later-record' && workbenchState.conclusion === 'not-restored';
    }
    return false;
  }

  const Mechanic = Object.freeze({ createState, applyAction, isSolved });
  globalThis.AcademicTowerMechanic = Mechanic;

  if (typeof initialState !== 'function' || typeof render !== 'function' || typeof isWin !== 'function') return;

  const configFor = stage => stage?.academicTower || null;
  const baseInitialState = initialState;
  initialState = function academicTowerInitialState(stage) {
    const next = baseInitialState(stage);
    const config = configFor(stage);
    if (config) next.academicTower = createState(config);
    return next;
  };

  const baseIsWin = isWin;
  isWin = function academicTowerIsWin() {
    const config = configFor(current());
    return config ? isSolved(config, state?.academicTower) : baseIsWin();
  };

  const selected = (value, expected) => value === expected ? ' selected' : '';
  const pressed = (value, expected) => String(value === expected);
  const chunk = (item, focus, id) => `<button type="button" class="academicChunk${selected(focus, id)}" data-academic-action="focus" data-value="${id}" aria-pressed="${pressed(focus, id)}"><span lang="zh-Hant">${item.text}</span><small>${item.labelKo}</small></button>`;

  function renderLaterFocus(config, workbench) {
    const splitButtons = config.splitOptions.map(option => `<button type="button" class="academicChoice${selected(workbench.splitChoice, option.id)}" data-academic-action="split" data-value="${option.id}" aria-pressed="${pressed(workbench.splitChoice, option.id)}">${option.label}</button>`).join('');
    const chunks = workbench.split ? `<div class="academicRelationArrow" aria-hidden="true">앞 정보 <span>→</span> 뒤 중심</div><div class="academicChunks">${chunk(config.chunks[0], workbench.focus, 'earlier')}${chunk(config.chunks[1], workbench.focus, 'later')}</div>` : '<p class="academicWorkbenchHint">두 경계 모두 같은 의미 덩어리를 만들 수 있어. 읽기 편한 곳을 골라.</p>';
    return `<div class="academicRecord" lang="zh-Hant">${config.record}</div><section class="academicStep"><h2>1 · 의미 경계</h2><div class="academicChoices">${splitButtons}</div></section>${workbench.split ? `<section class="academicStep"><h2>2 · 마지막에 남길 중심</h2>${chunks}</section>` : chunks}<button type="button" class="academicConfirm" data-academic-action="confirm" ${!workbench.split || !workbench.focus ? 'disabled' : ''}>이 읽기로 확정</button>`;
  }

  function renderRecordContrast(config, workbench) {
    const first = config.records[0], second = config.records[1];
    const relation = workbench.secondRevealed ? `<section class="academicStep"><h2>1 · 두 기록의 관계</h2><div class="academicChoices"><button type="button" class="academicChoice${selected(workbench.relation, 'addition')}" data-academic-action="relation" data-value="addition" aria-pressed="${pressed(workbench.relation, 'addition')}">그리고 · 나란히 추가</button><button type="button" class="academicChoice${selected(workbench.relation, 'contrast')}" data-academic-action="relation" data-value="contrast" aria-pressed="${pressed(workbench.relation, 'contrast')}">然而 · 뒤에서 제한</button></div></section>` : '';
    const conclusions = workbench.secondRevealed ? `<section class="academicStep"><h2>2 · 전체 기록의 최종 판단</h2><div class="academicConclusions">${config.conclusions.map(item => `<button type="button" class="academicConclusion${selected(workbench.conclusion, item.id)}" data-academic-action="conclusion" data-value="${item.id}" aria-pressed="${pressed(workbench.conclusion, item.id)}"><span lang="zh-Hant">${item.labelZh}</span><small>${item.labelKo}</small></button>`).join('')}</div></section>` : '';
    return `<div class="academicRecords"><article class="academicRecordCard${selected(workbench.focus, 'earlier-record')}"><small>${first.labelKo}</small><p lang="zh-Hant">${first.text}</p></article>${workbench.secondRevealed ? `<div class="academicRecordLink${workbench.relation === 'contrast' ? ' active' : ''}" aria-label="두 기록 연결">${workbench.relation === 'contrast' ? '然而 ↓' : '↓'}</div><article class="academicRecordCard${selected(workbench.focus, 'later-record')}"><small>${second.labelKo}</small><p lang="zh-Hant">${second.text}</p></article>` : '<button type="button" class="academicReveal" data-academic-action="reveal">다음 기록 펼치기</button>'}</div>${relation}${conclusions}<button type="button" class="academicConfirm" data-academic-action="confirm" ${!workbench.secondRevealed || !workbench.relation || !workbench.conclusion ? 'disabled' : ''}>전체 판단 확정</button>`;
  }

  function goalHtml(stage, workbench) {
    if (stage.academicTower.kind === 'later-focus') {
      return `문장을 <span class="${workbench.split ? 'done' : 'hot'}">나누고</span>, <span class="${workbench.focus === 'later' ? 'done' : 'hot'}">중심</span>을 뒤에 남겨.`;
    }
    return `두 기록을 <span class="${workbench.relation === 'contrast' ? 'done' : 'hot'}">연결하고</span>, 마지막 <span class="${workbench.conclusion === 'not-restored' ? 'done' : 'hot'}">판단</span>을 갱신해.`;
  }

  function renderWords(stage, workbench) {
    const solved = isSolved(stage.academicTower, workbench);
    $('#words').innerHTML = '';
    stage.words.forEach(word => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'wordbtn'; button.textContent = word;
      if (solved || (word === '卻' && stage.academicTower.kind === 'record-contrast' && workbench.relation === 'contrast')) button.classList.add('done');
      button.onclick = () => showWord(word);
      $('#words').append(button);
    });
  }

  function bindActions() {
    gridEl.querySelectorAll('[data-academic-action]').forEach(button => {
      button.addEventListener('click', () => runAction(button.dataset.academicAction, button.dataset.value));
    });
  }

  function feedback(config, workbench, action) {
    if (action === 'split') return '句子分成了兩個意思。 문장이 앞 정보와 뒤 판단으로 나뉘었어.';
    if (action === 'focus') return workbench.focus === 'later'
      ? '重點移到後面了。 비 오는 날의 위험이 마지막 판단으로 남아.'
      : '現在只留下「比較短」。 지금은 수로가 짧다는 정보만 중심에 남아.';
    if (action === 'reveal') return '後面的記錄也展開了。 첫 기록이 맞더라도 아직 전체 기록은 끝나지 않았어.';
    if (action === 'relation') return workbench.relation === 'contrast'
      ? '「然而」把後面的限制接上了。 뒤 기록이 전체 판단을 제한하도록 연결했어.'
      : '兩份記錄現在只是並排。 두 기록이 나란히 놓였지만 방향 변화는 아직 표시되지 않았어.';
    if (action === 'conclusion') return workbench.conclusion === 'not-restored'
      ? '最後判斷改成「還沒有恢復正常」。 최종 판단을 뒤 기록에 맞춰 갱신했어.'
      : '現在把修復效果當成全部結論。 지금은 수리 효과만으로 전체가 회복됐다고 읽고 있어.';
    if (action === 'confirm' && config.kind === 'later-focus') return workbench.focus === 'later'
      ? '前面的資料還在，後面的危險成了重點。 앞 정보는 남고 뒤 위험이 중심이 됐어.'
      : '只留下「比較短」，雨天的危險就不見了。 짧다는 정보만 남기면 비 오는 날의 판단이 사라져.';
    if (action === 'confirm') {
      if (workbench.relation !== 'contrast') return '兩份記錄只是排在一起，還沒有表示轉折。 두 기록의 방향 변화가 아직 연결되지 않았어.';
      if (workbench.conclusion !== 'not-restored') return '前一份記錄有效，卻不能代表整個裝置已恢復。 수리 효과가 있어도 장치 전체가 회복된 것은 아니야.';
      return '前後記錄都保留下來，最後判斷也更新了。 두 기록을 보존하며 최종 판단을 갱신했어.';
    }
    return '';
  }

  function runAction(type, value) {
    const stage = current(), config = configFor(stage);
    if (!config || screen !== 'tutorial' || isWin()) return;
    const result = applyAction(config, state.academicTower, { type, value });
    if (!result.changed) return;
    history.push(clone(state));
    state.academicTower = result.state;
    state.turn += 1;
    save(); render();
    const solved = isSolved(config, state.academicTower);
    setStatus(feedback(config, state.academicTower, type), solved ? 'good' : 'info');
    if (!solved) return;
    if (stageSession.mode !== 'replay') completed.add(stage.id);
    window.GameFlow?.recordStageComplete(stage.id, stageSession);
    save();
    clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      if (screen === 'tutorial' && current().id === stage.id && isWin()) showComplete();
    }, 180);
  }

  const baseRender = render;
  render = function academicTowerRender() {
    const stage = current(), config = configFor(stage);
    const view = document.getElementById('tutorialView');
    view?.classList.toggle('academicTowerStage', !!config);
    if (!config) {
      gridEl.classList.remove('academicTowerWorkbench');
      return baseRender();
    }
    if (!state.academicTower) state.academicTower = createState(config);
    const workbench = state.academicTower;
    $('#stageKicker').textContent = stage.kicker;
    $('#stageTitle').textContent = stage.subtitle;
    $('#goal').innerHTML = goalHtml(stage, workbench);
    $('#ruleLine').textContent = stage.rule;
    gridEl.style.gridTemplateColumns = '';
    gridEl.className = 'grid academicTowerWorkbench';
    gridEl.setAttribute('role', 'group');
    gridEl.setAttribute('aria-label', '학술탑 독해 작업대');
    gridEl.innerHTML = config.kind === 'later-focus'
      ? renderLaterFocus(config, workbench)
      : renderRecordContrast(config, workbench);
    bindActions(); renderWords(stage, workbench);
    $('#waitBtn').hidden = true;
    $('#inspectBtn').hidden = true;
    $('#undoBtn').hidden = false;
    $('#undoBtn').disabled = !history.length;
    $('.controls').style.gridTemplateColumns = '1fr';
  };
})();
