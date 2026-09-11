"""Focused 375x812 browser smoke test for gate-town tactical object artwork."""
import http.server
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-gate-icons'))
OUT.mkdir(parents=True, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, request_path):
        request_path = request_path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        if not request_path.startswith(prefix):
            return str(ROOT / '__missing__')
        return str(ROOT / request_path[len(prefix):])


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'


def background_asset(page, selector, filename, pseudo=None):
    element = page.locator(selector).first
    assert element.count() == 1, selector
    assert filename in element.evaluate('(el,pseudo)=>getComputedStyle(el,pseudo).backgroundImage', pseudo)
    if pseudo:
        return
    boxes = element.evaluate('(el)=>({art:el.getBoundingClientRect().toJSON(),cell:el.parentElement.getBoundingClientRect().toJSON()})')
    assert boxes['art']['width'] <= boxes['cell']['width']
    assert boxes['art']['height'] <= boxes['cell']['height']


try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
            args=['--no-sandbox'],
        )
        context = browser.new_context(
            viewport={'width': 375, 'height': 812},
            device_scale_factor=1,
            is_mobile=True,
            has_touch=True,
        )
        page = context.new_page()
        errors, missing = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: missing.append(response.url) if response.status >= 400 and 'favicon' not in response.url else None)
        page.goto(url)
        page.wait_for_function('!!window.GameFlow && !!window.GATE_TACTICAL_ICONS')

        stage_checks = [
            ('gate-stage-1', '.cell.sign', 'signpost.png', '::before'),
            ('gate-stage-2', '.range-bell', 'bell-tower.png', None),
            ('gate-stage-3', '.route-waypoint-mark', 'outpost.png', None),
        ]
        for stage_id, selector, asset, pseudo in stage_checks:
            page.evaluate('(id)=>TacticalGame.playStage(id,{mode:"replay"})', stage_id)
            background_asset(page, selector, asset, pseudo)
            page.screenshot(path=str(OUT / f'{stage_id}-375.png'))

        page.evaluate('TacticalGame.playStage("gate-stage-4",{mode:"replay"})')
        assert page.locator('.investigation-cart-mark').count() == 1
        assert page.locator('.investigation-crate-mark').count() == 2
        assert page.locator('.investigation-rock-mark').count() == 1
        background_asset(page, '.investigation-cart-mark', 'cart.png')
        background_asset(page, '.investigation-crate-mark', 'crate.png')
        background_asset(page, '.investigation-rock-mark', 'obstacle-rock.png')
        page.screenshot(path=str(OUT / 'gate-g4-objects-375.png'))
        page.evaluate('state.obstacleCleared=true;render()')
        assert page.locator('.investigation-rock-mark').count() == 0

        page.evaluate('TacticalGame.playStage("gate-stage-5",{mode:"replay"})')
        background_asset(page, '.movable-door-mark', 'gate.png')
        assert page.locator('#grid .cell').nth(12).locator('.movable-cart-mark').count() == 1
        page.evaluate('state.movablePos=[3,2];render()')
        assert page.locator('#grid .cell').nth(12).locator('.movable-cart-mark').count() == 0
        assert page.locator('#grid .cell').nth(17).locator('.movable-cart-mark').count() == 1
        page.evaluate('state.movablePos=[2,2];render()')
        page.screenshot(path=str(OUT / 'gate-g5-cart-375.png'))

        page.evaluate('TacticalGame.playStage("gate-stage-6",{mode:"replay"})')
        background_asset(page, '.follower-narrow-mark', 'narrow-pass.png')
        assert page.locator('#grid .cell').nth(32).locator('.follower-cart-mark').count() == 1
        page.evaluate('state.followerPos=[5,2];render()')
        assert page.locator('#grid .cell').nth(32).locator('.follower-cart-mark').count() == 0
        assert page.locator('#grid .cell').nth(27).locator('.follower-cart-mark').count() == 1
        page.evaluate('state.followerPos=[6,2];render()')
        page.screenshot(path=str(OUT / 'gate-g6-follower-375.png'))

        page.evaluate('TacticalGame.playStage("gate-stage-7",{mode:"replay"})')
        assert page.locator('.follower-chain-mark').count() == 2
        assert page.locator('.follower-chain-badge').all_text_contents() == ['1', '2']
        assert page.locator('.route-waypoint-mark').count() == 2
        page.evaluate('state.followerPositions=[[4,2],[5,2]];render()')
        assert page.locator('#grid .cell').nth(22).locator('.follower-chain-mark').count() == 1
        assert page.locator('#grid .cell').nth(27).locator('.follower-chain-mark').count() == 1
        page.evaluate('state.followerPositions=[[5,2],[6,2]];render()')
        page.screenshot(path=str(OUT / 'gate-g7-convoy-375.png'))
        page.evaluate('state.g7ObstacleCleared=true;render()')
        assert page.locator('.g7-obstacle-mark').count() == 0

        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not errors, errors
        assert not missing, missing
        context.close()
        browser.close()
finally:
    server.shutdown()

print(f'PASS: G1-G7 tactical assets, dynamic positions, clear states, and project-subpath loading. Screenshots: {OUT}')
