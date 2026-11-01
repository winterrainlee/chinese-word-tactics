"""Mobile browser smoke for the independent G1 world-grid review page."""
import http.server
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-ux'))
OUT.mkdir(parents=True, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, uri):
        uri = uri.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        return str(ROOT / uri[len(prefix):]) if uri.startswith(prefix) else str(ROOT / '__missing__')


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/world-grid-test/'

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(args=['--no-sandbox'])
        for width, height in [(375, 812), (360, 640), (430, 900)]:
            context = browser.new_context(viewport={'width': width, 'height': height},
                                          is_mobile=True, has_touch=True)
            page = context.new_page()
            page.set_default_timeout(12000)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(url)
            page.wait_for_function("document.documentElement.dataset.gridReady === 'true'")
            page.wait_for_function("document.querySelector('#mapArtwork').naturalWidth > 0")
            assert page.locator('#gridLayer line').count() == 31 + 56
            assert page.locator('#featureLayer .traceWaterCore').count() >= 3
            assert page.locator('.pin').count() == 0
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")
            assert page.evaluate("localStorage.length") == 0
            page.screenshot(path=str(OUT / f'world-grid-medium-{width}x{height}.png'),
                            full_page=True)

            overlay = page.locator('#mapHit')
            box = overlay.bounding_box()
            overlay.click(position={'x': box['width'] * 211 / 430,
                                    'y': box['height'] * 237 / 764})
            assert '열' in page.locator('#selectionTitle').inner_text()
            assert '상단 다리' in page.locator('#selectionDetails').inner_text()

            page.select_option('#gridSize', 'coarse')
            assert page.locator('#gridLayer line').count() == 19 + 35
            page.select_option('#gridSize', 'fine')
            assert page.locator('#gridLayer line').count() == 39 + 70
            assert '열' in page.locator('#selectionTitle').inner_text()
            page.locator('#showGrid').uncheck()
            assert page.locator('#gridLayer line').count() == 0
            page.locator('#showTraces').uncheck()
            assert page.locator('#featureLayer path').count() == 0

            page.locator('#showAnchors').check()
            assert page.locator('.pin').count() == 6
            page.locator('.pin[data-anchor-id="border-village"]').click()
            assert '바깥 방향' in page.locator('#selectionDetails').inner_text()
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")
            assert not errors, errors
            context.close()
        browser.close()
finally:
    server.shutdown()
print('world-grid-test: 3 mobile viewports, grid options, image, candidates, anchors, no save writes OK')
