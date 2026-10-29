"""375x812 post-Chapter-1 rain: story resume, C08 handoff and old save safety."""
import http.server
import json
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-ux'))
OUT.mkdir(parents=True, exist_ok=True)
KEY = 'chinese-word-tactics-journey-v1'

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
    def translate_path(self, uri):
        uri = uri.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        return str(ROOT / uri[len(prefix):]) if uri.startswith(prefix) else str(ROOT / '__missing__')

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'
seed = {
    'seenStories': ['chapter1-room-finale', 'chapter1-inn-convergence'],
    'completedStages': ['stage-5'],
    'completedMilestones': ['chapter1-complete','inn-unlocked','gate-core','workshop-core','market-core'],
    'acknowledgedNodes': [], 'stageOutcomes': {}, 'lastLocation': {'view':'world'}
}

def open_page(browser, state):
    context = browser.new_context(viewport={'width':375,'height':812}, is_mobile=True, has_touch=True)
    context.add_init_script("if (!localStorage.getItem('%s')) localStorage.setItem('%s',JSON.stringify(%s));" %
                            (KEY, KEY, json.dumps(state, ensure_ascii=False)))
    page = context.new_page()
    page.set_default_timeout(7000)
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto(url)
    page.wait_for_function('!!window.GameFlow && !!window.Chapter2Rain && !!window.FirstFreeQuest')
    return context, page, errors

try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=['--no-sandbox'])
        context, page, errors = open_page(browser, seed)
        page.evaluate('GameFlow.showJourney()')
        chapter = page.locator('.journeyChapter[data-chapter-id="chapter-2-after-rain"]')
        assert chapter.count() == 1
        assert '2장 · 비가 지나간 물길마을' in chapter.locator('.journeyChapterSummary').inner_text()
        assert chapter.get_attribute('open') is not None
        rain = chapter.locator('.journeyNode[data-node-id="story:chapter2-rain-opening"]')
        assert rain.count() == 1
        assert rain.get_attribute('data-state') == 'available'
        page.screenshot(path=str(OUT / 'chapter2-journey-opening-375x812.png'), full_page=True)
        page.evaluate('WorldInn.openRoom()')
        page.locator('#innRoomBack').click()
        page.locator('#storyView').wait_for(state='visible')
        assert page.locator('#storyTitle').inner_text() == '큰비가 내리던 밤'
        assert '雨聲' in page.locator('#storyZh').inner_text()
        assert page.locator('#storyKo').is_hidden()
        page.locator('#storyTranslate').click()
        assert page.locator('#storyKo').is_visible()
        page.locator('#storyNext').click()
        page.locator('#storyNext').click()
        assert page.evaluate('GameFlow.progress().lastLocation.beat') == 2
        assert page.evaluate('GameFlow.progress().completedMilestones.includes("chapter2-rain-passed")') is False
        page.reload()
        page.wait_for_function('!!window.GameFlow && !!window.Chapter2Rain')
        page.evaluate('GameFlow.resume()')
        page.locator('#storyView').wait_for(state='visible')
        assert page.locator('#storyCount').inner_text() == '3 / 4'
        assert '雨下了一整夜' in page.locator('#storyZh').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(OUT / 'chapter2-rain-intro-375x812.png'), full_page=True)
        page.locator('#storyNext').click()
        page.locator('#storyNext').click()
        page.locator('#worldView').wait_for(state='visible')
        page.locator('#firstQuestLater').wait_for(state='visible')
        assert page.locator('#sheet h2').inner_text() == '여관 주인의 부탁'
        result = page.evaluate('GameFlow.progress()')
        assert 'chapter2-rain-passed' in result['completedMilestones']
        assert 'chapter1-complete' in result['completedMilestones']
        assert 'chapter2-rain-opening' in result['seenStories']
        page.locator('#firstQuestLater').click()
        page.evaluate('GameFlow.showJourney()')
        completed_rain = page.locator(
            '.journeyChapter[data-chapter-id="chapter-2-after-rain"] .journeyNode[data-node-id="story:chapter2-rain-opening"]')
        assert completed_rain.get_attribute('data-state') == 'complete'
        before_replay = page.evaluate('GameFlow.progress()')
        completed_rain.click()
        assert page.locator('#storyTitle').inner_text() == '큰비가 내리던 밤'
        page.locator('#storySkip').click()
        page.locator('#journeyView').wait_for(state='visible')
        after_replay = page.evaluate('GameFlow.progress()')
        assert after_replay['seenStories'] == before_replay['seenStories']
        assert after_replay['completedMilestones'] == before_replay['completedMilestones']
        page.evaluate('WorldInn.openRoom()')
        page.locator('#innRoomBack').click()
        assert page.locator('#worldView').is_visible()
        assert page.locator('#storyView').is_hidden()
        assert not errors, errors
        context.close()

        for changed in [
            {'seenStories': seed['seenStories'] + ['academic-tower-er-intro']},
            {'seenStories': seed['seenStories'] + ['first-free-quest-accepted']}
        ]:
            legacy = dict(seed, **changed)
            context, page, errors = open_page(browser, legacy)
            page.evaluate('GameFlow.showJourney()')
            older_rain = page.locator(
                '.journeyChapter[data-chapter-id="chapter-2-after-rain"] .journeyNode[data-node-id="story:chapter2-rain-opening"]')
            assert older_rain.get_attribute('data-state') == 'past'
            assert '돌아보기' in older_rain.get_attribute('aria-label')
            older_rain.click()
            assert page.locator('#storyTitle').inner_text() == '큰비가 내리던 밤'
            for _ in range(4):
                page.locator('#storyNext').click()
            page.locator('#journeyView').wait_for(state='visible')
            assert not page.evaluate('GameFlow.progress().seenStories.includes("chapter2-rain-opening")')
            page.evaluate('WorldInn.openRoom()')
            page.locator('#innRoomBack').click()
            assert page.locator('#worldView').is_visible()
            assert page.evaluate('Chapter2Rain.statusFor(GameFlow.progress())') == 'legacy'
            assert not errors, errors
            context.close()
        browser.close()
finally:
    server.shutdown()

print('PASS: Chapter 2 rain once, resume, optional first quest, legacy saves')