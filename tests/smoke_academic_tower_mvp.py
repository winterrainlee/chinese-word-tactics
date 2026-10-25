"""MVP interaction contract: previews, retained context, undo and deliberate completion."""
from tower_browser_helpers import solve
import http.server
import json
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
    def translate_path(self, path):
        return str(ROOT / path.split('?', 1)[0].removeprefix('/chinese-word-tactics/'))

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--no-sandbox'])
        page = browser.new_page(viewport={'width':375, 'height':812}, is_mobile=True, has_touch=True)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(os.environ.get('ACADEMIC_TOWER_TEST_URL', f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'))
        page.wait_for_function('!!window.AcademicTowerRuntime')
        def start(suffix):
            page.evaluate('(s)=>TacticalGame.playStage("academic-tower-turn-"+s,{mode:"replay",returnTo:"academic-tower"})', suffix)
        def action(name, value=None):
            selector = f'[data-academic-action="{name}"]'
            if value is not None: selector += f'[data-value="{value}"]'
            page.locator(selector).click()
        start('01-que')
        page.locator('[data-academic-word="卻"]').click()
        page.locator('#sheet .sheetactions button').click()
        assert page.evaluate('document.activeElement.dataset.academicWord') == '卻'
        assert page.locator('#academicMvpConfirm').is_disabled()
        action('meaning-relation','keep')
        assert page.locator('#academicMvpConfirm').is_disabled()
        action('meaning-slot','from');action('meaning-source','rain-danger')
        action('meaning-slot','to');action('meaning-source','short')
        action('meaning-confirm')
        assert page.locator('.academicMvpFeedback').get_attribute('data-verdict')=='incorrect'
        wrong=page.evaluate('state.academicTower')
        action('meaning-slot','from');action('meaning-source','short')
        page.locator('#undoBtn').click()
        assert page.evaluate('state.academicTower.placements.from')=='rain-danger'
        solve(page)
        before=page.evaluate('localStorage.getItem("chinese-word-tactics-journey-v1")')
        action('finish-mvp');page.locator('#flowNext').click()
        assert page.evaluate('localStorage.getItem("chinese-word-tactics-journey-v1")')==before
        start('04-faner')
        for absent, actual, expected in [('stopped', 'faster', 'absent'), ('faster', 'more-water', 'actual'), ('more-water', 'stopped', 'absent')]:
            action('select-slot', 'absent'); action('select-result', absent)
            action('select-slot', 'actual'); action('select-result', actual)
            action('submit-results')
            assert page.evaluate('document.activeElement.dataset.value') == expected
            for slot, right in [('absent', absent == 'faster'), ('actual', actual == 'stopped')]:
                assert page.locator(f'[data-academic-action="select-slot"][data-value="{slot}"]').get_attribute('data-verdict') == ('correct' if right else 'incorrect')
            wrong_slot = page.locator(f'[data-academic-action="select-slot"][data-value="{expected}"]')
            assert wrong_slot.get_attribute('aria-pressed') == 'true'
            assert wrong_slot.evaluate('e => { const r=e.getBoundingClientRect(), p=document.querySelector("#grid").getBoundingClientRect(); return r.top >= p.top && r.bottom <= p.bottom; }')
        start('04-faner')
        action('select-slot', 'actual')
        action('select-result', 'stopped')
        assert page.locator('[data-academic-action="submit-results"]').is_disabled()
        action('select-slot', 'absent')
        action('select-result', 'more-water')
        assert '水量增加' in page.locator('.academicMvpSlots').inner_text()
        action('submit-results')
        assert '조건' in page.locator('.academicMvpFeedback').inner_text()
        action('select-result', 'faster')
        page.locator('#undoBtn').click()
        assert '水量增加' in page.locator('.academicMvpSlots').inner_text()
        action('select-result', 'faster'); action('submit-results'); action('next-case')
        action('select-result', 'stop')
        action('select-slot', 'actual'); action('select-result', 'normal'); action('submit-results')
        links = page.locator('[data-mvp-links]')
        assert links.is_visible()
        assert page.evaluate('document.activeElement.hasAttribute("data-mvp-links")')
        assert links.evaluate('e => { const r=e.getBoundingClientRect(), p=document.querySelector("#grid").getBoundingClientRect(); return r.top >= p.top && r.bottom <= p.bottom; }')
        action('select-link', 'jingran')
        assert links.is_visible()
        assert '竟然' in page.locator('.academicMvpPreview').inner_text()
        action('submit-link')
        assert '뜻밖' in page.locator('.academicMvpFeedback').inner_text()
        action('select-link', 'faner')
        assert '反而' in page.locator('.academicMvpPreview').inner_text()
        action('submit-link')
        page.wait_for_timeout(450)
        assert not page.locator('#flowNext').is_visible()
        action('finish-mvp'); page.locator('#flowNext').click()
        start('02-raner')
        assert not page.locator('#words').is_visible()
        assert page.locator('.academicMvpSource').count() == 2
        assert page.locator('#academicMvpConfirm').count() == 1
        assert '보고에서 고칠 부분을 찾아보자.' in page.locator('.academicTaskTitle').inner_text()
        assert page.locator('[data-academic-zone="original"]').count() == 1
        assert page.locator('[data-academic-zone="work"]').count() == 1
        assert page.locator('[data-academic-action="select-claim"]').count() == 2
        assert '그러므로 장치 전체도 정상' in page.locator('.academicReportDraft').inner_text()
        action('select-claim', 'fact-increased')
        assert page.locator('[data-verdict="incorrect"]').count() == 0
        action('submit-claim')
        assert '! 다시 살펴봐' in page.locator('.academicVerdictTitle').inner_text()
        assert page.locator('[data-academic-action="select-claim"].selected').get_attribute('aria-invalid') == 'true'
        action('select-claim', 'overreach-restored')
        assert page.locator('[data-verdict="incorrect"]').count() == 0
        action('submit-claim')
        assert '고칠 부분을 찾았어' in page.locator('.academicVerdictTitle').inner_text()
        assert page.locator('[data-mvp-detail="edit-memo"]').get_attribute('open') is not None
        action('select-revision', 'restore-all'); action('submit-revision')
        assert page.locator('.academicMvpPreview').get_attribute('data-verdict') == 'incorrect'
        page.screenshot(path='/tmp/academic-tower-feedback-02-wrong.png', full_page=True)
        action('select-revision', 'keep-both')
        assert page.locator('.academicMvpPreview').get_attribute('data-verdict') is None
        page.locator('#undoBtn').click()
        assert page.locator('.academicMvpPreview').get_attribute('data-verdict') == 'incorrect'
        action('select-revision', 'keep-both'); action('submit-revision')
        assert page.locator('.academicMvpPreview').get_attribute('data-verdict') == 'correct'
        assert page.evaluate('document.activeElement.id') == 'academicVerdict'
        page.screenshot(path='/tmp/academic-tower-feedback-02-correct.png', full_page=True)
        page.evaluate('TacticalGame.playStage("academic-tower-turn-03-expectation",{mode:"first-play"})')
        action('meaning-slot','from'); action('meaning-source','actual')
        page.reload();page.wait_for_function('!!window.AcademicTowerRuntime')
        assert page.evaluate('TacticalGame.resumeStage("academic-tower-turn-03-expectation")')
        assert page.evaluate('state.academicTower.placements.from')=='actual'
        def check(page, task, phase):
            original=page.locator('[data-academic-zone="original"]').inner_text()
            assert '果然' not in original and '竟然' not in original
            assert page.locator('.academicMeaningPath.expected').count()==1
            assert page.locator('.academicMeaningPath.actual').count()==1
        solve(page,check)
        assert not errors, errors
        browser.close()
finally:
    server.shutdown()
print('PASS: Tower MVP preview, context, undo, completion and legacy isolation.')
