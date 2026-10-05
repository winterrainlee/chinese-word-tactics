"""Optional 03A: discovery, comparison, application, persistence and late visits."""
import http.server
import json
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
STAGE = 'academic-tower-turn-03a-ran-family'
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
    def translate_path(self, path):
        return str(ROOT / path.split('?', 1)[0].removeprefix('/chinese-word-tactics/'))

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--no-sandbox'])
        for width, height in [(375, 812), (390, 844), (430, 932), (360, 740)]:
            page = browser.new_page(viewport={'width': width, 'height': height}, is_mobile=True, has_touch=True)
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            late = width in (430, 360)
            seed = {
                'seenStories': ['chapter1-room-finale', 'academic-tower-arrival', 'academic-tower-turn-intro', 'academic-tower-turn-before-faner'],
                'completedStages': ['stage-5', 'academic-tower-turn-01-que', 'academic-tower-turn-02-raner', 'academic-tower-turn-03-expectation'],
                'completedMilestones': ['chapter1-complete', 'academic-tower-entered'],
                'acknowledgedNodes': [], 'stageOutcomes': {}, 'lastLocation': {'view': 'world'}
            }
            if width != 375:
                seed['completedStages'].append('academic-tower-turn-04-faner')
            if late:
                seed['completedStages'].append('academic-tower-turn-05-synthesis')
                seed['completedMilestones'].append('academic-tower-turn-foundation')
                seed['seenStories'].append('academic-tower-turn-result')
            page.add_init_script("if (!localStorage.getItem('chinese-word-tactics-journey-v1')) localStorage.setItem('chinese-word-tactics-journey-v1', " + json.dumps(json.dumps(seed)) + ");")
            page.goto(f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/')
            page.wait_for_function('!!window.AcademicTowerRuntime')
            page.evaluate("GameFlow.enterRegion('academic-tower')")
            room = page.locator(f'[data-room-id="{STAGE}"]')
            assert room.get_attribute('data-state') == 'available'
            assert '같은 然' not in room.inner_text()
            room.click()
            def story():
                for _ in range(int(page.locator('#storyCount').inner_text().split('/')[1])):
                    page.locator('#storyNext').click()
            story()
            page.wait_for_function('(id)=>TacticalGame.stageId()===id', arg=STAGE)
            def action(name, value=None):
                sel = f'[data-academic-action="{name}"]'
                if value is not None: sel += f'[data-value="{value}"]'
                page.locator(sel).click()
            def layout():
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                assert page.locator('#grid').evaluate('e=>e.scrollWidth <= e.clientWidth + 1')
                assert page.locator('[data-academic-action]').evaluate_all('els=>els.every(e=>{const r=e.getBoundingClientRect();return r.width>=44 && r.height>=44})')
            assert '같은 然' not in page.locator('#stageTitle').inner_text()
            assert ('남겨 둔 칸' in page.locator('#grid').inner_text()) == late
            for value in ['然而:而', '果然:然', '竟然:然']: action('select-character', value)
            action('submit-notice')
            assert page.evaluate('document.activeElement.dataset.value').startswith('然而:')
            assert page.locator('[data-academic-action="select-character"][data-verdict="incorrect"]').count() == 1
            action('select-character', '然而:然')
            layout()
            page.screenshot(path=f'/tmp/academic-tower-ran-notice-{width}.png', full_page=True)
            action('submit-notice')
            assert '같은 然' in page.locator('#stageTitle').inner_text()
            assert '怎麼又有' in page.locator('#grid').inner_text()
            action('start-compare')
            cards = page.evaluate('(id)=>STAGES.find(s=>s.id===id).academicTower.cards', STAGE)
            for i, card in enumerate(cards):
                if i == 1:
                    page.reload(); page.wait_for_function('!!window.AcademicTowerRuntime')
                    assert page.evaluate('GameFlow.resume()')
                    assert page.evaluate('state.academicTower.caseIndex') == 1
                    assert page.evaluate('state.academicTower.introVariant') == ('late' if late else 'early')
                action('select-position', 'last' if card['position'] == 'first' else 'first')
                wrong = next(o for o in card['options'] if o != card['relation'])
                action('select-ran-relation', wrong); action('submit-comparison')
                assert page.evaluate('document.activeElement.dataset.academicAction') == 'select-position'
                assert page.locator('[data-academic-action][data-verdict="incorrect"]').count() == 2
                action('select-position', card['position']); action('submit-comparison')
                assert page.evaluate('document.activeElement.dataset.academicAction') == 'select-ran-relation'
                assert page.locator('[data-academic-action="select-position"].selected').get_attribute('data-verdict') == 'correct'
                assert page.locator('[data-academic-action="select-ran-relation"].selected').get_attribute('data-verdict') == 'incorrect'
                action('select-ran-relation', card['relation'])
                layout()
                if i == 6: page.screenshot(path=f'/tmp/academic-tower-ran-compare-{width}.png', full_page=True)
                action('submit-comparison'); action('next-comparison')
            for wrong, correct in [('如果', '既然'), ('然後', '不然')]:
                action('select-ran-word', wrong); action('submit-ran-word')
                assert page.evaluate('document.activeElement.dataset.value') == wrong
                action('select-ran-word', correct)
                page.locator('#undoBtn').click()
                assert page.locator('[data-academic-action="select-ran-word"].selected').get_attribute('data-value') == wrong
                action('select-ran-word', correct)
                page.locator(f'[data-academic-word="{correct}"]').click()
                assert correct in page.locator('#sheet').inner_text()
                page.locator('#sheet .sheetactions button').click()
                layout(); action('submit-ran-word')
            assert not page.locator('#flowNext').is_visible()
            action('finish-mvp'); page.locator('#flowNext').click(); story()
            page.locator('#academicTowerView').wait_for(state='visible')
            progress = page.evaluate('GameFlow.progress()')
            assert STAGE in progress['completedStages']
            assert page.evaluate("LexiconRuntime.isDiscovered('既然') && LexiconRuntime.isDiscovered('不然')")
            assert ('academic-tower-turn-foundation' in progress['completedMilestones']) == late
            before = page.evaluate('localStorage.getItem("chinese-word-tactics-journey-v1")')
            page.locator(f'[data-room-id="{STAGE}"]').click()
            action('select-character', '然而:然')
            assert page.evaluate('localStorage.getItem("chinese-word-tactics-journey-v1")') == before
            if width == 375:
                page.evaluate("GameFlow.playStage('academic-tower-turn-04-faner')")
                assert '이번에는 然이 없' in page.locator('#grid').inner_text()
            assert not errors, errors
            page.close()
        browser.close()
finally:
    server.shutdown()
print('PASS: optional 03A discovery, error focus, seven comparisons, applications, resume, late visit and replay across four viewports.')
