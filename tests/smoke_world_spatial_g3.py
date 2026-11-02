"""G3: exact world/story/quest IDs share read-only spatial context, without UI changes."""
import http.server
import json
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
KEY='chinese-word-tactics-journey-v1'
seed={
    'seenStories':['chapter1-inn-convergence','chapter1-room-finale',
                   'chapter2-rain-opening','first-free-quest-accepted'],
    'completedStages':['stage-5'],
    'completedMilestones':['inn-unlocked','chapter1-complete','chapter2-rain-passed'],
    'acknowledgedNodes':[],
    'stageOutcomes':{},
    'lastLocation':{'view':'world'}
}
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_): pass
    def translate_path(self,path):
        path=path.split('?',1)[0]
        prefix='/chinese-word-tactics/'
        return str(ROOT/path[len(prefix):]) if path.startswith(prefix) else str(ROOT/'__missing__')

server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'
try:
    with sync_playwright() as pw:
        for engine in (pw.chromium,pw.webkit):
            browser=engine.launch(**({'args':['--no-sandbox']} if engine==pw.chromium else {}))
            context=browser.new_context(
                viewport={'width':375,'height':812},is_mobile=True,has_touch=True)
            context.add_init_script(
                "localStorage.setItem(%s,JSON.stringify(%s));" %
                (json.dumps(KEY),json.dumps(seed,ensure_ascii=False))
            )
            page=context.new_page()
            page.set_default_timeout(10000)
            errors=[]
            requests=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.on('request',lambda req:requests.append(req.url)
                if 'world-spatial-catalog-v0.1.json' in req.url else None)
            page.goto(url)
            page.wait_for_function('!!window.WorldSpatialContext && !!window.GameFlow')
            page.evaluate('GameFlow.showWorld()')
            marker=page.locator('.regionCard[data-region-id="gate-town"]')
            marker.wait_for(state='visible')
            page.wait_for_function("""document.querySelector(
                '.regionCard[data-region-id="gate-town"]')?.dataset.spatialPlaceId==='gate-town'""")
            assert marker.get_attribute('data-spatial-place-kind')=='district'
            assert page.locator('.regionCard[data-spatial-place-id]').count()==6
            assert page.locator('.regionCard[data-region-id="border-village"]').get_attribute('data-spatial-place-kind')=='outside-settlement'
            assert '물길마을' in page.locator('#worldView').inner_text()
            progress_before=page.evaluate("localStorage.getItem(%s)"%json.dumps(KEY))
            invisible=page.evaluate("""async () => {
              const g=WorldSpatialContext;
              const before=await g.place('academic-tower',GameFlow.progress());
              const after=await g.place('academic-tower',{
                ...GameFlow.progress(),sideResearchProgress:{
                  'academic-tower-turn-04a-er-family':{openingFound:true}}
              });
              const quest=await g.quest('north-forest-mushrooms',GameFlow.progress());
              return {unseen:before.observations.length,known:after.observations.map(x=>x.id),
                areaRegistered:quest.activityCatalogued,area:quest.activityPlaceId,
                restricted:(await g.planningRule('scenario:post-rain-border-travel')).active};
            }""")
            assert invisible=={
                'unseen':0,'known':['observation:04a-side-outlet'],
                'areaRegistered':False,'area':'north-forest','restricted':False
            }
            page.locator('.worldForestQuestMarker[data-spatial-quest-origin="inn"]').wait_for(state='visible')
            assert page.locator('.worldForestQuestMarker').get_attribute(
                'data-spatial-quest-area-catalogued')=='false'
            assert page.evaluate("localStorage.getItem(%s)"%json.dumps(KEY))==progress_before
            assert len(requests)==1,requests
            # The existing story scene uses a stable story ID, not its background to infer place.
            played=page.evaluate("""GameFlow.playStory('chapter2-rain-opening',{
                mode:'replay',returnTo:'world'})""")
            assert played is True
            page.locator('#storyScene[data-spatial-story-place-id="inn"]').wait_for(state='attached')
            assert page.locator('#storyTitle').inner_text()=='큰비가 내리던 밤'
            assert page.locator('#storyZh').is_visible()
            assert not errors,errors
            context.close()
            browser.close()

        # Failure is contained: map/region sheet still work if the new JSON is unavailable.
        browser=pw.chromium.launch(args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':375,'height':812},is_mobile=True,has_touch=True)
        context.add_init_script("localStorage.setItem(%s,JSON.stringify(%s));" %
                                (json.dumps(KEY),json.dumps(seed,ensure_ascii=False)))
        page=context.new_page()
        page.route('**/data/world-spatial-catalog-v0.1.json*',
                   lambda route:route.fulfill(status=503,body='temporary error'))
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(url)
        page.wait_for_function('!!window.GameFlow && !!window.WorldSpatialContext')
        page.evaluate('GameFlow.showWorld()')
        marker=page.locator('.regionCard[data-region-id="gate-town"]')
        marker.wait_for(state='visible')
        page.wait_for_timeout(200)
        assert marker.get_attribute('data-spatial-place-id') is None
        marker.click()
        assert page.locator('#sheet h2').inner_text()=='길목'
        assert page.locator('#worldView').is_visible()
        assert not errors,errors
        context.close()
        browser.close()
finally:
    server.shutdown()

print('PASS: G3 world/story/quest shared context, discovery gate, failed fetch, Chromium/WebKit')
