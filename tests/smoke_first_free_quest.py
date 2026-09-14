"""375x812 browser smoke for C08: first innkeeper request → northern forest → report → quest board."""
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
KEY = 'chinese-word-tactics-journey-v1'


def finish_story(page, max_clicks=20):
    for _ in range(max_clicks):
        if not page.locator('#storyView').is_visible():
            return
        page.locator('#storyNext').click()
    raise AssertionError('story did not finish')


def click_cell(page, row, col, cols=7):
    page.locator('#grid .cell').nth(row * cols + col).click()


try:
    with sync_playwright() as pw:
        executable = os.environ.get('CHROMIUM_PATH')
        launch = {'args': ['--no-sandbox']}
        if executable: launch['executable_path'] = executable
        browser = pw.chromium.launch(**launch)

        seed = {
            'seenStories': [
                'gate-after-convoy', 'workshop-finale', 'market-after-m8',
                'chapter1-inn-convergence', 'chapter1-room-finale'
            ],
            'completedStages': ['stage-5'],
            'completedMilestones': [
                'inn-unlocked', 'gate-core', 'workshop-core', 'market-core', 'chapter1-complete'
            ],
            'acknowledgedNodes': [],
            'stageOutcomes': {},
            'lastLocation': {'view': 'world'}
        }

        context = browser.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=1, is_mobile=True, has_touch=True)
        context.add_init_script(
            "localStorage.setItem('%s', JSON.stringify(%s));" % (KEY, json.dumps(seed, ensure_ascii=False))
        )
        page = context.new_page()
        page.set_default_timeout(6000)
        errors, missing = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: missing.append(response.url) if response.status >= 400 and 'favicon' not in response.url else None)

        page.goto(url)
        page.wait_for_function('!!window.GameFlow && !!window.WorldInn && !!window.FirstFreeQuest')
        page.evaluate('GameFlow.showWorld()')
        page.locator('.worldInnMarker').wait_for(state='visible')

        # Before the innkeeper asks, the northern forest is only map scenery: no quest marker yet.
        assert page.locator('.worldForestQuestMarker').count() == 0

        # The request can be postponed without changing progress or installing a marker.
        page.locator('.worldInnMarker').click()
        assert page.locator('#sheet h2').inner_text() == '여관 주인의 부탁'
        assert page.locator('#firstQuestOfferKo').is_hidden()
        page.locator('#firstQuestOfferMeaning').click()
        assert page.locator('#firstQuestOfferKo').is_visible()
        page.locator('#firstQuestLater').click()
        assert page.locator('#scrim').evaluate('(el)=>!el.classList.contains("open")')
        assert page.evaluate("!GameFlow.progress().seenStories.includes('first-free-quest-accepted')")
        assert page.locator('.worldForestQuestMarker').count() == 0

        # Accept the same persistent request.
        page.locator('.worldInnMarker').click()
        page.locator('#firstQuestAccept').click()
        page.locator('#storyView').wait_for(state='visible')
        assert page.locator('#storyTitle').inner_text() == '북쪽 숲으로'
        finish_story(page)

        # Acceptance reveals the already illustrated northern forest as a playable destination.
        page.locator('#worldView').wait_for(state='visible')
        marker = page.locator('.worldForestQuestMarker')
        marker.wait_for(state='visible')
        assert '북쪽 숲' in marker.inner_text()
        assert '北邊森林' in marker.inner_text()
        box = marker.evaluate('(el)=>el.getBoundingClientRect().toJSON()')
        world = page.locator('#worldRegions').evaluate('(el)=>el.getBoundingClientRect().toJSON()')
        marker_center_y = box['y'] + box['height'] / 2
        assert marker_center_y < world['y'] + world['height'] * 0.38, (box, world)
        assert page.evaluate("GameFlow.progress().seenStories.includes('first-free-quest-accepted')")
        page.screenshot(path=str(OUT / 'ux-c08-north-forest-marker-375x812.png'), full_page=True)

        marker.click()
        assert page.locator('#sheet h2').inner_text() == '북쪽 숲'
        page.locator('#northForestGo').click()
        page.locator('#tutorialView').wait_for(state='visible')
        assert page.locator('#stageTitle').inner_text() == '북쪽 숲의 버섯'
        assert page.evaluate("current().id === 'first-free-quest-forest'")
        assert page.locator('#grid .cell').count() == 49
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')

        # Select the boy and walk around B so the first target patch A is approached from the east.
        click_cell(page, 5, 3)
        for row, col in [(4,3), (4,2), (3,2), (2,2), (1,2)]: click_cell(page, row, col)
        assert page.locator('#inspectBtn').inner_text() == '버섯 살펴보기'
        page.locator('#inspectBtn').click()
        assert '月白菇' in page.locator('#status').inner_text()
        assert '×2' in page.locator('#status').inner_text()
        assert page.locator('#inspectBtn').inner_text() == '월백버섯 챙기기'
        page.locator('#inspectBtn').click()
        assert page.evaluate('state.forestCount') == 2
        assert '不足' in page.locator('#status').inner_text()

        # Cross to the second target patch C, inspect it, and reach the requested total of three.
        for row, col in [(1,3), (1,4)]: click_cell(page, row, col)
        assert page.locator('#inspectBtn').inner_text() == '버섯 살펴보기'
        page.locator('#inspectBtn').click()
        assert '月白菇' in page.locator('#status').inner_text()
        assert '×1' in page.locator('#status').inner_text()
        assert page.locator('#inspectBtn').inner_text() == '월백버섯 챙기기'
        page.locator('#inspectBtn').click()
        assert page.evaluate('state.forestCount') == 3
        assert '足夠' in page.locator('#status').inner_text()
        assert page.locator('.wordbtn.done').filter(has_text='足夠').count() == 1

        # The quest is not complete until the boy exits the forest.
        assert page.evaluate("!GameFlow.progress().completedStages.includes('first-free-quest-forest')")
        for row, col in [(2,4), (3,4), (4,4), (5,4), (5,3), (6,3)]: click_cell(page, row, col)
        page.locator('#flowNext').wait_for(state='visible')
        page.screenshot(path=str(OUT / 'ux-c08-forest-complete-375x812.png'), full_page=True)
        page.locator('#flowNext').click()

        # Stage completion returns to the world. The inn now becomes the report destination.
        page.locator('#worldView').wait_for(state='visible')
        assert page.evaluate("GameFlow.progress().completedStages.includes('first-free-quest-forest')")
        assert page.locator('.worldForestQuestMarker.completed').count() == 1
        page.locator('.worldInnMarker').click()
        assert page.locator('#firstQuestReport').is_visible()
        assert page.locator('#firstQuestReportKo').is_hidden()
        page.locator('#firstQuestReport').click()

        # Reporting flows directly into the small board-installation scene.
        page.locator('#storyView').wait_for(state='visible')
        assert page.locator('#storyTitle').inner_text() == '버섯을 가져오다'
        while page.locator('#storyView').is_visible() and page.locator('#storyTitle').inner_text() == '버섯을 가져오다':
            page.locator('#storyNext').click()
        assert page.locator('#storyTitle').inner_text() == '부탁을 적어 두는 곳'
        finish_story(page)

        page.locator('#worldView').wait_for(state='visible')
        saved = page.evaluate("JSON.parse(localStorage.getItem('%s'))" % KEY)
        assert 'first-free-quest-completed' in saved['completedMilestones']
        assert 'quest-board-unlocked' in saved['completedMilestones']
        assert 'first-free-quest-report' in saved['seenStories']
        assert 'quest-board-installed' in saved['seenStories']

        # Only after the report does the inn gain a persistent quest-board entry.
        page.locator('.worldInnMarker').click()
        page.locator('#questBoardOpen').wait_for(state='visible')
        page.locator('#questBoardOpen').click()
        assert page.locator('#sheet h2').inner_text() == '의뢰 게시판'
        board_text = page.locator('#sheet').inner_text()
        assert '북쪽 숲의 버섯' in board_text
        assert '완료' in board_text
        assert '지금은 새로 적힌 부탁이 없다' in board_text
        page.screenshot(path=str(OUT / 'ux-c08-quest-board-375x812.png'), full_page=True)

        assert not errors, errors
        assert not missing, missing
        context.close()
        browser.close()
finally:
    server.shutdown()

print(f'PASS: C08 first free quest browser smoke. Screenshots: {OUT}')
