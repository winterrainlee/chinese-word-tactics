"""Layout and discoverability smoke for the northern-forest F1-F8 bundle.

Runs only the repository's Python Playwright pattern against the deployed
subpath.  Each stage is checked at its initial state and after its longest
representative route.  CHROMIUM_PATH is intentionally the only browser
selection mechanism used by this test.
"""
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-layout'))
OUT.mkdir(parents=True, exist_ok=True)
VIEWPORTS = [(375, 812), (375, 667), (375, 640), (360, 640)]
STAGES = {
    'F1': 'first-free-quest-forest',
    **{f'F{i}': f'north-forest-stage-{i}' for i in range(2, 9)},
}
LAYOUT_FAILURES = []


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


def direct_info(page, row, col):
    cell(page, row, col).click()
    page.locator('#sheet').wait_for(state='visible')
    page.locator('#sheet .sheetactions button').click()


def wait_completion(page, label):
    try:
        page.locator('#flowNext').wait_for(state='visible', timeout=2500)
    except Exception as error:
        snapshot = page.evaluate("""() => ({
          id: current().id,
          state: JSON.stringify(state),
          flowNext: (() => { const el = document.querySelector('#flowNext'); const r = el?.getBoundingClientRect();
            return {hidden: el?.hidden, display: el ? getComputedStyle(el).display : null,
              width: r?.width || 0, height: r?.height || 0}; })(),
          status: document.querySelector('#status')?.innerText || ''
        })""")
        LAYOUT_FAILURES.append((label, 'representative route', 'completion control', str(error), snapshot))


def start(page, stage_id):
    page.evaluate("id => TacticalGame.playStage(id, { mode: 'replay', returnTo: 'world' })", stage_id)
    page.wait_for_function("id => current().id === id", arg=stage_id)
    page.locator('#tutorialView').wait_for(state='visible')


def metrics(page):
    return page.evaluate("""() => {
      const rect = el => { const r = el.getBoundingClientRect(); return {
        x: r.x, y: r.y, width: r.width, height: r.height,
        right: r.right, bottom: r.bottom
      }; };
      const tutorial = document.querySelector('#tutorialView');
      const parts = ['.topbar', '.goalbox', '#words', '.mapwrap', '#status', '.controls']
        .map(s => document.querySelector(s)).filter(Boolean).map(rect);
      const minX = Math.min(...parts.map(r => r.x));
      const maxRight = Math.max(...parts.map(r => r.right));
      const minY = Math.min(...parts.map(r => r.y));
      const maxBottom = Math.max(...parts.map(r => r.bottom));
      const buttons = [...tutorial.querySelectorAll('button')]
        .filter(el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'
          && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0)
        .map(el => ({id: el.id, text: el.innerText, ...rect(el)}));
      const grid = rect(document.querySelector('#grid'));
      const cells = [...document.querySelectorAll('#grid .cell')].map(rect);
      return {
        overflowX: document.documentElement.scrollWidth - innerWidth,
        overflowY: document.documentElement.scrollHeight - innerHeight,
        core: {x: minX, y: minY, width: maxRight - minX, height: maxBottom - minY},
        grid, cells, buttons,
        rows: current().grid.length, cols: current().grid[0].length,
        title: document.querySelector('#stageTitle').innerText,
        status: document.querySelector('#status').innerText,
        inspect: {visible: !document.querySelector('#inspectBtn').hidden,
                  text: document.querySelector('#inspectBtn').innerText}
      };
    }""")


def assert_layout(label, page, before, after):
    for state_name, sample in [('initial', before), ('longest', after)]:
        if sample['overflowX'] > 0.5:
            LAYOUT_FAILURES.append((label, state_name, 'horizontal overflow', sample['overflowX']))
        if sample['overflowY'] > 0.5:
            LAYOUT_FAILURES.append((label, state_name, 'vertical overflow', sample['overflowY']))
        for button in sample['buttons']:
            if button['width'] < 44 or button['height'] < 44:
                LAYOUT_FAILURES.append((label, state_name, 'button', button))
        if page.viewport_size['width'] == 375 and page.viewport_size['height'] == 640:
            if sample['core']['height'] > 620:
                LAYOUT_FAILURES.append((label, state_name, 'core height', sample['core']))
    for key in ('x', 'y', 'width', 'height', 'right', 'bottom'):
        if abs(before['grid'][key] - after['grid'][key]) > 1:
            LAYOUT_FAILURES.append((label, 'grid bbox', key, before['grid'][key], after['grid'][key]))
    if len(before['cells']) != before['rows'] * before['cols']:
        LAYOUT_FAILURES.append((label, 'initial', 'cell count', before['rows'], before['cols']))
    if len(after['cells']) != after['rows'] * after['cols']:
        LAYOUT_FAILURES.append((label, 'longest', 'cell count', after['rows'], after['cols']))
    min_width = min(cell_box['width'] for cell_box in before['cells'])
    min_height = min(cell_box['height'] for cell_box in before['cells'])
    if min_width < 44 or min_height < 44:
        LAYOUT_FAILURES.append((label, 'initial', 'cell touch size', min_width, min_height))


def play_longest(page, key):
    if key == 'F1':
        move(page, [(5, 3), (4, 3)]); action(page)
        for path in [[(4, 2), (3, 2), (2, 2), (1, 2)], [(1, 3), (1, 4)]]:
            move(page, path); action(page, 2)
        move(page, [(2, 4), (3, 4), (4, 4), (5, 4), (5, 3), (6, 3)])
        wait_completion(page, key)
        return
    if key == 'F2':
        move(page, [(2, 3)]); action(page)
        move(page, [(2, 2), (3, 2)]); action(page)
        move(page, [(4, 2), (4, 3)]); action(page, 2)
    elif key == 'F3':
        move(page, [(2, 3)]); action(page, 3)
    elif key == 'F4':
        move(page, [(2, 3), (2, 4)]); action(page, 2)
        move(page, [(2, 3), (2, 2), (1, 2)]); action(page, 3)
    elif key == 'F5':
        move(page, [(2, 3), (2, 4)]); action(page, 3)
        move(page, [(2, 3), (2, 2), (2, 1)]); action(page, 2)
        move(page, [(3, 1), (3, 2), (4, 2)]); action(page, 2)
        move(page, [(4, 3), (5, 3)])
    elif key == 'F6':
        action(page)
        move(page, [(4, 2), (3, 2)]); action(page)
        move(page, [(4, 2), (4, 3), (4, 4), (3, 4)]); action(page)
        move(page, [(2, 4)]); action(page)
        move(page, [(2, 3)]); action(page)
        move(page, [(1, 3)])
    elif key == 'F7':
        direct_info(page, 2, 4)
        move(page, [(4, 3), (3, 3)]); action(page)
        move(page, [(3, 4)])
        page.locator('#inspectBtn').click()
        page.locator('[data-context-action-choices]').wait_for(state='visible')
        page.locator('[data-context-action-choices] button', has_text='덤불 살펴보기').click()
        action(page, 2)
        move(page, [(3, 3), (4, 3), (5, 3), (6, 3)])
    elif key == 'F8':
        for route in [(5, 1), (4, 3), (5, 5)]: direct_info(page, *route)
        move(page, [(5, 3), (5, 2)]); action(page); action(page, 3)
        wait_completion(page, key)
        return
    wait_completion(page, key)


def assert_discoverability(page, key):
    text = page.locator('#tutorialView').inner_text()
    assert page.locator('#stageTitle').inner_text(), key
    assert page.locator('#goal').inner_text(), key
    assert page.locator('#ruleLine').inner_text(), key
    assert page.locator('#words .wordbtn').count() >= 1, key
    assert page.evaluate('[6, 7].includes(current().grid[0].length)')
    if key == 'F1':
        assert '範圍' in text and '數量' in text and '退出' in text
    elif key in ('F2', 'F3'):
        assert any(word in text for word in ('方向', '標記', '指示'))
    elif key in ('F4', 'F5'):
        assert any(word in text for word in ('特徵', '相似', '適合', '生長'))
    elif key in ('F6', 'F7'):
        assert any(word in text for word in ('痕跡', '附近', '留下', '尋找'))
    elif key == 'F8':
        assert any(word in text for word in ('安全', '危險', '路況', '情況'))


errors = []
missing = []
try:
    with sync_playwright() as pw:
        executable = os.environ.get('CHROMIUM_PATH')
        launch = {'args': ['--no-sandbox']}
        if executable:
            launch['executable_path'] = executable
        browser = pw.chromium.launch(**launch)
        for width, height in VIEWPORTS:
            context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1,
                                          is_mobile=True, has_touch=True)
            page = context.new_page()
            page.set_default_timeout(6000)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('response', lambda response: missing.append(response.url)
                    if response.status >= 400 and 'favicon' not in response.url else None)
            page.goto(URL)
            page.wait_for_function('!!window.GameFlow && !!window.NorthForestMechanics && !!window.FirstFreeQuest')
            for key, stage_id in STAGES.items():
                start(page, stage_id)
                assert_discoverability(page, key)
                initial = metrics(page)
                page.screenshot(path=str(OUT / f'north-forest-layout-{key.lower()}-{width}x{height}-initial.png'), full_page=True)
                start(page, stage_id)
                play_longest(page, key)
                longest = metrics(page)
                assert_discoverability(page, key)
                if key == 'F5':
                    assert '適合 2/2' in page.locator('#northForestReference').inner_text()
                if key == 'F8':
                    assert page.evaluate("document.querySelector('.forest-object-route-west')?.dataset.routeStatus") == '乾·寬'
                    assert page.evaluate("document.querySelector('.forest-object-route-middle')?.dataset.routeStatus") == '濕·窄'
                    assert page.evaluate("document.querySelector('.forest-object-route-east')?.dataset.routeStatus") == '乾·寬'
                    assert page.evaluate("[...document.querySelectorAll('.forest-object-confirmed')].length") == 3
                assert_layout(f'{key}@{width}x{height}', page, initial, longest)
                page.screenshot(path=str(OUT / f'north-forest-layout-{key.lower()}-{width}x{height}-longest.png'), full_page=True)
            context.close()
        browser.close()
finally:
    server.shutdown()

assert not errors, errors
assert not missing, missing
if LAYOUT_FAILURES:
    raise AssertionError('layout failures:\n' + json.dumps(LAYOUT_FAILURES, ensure_ascii=False, indent=2))
print(f'PASS: northern forest F1-F8 layout smoke at {VIEWPORTS}. Screenshots: {OUT}')
