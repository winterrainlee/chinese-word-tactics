"""375x812 browser smoke for the inn room entry, raster background, and SVG hotspots."""
import http.server
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

try:
    with sync_playwright() as pw:
        executable = os.environ.get('CHROMIUM_PATH')
        launch = {'args': ['--no-sandbox']}
        if executable: launch['executable_path'] = executable
        browser = pw.chromium.launch(**launch)
        context = browser.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=1, is_mobile=True, has_touch=True)
        page = context.new_page()
        page.set_default_timeout(5000)
        errors, missing = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: missing.append(response.url) if response.status >= 400 and 'favicon' not in response.url else None)

        page.goto(url)
        page.wait_for_function('!!window.GameFlow && !!window.TacticalGame && !!window.WorldInn')
        page.evaluate('WorldInn.openRoom()')
        page.locator('#innRoomView').wait_for(state='visible')
        page.wait_for_function('document.querySelector("#innRoomBackdrop")?.dataset.loaded === "true"')
        page.wait_for_function('document.querySelector("#innRoomHotspots")?.dataset.loaded === "true"')

        assert page.locator('#innRoomBackdrop').is_visible()
        assert page.locator('#innRoomHotspots [data-word]').count() == 4
        assert page.locator('#innRoomHotspots [data-action="leave-room"]').count() == 1
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')

        scene = page.locator('#innRoomScene').evaluate('(el)=>el.getBoundingClientRect().toJSON()')
        assert scene['width'] <= 375 and scene['height'] > 400, scene

        page.locator('#hotspot-bed').click()
        assert page.locator('#sheet').is_visible()
        assert page.locator('#sheet h2').inner_text() == '床'
        assert '침대' in page.locator('#sheet').inner_text()
        page.locator('#innRoomWordClose').click()

        page.screenshot(path=str(OUT / 'ux-inn-room-375x812.png'), full_page=True)
        assert not errors, errors
        assert not missing, missing
        context.close()
        browser.close()
finally:
    server.shutdown()

print(f'PASS: inn room browser smoke. Screenshot: {OUT / "ux-inn-room-375x812.png"}')
