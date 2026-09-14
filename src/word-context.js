/* Stage-local word-card context. Pronunciation and meaning always come from the shared vocabulary. */
(() => {
  function resolve(stage, word, dictionary = typeof WORDS === 'undefined' ? {} : WORDS) {
    const base = dictionary?.[word];
    if (!base) return null;
    const context = stage?.wordContext?.[word];
    return {
      p: base.p,
      k: base.k,
      ex: typeof context?.ex === 'string' ? context.ex : base.ex,
      rule: typeof context?.rule === 'string' ? context.rule : base.rule
    };
  }

  globalThis.WordContext = Object.freeze({ resolve });
})();
