"""P1: 3 independent optional post-rain first-sighting stories and stable Chapter 1 replay."""
import http.server
import json
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('TEST_OUTPUT','/tmp/chinese-word-tactics-ux'))
OUT.mkdir(parents=True,exist_ok=True)
KEY='chinese-word-tactics-journey-v1'
IDS={
    'gate-town':'chapter2-gate-first-look',
    'market-town':'chapter2-market-first-look',
    'workshop-town':'chapter2-workshop-first-look'
}
BASE={
  'seenStories':['chapter1-inn-convergence','chapter1-room-finale'],
  'completedStages':['stage-5'],
  'completedMilestones':['chapter1-complete','inn-unlocked','gate-core','workshop-core','market-core'],
  'acknowledgedNodes':[],'stageOutcomes':{},
  'lastLocation':{'view':'world'}
}
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
    def translate_path(self,uri):
        uri=uri.split('?',1)[0]
        p='/chinese-word-tactics/'
        return str(ROOT/uri[len(p):]) if uri.startswith(p) else str(ROOT/'__missing__')
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'

def open_game(browser,state,viewport):
    context=browser.new_context(viewport=viewport,is_mobile=True,has_touch=True)
    context.add_init_script("localStorage.setItem(%s,JSON.stringify(%s));"%
        (json.dumps(KEY),json.dumps(state,ensure_ascii=False)))
    page=context.new_page()
    page.set_default_timeout(10000)
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(url)
    page.wait_for_function('!!window.GameFlow && !!window.Chapter2FirstLook && !!window.Chapter2Rain')
    page.evaluate('GameFlow.showWorld()')
    page.locator('.regionCard[data-region-id="gate-town"]').wait_for(state='visible')
    return context,page,errors

def place_sheet(page,regionId):
    page.locator('.regionCard[data-region-id="'+regionId+'"]').click()
    page.locator('#sheet h2').wait_for(state='visible')
    return page.locator('#worldFirstLookEntry')

try:
    with sync_playwright() as pw:
        for engine in (pw.chromium,pw.webkit):
            browser=engine.launch(**({'args':['--no-sandbox']} if engine==pw.chromium else {}))
            for viewport in ({'width':375,'height':812},{'width':360,'height':640}):
                # Pre-rain means no optional first looks; 1st chapter practice survives.
                context,page,errors=open_game(browser,BASE,viewport)
                assert page.evaluate('Chapter2Rain.statusFor(GameFlow.progress())')=='pending'
                assert page.evaluate('Chapter2FirstLook.statusFor("gate-town")') is None
                for region in IDS:
                    button=place_sheet(page,region)
                    assert button.count()==0
                    assert page.locator('#worldPlaceGo').inner_text()=='다시 연습하기'
                    page.locator('#worldPlaceClose').click()
                assert not errors,errors
                context.close()

                after={**BASE,
                    'seenStories':BASE['seenStories']+['chapter2-rain-opening'],
                    'completedMilestones':BASE['completedMilestones']+['chapter2-rain-passed']}
                context,page,errors=open_game(browser,after,viewport)
                assert page.evaluate('Chapter2Rain.statusFor(GameFlow.progress())')=='complete'
                order=['market-town','workshop-town','gate-town']
                for index,region in enumerate(order):
                    storyId=IDS[region]
                    button=place_sheet(page,region)
                    assert button.count()==1
                    assert '달라진 풍경 살펴보기' in button.inner_text()
                    assert page.locator('#worldPlaceGo').inner_text()=='다시 연습하기'
                    assert button.bounding_box()['height']>=44
                    before=page.evaluate('GameFlow.progress()')
                    button.click()
                    page.locator('#storyView').wait_for(state='visible')
                    beats=5 if region=='market-town' else 4
                    assert page.locator('#storyCount').inner_text()==f'1 / {beats}'
                    assert page.locator('#storyZh').inner_text().strip()
                    assert page.locator('#storyKo').is_hidden()
                    assert page.locator('#storyScene').get_attribute('data-spatial-story-place-id')==region
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
                    if index==0:
                        page.screenshot(path=str(OUT/f'chapter2-p1-story-{engine.name}-{viewport["width"]}x{viewport["height"]}.png'),full_page=True)
                    page.locator('#storyTranslate').click()
                    assert page.locator('#storyKo').is_visible()
                    for _ in range(beats): page.locator('#storyNext').click()
                    page.locator('#worldView').wait_for(state='visible')
                    progress=page.evaluate('GameFlow.progress()')
                    assert storyId in progress['seenStories']
                    assert set(progress['completedStages'])==set(before['completedStages'])
                    assert set(progress['completedMilestones'])==set(before['completedMilestones'])
                    assert progress['seenStories'].count(storyId)==1
                    assert all(otherId not in progress['seenStories']
                        for otherRegion,otherId in IDS.items()
                        if otherRegion not in order[:index+1])
                    button=place_sheet(page,region)
                    assert '다시 돌아보기' in button.inner_text()
                    saved=page.evaluate("localStorage.getItem(%s)"%json.dumps(KEY))
                    button.click()
                    page.locator('#storySkip').click()
                    page.locator('#worldView').wait_for(state='visible')
                    assert page.evaluate("localStorage.getItem(%s)"%json.dumps(KEY))==saved
                page.evaluate('GameFlow.showJourney()')
                for region,storyId in IDS.items():
                    node=page.locator('.journeyNode[data-node-id="story:'+storyId+'"]')
                    assert node.count()==1
                    assert node.get_attribute('data-state')=='complete'
                page.evaluate('GameFlow.showWorld()')
                # One existing core practice still opens its original stage list, not P1.
                place_sheet(page,'gate-town')
                page.locator('#worldPlaceGo').click()
                page.locator('#journeyView').wait_for(state='visible')
                assert page.locator('[data-journey-region-id="gate-town"]').count()>=1
                assert not errors,errors
                context.close()

                # Old saves with later optional activity already past the one-off rain.
                legacy={**BASE,'seenStories':BASE['seenStories']+['first-free-quest-accepted']}
                context,page,errors=open_game(browser,legacy,viewport)
                assert page.evaluate('Chapter2Rain.statusFor(GameFlow.progress())')=='legacy'
                assert place_sheet(page,'workshop-town').count()==1
                assert not errors,errors
                context.close()
            browser.close()
finally:
    server.shutdown()
print('PASS: P1 optional 3 sightings, order, replay, legacy, no core regression; Chromium/WebKit 375x812 and 360x640')
