/* Quest-board and forest-place UI for the four northern-forest sibling requests. */
(() => {
  const content = globalThis.NorthForestContent;
  if (!content || typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const progress = () => globalThis.GameFlow?.progress?.() || {};
  const P = globalThis.JourneyProgress;
  const nodeFor = value => typeof value === 'string' ? P?.getNode?.(value) : value;
  const complete = (node, value = progress()) => !!node && !!P?.isComplete?.(nodeFor(node), value);
  const available = (node, value = progress()) => !!node && !!P?.isAvailable?.(nodeFor(node), value);
  const questNodes = questId => P?.allNodes?.().filter(node => node.questId === questId) || [];
  const firstPlayable = (questId, value = progress()) => questNodes(questId)
    .find(node => available(node, value) && !complete(node, value));
  const questFinished = (quest, value = progress()) => complete(`story:${quest.finalStoryId}`, value);
  const questStarted = (quest, value = progress()) => complete(`story:${quest.introStoryId}`, value) ||
    quest.stageIds.some(id => complete(`stage:${id}`, value));
  const questVisible = (quest, value = progress()) => questStarted(quest, value) || available(`story:${quest.introStoryId}`, value);
  const hasNewBoardQuest = (value = progress()) => content.QUESTS.some(quest =>
    available(`story:${quest.introStoryId}`, value) && !questStarted(quest, value));
  const hasActiveForest = (value = progress()) => content.QUESTS.some(quest => {
    const node = firstPlayable(quest.id, value);
    return node?.entryRegionId === 'north-forest';
  });

  function playNode(node) {
    if (!node) return false;
    globalThis.TacticalGame?.closeSheet?.();
    return node.type === 'story'
      ? globalThis.GameFlow?.playStory?.(node.id)
      : globalThis.GameFlow?.playStage?.(node.id);
  }

  function openBoardSheet() {
    const value = progress(), visible = content.QUESTS.filter(quest => questVisible(quest, value));
    const notes = visible.map(quest => {
      const finished = questFinished(quest, value), started = questStarted(quest, value);
      const node = firstPlayable(quest.id, value);
      const status = finished ? '완료' : started ? '진행 중' : '새 의뢰';
      const button = node ? `<button class="questBoardAction" data-quest-id="${quest.id}">${started ? '이어가기' : '의뢰 확인'}</button>` : '';
      return `<article class="questBoardNote"><div class="questBoardNoteHead"><strong>${quest.titleKo}</strong><span>${status}</span></div><div class="questBoardNoteZh" lang="zh-Hant">北邊森林 · ${quest.titleZh}</div>${button}</article>`;
    }).join('');
    globalThis.TacticalGame?.openSheet?.(`
      <h2>의뢰 게시판</h2><div class="regionSheetNameZh" lang="zh-Hant">委託板</div>
      <article class="questBoardNote"><div class="questBoardNoteHead"><strong>북쪽 숲의 버섯</strong><span>완료</span></div><div class="questBoardNoteZh" lang="zh-Hant">北邊森林 · 月白菇三個</div></article>
      ${notes || '<p class="questBoardEmpty">지금은 새로 적힌 부탁이 없다.</p>'}
      <div class="sheetactions"><button id="questBoardClose">닫기</button></div>`);
    $('questBoardClose').onclick = () => globalThis.TacticalGame?.closeSheet?.();
    document.querySelectorAll('[data-quest-id]').forEach(button => {
      button.onclick = () => playNode(firstPlayable(button.dataset.questId));
    });
    return true;
  }

  function openForestSheet() {
    const value = progress();
    const active = content.QUESTS.map(quest => ({ quest, node: firstPlayable(quest.id, value) }))
      .filter(item => item.node?.entryRegionId === 'north-forest');
    const allFinished = content.QUESTS.every(quest => questFinished(quest, value));
    const meaning = allFinished
      ? '장터·여관·장인골과 이어지는 생활권의 숲이야. 이제 물길마을 주변이 전처럼 낯설지 않아.'
      : active.length > 1
        ? `진행할 수 있는 의뢰가 ${active.length}개 있어. 숲에 들어가면 하나를 고를 수 있어.`
        : active.length === 1
          ? `${active[0].quest.titleKo} 의뢰를 이어갈 수 있어.`
          : '물길마을 북쪽의 생활 숲이야. 새 부탁은 여관 의뢰 게시판에서 확인할 수 있어.';
    const continueEntry = active.length
      ? '<button class="questBoardEntry" id="northForestGo"><span><strong>진행 의뢰 들어가기</strong><small>북쪽 숲에서 이어갈 일을 선택해.</small></span><span class="questBoardMark" aria-hidden="true">→</span></button>'
      : '';
    globalThis.TacticalGame?.openSheet?.(`<h2>북쪽 숲</h2><div class="regionSheetNameZh" lang="zh-Hant">北邊森林</div><div class="meaning">${meaning}</div>${continueEntry}<div class="sheetactions"><button class="secondary" id="northForestClose">닫기</button><button id="northForestPractice">의뢰 보기 · 다시 하기</button></div>`);
    $('northForestClose').onclick = () => globalThis.TacticalGame?.closeSheet?.();
    const go = $('northForestGo');
    if (go) go.onclick = () => { globalThis.TacticalGame?.closeSheet?.(); globalThis.GameFlow?.enterRegion?.('north-forest'); };
    const practice = $('northForestPractice');
    if (practice) practice.onclick = () => { globalThis.TacticalGame?.closeSheet?.(); globalThis.GameFlow?.showRegionPractice?.('north-forest'); };
    return true;
  }

  globalThis.NorthForestWorld = Object.freeze({
    complete, available, firstPlayable, questFinished, questStarted, questVisible, hasActiveForest, hasNewBoardQuest,
    openBoardSheet, openForestSheet
  });
})();
