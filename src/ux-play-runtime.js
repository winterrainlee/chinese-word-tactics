/* Shared v1.0 tactical UX behavior. Loaded after tactical/flow runtimes. */
(() => {
  if (typeof document === 'undefined' || typeof render !== 'function') return;
  const $ = id => document.getElementById(id);
  const shell = $('tutorialView');
  const status = $('status');

  function ensureSlots() {
    let context = $('contextPanel');
    if (!context) {
      context = document.createElement('div');
      context.id = 'contextPanel';
      context.className = 'contextPanel';
      context.hidden = true;
      status.insertAdjacentElement('afterend', context);
    }
    let completion = $('completionBar');
    if (!completion) {
      completion = document.createElement('div');
      completion.id = 'completionBar';
      completion.className = 'completionBar';
      completion.hidden = true;
      context.insertAdjacentElement('afterend', completion);
    }
    return { context, completion };
  }

  function ensureGoalDetail() {
    const goalbox = document.querySelector('.goalbox');
    if (!goalbox) return;
    let button = $('goalDetailBtn');
    if (!button) {
      button = document.createElement('button');
      button.id = 'goalDetailBtn';
      button.className = 'goalDetailBtn';
      button.type = 'button';
      button.textContent = '뜻';
      button.setAttribute('aria-label', '목표와 규칙 자세히 보기');
      goalbox.append(button);
    }
    button.onclick = () => {
      const stage = current();
      if (!stage) return;
      const rule = stage.rule ? `<div class="gamerule"><strong>이 판에서는</strong><br>${stage.rule}</div>` : '';
      openSheet(`<h2>${stage.subtitle || '이번 목표'}</h2><div class="example" lang="zh-Hant">${stage.goal || ''}</div>${rule}<div class="sheetactions"><button onclick="closeSheet()">닫기</button></div>`);
    };
  }

  function relocateMarketPanel() {
    const { context } = ensureSlots();
    const panel = document.querySelector('#grid .market-panel');
    if (!panel) {
      context.replaceChildren();
      context.hidden = true;
      return;
    }
    context.replaceChildren(panel);
    context.hidden = false;
  }

  function hideCompletion() {
    const { completion } = ensureSlots();
    completion.hidden = true;
    completion.replaceChildren();
    shell?.classList.remove('stageComplete');
  }

  function decorate() {
    ensureGoalDetail();
    status?.setAttribute('role', 'status');
    status?.setAttribute('aria-live', 'polite');
    relocateMarketPanel();
    if (!isWin()) hideCompletion();
  }

  ensureSlots();
  const baseRender = render;
  render = function uxPlayRender() {
    const result = baseRender();
    decorate();
    return result;
  };

  const baseResetStage = resetStage;
  resetStage = function uxPlayResetStage(...args) {
    hideCompletion();
    return baseResetStage(...args);
  };

  const baseFlow = globalThis.GameFlow;
  if (baseFlow) {
    function completionLabel(id, context) {
      if (context.mode === 'replay') return context.returnTo === 'world' ? '월드맵으로' : '여정으로';
      const next = JourneyProgress.nextNode(`stage:${id}`, baseFlow.progress());
      if (next?.type === 'story') return /after|finale/.test(next.id) ? '후일담 보기' : '이야기 계속';
      if (next?.type === 'stage') return '다음 판 시작';
      return '마을 지도로';
    }

    function showStageComplete(id, context = {}) {
      const { completion } = ensureSlots();
      closeSheet();
      shell?.classList.add('stageComplete');
      completion.hidden = false;
      completion.innerHTML = `<strong>✓ 스테이지 완료</strong><button id="flowNext" type="button"></button>`;
      const next = $('flowNext');
      next.textContent = completionLabel(id, context);
      next.onclick = () => {
        hideCompletion();
        if (context.mode === 'replay') {
          context.returnTo === 'world' ? baseFlow.showWorld() : baseFlow.showJourney();
          return;
        }
        baseFlow.continueFromNode(`stage:${id}`);
      };
    }

    globalThis.GameFlow = Object.freeze({ ...baseFlow, showStageComplete });
  }

  decorate();
  globalThis.UXPlay = Object.freeze({ ensureSlots, decorate, hideCompletion });
})();
