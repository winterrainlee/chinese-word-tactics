/* Pure progression/store helpers. No DOM or tactical-engine state is accessed here. */
(() => {
  const KEY = 'chinese-word-tactics-journey-v1';
  const strings = value => Array.isArray(value) ? [...new Set(value.filter(x => typeof x === 'string'))] : [];
  const copy = value => JSON.parse(JSON.stringify(value));
  const cleanOutcome = value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === 'string' || typeof item === 'boolean' || Number.isFinite(item)) result[key] = item;
      else if (Array.isArray(item)) result[key] = strings(item);
    }
    return Object.keys(result).length ? result : null;
  };
  const cleanOutcomes = value => {
    const result = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
    for (const [stageId, outcome] of Object.entries(value)) {
      const clean = cleanOutcome(outcome);
      if (clean) result[stageId] = clean;
    }
    return result;
  };
  const nodeId = node => `${node.type}:${node.id}`;
  const nodes = () => JourneyContent.JOURNEY.flatMap(chapter => chapter.sections.flatMap(section =>
    section.sequence.map(node => ({ ...node, nodeId: nodeId(node), chapterId: chapter.id, sectionId: section.id }))));
  const getNode = id => nodes().find(node => node.nodeId === id);
  function normalize(raw) {
    raw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const location = raw.lastLocation;
    const validLocation = location && (location.view === 'world' ||
      (['story', 'tactical'].includes(location.view) && getNode(location.nodeId)?.type === (location.view === 'story' ? 'story' : 'stage')));
    return { seenStories: strings(raw.seenStories), completedStages: strings(raw.completedStages),
      acknowledgedNodes: strings(raw.acknowledgedNodes), stageOutcomes: cleanOutcomes(raw.stageOutcomes), lastLocation: validLocation ? {
        view: location.view, ...(location.view !== 'world' ? { nodeId: location.nodeId,
          beat: Number.isInteger(location.beat) && location.beat >= 0 ? location.beat : 0 } : {})
      } : null };
  }
  function isComplete(node, progress) {
    return node.type === 'story' ? progress.seenStories.includes(node.id) : progress.completedStages.includes(node.id);
  }
  function isAvailable(node, progress) {
    return isComplete(node, progress) || (node.requires || []).every(id => {
      const required = getNode(id);
      return required && (isComplete(required, progress) || progress.acknowledgedNodes.includes(id));
    });
  }
  function nextNode(id, progress) {
    const current = getNode(id);
    if (!current) return null;
    const sections = JourneyContent.JOURNEY.flatMap(chapter => chapter.sections);
    let section = sections.find(s => s.id === current.sectionId), after = id;
    const visited = new Set();
    // Only explicit section links advance the campaign. Parallel regions never auto-chain.
    while (section && !visited.has(section.id)) {
      visited.add(section.id);
      const index = after ? section.sequence.findIndex(n => nodeId(n) === after) : -1;
      const candidate = section.sequence.slice(index + 1).map(n => getNode(nodeId(n)))
        .find(n => isAvailable(n, progress) && !isComplete(n, progress));
      if (candidate) return candidate;
      section = sections.find(s => s.id === section.nextSectionId); after = null;
    }
    return null;
  }
  function recommendedNode(progress) {
    const saved = getNode(progress.lastLocation?.nodeId);
    if (saved && isAvailable(saved, progress) && !isComplete(saved, progress)) return saved;
    // Old tutorial graduates are invited to the new epilogue, not forced back to stage 0.
    if (progress.completedStages.includes('stage-5')) {
      const epilogue = getNode('story:prologue-forest-edge');
      if (!isComplete(epilogue, progress)) return epilogue;
      const intro = getNode('story:chapter1-roadside-merchant');
      if (!isComplete(intro, progress)) return intro;
    }
    return nodes().find(node => isAvailable(node, progress) && !isComplete(node, progress)) || null;
  }
  function getHeroRole(completedMilestones = []) {
    const milestones = strings(completedMilestones);
    return JourneyContent.tier1CoreMilestones.every(id => milestones.includes(id)) ? 'hero' : 'boy';
  }
  function createStore(storage, onError = () => {}) {
    const read = key => {
      try { return JSON.parse(storage.getItem(key) || 'null'); }
      catch { onError(); return null; }
    };
    let progress = normalize(read(KEY));
    const legacy = read('chufa-tutorial-v03');
    progress.completedStages = strings([...progress.completedStages,
      ...strings(legacy?.completed).filter(id => /^stage-[0-5]$/.test(id))]);
    // G3 existed briefly before stage outcomes. Recover the chosen post from the tactical save when possible.
    if (!progress.stageOutcomes['gate-stage-3'] && progress.completedStages.includes('gate-stage-3')) {
      const viaIds = strings(legacy?.state?.viaIds).filter(id => ['west-post', 'east-post'].includes(id));
      if (viaIds.length) progress.stageOutcomes['gate-stage-3'] = {
        viaIds, routeChoices: strings(legacy?.state?.routeChoices).filter(id => ['west', 'east'].includes(id))
      };
    }
    const persist = () => { try { storage.setItem(KEY, JSON.stringify(progress)); } catch { onError(); } };
    persist();
    return Object.freeze({
      get: () => copy(progress),
      complete(node, mode = 'first-play', outcome = null) {
        if (mode !== 'first-play' || !getNode(nodeId(node))) return;
        const field = node.type === 'story' ? 'seenStories' : 'completedStages';
        progress[field] = strings([...progress[field], node.id]);
        progress.acknowledgedNodes = strings([...progress.acknowledgedNodes, nodeId(node)]);
        if (node.type === 'stage' && !progress.stageOutcomes[node.id]) {
          const clean = cleanOutcome(outcome);
          if (clean) progress.stageOutcomes[node.id] = clean;
        }
        persist();
      },
      locate(location, mode = 'first-play') {
        if (mode !== 'first-play') return;
        progress.lastLocation = normalize({ lastLocation: location }).lastLocation;
        persist();
      }
    });
  }
  globalThis.JourneyProgress = Object.freeze({ KEY, nodeId, nodes, getNode, normalize, isComplete,
    isAvailable, nextNode, recommendedNode, getHeroRole, createStore });
})();
