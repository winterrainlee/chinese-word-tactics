"""Optional 03A: discovery, comparison, application, persistence and late visits."""
from tower_browser_helpers import solve
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
        for width, height in [(375, 812), (375, 667), (375, 640), (360, 640)]:
            page = browser.new_page(viewport={'width': width, 'height': height}, is_mobile=True, has_touch=True)
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            late = height == 640
            seed = {
                'seenStories': ['chapter1-room-finale', 'academic-tower-arrival', 'academic-tower-turn-intro', 'academic-tower-turn-before-faner'],
                'completedStages': ['stage-5', 'academic-tower-turn-01-que', 'academic-tower-turn-02-raner', 'academic-tower-turn-03-expectation'],
                'completedMilestones': ['chapter1-complete', 'academic-tower-entered'],
                'acknowledgedNodes': [], 'stageOutcomes': {}, 'lastLocation': {'view': 'world'}
            }
            if late:
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
            assert page.locator('#storyView').is_visible()
            assert int(page.locator('#storyCount').inner_text().split('/')[1])==4
            assert ('남겨 둔 칸' in page.locator('#storyKo').text_content()) == late
            page.locator('#storyNext').click();page.locator('#storyNext').click()
            assert page.locator('#storyPortrait').get_attribute('data-speaker')=='towerResearcher'
            assert '如此' in page.locator('#storyZh').inner_text()
            page.locator('#storyTranslate').click()
            assert page.locator('#storyKo').is_visible()
            assert '그러하다·그렇게' in page.locator('#storyKo').inner_text()
            page.screenshot(path=f'/tmp/academic-tower-ran-researcher-{width}x{height}.png',full_page=True)
            page.locator('#storyPrev').click()
            assert page.locator('#storyKo').is_hidden()
            page.locator('#storyPrev').click()
            page.screenshot(path=f'/tmp/academic-tower-ran-story-{width}x{height}.png',full_page=True)
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
            assert page.evaluate('state.academicTower.phase') == 'work'
            assert page.locator('#storyView').is_hidden()
            assert page.locator('[data-academic-action="start-compare"]').count()==0
            assert page.locator('[data-academic-action="select-character"]').count()==0
            layout()
            assert page.locator('.academicVerdictTitle').count() == 0
            assert '기록과 맞아' not in page.locator('#grid').inner_text()
            tasks=page.evaluate('current().academicTower.tasks')
            for i,task in enumerate(tasks):
                if task.get('characterGuide'):
                    assert task['characterGuide']['clue'] in page.locator('#grid').inner_text()
                    assert task['characterGuide']['meaning'] in page.locator('#grid').inner_text()
                else:
                    assert page.locator('.academicCharacterGuide').count()==0
                if i==0:
                    before_help=page.evaluate('state.academicTower')
                    page.locator('[data-mvp-detail="ran-intro"] summary').click()
                    assert '연구원' in page.locator('[data-mvp-detail="ran-intro"]').inner_text()
                    page.locator('[data-mvp-detail="ran-intro"] summary').click()
                    assert page.evaluate('state.academicTower')==before_help
                    page.screenshot(path=f'/tmp/academic-tower-ran-guide-{width}x{height}.png',full_page=True)
                if task.get('type')=='read':
                    assert page.locator('.academicObservation').count()==1
                    assert page.locator('[data-academic-zone="work"]').count()==0
                    assert '나의 해석' not in page.locator('#grid').inner_text()
                    assert page.locator('.academicVerdictTitle').count()==0
                    assert page.locator('[data-academic-action].selected').count()==0
                else:
                    assert page.locator('[data-academic-zone="work"]').count()==1
                assert page.locator('[data-academic-action="meaning-slot"]').count()==0
                assert page.locator('[data-academic-action="meaning-source"]').count()==0
                if i==1:
                    saved=page.evaluate('state.academicTower')
                    page.reload();page.wait_for_function('!!window.AcademicTowerRuntime');assert page.evaluate('GameFlow.resume()')
                    assert page.evaluate('state.academicTower')==saved
                if task.get('relations'):
                    wrong=next(r['id'] for r in task['relations'] if r['id']!=task['relation'])
                    action('meaning-relation',wrong);action('meaning-confirm')
                    assert page.locator('.academicMvpFeedback').get_attribute('data-verdict')=='incorrect'
                    action('meaning-relation',task['relation']);page.locator('#undoBtn').click()
                    assert page.evaluate('state.academicTower.relation')==wrong
                    action('meaning-relation',task['relation'])
                layout();action('meaning-confirm')
                if task.get('type')=='read':
                    assert page.evaluate('state.academicTower.taskIndex')==i+1
                else:
                    assert page.locator('.academicMvpFeedback').get_attribute('data-verdict')=='correct'
                    if i<len(tasks)-1:action('meaning-next')
            page.locator('[data-mvp-detail="observations"] summary').click()
            assert page.locator('[data-mvp-detail="observations"] p').count()==9
            assert not page.locator('#flowNext').is_visible()
            action('finish-mvp'); page.locator('#flowNext').click(); story()
            page.locator('#academicTowerView').wait_for(state='visible')
            progress = page.evaluate('GameFlow.progress()')
            assert STAGE in progress['completedStages']
            assert page.evaluate("LexiconRuntime.isDiscovered('既然') && LexiconRuntime.isDiscovered('不然')")
            assert ('academic-tower-turn-foundation' in progress['completedMilestones']) == late
            before = page.evaluate('localStorage.getItem("chinese-word-tactics-journey-v1")')
            page.locator(f'[data-room-id="{STAGE}"]').click()
            assert page.locator('#storyView').is_visible()
            assert page.locator('#storySkip').is_visible()
            page.locator('#storySkip').click()
            assert page.evaluate('state.academicTower.phase') == 'work'
            assert page.evaluate('state.academicTower.selectedCharacter') == {}
            assert page.evaluate('state.academicTower.answers') == {}
            assert page.locator('[data-academic-action].selected').count() == 0
            assert page.evaluate('localStorage.getItem("chinese-word-tactics-journey-v1")') == before
            page.evaluate('GameFlow.showJourney()')
            page.evaluate("document.querySelectorAll('#journeyList details').forEach(e=>e.open=true)")
            page.locator(f'.journeyNode[data-node-id="stage:{STAGE}"]').click()
            assert page.evaluate('stageSession.mode') == 'replay'
            assert page.locator('#storyView').is_visible()
            story()
            assert page.evaluate('state.academicTower.phase') == 'work'
            assert page.evaluate('state.academicTower.selectedCharacter') == {}
            assert page.locator('[data-academic-action].selected').count() == 0
            solve(page)
            assert page.evaluate('state.academicTower.phase') == 'complete'
            page.evaluate('GameFlow.showJourney()')
            page.reload();page.wait_for_function('!!window.AcademicTowerRuntime')
            page.evaluate('GameFlow.showJourney()')
            page.evaluate("document.querySelectorAll('#journeyList details').forEach(e=>e.open=true)")
            page.locator(f'.journeyNode[data-node-id="stage:{STAGE}"]').click()
            assert page.locator('#storyView').is_visible()
            story()
            assert page.evaluate('state.academicTower.phase') == 'work'
            assert page.evaluate('state.academicTower.answers') == {}
            assert page.locator('[data-academic-action].selected').count() == 0
            page.locator('#resetBtn').click()
            assert page.evaluate('state.academicTower.selectedCharacter') == {}
            assert page.locator('[data-academic-action].selected').count() == 0

            page.evaluate("GameFlow.playStage('academic-tower-turn-04-faner')")
            assert ('이번에는 然이 없' in page.locator('#grid').inner_text()) == (not late)
            assert not errors, errors
            page.close()
        browser.close()
finally:
    server.shutdown()
print('PASS: optional 03A discovery, error focus, seven comparisons, applications, resume, late visit and replay across four viewports.')
