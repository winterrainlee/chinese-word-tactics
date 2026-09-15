/* Settings screen: local save export, validated restore, reset entry, and build info. */
(() => {
  const $ = id => document.getElementById(id);
  let returnView = 'landingView';
  let restoreCandidate = null;

  const viewName = id => ({
    landingView: 'landing', tutorialView: 'tutorial', worldView: 'world', storyView: 'story',
    journeyView: 'journey', wordsView: 'words', settingsView: 'settings'
  })[id] || 'landing';
  const currentViewId = () => document.querySelector('.appView:not([hidden])')?.id || 'landingView';
  const buildId = () => document.querySelector('meta[name="cwt-build"]')?.content || 'unknown';
  const pad = value => String(value).padStart(2, '0');
  const filenameDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const prettyDate = iso => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  function setMessage(text = '', type = '') {
    const el = $('settingsMessage');
    el.textContent = text;
    el.className = `settingsMessage${type ? ` ${type}` : ''}`;
    el.hidden = !text;
  }

  function clearRestore() {
    restoreCandidate = null;
    $('settingsRestorePreview').hidden = true;
    $('settingsRestoreSummary').textContent = '';
    $('settingsImportFile').value = '';
  }

  function renderRestorePreview(checked) {
    const data = checked.summary;
    const status = data.chapter1Complete ? '1장 완료 기록' : '진행 중인 기록';
    $('settingsRestoreSummary').textContent = `${status} · 완료 스테이지 ${data.completedStages}개 · 발견 단어 ${data.discoveredWords}개 · ${prettyDate(data.createdAt)}`;
    $('settingsRestorePreview').hidden = false;
  }

  function open() {
    const visible = currentViewId();
    if (visible !== 'settingsView') returnView = visible;
    TacticalGame.closeSheet();
    TacticalGame.showView('settings');
    $('settingsBuild').textContent = buildId();
    clearRestore();
    setMessage('');
    window.scrollTo(0, 0);
    return true;
  }

  function back() {
    clearRestore();
    setMessage('');
    if (returnView === 'landingView' && globalThis.GameFlow?.showLanding) return GameFlow.showLanding();
    TacticalGame.showView(viewName(returnView));
    window.scrollTo(0, 0);
    return true;
  }

  function exportProgress() {
    try {
      const backup = SaveData.createBackup(localStorage, { build: buildId() });
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `따라온-단어들-저장-${filenameDate(new Date())}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Give iOS Safari enough time to hand the blob to its download/file flow.
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      setMessage('현재 진행 기록을 저장 파일로 만들었어.');
    } catch (error) {
      setMessage(error?.message || '진행 기록을 내보내지 못했어.', 'bad');
    }
  }

  async function inspectFile(file) {
    clearRestore();
    setMessage('');
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage('저장 파일이 너무 커. 따라온 단어들에서 만든 JSON 파일인지 확인해줘.', 'bad');
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const checked = SaveData.validateBackup(parsed);
      if (!checked.ok) {
        setMessage(checked.error, 'bad');
        return;
      }
      restoreCandidate = checked.backup;
      renderRestorePreview(checked);
      setMessage('파일을 확인했어. 아래 내용을 보고 복원할지 결정해줘.');
    } catch {
      setMessage('JSON 저장 파일을 읽지 못했어. 파일이 손상되지 않았는지 확인해줘.', 'bad');
    }
  }

  function restoreProgress() {
    if (!restoreCandidate) return;
    try {
      SaveData.restoreBackup(localStorage, restoreCandidate);
      setMessage('복원이 끝났어. 저장 기록을 다시 불러올게.');
      location.reload();
    } catch (error) {
      setMessage(error?.message || '진행 기록을 복원하지 못했어.', 'bad');
    }
  }

  function resetProgress() {
    if (globalThis.GameFlow?.resetJourney) GameFlow.resetJourney();
  }

  $('landingSettings')?.addEventListener('click', open);
  $('settingsBack')?.addEventListener('click', back);
  $('settingsExport')?.addEventListener('click', exportProgress);
  $('settingsImport')?.addEventListener('click', () => $('settingsImportFile').click());
  $('settingsImportFile')?.addEventListener('change', event => inspectFile(event.target.files?.[0]));
  $('settingsRestoreConfirm')?.addEventListener('click', restoreProgress);
  $('settingsReset')?.addEventListener('click', resetProgress);

  globalThis.SettingsRuntime = Object.freeze({ open, back, exportProgress, inspectFile, restoreProgress });
})();
