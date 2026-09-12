/* Region stories continue directly until the region finale; the world map remains an explicit exit choice. */
(() => {
  const journey = globalThis.JourneyContent?.JOURNEY;
  if (!Array.isArray(journey)) return;

  for (const section of journey.flatMap(chapter => chapter.sections || [])) {
    if (!section.regionId || !Array.isArray(section.sequence) || !section.sequence.length) continue;
    const lastStoryIndex = section.sequence.reduce((last, node, index) => node?.type === 'story' ? index : last, -1);
    if (lastStoryIndex < 0) continue;
    section.sequence.forEach((node, index) => {
      if (node?.type !== 'story') return;
      if (index === lastStoryIndex) node.returnToWorldAfter = true;
      else if (node.returnToWorldAfter) node.returnToWorldAfter = false;
    });
  }
})();
