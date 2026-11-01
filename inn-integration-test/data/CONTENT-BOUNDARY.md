# v0.5 content boundary

- `src/content.js`: runtime content declarations for tutorial words, tutorial stages, and first-world region metadata.
- `src/app.js`: game state, rendering, interaction, storage, and screen transitions.
- `src/world.css`: world selection screen styles.
- `legacy/tutorial-v03.html`: frozen baseline for regression comparison.

## Authoring / audit metadata

- `data/tbcl-word-levels-2025-04.json`: current game vocabulary only, checked against the official 2025-04 TBCL vocabulary-list snapshot. This is source/reference metadata, not gameplay truth.
- `data/vocabulary-lifecycle-v0.1.json`: game-editorial metadata that records where each vocabulary item is used as a target word and whether its reuse scope has been classified.
- `tools/vocabulary-lifecycle-audit.cjs`: checks stage `words[]` against the lifecycle snapshot, reports reuse distribution and TBCL distribution, and counts literal story-text reappearances separately from active reuse.

Large TBCL source datasets remain outside the browser runtime. They should feed authoring checks or later generated runtime data rather than be loaded directly on mobile.

Official TBCL levels must not be silently rewritten to fit game design. Game-specific meaning notes, stage placement, reuse plans, and story-highlight state belong to the editorial layer instead.
