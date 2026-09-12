/* Shared v1.0 tactical UX behavior. Loaded after tactical/flow runtimes. */
(() => {
  if (typeof document === 'undefined' || typeof render !== 'function') return;
  const $ = id => document.getElementById(id);
  const shell = $('tutorialView');
  const status = $('status');
  const PENDING_COMPLETION_KEY = 'chinese-word-tactics-pending-completion-v1';
  const SHORT_GOALS = Object.freeze({
    'market-stage-8': '開市以前，補齊各處需要的東西。'
  });

  function savePendingCompletion(stageId) {
    try { localStorage.setItem(PENDING_COMPLETION_KEY, JSON.stringify({ stageId })); } catch {}
  }
  function clearPendingCompletion() {
    try { localStorage.removeItem(PENDING_COMPLETION_KEY); } catch {}
  }

  function splitLearningFeedback(message) {
    const text = String(message || '').trim();
    if (!/[\u3400-\u9fff]/u.test(text)) return null;
    const koIndex = text.search(/[가-힣]/u);
    if (koIndex <= 0) return null;
    const zh = text.slice(0, koIndex).replace(/[\s—–-]+$/u, '').trim();
    const ko = text.slice(koIndex).trim();
    return zh && ko ? { zh, ko } : null;
  }

  function renderLearningFeedback(message) {
    const parts = splitLearningFeedback(message);
    if (!parts || !status) return false;
    status.replaceChildren();
    const zh = document.createElement('span');
    zh.className = 'statusZh';
    zh.lang = 'zh-Hant';
    zh.textContent = parts.zh;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'statusMeaningBtn';
    button.textContent = '뜻';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '행동 안내와 결과의 한국어 뜻 보기');
    const ko = document.createElement('span');
    ko.className = 'statusKo';
    ko.lang = 'ko';
    ko.textContent = parts.ko;
    ko.hidden = true;
    button.onclick = () => {
      const opening = ko.hidden;
      ko.hidden = !opening;
      button.setAttribute('aria-expanded', String(opening));
      button.textContent = opening ? '접기' : '뜻';
    };
    status.append(zh, button, ko);
    return true;
  }

  const baseSetStatus = setStatus;
  setStatus = function uxPlaySetStatus(message, type = '') {
    baseSetStatus(message, type);
    renderLearningFeedback(status?.textContent || message);
  };

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

  function applyShortGoal() {
    const short = SHORT_GOALS[current()?.id];
    if (!short) return;
    const goal = $('goal');
    goal.textContent = short;
    goal.setAttribute('lang', 'zh-Hant');
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
    applyShortGoal();
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
    clearPendingCompletion();
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
      if (context.mode !== 'replay') savePendingCompletion(id);
      if (!status?.classList.contains('good')) setStatus('目標完成。 이번 목표를 끝냈어. 결과를 확인하고 다음으로 넘어가자.', 'good');
      completion.hidden = false;
      completion.innerHTML = `<strong>✓ 스테이지 완료</strong><button id="flowNext" type="button"></button>`;
      const next = $('flowNext');
      next.textContent = completionLabel(id, context);
      next.onclick = () => {
        clearPendingCompletion();
        hideCompletion();
        if (context.mode === 'replay') {
          context.returnTo === 'world' ? baseFlow.showWorld() : baseFlow.showJourney();
          return;
        }
        baseFlow.continueFromNode(`stage:${id}`);
      };
    }

    globalThis.GameFlow = Object.freeze({ ...baseFlow, showStageComplete });
    const pending = globalThis.__CWT_PENDING_COMPLETION__;
    if (pending?.id && current()?.id === pending.id) {
      showStageComplete(pending.id, pending.context || { mode: 'first-play', returnTo: 'journey' });
      delete globalThis.__CWT_PENDING_COMPLETION__;
    }
  }

  decorate();
  globalThis.UXPlay = Object.freeze({ ensureSlots, decorate, hideCompletion, clearPendingCompletion, splitLearningFeedback, renderLearningFeedback });
})();