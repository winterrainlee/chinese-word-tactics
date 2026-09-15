/* Versioned export/restore format for local-only progress. No DOM access. */
(() => {
  const APP_ID = 'chinese-word-tactics';
  const FORMAT_VERSION = 1;
  const STORAGE_KEYS = Object.freeze({
    journey: 'chinese-word-tactics-journey-v1',
    tactical: 'chufa-tutorial-v03',
    world: 'chinese-word-tactics-world-v1',
    pendingCompletion: 'chinese-word-tactics-pending-completion-v1',
    lexicon: 'chinese-word-tactics-lexicon-v1'
  });
  const KEY_LIST = Object.freeze(Object.values(STORAGE_KEYS));
  const isPlainObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  const stringArray = value => Array.isArray(value) && value.every(item => typeof item === 'string');
  const nullableString = value => value === null || typeof value === 'string';

  function validJourney(value) {
    if (value === null) return true;
    if (!isPlainObject(value)) return false;
    if (!stringArray(value.seenStories) || !stringArray(value.completedStages) ||
      !stringArray(value.completedMilestones) || !stringArray(value.acknowledgedNodes) ||
      !isPlainObject(value.stageOutcomes)) return false;
    const location = value.lastLocation;
    if (location === null) return true;
    if (!isPlainObject(location) || !['world', 'story', 'tactical'].includes(location.view)) return false;
    if (location.view === 'world') return true;
    return typeof location.nodeId === 'string' && Number.isInteger(location.beat) && location.beat >= 0;
  }

  function validTactical(value) {
    if (value === null) return true;
    return isPlainObject(value) && Number.isInteger(value.stageIndex) && value.stageIndex >= 0 &&
      isPlainObject(value.state) && Array.isArray(value.history) && stringArray(value.completed) &&
      typeof value.selected === 'boolean' && typeof value.inspect === 'boolean';
  }

  function validWorld(value) {
    if (value === null) return true;
    return isPlainObject(value) && stringArray(value.visited) && stringArray(value.completedMilestones);
  }

  function validPending(value) {
    if (value === null) return true;
    return isPlainObject(value) && typeof value.stageId === 'string';
  }

  function validLexicon(value) {
    if (value === null) return true;
    return isPlainObject(value) && stringArray(value.discovered) && stringArray(value.visitedStages) &&
      nullableString(value.lastChapterId) && nullableString(value.lastRegionId);
  }

  const validators = Object.freeze({
    [STORAGE_KEYS.journey]: validJourney,
    [STORAGE_KEYS.tactical]: validTactical,
    [STORAGE_KEYS.world]: validWorld,
    [STORAGE_KEYS.pendingCompletion]: validPending,
    [STORAGE_KEYS.lexicon]: validLexicon
  });

  function summary(backup) {
    const storage = backup.storage || {};
    const journey = storage[STORAGE_KEYS.journey] || {};
    const lexicon = storage[STORAGE_KEYS.lexicon] || {};
    return Object.freeze({
      createdAt: backup.createdAt || null,
      build: backup.build || null,
      chapter1Complete: Array.isArray(journey.completedMilestones) && journey.completedMilestones.includes('chapter1-complete'),
      completedStages: Array.isArray(journey.completedStages) ? journey.completedStages.length : 0,
      seenStories: Array.isArray(journey.seenStories) ? journey.seenStories.length : 0,
      discoveredWords: Array.isArray(lexicon.discovered) ? lexicon.discovered.length : 0
    });
  }

  function createBackup(storage, options = {}) {
    const data = {};
    for (const key of KEY_LIST) {
      const raw = storage.getItem(key);
      if (raw === null) { data[key] = null; continue; }
      try { data[key] = JSON.parse(raw); }
      catch { throw new Error(`저장 데이터 ${key}를 읽을 수 없어 백업을 만들지 못했어.`); }
    }
    const backup = {
      app: APP_ID,
      formatVersion: FORMAT_VERSION,
      createdAt: options.createdAt || new Date().toISOString(),
      build: options.build || null,
      storage: data
    };
    return Object.freeze({ ...backup, storage: Object.freeze(data) });
  }

  function validateBackup(input) {
    if (!isPlainObject(input) || input.app !== APP_ID) {
      return { ok: false, error: '따라온 단어들의 저장 파일이 아니야.' };
    }
    if (input.formatVersion !== FORMAT_VERSION) {
      return { ok: false, error: '현재 버전에서 지원하지 않는 저장 형식이야.' };
    }
    if (!isPlainObject(input.storage)) {
      return { ok: false, error: '저장 데이터 묶음을 찾을 수 없어.' };
    }
    const supplied = Object.keys(input.storage);
    if (supplied.some(key => !KEY_LIST.includes(key)) || KEY_LIST.some(key => !Object.hasOwn(input.storage, key))) {
      return { ok: false, error: '저장 파일의 항목 구성이 현재 게임과 맞지 않아.' };
    }
    for (const key of KEY_LIST) {
      if (!validators[key](input.storage[key])) {
        return { ok: false, error: `저장 파일의 ${key} 항목이 올바르지 않아.` };
      }
    }
    if (typeof input.createdAt !== 'string' || Number.isNaN(Date.parse(input.createdAt))) {
      return { ok: false, error: '저장 파일의 생성 시각을 확인할 수 없어.' };
    }
    return { ok: true, backup: input, summary: summary(input) };
  }

  function restoreBackup(storage, input) {
    const checked = validateBackup(input);
    if (!checked.ok) throw new Error(checked.error);
    const previous = Object.fromEntries(KEY_LIST.map(key => [key, storage.getItem(key)]));
    try {
      for (const key of KEY_LIST) {
        const value = checked.backup.storage[key];
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      try {
        for (const key of KEY_LIST) {
          const raw = previous[key];
          if (raw === null) storage.removeItem(key);
          else storage.setItem(key, raw);
        }
      } catch {}
      throw new Error('진행 기록을 복원하지 못했어. 브라우저의 사이트 데이터 저장 권한을 확인해줘.', { cause: error });
    }
    return checked.summary;
  }

  globalThis.SaveData = Object.freeze({ APP_ID, FORMAT_VERSION, STORAGE_KEYS, KEY_LIST, createBackup, validateBackup, restoreBackup, summary });
})();
