"""MVP interaction contract: previews, retained context, undo and deliberate completion."""
import http.server
import json
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
        page.goto(f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/')
        page.wait_for_function('!!window.AcademicTowerRuntime')
        def start(suffix):
            page.evaluate('(s)=>TacticalGame.playStage("academic-tower-turn-"+s,{mode:"replay",returnTo:"academic-tower"})', suffix)
        def action(name, value=None):
            selector = f'[data-academic-action="{name}"]'
            if value is not None: selector += f'[data-value="{value}"]'
            page.locator(selector).click()
        start('01-que')
        assert not page.locator('#words').is_visible()
        page.locator('[data-academic-word="卻"]').click()
        page.locator('#sheet .sheetactions button').click()
        assert page.evaluate('document.activeElement.dataset.academicWord') == '卻'
        assert page.locator('#grid').evaluate('e=>e.clientHeight') > 650
        action('select-claim', 'overreach-use'); action('submit-claim')
        page.locator('[data-mvp-detail="source-meaning"] summary').click()
        page.locator('[data-mvp-detail="edit-memo"] > summary').click()
        action('select-revision', 'ignore-danger')
        assert '위험은 이용 판단에서 제외' in page.locator('.academicMvpPreview').inner_text()
        assert page.locator('[data-mvp-detail="source-meaning"]').get_attribute('open') is not None
        assert page.evaluate('document.activeElement.dataset.value') == 'ignore-danger'
        scroll = page.locator('#grid').evaluate('e=>e.scrollTop')
        page.locator('[data-academic-action="select-revision"][data-value="ignore-danger"]').press('Enter')
        assert abs(page.locator('#grid').evaluate('e=>e.scrollTop') - scroll) < 2
        action('submit-revision')
        assert '위험을 빼면 안 돼' in page.locator('.academicMvpFeedback').inner_text()
        action('select-revision', 'keep-both')
        assert '반영한다' in page.locator('.academicMvpPreview').inner_text()
        page.screenshot(path='/tmp/academic-tower-mvp-01.png', full_page=True)
        page.locator('#undoBtn').click()
        assert '제외한다' in page.locator('.academicMvpPreview').inner_text()
        action('select-revision', 'keep-both'); action('submit-revision'); action('next-case')
        assert page.locator('#grid').evaluate('e=>e.scrollTop') == 0
        page.locator('[data-mvp-detail="edit-memo"] > summary').click()
        action('select-revision', 'old-and-working')
        assert '目前仍能正常運作' in page.locator('.academicMvpPreview').inner_text()
        action('submit-revision')
        # Wait beyond the former 220ms automatic completion; this is a timed behavior assertion.
        page.wait_for_timeout(450)
        assert page.locator('[data-academic-action="finish-mvp"]').is_visible()
        assert not page.locator('#flowNext').is_visible()
        before = page.evaluate('localStorage.getItem("chinese-word-tactics-journey-v1")')
        action('finish-mvp')
        assert page.locator('#flowNext').is_visible()
        assert page.evaluate('localStorage.getItem("chinese-word-tactics-journey-v1")') == before
        page.locator('#flowNext').click()
        start('04-faner')
        action('select-result', 'more-water')
        assert '水量增加' in page.locator('.academicMvpSlots').inner_text()
        action('submit-result')
        assert '조건' in page.locator('.academicMvpFeedback').inner_text()
        action('select-result', 'faster'); action('submit-result')
        action('select-result', 'stopped'); action('submit-result'); action('next-case')
        action('select-result', 'stop'); action('submit-result')
        action('select-result', 'normal'); action('submit-result')
        page.locator('[data-mvp-detail="edit-link"] summary').click()
        action('select-link', 'jingran')
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
        assert page.locator('#words').is_visible()
        assert page.locator('.academicSources').is_visible()
        assert not page.locator('#academicMvpConfirm').count()
        assert not errors, errors
        browser.close()
finally:
    server.shutdown()
print('PASS: Tower MVP preview, context, undo, completion and legacy isolation.')
