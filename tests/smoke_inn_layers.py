"""Isolated lobby art comparison: mobile interaction, shared fixtures, zero storage writes."""
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/inn-layer-evidence'))
OUT.mkdir(parents=True, exist_ok=True)
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
    def translate_path(self, path):
        path = path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        return str(ROOT / path[len(prefix):]) if path.startswith(prefix) else str(ROOT / '__missing__')
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/inn-layer-test/'
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=['--no-sandbox'])
        for w,h in [(375,812),(360,640)]:
            ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=1)
            page=ctx.new_page(); errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.add_init_script("window.__writes=[];for(const k of ['setItem','removeItem','clear']){const f=Storage.prototype[k];Storage.prototype[k]=function(...a){window.__writes.push(k);return f.apply(this,a)}}")
            page.goto(base);page.locator('#scene[data-ready="true"]').wait_for()
            background=page.locator('[data-object-id="inn.lobby.structure"]').element_handle()
            background_src=background.get_attribute('src')
            for n in [0,1,3,7,6,2,4,5,0]:
                page.locator('#dev > summary').tap()
                for key,bit in [('board',1),('rain',2),('newQuest',4)]:page.locator('#state-'+key).set_checked(bool(n&bit))
                page.locator('#dev > summary').tap()
                for obj,expected in [('board',bool(n&1)),('notice.first',bool(n&1)),('notice.new',bool(n&1 and n&4)),('rain.water',bool(n&2)),('rain.belongings',bool(n&2))]:
                    assert page.locator('[data-object-id="inn.lobby.'+obj+'"]').is_visible()==expected,(w,n,obj)
                assert background.evaluate('(e)=>e.isConnected') and background.get_attribute('src')==background_src
                for hit in page.locator('.hotspot:visible').all():
                    r=hit.bounding_box();assert min(r['width'],r['height'])>=44,(w,n,r)
                    assert hit.evaluate('(e)=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}'),(w,n,hit.get_attribute('data-interaction'))
                page.screenshot(path=str(OUT/f'inn-layer-{n}-{w}x{h}.png'),full_page=True)
            page.locator('[data-interaction="keeper"]').tap();page.locator('.translate').tap()
            assert page.locator('#ko').is_visible() and page.locator('#scene').is_visible()
            page.locator('.next').tap();assert not page.locator('#ko').is_visible()
            for target in ['table','pot','cup','ledger']:
                page.locator('[data-interaction="'+target+'"]').tap();assert page.locator('#closeTalk').is_visible()
            page.locator('#dev > summary').tap()
            for key in ['board','rain','newQuest']:page.locator('#state-'+key).check()
            page.locator('#dev > summary').tap()
            page.locator('[data-interaction="board"]').tap();assert '毛巾' in page.locator('#zh').inner_text()
            page.locator('#dev > summary').tap();page.locator('#state-board').uncheck();page.locator('#dev > summary').tap()
            assert not page.locator('#closeTalk').is_visible()
            for target in ['wet','water']:page.locator('[data-interaction="'+target+'"]').tap()
            page.locator('#dev > summary').tap();page.locator('.devbody details > summary').tap()
            page.locator('#layerChecks [data-key="people"]').uncheck()
            assert not page.locator('[data-object-id="inn.lobby.keeper"]').is_visible()
            page.locator('#layerChecks [data-key="foreground"]').uncheck()
            assert not page.locator('[data-object-id="inn.lobby.counter-front"]').is_visible()
            page.locator('#objectChecks [data-key="inn.lobby.teapot"]').uncheck()
            assert not page.locator('[data-interaction="pot"]').is_visible()
            page.locator('#restoreLayers').tap();page.locator('#dev > summary').tap()
            page.locator('[data-interaction="stairs"]').tap()
            page.wait_for_function('document.querySelector("#innRoomBackdrop")?.dataset.loaded==="true"')
            page.locator('#hotspot-bed').tap();assert page.locator('#sheet').is_visible()
            page.locator('#innRoomWordClose').tap();page.locator('#hotspot-door').tap()
            page.locator('#lobbyView').wait_for(state='visible')
            page.locator('#dev > summary').tap();page.locator('#focusStory').tap()
            page.locator('#storyTranslate').tap();assert page.locator('#storyKo').is_visible()
            page.locator('#storyNext').tap();page.locator('#storyNext').tap()
            page.locator('#lobbyView').wait_for(state='visible');page.locator('#dev > summary').tap()
            page.locator('[data-interaction="door"]').tap();assert page.locator('#outsideView').is_visible()
            page.locator('#reenter').tap();page.locator('#lobbyView').wait_for(state='visible')
            assert not page.evaluate('window.__writes'),page.evaluate('window.__writes')
            assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
            assert not errors,errors
            ctx.close()
        browser.close()
finally:
    server.shutdown()
print('Inn layers: all 8 combinations × 2 mobile viewports; alpha assets, touch ordering, layer/object toggles, room/story/outside, zero storage writes passed.')
