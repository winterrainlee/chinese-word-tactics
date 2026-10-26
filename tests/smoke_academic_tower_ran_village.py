"""03B: a packed-lunch visit, four distinct semantic judgments, and two reading-only beats."""
import http.server
import json
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright
from tower_browser_helpers import action, finish_story

ROOT = Path(__file__).resolve().parents[1]
STAGE = "academic-tower-turn-03b-ran-village"

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
    def translate_path(self, path):
        return str(ROOT / path.split('?', 1)[0].removeprefix('/chinese-word-tactics/'))

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(args=['--no-sandbox'])
        for width,height in [(375,812),(375,667),(375,640),(360,640)]:
            page = browser.new_page(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            late = height == 640
            seed = {
                'seenStories': ['chapter1-room-finale','academic-tower-arrival',
                                'academic-tower-turn-intro','academic-tower-ran-intro','academic-tower-ran-result'],
                'completedStages': ['stage-5','academic-tower-turn-01-que',
                                    'academic-tower-turn-02-raner','academic-tower-turn-03-expectation',
                                    'academic-tower-turn-03a-ran-family'],
                'completedMilestones': ['chapter1-complete','academic-tower-entered'],
                'acknowledgedNodes': [],'stageOutcomes':{},'lastLocation':{'view':'world'}
            }
            if late:
                seed['completedStages'] += ['academic-tower-turn-04-faner','academic-tower-turn-05-synthesis']
                seed['completedMilestones'].append('academic-tower-turn-foundation')
                seed['seenStories'].append('academic-tower-turn-result')
            page.add_init_script("if (!localStorage.getItem('chinese-word-tactics-journey-v1')) localStorage.setItem('chinese-word-tactics-journey-v1',"+
                                 json.dumps(json.dumps(seed))+");")
            page.goto(f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/')
            page.wait_for_function('!!window.AcademicTowerRuntime')
            assert page.evaluate("GameFlow.enterRegion('academic-tower')")
            room=page.locator(f'[data-room-id="{STAGE}"]')
            assert room.get_attribute('data-state') == 'available'
            assert '03B' not in room.inner_text()
            assert room.get_attribute('aria-label').startswith('옛 지도, 지금의 마을')
            room.click()
            assert page.locator('#storyView').is_visible()
            assert int(page.locator('#storyCount').inner_text().split('/')[1]) == 15
            assert '飯盒' in page.locator('#storyZh').inner_text()
            finish_story(page)
            page.wait_for_function('(id)=>TacticalGame.stageId()===id',arg=STAGE)
            assert page.evaluate('state.academicTower.phase') == 'work'
            assert page.evaluate('state.academicTower.taskIndex') == 0

            def layout():
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                assert page.locator('#grid').evaluate('el=>el.scrollWidth<=el.clientWidth+1')
                assert page.locator('#grid [data-academic-action]').evaluate_all(
                    'buttons=>buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44})'
                )
            layout()
            assert page.locator('[data-academic-zone="original"]').count() == 1
            assert page.locator('[data-academic-zone="work"]').count() == 1
            assert '仍然' in page.locator('#grid').inner_text()
            assert page.locator('.academicVillageChoices button').count() == 3
            def wrong_then_right():
                task=page.evaluate('current().academicTower.tasks[state.academicTower.taskIndex]')
                candidates=task.get('targets') or task.get('relations')
                correct=task['answer']['to'] if task.get('targets') else task['relation']
                wrong=next(option['id'] for option in candidates if option['id']!=correct)
                select='meaning-source' if task.get('targets') else 'meaning-relation'
                action(page,select,wrong)
                layout()
                action(page,'meaning-confirm')
                assert page.evaluate('state.academicTower.phase') == 'work'
                assert page.locator('.academicMvpFeedback').get_attribute('data-verdict') == 'incorrect'
                before=page.evaluate('state.academicTower')
                page.reload()
                page.wait_for_function('!!window.AcademicTowerRuntime')
                assert page.evaluate('GameFlow.resume()')
                assert page.evaluate('state.academicTower') == before
                action(page,select,correct)
                action(page,'meaning-confirm')
                assert page.evaluate('state.academicTower.phase') == 'review'
                assert page.locator('.academicMvpFeedback').get_attribute('data-verdict') == 'correct'
                action(page,'meaning-next')

            wrong_then_right() # T1
            assert page.evaluate('state.academicTower.taskIndex') == 1
            assert page.locator('[data-academic-zone="work"]').count() == 0
            assert '突然' in page.locator('#grid').inner_text()
            assert '쪽지 펼치기' in page.locator('#academicMvpConfirm').inner_text()
            layout();action(page,'meaning-confirm') # T2 read-only
            assert page.evaluate('state.academicTower.taskIndex') == 2
            assert page.locator('[data-academic-zone="work"]').count() == 1
            wrong_then_right() # T3
            assert page.evaluate('state.academicTower.taskIndex') == 3
            assert '固然' in page.locator('#grid').inner_text()
            wrong_then_right() # T4
            assert page.evaluate('state.academicTower.taskIndex') == 4
            assert '不盡然' in page.locator('#grid').inner_text()
            wrong_then_right() # T5
            assert page.evaluate('state.academicTower.taskIndex') == 5
            assert page.locator('[data-academic-zone="work"]').count() == 0
            assert page.locator('[data-academic-zone="original"]').count() == 1
            layout();action(page,'meaning-confirm') # T6 joint reread
            assert page.evaluate('state.academicTower.phase') == 'complete'
            assert page.locator('#academicMvpConfirm').inner_text().startswith('완성 기록 확인')
            action(page,'finish-mvp')
            assert page.locator('#flowNext').is_visible()
            page.locator('#flowNext').click()
            assert page.locator('#storyView').is_visible()
            assert int(page.locator('#storyCount').inner_text().split('/')[1]) == 10
            finish_story(page)
            page.locator('#academicTowerView').wait_for(state='visible')
            progress=page.evaluate('GameFlow.progress()')
            assert STAGE in progress['completedStages']
            assert ('academic-tower-turn-foundation' in progress['completedMilestones']) == late
            assert page.evaluate("['仍然','突然','當然','固然','不盡然'].every(w=>LexiconRuntime.isDiscovered(w))")
            before=page.evaluate("localStorage.getItem('chinese-word-tactics-journey-v1')")
            page.locator(f'[data-room-id="{STAGE}"]').click()
            assert page.locator('#storyView').is_visible()
            assert page.locator('#storySkip').is_visible()
            page.locator('#storySkip').click()
            assert page.evaluate('state.academicTower.taskIndex') == 0
            assert page.evaluate('state.academicTower.answers') == {}
            assert page.evaluate("localStorage.getItem('chinese-word-tactics-journey-v1')") == before
            assert not errors,errors
            page.close()
        browser.close()
finally:
    server.shutdown()
print('PASS: 03B packed lunch story, 4 decisions, 2 reading steps, save/replay and four viewports.')
