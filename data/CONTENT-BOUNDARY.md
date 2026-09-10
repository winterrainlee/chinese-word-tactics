# v0.5 content boundary

- `src/content.js`: runtime content declarations for tutorial words, tutorial stages, and first-world region metadata.
- `src/app.js`: game state, rendering, interaction, storage, and screen transitions.
- `src/world.css`: world selection screen styles.
- `legacy/tutorial-v03.html`: frozen baseline for regression comparison.

Large TBCL source datasets remain outside the browser runtime for now. They should feed later generated runtime data rather than be loaded directly on mobile.
