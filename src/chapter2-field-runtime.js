/* A local draft is a set of editable links. Reading, checking or replaying never changes world travel. */
(() => {
  const $ = id => document.getElementById(id);
  function start(entry, draft, callbacks) {
    TacticalGame.showView('field');
    const root = $('fieldView');
    let current = draft.cursor ?? draft.links.findIndex(value => value === null);
    if (current < 0) current = 0;
    draft.cursor = current; callbacks.save(draft);
    let feedback = '', help = false, word = null;
    function render() {
      const row = entry.rows[current], source = entry.sources[row[1]], choices = entry.sets[row[3]];
      const filled = draft.links.filter(Boolean).length;
      const targets = entry.words.filter(item => source[1].includes(item));
      const original = source[1].split(new RegExp('('+entry.words.join('|')+')','g')).map(piece =>
        targets.includes(piece) ? `<button class="fieldTerm" data-term="${piece}">${piece}</button>` : piece).join('');
      // All labels originate from the author-owned field content. Saved choices only index known labels.
      root.innerHTML = `<header><span>${entry.placeKo} · 01</span><button id="fieldLeave">월드맵</button></header>
        <h1>${entry.title}</h1><section class="fieldSource"><small>${source[0]}</small>
        <p lang="zh-Hant">${original}</p>
        ${word ? `<p class="fieldGloss"><b>${word}</b> · ${WORDS[word].p} · ${WORDS[word].k}</p>` : ''}<button id="fieldHelp" aria-expanded="${help}">주음 · 뜻 ${help?'닫기':'보기'}</button>
        ${help?`<p class="fieldReading">${entry.readings[row[1]]}</p><p>${source[2]}</p>`:''}</section>
        <section class="fieldWork"><small>${entry.book} · ${current+1} / ${entry.rows.length}</small>
        <h2>${row[2]}</h2><div class="fieldOptions">${Object.entries(choices).map(([key,label])=>
          `<button data-link="${key}" aria-pressed="${draft.links[current]===key}"><strong>${label}</strong>
          ${entry.rows.map((r,i)=>r[3]===row[3] && draft.links[i]===key ? `<span class="fieldSlip">${r[2]}</span>` : '').join('')}</button>`).join('')}</div>
        <p role="status">${feedback || '기록할 칸을 눌러 이 줄을 옮겨 적어.'}</p>
        <button id="fieldNext">${filled===entry.rows.length?'원문과 대조하기':'다음 기록으로'}</button></section>
        <details class="fieldLedger"><summary>${entry.book} 펼치기 · ${filled}/${entry.rows.length}</summary>
        ${entry.rows.map(([id,,title,set],i)=>`<button data-row="${i}">${title}<strong>${entry.sets[set][draft.links[i]]||'빈칸'}</strong></button>`).join('')}</details>`;
      root.dataset.stage = entry.id;
      root.dataset.row = row[0];
      root.querySelectorAll('[data-term]').forEach(button => button.onclick = () => {
        word = word === button.dataset.term ? null : button.dataset.term; render();
      });
      $('fieldLeave').onclick = callbacks.leave;
      $('fieldHelp').onclick = () => { help=!help; render(); };
      root.querySelectorAll('[data-link]').forEach(button => button.onclick = () => {
        const key = button.dataset.link;
        draft.links[current] = draft.links[current]===key ? null : key;
        callbacks.save(draft);
        feedback = draft.links[current] ? '기록에 붙였어. 다시 누르면 뗄 수 있어.' : '이 줄을 비웠어.';
        render();
      });
      function select(index,message='') {
        current=index; draft.cursor=index; callbacks.save(draft);
        feedback=message; help=false; word=null; render(); window.scrollTo(0,0);
      }
      root.querySelectorAll('[data-row]').forEach(button => button.onclick = () => select(Number(button.dataset.row)));
      $('fieldNext').onclick = () => {
        const empty = draft.links.findIndex((value,i) => i>current && !value);
        if (filled !== entry.rows.length) return select(empty>=0 ? empty : draft.links.indexOf(null),'빈 기록을 채워 줘.');
        const wrong = entry.rows.findIndex((r,i) => draft.links[i]!==r[4]);
        if (wrong >= 0) return select(wrong,'이 연결을 원문에서 다시 확인해. 다른 줄은 그대로 있어.');
        callbacks.finish(draft);
      };
    }
    render(); window.scrollTo(0,0);
  }
  globalThis.Chapter2FieldRuntime = {start};
})();
