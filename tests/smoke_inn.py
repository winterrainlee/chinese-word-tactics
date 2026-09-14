"""375x812 browser smoke for the inn room and Chapter 1 finale handoff."""
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

try:
    with sync_playwright() as pw:
        executable = os.environ.get('CHROMIUM_PATH')
        launch = {'args': ['--no-sandbox']}
        if executable: launch['executable_path'] = executable
        browser = pw.chromium.launch(**launch)

        context = browser.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=1, is_mobile=True, has_touch=True)
        page = context.new_page()
        page.set_default_timeout(5000)
        errors, missing, requests = [], [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: missing.append(response.url) if response.status >= 400 and 'favicon' not in response.url else None)
        page.on('request', lambda request: requests.append(request.url))

        page.goto(url)
        page.wait_for_function('!!window.GameFlow && !!window.TacticalGame && !!window.WorldInn')

        # Warm the room only after an explicit inn interaction helper is called.
        page.evaluate('WorldInn.preloadRoomBackground()')
        warm_room_requests = [item for item in requests if '/images/inn/room-v0.2/' in item]
        assert len(warm_room_requests) == 3, warm_room_requests
        assert not any('inn-room-hotspots.svg' in item for item in requests), requests

        before_open_count = len(requests)
        page.evaluate('WorldInn.openRoom()')
        page.locator('#innRoomView').wait_for(state='visible')
        page.wait_for_function('document.querySelector("#innRoomBackdrop")?.dataset.loaded === "true"')
        page.wait_for_function('document.querySelector("#innRoomHotspots")?.dataset.loaded === "true"')

        # Opening a warmed room should not start any new asset request.
        room_requests_after_open = [item for item in requests[before_open_count:] if '/images/inn/room-v0.2/' in item or 'inn-room-hotspots.svg' in item]
        assert room_requests_after_open == [], room_requests_after_open
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
        assert '여관 방에서 발견한 생활 단어' not in page.locator('#sheet').inner_text()
        page.locator('#innRoomWordClose').click()

        page.screenshot(path=str(OUT / 'ux-inn-room-375x812.png'), full_page=True)
        assert not errors, errors
        assert not missing, missing
        context.close()

        # C06: all three completed routes make the inn the next explicit destination.
        finale_progress = {
            'seenStories': ['gate-after-convoy', 'workshop-finale', 'market-after-m8'],
            'completedStages': ['stage-5'],
            'completedMilestones': ['gate-core', 'workshop-core', 'market-core', 'inn-unlocked'],
            'acknowledgedNodes': [],
            'stageOutcomes': {},
            'lastLocation': {'view': 'world'}
        }
        finale_context = browser.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=1, is_mobile=True, has_touch=True)
        finale_context.add_init_script(
            "localStorage.setItem('chinese-word-tactics-journey-v1', JSON.stringify(%s));" % json.dumps(finale_progress, ensure_ascii=False)
        )
        finale_page = finale_context.new_page()
        finale_errors, finale_missing = [], []
        finale_page.on('pageerror', lambda error: finale_errors.append(str(error)))
        finale_page.on('response', lambda response: finale_missing.append(response.url) if response.status >= 400 and 'favicon' not in response.url else None)
        finale_page.goto(url)
        finale_page.wait_for_function('!!window.GameFlow && !!window.WorldInn && !!window.Chapter1Finale')
        finale_page.evaluate('GameFlow.showWorld()')

        finale_page.locator('#worldContinue').wait_for(state='visible')
        assert finale_page.locator('#worldContinue').inner_text() == '여관으로 돌아가기'
        finale_page.locator('.worldInnMarker').click()
        sheet_text = finale_page.locator('#sheet').inner_text()
        assert '돌아와서 할 이야기가 생겼다' in sheet_text
        assert '여관 주인에게 아직 이야기하지 않았다' in sheet_text

        finale_page.locator('#chapter1FinaleEnter').click()
        finale_page.locator('#storyView').wait_for(state='visible')
        assert finale_page.locator('#storyTitle').inner_text() == '돌아와서 할 이야기'
        for _ in range(7): finale_page.locator('#storyNext').click()
        assert finale_page.locator('#storyTitle').inner_text() == '돌아올 곳'
        for _ in range(7): finale_page.locator('#storyNext').click()

        finale_page.locator('#innRoomView').wait_for(state='visible')
        finale_page.wait_for_function("JSON.parse(localStorage.getItem('chinese-word-tactics-journey-v1')).completedMilestones.includes('chapter1-complete')")
        saved = finale_page.evaluate("JSON.parse(localStorage.getItem('chinese-word-tactics-journey-v1'))")
        assert 'chapter1-room-finale' in saved['seenStories']
        assert 'chapter1-complete' in saved['completedMilestones']
        assert finale_page.evaluate('Chapter1Finale.isReady()') is False
        finale_page.screenshot(path=str(OUT / 'ux-chapter1-finale-room-375x812.png'), full_page=True)
        assert not finale_errors, finale_errors
        assert not finale_missing, finale_missing
        finale_context.close()

        browser.close()
finally:
    server.shutdown()

print(f'PASS: inn room + Chapter 1 finale browser smoke. Screenshots: {OUT / "ux-inn-room-375x812.png"}, {OUT / "ux-chapter1-finale-room-375x812.png"}')
