"""375x812 browser smoke for settings, save export, and restore preview.

Requires Python Playwright and Chromium.
Run: python tests/smoke_settings.py
Optional: CHROMIUM_PATH=/path/to/chromium TEST_OUTPUT=/path/to/screenshots
"""
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-ux'))
OUT.mkdir(parents=True, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
    def translate_path(self, request_path):
        request_path = request_path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        if not request_path.startswith(prefix): return str(ROOT / '__missing__')
        return str(ROOT / request_path[len(prefix):])

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'

def assert_touch_targets(page, selector):
    targets = page.locator(selector).evaluate_all('''nodes => nodes.filter(node => { const style=getComputedStyle(node), box=node.getBoundingClientRect(); return style.display!=='none'&&style.visibility!=='hidden'&&box.width&&box.height; }).map(node => { const box=node.getBoundingClientRect(); return {text:node.textContent.trim(),width:box.width,height:box.height}; })''')
    assert targets, selector
    assert all(item['width'] >= 44 and item['height'] >= 44 for item in targets), targets

try:
    with sync_playwright() as pw:
        executable = os.environ.get('CHROMIUM_PATH')
        launch = {'args':['--no-sandbox']}
        if executable: launch['executable_path'] = executable
        browser = pw.chromium.launch(**launch)
        context = browser.new_context(
            viewport={'width':375,'height':812}, device_scale_factor=1,
            is_mobile=True, has_touch=True, accept_downloads=True
        )
        page = context.new_page(); page.set_default_timeout(5000)
        errors, missing = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: missing.append(response.url) if response.status >= 400 and 'favicon' not in response.url else None)
        page.goto(url)
        page.wait_for_function('!!window.GameFlow && !!window.TacticalGame && !!window.SettingsRuntime && !!window.SaveData')

        assert page.locator('#landingView').is_visible()
        assert page.locator('#landingSettings').is_visible()
        assert_touch_targets(page, '#landingSettings:visible')
        page.locator('#landingSettings').click()
        assert page.locator('#settingsView').is_visible()
        assert not page.locator('#landingView').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert_touch_targets(page, '#settingsBack:visible, .settingsAction:visible')
        assert page.locator('#settingsBuild').inner_text() == '2026-09-20-north-forest-feedback4'

        with page.expect_download() as info:
            page.locator('#settingsExport').click()
        download = info.value
        assert download.suggested_filename.startswith('따라온-단어들-저장-')
        assert download.suggested_filename.endswith('.json')
        exported = Path(download.path()).read_text(encoding='utf-8')
        payload = json.loads(exported)
        assert payload['app'] == 'chinese-word-tactics'
        assert payload['formatVersion'] == 1
        assert set(payload['storage']) == {
            'chinese-word-tactics-journey-v1', 'chufa-tutorial-v03',
            'chinese-word-tactics-world-v1', 'chinese-word-tactics-pending-completion-v1',
            'chinese-word-tactics-lexicon-v1'
        }
        assert '현재 진행 기록을 저장 파일로 만들었어.' in page.locator('#settingsMessage').inner_text()

        page.locator('#settingsImportFile').set_input_files({
            'name': '따라온-단어들-저장.json',
            'mimeType': 'application/json',
            'buffer': exported.encode('utf-8')
        })
        page.locator('#settingsRestorePreview').wait_for(state='visible')
        assert '진행 중인 기록' in page.locator('#settingsRestoreSummary').inner_text()
        assert_touch_targets(page, '#settingsRestoreConfirm:visible')
        page.screenshot(path=str(OUT/'ux-00-settings-backup-375x812.png'), full_page=True)

        foreign = json.dumps({'app':'other-game','formatVersion':1,'createdAt':'2026-09-15T12:00:00.000Z','storage':{}}, ensure_ascii=False)
        page.locator('#settingsImportFile').set_input_files({
            'name': 'not-this-game.json', 'mimeType': 'application/json', 'buffer': foreign.encode('utf-8')
        })
        page.locator('#settingsMessage').wait_for(state='visible')
        page.wait_for_function("document.getElementById('settingsMessage').textContent.includes('따라온 단어들의 저장 파일이 아니야.')")
        assert page.locator('#settingsRestorePreview').is_hidden()
        assert 'bad' in (page.locator('#settingsMessage').get_attribute('class') or '')

        page.locator('#settingsBack').click()
        assert page.locator('#landingView').is_visible()
        assert page.locator('#settingsView').is_hidden()
        assert not errors, errors
        assert not missing, missing
        print('SETTINGS_BACKUP_SMOKE_OK', flush=True)
        browser.close()
finally:
    server.shutdown(); server.server_close()
