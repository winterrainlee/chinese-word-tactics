"""03B: separate portrait stories from research, preserve mid-scene save/replay."""
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
                work=page.locator('[data-academic-zone="work"]')
                assert work.locator(':scope > .academicRegionLabel').inner_text() == task['workLabel']
                assert work.locator(':scope > .academicTaskTitle').inner_text() == task['question']
                assert work.get_attribute('data-academic-work-kind') == task['workKind']
                assert page.locator('#academicMvpConfirm').inner_text() == task['confirmLabel']
                assert '나의 해설 초안' not in work.inner_text()
                if task.get('sourceLabel'):
                    assert page.locator('[data-academic-zone="original"] > .academicRegionLabel').inner_text() == task['sourceLabel']
                if task.get('workContext'):
                    assert work.locator('.academicVillageWorkContext').inner_text() == task['workContext']
                else:
                    assert work.locator('.academicVillageWorkContext').count() == 0
                if task.get('choicePrefix'):
                    preview=work.locator('.academicVillageSentence')
                    assert preview.count() == 1
                    assert task['prefixLabel'] in preview.inner_text()
                    assert task['choicePrefix']+'＿＿' in preview.inner_text()
                    assert work.locator('.academicMvpPreview.academicVillagePreview').count() == 0
                if task.get('draft'):
                    assert task['draftLabel'] in work.locator('.academicVillageDraft').inner_text()
                    assert '결론은 아니야' in work.locator('.academicVillageWorkContext').inner_text()
                candidates=task.get('targets') or task.get('relations')
                correct=task['answer']['to'] if task.get('targets') else task['relation']
                wrong=next(option['id'] for option in candidates if option['id']!=correct)
                select='meaning-source' if task.get('targets') else 'meaning-relation'
                action(page,select,wrong)
                if task.get('choicePrefix'):
                    preview=page.locator('.academicVillageSentence')
                    bad_text=next(option['text'] for option in candidates if option['id']==wrong)
                    assert task['choicePrefix']+bad_text in preview.inner_text()
                    assert preview.count() == 1
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
                if task.get('choicePrefix'):
                    correct_text=next(option['text'] for option in candidates if option['id']==correct)
                    assert task['choicePrefix']+correct_text in page.locator('.academicVillageSentence').inner_text()
                    assert page.locator('.academicMeaningRelation').count() == 0, 'do not duplicate the completed line'
                if task.get('draft'):
                    assert page.locator('.academicVillageDraft del').count() == 1
                    assert task['correction'] in page.locator('[data-academic-zone="work"]').inner_text()
                action(page,'meaning-next')

            wrong_then_right() # T1 -> portrait story with 突然
            assert page.evaluate('state.academicTower.taskIndex') == 1
            assert page.evaluate('state.academicTower.phase') == 'scene'
            assert page.evaluate('state.academicTower.sceneId') == 'paper'
            assert page.locator('#storyView').is_visible()
            assert not page.locator('#tutorialView').is_visible()
            assert page.locator('#storyCount').inner_text() == '1 / 5'
            assert page.locator('#storyPortrait').is_visible()
            assert page.evaluate("""StoryPronunciation.readingFor(
              'academic-tower-03b-scene-paper',
              '研究員剛翻開地圖的一角，一張摺好的紙突然滑了出來。'
            ) !== null""")
            page.locator('#storyNext').click()
            assert page.locator('#storyCount').inner_text() == '2 / 5'
            assert '突然' in page.locator('#storyZh').inner_text()
            assert page.evaluate('state.academicTower.sceneIndex') == 1
            saved_scene = page.evaluate('state.academicTower')
            page.reload()
            page.wait_for_function('!!window.AcademicTowerRuntime')
            assert page.evaluate('GameFlow.resume()')
            assert page.locator('#storyView').is_visible()
            assert page.locator('#storyCount').inner_text() == '2 / 5'
            assert page.evaluate('state.academicTower') == saved_scene
            while page.locator('#storyView').is_visible():
                page.locator('#storyNext').click()
            assert page.evaluate('state.academicTower.taskIndex') == 2
            assert page.evaluate('state.academicTower.phase') == 'work'
            assert page.locator('[data-academic-zone="work"]').count() == 1
            assert page.locator('.academicVillageReaction').count() == 0
            wrong_then_right() # T3
            assert page.evaluate('state.academicTower.taskIndex') == 3
            assert '固然' in page.locator('#grid').inner_text()
            wrong_then_right() # T4 -> second portrait story
            assert page.evaluate('state.academicTower.taskIndex') == 4
            assert page.evaluate('state.academicTower.phase') == 'scene'
            assert page.evaluate('state.academicTower.sceneId') == 'market'
            assert page.locator('#storyView').is_visible()
            assert page.locator('#storyCount').inner_text() == '1 / 4'
            assert page.locator('#storyPortrait').is_visible()
            page.locator('#storyNext').click()
            page.locator('#storyNext').click()
            assert page.locator('#storyCount').inner_text() == '3 / 4'
            old_scene=page.evaluate('state.academicTower')
            page.reload();page.wait_for_function('!!window.AcademicTowerRuntime')
            assert page.evaluate('GameFlow.resume()')
            assert page.locator('#storyView').is_visible()
            assert page.locator('#storyCount').inner_text() == '3 / 4'
            assert page.evaluate('state.academicTower') == old_scene
            while page.locator('#storyView').is_visible():
                page.locator('#storyNext').click()
            assert page.evaluate('state.academicTower.taskIndex') == 4
            assert page.evaluate('state.academicTower.phase') == 'work'
            assert '不盡然' in page.locator('#grid').inner_text()
            assert page.locator('.academicVillageReaction').count() == 0
            wrong_then_right() # T5
            assert page.evaluate('state.academicTower.taskIndex') == 5
            assert page.evaluate('state.academicTower.phase') == 'work'
            assert page.locator('[data-academic-zone="original"]').count() == 1
            assert page.locator('[data-academic-zone="work"]').count() == 1
            assert page.locator('[data-academic-zone="original"] > .academicRegionLabel').inner_text() == '기록의 근거'
            assert page.locator('[data-academic-zone="work"] > .academicRegionLabel').inner_text() == '두 사람의 공동 연구 기록'
            assert page.locator('[data-academic-zone="work"]').get_attribute('data-academic-work-kind') == 'restore'
            assert page.locator('.academicVillageClozeLine').count() == 5
            assert page.locator('.academicVillageClozeSection').all_inner_texts() == [
                '연구실에서 있었던 일', '옛 쪽지 · 작성자 미상의 주장',
                '소년과 연구원의 공동 해설'
            ]
            assert page.locator('.academicVillageClozeSentence').count() == 5
            assert page.locator('.academicVillageClozeBlank').count() == 5
            assert page.locator('.academicVillageClozeTools small').inner_text() == '0 / 5 칸 채움'
            assert page.locator('.academicVillageClozeDropdown').count() == 0
            assert page.locator('.academicVillageClozeOption').count() == 0
            assert page.locator('.academicVillageClozeBank').count() == 0
            assert page.locator('.academicVillageClozeReset').is_disabled()
            assert page.locator('#academicMvpConfirm').is_disabled()
            assert '突然' not in page.locator('[data-academic-zone="original"]').inner_text()
            assert page.locator('.academicVillageClozeLine[data-village-blank-id="claim"]').inner_text().count('「') == 1
            assert page.locator('.academicVillageClozeBlank.selected').count() == 0
            assert page.locator('.academicVillageClozeBlank[aria-expanded="false"]').count() == 5
            layout()

            # The blank is the trigger: one tap reveals all five terms just
            # under that sentence, without a duplicated footer word bank.
            action(page,'meaning-cloze-slot','incident')
            assert page.locator('.academicVillageClozeDropdown').count() == 1
            assert page.locator('.academicVillageClozeBlank[aria-expanded="true"]').count() == 1
            assert page.locator('.academicVillageClozeDropdown').get_attribute('data-village-dropdown-for') == 'incident'
            assert sorted(page.locator('.academicVillageClozeOption span').all_inner_texts()) == sorted([
                '仍然','突然','當然','固然','不盡然'
            ])
            assert page.locator('.academicVillageClozeOption').count() == 5
            assert page.locator('.academicVillageClozeOption').first.is_visible()
            layout()
            assert page.evaluate('state.academicTower.clozeMenuOpen') is True
            # Re-tapping the same blank, using "Close", or tapping elsewhere
            # dismisses without resetting any placed word.
            action(page,'meaning-cloze-slot','incident')
            assert page.locator('.academicVillageClozeDropdown').count() == 0
            action(page,'meaning-cloze-slot','incident')
            action(page,'meaning-cloze-close')
            assert page.locator('.academicVillageClozeDropdown').count() == 0
            action(page,'meaning-cloze-slot','incident')
            # Keyboard Escape closes even if focus remains on the blank trigger.
            assert page.locator('.academicVillageClozeBlank[aria-expanded="true"]').is_visible()
            page.keyboard.press('Escape')
            assert page.locator('.academicVillageClozeDropdown').count() == 0
            assert page.evaluate('state.academicTower.clozeMenuOpen') is False
            action(page,'meaning-cloze-slot','incident')
            page.locator('[data-academic-zone="original"] > .academicRegionLabel').click()
            assert page.locator('.academicVillageClozeDropdown').count() == 0
            assert page.evaluate('state.academicTower.placements') == {}

            # Save a menu that is open in the middle of the task.
            action(page,'meaning-cloze-slot','incident')
            saved=page.evaluate('state.academicTower')
            options_before=page.locator('.academicVillageClozeOption span').all_inner_texts()
            page.reload();page.wait_for_function('!!window.AcademicTowerRuntime')
            assert page.evaluate('GameFlow.resume()')
            assert page.evaluate('state.academicTower') == saved
            assert page.locator('.academicVillageClozeDropdown').count() == 1
            assert page.locator('.academicVillageClozeOption span').all_inner_texts() == options_before

            action(page,'meaning-cloze-place','仍然')
            assert page.locator('.academicVillageClozeDropdown').count() == 0
            action(page,'meaning-cloze-slot','claim')
            assert page.locator('.academicVillageClozeDropdown').get_attribute('data-village-dropdown-for') == 'claim'
            action(page,'meaning-cloze-place','突然')
            assert page.evaluate('state.academicTower.placements') == {'incident':'仍然','claim':'突然'}
            assert page.locator('.academicVillageClozeTools small').inner_text() == '2 / 5 칸 채움'
            saved=page.evaluate('state.academicTower')
            page.reload();page.wait_for_function('!!window.AcademicTowerRuntime')
            assert page.evaluate('GameFlow.resume()')
            assert page.evaluate('state.academicTower') == saved
            assert page.locator('.academicVillageClozeDropdown').count() == 0
            action(page,'meaning-cloze-reset')
            assert page.evaluate('state.academicTower.placements') == {}
            assert page.locator('.academicVillageClozeTools small').inner_text() == '0 / 5 칸 채움'
            assert page.locator('#academicMvpConfirm').is_disabled()

            # Fill all blanks, deliberately mixing up three words. Each blank
            # opens its own menu and closes as soon as a word is chosen.
            for word in ['仍然','突然','當然','固然','不盡然']:
                slot_id=page.evaluate('state.academicTower.slot')
                action(page,'meaning-cloze-slot',slot_id)
                assert page.locator('.academicVillageClozeDropdown').get_attribute('data-village-dropdown-for') == slot_id
                assert page.locator('.academicVillageClozeOption').count() == 5
                layout()
                action(page,'meaning-cloze-place',word)
                assert page.locator('.academicVillageClozeDropdown').count() == 0
            assert page.locator('.academicVillageClozeTools small').inner_text() == '5 / 5 칸 채움'
            assert page.locator('#academicMvpConfirm').is_enabled()
            layout()
            action(page,'meaning-confirm')
            assert page.evaluate('state.academicTower.phase') == 'work'
            assert page.evaluate('state.academicTower.lastCheck.step') == 'cloze'
            assert page.locator('.academicVillageClozeHint[data-verdict="incorrect"]').count() == 3
            assert page.locator('.academicVillageClozeHint[data-verdict="correct"]').count() == 2
            saved=page.evaluate('state.academicTower')
            page.reload();page.wait_for_function('!!window.AcademicTowerRuntime')
            assert page.evaluate('GameFlow.resume()')
            assert page.evaluate('state.academicTower') == saved
            assert page.locator('.academicVillageClozeHint[data-verdict="incorrect"]').count() == 3

            # Opening the dropdown does not erase feedback; choosing does.
            action(page,'meaning-cloze-slot','incident')
            assert page.locator('.academicVillageClozeHint[data-verdict="incorrect"]').count() == 3
            assert page.locator('[data-village-dropdown-for="incident"] [data-value="突然"] small').inner_text() == '자리 바꾸기'
            layout()
            action(page,'meaning-cloze-place','突然')
            assert page.evaluate('state.academicTower.placements.incident') == '突然'
            assert page.evaluate('state.academicTower.placements.claim') == '仍然'
            assert page.locator('.academicVillageClozeHint').count() == 0
            action(page,'meaning-cloze-slot','claim')
            assert page.locator('[data-village-dropdown-for="claim"] [data-value="當然"] small').inner_text() == '자리 바꾸기'
            action(page,'meaning-cloze-place','當然')
            assert page.evaluate('state.academicTower.placements.claim') == '當然'
            assert page.evaluate('state.academicTower.placements.continuity') == '仍然'
            assert page.locator('.academicVillageClozeBlank').count() == 5
            assert page.locator('.academicVillageClozeDropdown').count() == 0
            action(page,'meaning-confirm')
            assert page.evaluate('state.academicTower.phase') == 'complete'
            assert page.locator('.academicVillageClozeHint[data-verdict="correct"]').count() == 5
            assert page.locator('.academicVillageClozeDropdown').count() == 0
            assert page.locator('.academicVillageClozeFilled').count() == 5
            assert page.locator('.academicVillageClozeComplete').is_visible()
            assert page.locator('#academicMvpConfirm').inner_text().startswith('완성 기록 확인')
            action(page,'finish-mvp')
            assert page.locator('#flowNext').is_visible()
            page.locator('#flowNext').click()
            assert page.locator('#storyView').is_visible()
            assert int(page.locator('#storyCount').inner_text().split('/')[1]) == 11
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
            action(page,'meaning-relation','road-used')
            action(page,'meaning-confirm')
            action(page,'meaning-next')
            assert page.locator('#storyView').is_visible()
            assert page.locator('#storySkip').is_visible()
            page.locator('#storySkip').click()
            assert page.evaluate('state.academicTower.taskIndex') == 2
            assert page.evaluate("localStorage.getItem('chinese-word-tactics-journey-v1')") == before
            assert not errors,errors
            page.close()
        browser.close()
finally:
    server.shutdown()
print('PASS: 03B per-blank dropdowns, tap/close/swap, wrong-answer feedback, saved menu, replay and four viewports.')
