"""Isolated lobby art comparison: mobile interaction, shared fixtures, zero storage writes."""
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/inn-style-evidence'))
OUT.mkdir(parents=True, exist_ok=True)
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
    def translate_path(self, path):
        path = path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        return str(ROOT / path[len(prefix):]) if path.startswith(prefix) else str(ROOT / '__missing__')
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/inn-style-test/'
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=['--no-sandbox'])
        for w,h in [(375,812),(375,640),(390,844),(320,568)]:
            ctx = browser.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=1)
            page = ctx.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.add_init_script("""window.__writes=[];for(const k of ['setItem','removeItem','clear']){const original=Storage.prototype[k];Storage.prototype[k]=function(...args){window.__writes.push(k);return original.apply(this,args);};}""")
            page.goto(base)
            page.wait_for_function('document.querySelector("#backdrop").naturalWidth>0')
            for style in ['a','b','c']:
                page.locator(f'button[data-style="{style}"]').tap()
                page.wait_for_function('document.querySelector("#backdrop").complete && document.querySelector("#backdrop").naturalWidth>0')
                page.locator('[data-id="keeper"]').tap()
                page.locator('.translate').tap()
                assert page.locator('#ko').is_visible()
                first=page.locator('#zh').inner_text()
                page.screenshot(path=str(OUT/f'inn-{style}-{w}x{h}.png'),full_page=True)
                page.locator(f'button[data-style="{("b" if style=="a" else "a")}"]').tap()
                assert page.locator('#zh').inner_text()==first and page.locator('#ko').is_visible()
                page.locator('button[data-style="'+style+'"]').tap()
                page.locator('.next').tap()
                assert '謝謝' in page.locator('#zh').inner_text()
                assert not page.locator('#ko').is_visible()
                page.locator('[data-id="board"]').tap()
                assert '用完杯子' in page.locator('#zh').inner_text()
                page.locator('[data-id="table"]').tap()
                assert '一壺茶' in page.locator('#zh').inner_text()
                page.locator('[data-id="stairs"]').tap()
                page.wait_for_function('document.querySelector("#innRoomBackdrop")?.dataset.loaded==="true"')
                page.locator('#hotspot-bed').tap()
                assert page.locator('#sheet').is_visible()
                page.locator('#innRoomWordClose').tap()
                page.locator('#hotspot-door').tap()
                page.locator('#lobbyView').wait_for(state='visible')
                page.locator('#focusStory').tap()
                page.locator('#storyTranslate').tap()
                assert page.locator('#storyKo').is_visible()
                for _ in range(3): page.locator('#storyNext').tap()
                page.locator('#lobbyView').wait_for(state='visible')
                page.locator('[data-id="door"]').tap()
                page.locator('.next').tap()
                page.locator('#reenter').tap()
                page.locator('#lobbyView').wait_for(state='visible')
            assert not page.evaluate('window.__writes'), page.evaluate('window.__writes')
            assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
            for r in page.locator('.hotspot').evaluate_all('(es)=>es.map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height]})'):
                assert min(r)>=44, r
            assert not errors, errors
            ctx.close()
        browser.close()
finally:
    server.shutdown()
print('Inn art comparison: 3 styles × 4 viewports; room/story/board/table/door; no storage writes passed.')
