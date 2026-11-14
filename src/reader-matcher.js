/* Pure UTF-16 spans; no DOM, normalization, network or grammatical claims. */
(() => {
  const boundary = /[\s，,。.!！？?；;：:「『“（(]/u;
  function clauseStart(text, at) {
    while (at > 0 && /[ \t\r]/u.test(text[at - 1])) at--;
    return at === 0 || boundary.test(text[at - 1]);
  }
  function allowed(text, at, form, mode) {
    if (mode === 'literal') return true;
    if (!clauseStart(text, at)) return false;
    const tail = text.slice(at + form.length);
    if (mode === 'clause-start') return true;
    // Only spaces/tabs: never cross a paragraph to borrow its punctuation.
    if (mode === 'clause-start-comma') return /^[ \t]*[，,]/u.test(tail);
    if (mode === 'contrast-keshi') {
      // Conservative omission of questions, including genuine contrast questions.
      const sentence = tail.split(/[。.!！；;\n]/u, 1)[0];
      return sentence.trim().length > 0 && !/[？?]/u.test(sentence);
    }
    return false;
  }
  function detect(text, content = globalThis.ReaderContent) {
    if (typeof text !== 'string' || !content) return [];
    const hits = [], blocked = [];
    for (const ex of content.exclusions) {
      let at = text.indexOf(ex.text);
      while (at !== -1) {
        const start = at + ex.text.indexOf(ex.marker);
        blocked.push([start, start + ex.marker.length]);
        at = text.indexOf(ex.text, at + 1);
      }
    }
    const add = (start, end, markerId) => hits.push({start, end, markerId});
    for (const entry of content.entries.filter(e => e.enabled)) for (const form of entry.forms) {
      let at = text.indexOf(form);
      while (at !== -1) {
        if (allowed(text, at, form, entry.matchMode) &&
            !blocked.some(([s,e]) => at < e && at + form.length > s)) add(at, at + form.length, entry.id);
        at = text.indexOf(form, at + 1);
      }
    }
    // Do not import A2's vulnerable single-character pair endpoints.
    for (const m of text.matchAll(/但(?!是|凡|願)/gu))
      if (clauseStart(text, m.index)) add(m.index, m.index + 1, 'clause-dan');
    for (const m of text.matchAll(/則(?=表示|將|在|由|減少|受)/gu))
      if (!/[原規準法守細通否]/u.test(text[m.index - 1] || '')) add(m.index, m.index + 1, 'restricted-ze');
    for (const m of text.matchAll(/若(?!干)(?=[^。！？；\n]{1,80}，[^。！？；\n]{0,12}(?:應|將|預計))/gu))
      if (clauseStart(text, m.index)) add(m.index, m.index + 1, 'conditional-ruo');
    hits.sort((a,b) => a.start-b.start || b.end-a.end || a.markerId.localeCompare(b.markerId));
    let end = -1;
    return hits.filter(hit => { if (hit.start < end) return false; end = hit.end; return true; });
  }
  globalThis.ReaderMatcher = Object.freeze({detect});
})();
