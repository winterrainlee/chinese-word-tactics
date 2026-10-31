"""Mobile map/tower gates: W7 first, Gate dialogue, M4 for 03B, rain for 04A."""
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
        prefix='/chinese-word-tactics/'
        return str(ROOT / uri[len(prefix):]) if uri.startswith(prefix) else str(ROOT / '__missing__')

server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'

def open_seed(browser, state):
    context=browser.new_context(viewport={'width':375,'height':812},is_mobile=True,has_touch=True)
    context.add_init_script("localStorage.setItem('%s',JSON.stringify(%s));" %
                            (KEY,json.dumps(state,ensure_ascii=False)))
    page=context.new_page()
    page.set_default_timeout(7000)
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.goto(url)
    page.wait_for_function('!!window.GameFlow && !!window.AcademicTowerRuntime && !!window.Chapter2Rain')
    return context,page,errors

def state(**overrides):
    base=dict(seenStories=['chapter1-roadside-merchant'],completedStages=['stage-5'],
              completedMilestones=[],acknowledgedNodes=[],stageOutcomes={},
              lastLocation={'view':'world'})
    base.update(overrides)
    return base

try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(args=['--no-sandbox'])
        early=state(completedStages=['stage-5','workshop-stage-7'],
                    completedMilestones=['workshop-core'])
        ctx,page,errors=open_seed(browser,early)
        page.evaluate('GameFlow.showWorld()')
        card=page.locator('.regionCard[data-region-id="academic-tower"]')
        assert 'locked' in (card.get_attribute('class') or '')
        card.click()
        assert page.locator('#worldPlaceLockedGo').is_disabled()
        assert not errors,errors
        ctx.close()

        after=state(seenStories=['chapter1-roadside-merchant','workshop-finale'],
                    completedStages=['stage-5','workshop-stage-7'],
                    completedMilestones=['workshop-core'])
        ctx,page,errors=open_seed(browser,after)
        page.evaluate('GameFlow.showWorld()')
        assert page.locator('#worldView .stagekicker').inner_text() == '1장 · 세 갈래 길'
        card=page.locator('.regionCard[data-region-id="academic-tower"]')
        assert 'locked' not in (card.get_attribute('class') or '')
        card.click()
        assert page.locator('#worldPlaceGo').is_enabled()
        page.locator('#worldPlaceGo').click()
        page.locator('#storyView').wait_for(state='visible')
        assert page.locator('#storyTitle').inner_text() == '문 앞에서 멈추다'
        for _ in range(5):page.locator('#storyNext').click()
        assert '關口' not in page.locator('#storyZh').inner_text()
        assert '舊調節器' in page.locator('#storyZh').inner_text()
        page.screenshot(path=str(OUT / 'tower-unlocked-after-workshop-375x812.png'),full_page=True)
        assert not errors,errors
        ctx.close()

        # Gate's glowing sign is referenced only after the Gate G7 story.
        gate=state(seenStories=['workshop-finale','gate-after-convoy'],
                   completedStages=['stage-5','workshop-stage-7'],
                   completedMilestones=['workshop-core'])
        ctx,page,errors=open_seed(browser,gate)
        assert page.evaluate("GameFlow.playStory('academic-tower-arrival')")
        for _ in range(5):page.locator('#storyNext').click()
        assert '關口' in page.locator('#storyZh').inner_text()
        assert not errors,errors
        ctx.close()

        shared=state(
            seenStories=['chapter1-room-finale','academic-tower-arrival',
              'academic-tower-ran-result','academic-tower-turn-before-faner'],
            completedStages=['stage-5','academic-tower-turn-03a-ran-family',
              'academic-tower-turn-04-faner'],
            completedMilestones=['chapter1-complete','academic-tower-entered']
        )
        ctx,page,errors=open_seed(browser,shared)
        assert page.evaluate("GameFlow.enterRegion('academic-tower')")
        roomB=page.locator('[data-room-id="academic-tower-turn-03b-ran-village"]')
        assert roomB.get_attribute('data-state')=='locked'
        assert page.locator('[data-room-id="academic-tower-turn-04a-er-family"]').count()==0
        assert not page.evaluate("JourneyProgress.isAvailable(JourneyProgress.getNode('story:academic-tower-er-intro'),GameFlow.progress())")
        assert not errors,errors
        ctx.close()

        market=dict(shared)
        market['seenStories']=shared['seenStories']+['market-after-m4']
        ctx,page,errors=open_seed(browser,market)
        assert page.evaluate("GameFlow.enterRegion('academic-tower')")
        assert page.locator('[data-room-id="academic-tower-turn-03b-ran-village"]').get_attribute('data-state')=='available'
        assert page.locator('[data-room-id="academic-tower-turn-04a-er-family"]').count()==0
        assert not errors,errors
        ctx.close()

        after_rain=dict(shared)
        after_rain['completedMilestones']=shared['completedMilestones']+['chapter2-rain-passed']
        ctx,page,errors=open_seed(browser,after_rain)
        assert page.evaluate("GameFlow.enterRegion('academic-tower')")
        er=page.locator('[data-room-id="academic-tower-turn-04a-er-family"]')
        assert er.get_attribute('data-state')=='available'
        page.evaluate('GameFlow.showJourney()')
        assert page.locator('[data-node-id="story:academic-tower-er-intro"]').count()==1
        page.screenshot(path=str(OUT / 'tower-04a-after-rain-375x812.png'),full_page=True)
        assert not errors,errors
        ctx.close()

        old=dict(shared)
        old['seenStories']=shared['seenStories']+['academic-tower-er-intro']
        ctx,page,errors=open_seed(browser,old)
        assert page.evaluate('Chapter2Rain.statusFor(GameFlow.progress())')=='legacy'
        assert page.evaluate("GameFlow.enterRegion('academic-tower')")
        assert page.locator('[data-room-id="academic-tower-turn-04a-er-family"]').count()==1
        assert not errors,errors
        ctx.close()
        browser.close()
finally:
    server.shutdown()

print('PASS: W7 tower entry, conditional Gate reference, 03B M4, 04A rain and legacy')
