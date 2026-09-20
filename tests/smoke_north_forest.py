"""Mobile browser smoke for northern-forest F2-F8. Uses the deployed subpath locally."""
import http.server
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-tests'))
OUT.mkdir(parents=True, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, path):
        path = path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        return str(ROOT / (path[len(prefix):] if path.startswith(prefix) else '__missing__'))


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'


def cell(page, row, col):
    cols = page.evaluate('current().grid[0].length')
    return page.locator('#grid .cell').nth(row * cols + col)


def move(page, path):
    for row, col in path:
        cell(page, row, col).click()


def action(page, count=1):
    for _ in range(count):
        page.locator('#inspectBtn').click()


def start(page, stage_id):
    page.evaluate("id => TacticalGame.playStage(id, { mode: 'replay', returnTo: 'world' })", stage_id)
    page.wait_for_function("id => current().id === id", arg=stage_id)
    assert page.locator('#tutorialView').is_visible()
    assert page.locator('#grid .cell').count() in (36, 42, 49)
    widths = page.locator('#grid .cell').evaluate_all('(items) => items.map(item => item.getBoundingClientRect().width)')
    assert min(widths) >= 44
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')


def direct_info(page, row, col):
    cell(page, row, col).click()
    page.locator('#sheet').wait_for(state='visible')
    page.locator('#sheet .sheetactions button').click()


errors = []
missing = []
try:
    with sync_playwright() as pw:
        launch = {'args': ['--no-sandbox']}
        if os.environ.get('CHROMIUM_PATH'):
            launch['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = pw.chromium.launch(**launch)
        context = browser.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=1,
                                      is_mobile=True, has_touch=True)
        page = context.new_page()
        page.set_default_timeout(5000)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: missing.append(response.url)
                if response.status >= 400 and 'favicon' not in response.url else None)
        page.goto(URL)
        page.wait_for_function('!!window.GameFlow && !!window.NorthForestMechanics')

        start(page, 'north-forest-stage-2')
        move(page, [(2, 3)]); action(page)
        move(page, [(2, 2), (3, 2)]); action(page)
        move(page, [(4, 2), (4, 3)]); action(page, 2)
        page.locator('#flowNext').wait_for(state='visible')
        assert page.evaluate('state.markerAConfirmed && state.markerBConfirmed && state.markerCConfirmed')

        start(page, 'north-forest-stage-3')
        direct_info(page, 3, 5)
        move(page, [(2, 3)]); action(page, 3)
        page.locator('#flowNext').wait_for(state='visible')
        assert page.evaluate("state.markerDirection === '下' && state.routeReferenceObserved")

        start(page, 'north-forest-stage-4')
        assert page.locator('#northForestReference').is_visible()
        assert '樣本' in page.locator('#northForestReference').inner_text()
        assert '深綠色' in page.locator('#northForestReference').inner_text()
        move(page, [(2, 3), (2, 4)]); action(page, 2)
        assert page.evaluate('state.selectedPatch === null && state.comparedSimilar')
        assert '葉尖' in page.locator('#status').inner_text()
        move(page, [(2, 3), (2, 2), (1, 2)]); action(page, 2)
        page.locator('#flowNext').wait_for(state='visible')
        page.screenshot(path=str(OUT / 'north-forest-f4-375x812.png'), full_page=True)

        start(page, 'north-forest-stage-5')
        move(page, [(2, 3), (2, 4)]); action(page, 3)
        assert page.evaluate("!state.carriedMaterials.includes('material-b')")
        move(page, [(2, 3), (2, 2), (2, 1)])
        assert '水邊' in page.locator('#status').inner_text()
        assert '물가' in cell(page, 2, 1).get_attribute('aria-label')
        action(page, 2)
        move(page, [(3, 1), (3, 2), (4, 2)]); action(page, 2)
        assert page.evaluate("state.carriedMaterials.join(',') === 'material-a,material-c'")
        move(page, [(4, 3), (5, 3)])
        page.locator('#flowNext').wait_for(state='visible')

        start(page, 'north-forest-stage-6')
        action(page)
        move(page, [(4, 2), (3, 2)]); action(page)
        assert page.evaluate('!state.relatedTraceConfirmed')
        move(page, [(4, 2), (4, 3), (4, 4), (3, 4)]); action(page)
        assert page.evaluate('!state.relatedTraceConfirmed')
        move(page, [(2, 4)]); action(page)
        move(page, [(2, 3)]); action(page)
        move(page, [(1, 3)])
        page.locator('#flowNext').wait_for(state='visible')

        start(page, 'north-forest-stage-7')
        assert page.locator('.forest-bundle-mark').count() == 0
        move(page, [(5, 2), (4, 2), (3, 2)]); action(page)
        move(page, [(4, 2), (5, 2), (5, 3), (5, 4), (4, 4), (4, 5)]); action(page, 2)
        assert page.locator('.forest-bundle-mark').count() == 1
        action(page)
        assert page.locator('.forest-bundle-mark').count() == 0
        move(page, [(4, 4), (5, 4), (5, 3), (6, 3)])
        page.locator('#flowNext').wait_for(state='visible')

        start(page, 'north-forest-stage-8')
        for route in [(5, 1), (4, 3), (5, 5)]:
            direct_info(page, *route)
        move(page, [(5, 3), (5, 2), (5, 1), (4, 1)]); action(page, 2)
        move(page, [(3, 1), (2, 1), (1, 1), (1, 2), (1, 3), (0, 3)])
        page.locator('#flowNext').wait_for(state='visible')
        assert page.evaluate('JSON.stringify(state.followerPos) === "[1,3]"')

        start(page, 'north-forest-stage-8')
        for route in [(5, 1), (4, 3), (5, 5)]:
            direct_info(page, *route)
        move(page, [(5, 3), (5, 4), (5, 5), (4, 5), (3, 5), (2, 5), (1, 5), (1, 4), (1, 3), (0, 3)])
        page.locator('#flowNext').wait_for(state='visible')

        start(page, 'north-forest-stage-8')
        for route in [(5, 1), (4, 3), (5, 5)]:
            direct_info(page, *route)
        move(page, [(5, 3), (4, 3), (3, 3), (2, 3)])
        assert page.evaluate('JSON.stringify(state.followerPos) === "[4,3]" && state.followerStuck')
        move(page, [(3, 3)]); action(page)
        assert page.evaluate('JSON.stringify(state.hero) === "[4,3]" && JSON.stringify(state.followerPos) === "[5,3]"')
        page.screenshot(path=str(OUT / 'north-forest-f8-retreat-375x812.png'), full_page=True)

        assert not errors, errors
        assert not missing, missing
        context.close()
        browser.close()
finally:
    server.shutdown()

print(f'PASS: northern forest F2-F8 mobile browser smoke. Screenshots: {OUT}')
