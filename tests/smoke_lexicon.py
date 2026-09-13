"""375x812 browser smoke for the standalone comparison-first word book.

Requires Python Playwright and Chromium.
Run: python tests/smoke_lexicon.py
Optional: CHROMIUM_PATH=/path/to/chromium TEST_OUTPUT=/path/to/screenshots
"""
import http.server
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-lexicon'))
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

def assert_touch_targets(page, selector):
    targets = page.locator(selector).evaluate_all('''nodes => nodes.filter(node => { const style=getComputedStyle(node), box=node.getBoundingClientRect(); return style.display!=='none'&&style.visibility!=='hidden'&&box.width&&box.height; }).map(node => { const box=node.getBoundingClientRect(); return {text:node.textContent.trim(),width:box.width,height:box.height}; })''')
    assert targets, selector
    assert all(item['width'] >= 44 and item['height'] >= 44 for item in targets), targets

try:
    with sync_playwright() as pw:
        executable = os.environ.get('CHROMIUM_PATH')
        launch = {'args':['--no-sandbox']}
        if executable: launch['executable_path'] = executable
        browser = pw.chromium.launch(**launch)
        context = browser.new_context(viewport={'width':375,'height':812},device_scale_factor=1,is_mobile=True,has_touch=True)
        page = context.new_page(); page.set_default_timeout(5000)
        errors, missing = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: missing.append(response.url) if response.status >= 400 and 'favicon' not in response.url else None)
        page.goto(url)
        page.wait_for_function('!!window.GameFlow && !!window.LexiconRuntime && !!window.TacticalGame')

        # The compact in-stage sheet remains useful, but can jump into the full word entry.
        page.evaluate('TacticalGame.playStage("market-stage-4",{mode:"replay",returnTo:"journey"})')
        page.locator('.wordbtn', has_text='買').click()
        bridge = page.locator('[data-open-lexicon-word="買"]')
        assert bridge.is_visible()
        assert_touch_targets(page, '[data-open-lexicon-word="買"]:visible, .sheetactions button:visible')
        bridge.click()
        assert page.locator('#wordsView').is_visible()
        assert page.locator('#wordsTitle').inner_text() == '買'
        assert '我買了一份菜。' in page.locator('#wordsContent').inner_text()
        page.screenshot(path=str(OUT/'lexicon-00-quick-sheet-bridge-375x812.png'),full_page=True)
        page.evaluate('GameFlow.showJourney()')

        # Simulate words actually encountered in several stages. Later words must remain hidden.
        page.evaluate('''() => {
          ['stage-1','stage-3','gate-stage-1','gate-stage-3','workshop-stage-2','market-stage-4']
            .forEach(id => LexiconRuntime.visitStage(id));
          GameFlow.showWords();
        }''')
        assert page.locator('#wordsView').is_visible()
        assert not page.locator('#scrim').evaluate('(el)=>el.classList.contains("open")')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert page.locator('.lexiconRegionCard').count() == 3
        region_text = page.locator('.lexiconRegionList').inner_text()
        for name in ['길목','장인골','장터']: assert name in region_text
        assert '발견 3 / 15' in page.locator('[data-lexicon-region="market-town"]').inner_text()
        assert_touch_targets(page, '.lexiconRegionCard:visible, .flowNav button:visible, .iconbtn:visible')
        page.screenshot(path=str(OUT/'lexicon-01-home-375x812.png'),full_page=True)

        page.locator('[data-lexicon-region="market-town"]').click()
        assert page.locator('#wordsChapterBar').is_hidden()
        assert page.locator('[data-lexicon-group="market-buy-sell"]').is_visible()
        assert page.locator('[data-lexicon-group="market-price-value"]').is_visible()
        # 價值 belongs to a future stage, so the Chinese word itself must not leak yet.
        assert '價值' not in page.locator('#wordsContent').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert_touch_targets(page, '.lexiconGroupCard:visible, .lexiconAllButton:visible, .iconbtn:visible')
        page.screenshot(path=str(OUT/'lexicon-02-market-groups-375x812.png'),full_page=True)

        page.locator('[data-lexicon-group="market-buy-sell"]').click()
        comparison = page.locator('#wordsContent').inner_text()
        assert '買' in comparison and '賣' in comparison
        assert '같은 거래를 구매자 쪽에서 보면 買, 판매자 쪽에서 보면 賣' in comparison
        assert_touch_targets(page, '.lexiconCompareWord:visible, .lexiconRelated button:visible, .iconbtn:visible')
        page.screenshot(path=str(OUT/'lexicon-03-comparison-375x812.png'),full_page=True)

        page.locator('[data-lexicon-word="買"]').first.click()
        detail = page.locator('#wordsContent').inner_text()
        assert 'ㄇㄞˇ' in detail and '사다, 구입하다' in detail
        assert '我買了一份菜。' in detail and '나는 채소 한 몫을 샀다.' in detail
        assert '장터 · 오늘 저녁거리' in detail
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(OUT/'lexicon-04-word-detail-375x812.png'),full_page=True)

        page.locator('#wordsSearchBtn').click()
        search = page.locator('#lexiconSearchInput')
        search.fill('가격')
        assert page.locator('#lexiconSearchResults [data-lexicon-word="價格"]').count() == 1
        assert page.locator('#lexiconSearchResults [data-lexicon-word="價值"]').count() == 0
        search.fill('ㄐㄧㄚˋㄍㄜˊ')
        assert page.locator('#lexiconSearchResults [data-lexicon-word="價格"]').count() == 1
        assert_touch_targets(page, '.lexiconWordRow:visible, .iconbtn:visible')
        page.screenshot(path=str(OUT/'lexicon-05-search-375x812.png'),full_page=True)

        page.locator('#wordsView [data-flow="journey"]').click()
        assert page.locator('#journeyView').is_visible()
        assert not page.locator('#wordsView').is_visible()

        assert not errors, errors
        assert not missing, missing
        context.close(); browser.close()
finally:
    server.shutdown()

print(f'PASS: mobile lexicon browser smoke. Screenshots: {OUT}')
