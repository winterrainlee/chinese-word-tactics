"""End-to-end mobile smoke for Academic Tower rooms 01 through 05."""
from tower_browser_helpers import solve
import http.server
import json
import os
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get("TEST_OUTPUT", "/tmp/chinese-word-tactics-tests"))
OUT.mkdir(parents=True, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, request_path):
        request_path = request_path.split("?", 1)[0]
        prefix = "/chinese-word-tactics/"
        return str(ROOT / (request_path[len(prefix):] if request_path.startswith(prefix) else "__missing__"))


def finish_story(page):
    total = int(page.locator("#storyCount").inner_text().split("/")[1].strip())
    for _ in range(total):
        page.locator("#storyNext").click()


def choose(page, action, value=None):
    selector = f'[data-academic-action="{action}"]'
    if value is not None:
        selector += f'[data-value="{value}"]'
    for key in ['edit-memo', 'edit-link']:
        panel = page.locator(f'details[data-mvp-detail="{key}"]')
        if panel.count() and panel.locator(selector).count() and panel.get_attribute('open') is None:
            panel.locator('summary').first.click()
    page.locator(selector).click()


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{server.server_port}/chinese-word-tactics/"

errors = []
missing = []
try:
    with sync_playwright() as playwright:
        launch = {"args": ["--no-sandbox"]}
        if os.environ.get("CHROMIUM_PATH"):
            launch["executable_path"] = os.environ["CHROMIUM_PATH"]
        browser = playwright.chromium.launch(**launch)
        context = browser.new_context(
            viewport={"width": 375, "height": 812}, device_scale_factor=1,
            is_mobile=True, has_touch=True
        )
        page = context.new_page()
        page.set_default_timeout(6000)
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("response", lambda response: missing.append(response.url)
                if response.status >= 400 and "favicon" not in response.url else None)
        seeded_progress = {
            "seenStories": ["chapter1-room-finale"],
            "completedStages": ["stage-5"],
            "completedMilestones": ["chapter1-complete"],
            "acknowledgedNodes": ["story:chapter1-room-finale"],
            "stageOutcomes": {},
            "lastLocation": {"view": "world"}
        }
        page.add_init_script(
            "if (!localStorage.getItem('chinese-word-tactics-journey-v1')) "
            "localStorage.setItem('chinese-word-tactics-journey-v1', "
            + json.dumps(json.dumps(seeded_progress)) + ");"
        )
        page.goto(URL)
        page.wait_for_function("!!window.GameFlow && !!window.AcademicTowerMechanic && !!window.AcademicTowerRuntime")

        assert page.evaluate("GameFlow.playStory('academic-tower-arrival')")
        assert page.locator("#storyView").is_visible()
        assert "學術塔門前" in page.locator("#storyPlace").inner_text()
        finish_story(page)
        assert "연구실의 오래된 색인" in page.locator("#storyTitle").inner_text()
        finish_story(page)

        page.wait_for_function("TacticalGame.stageId() === 'academic-tower-turn-01-que'")
        assert page.locator("#tutorialView").is_visible()
        page.locator('[data-mvp-detail="task-words"] summary').click()
        page.locator('[data-academic-word="卻"]').click()
        assert "그런데" in page.locator("#sheet").inner_text()
        page.locator("#sheet .sheetactions button").click()
        choose(page,'meaning-relation','contrast');choose(page,'meaning-confirm');choose(page,'meaning-next')
        choose(page,'meaning-source','age');choose(page,'meaning-confirm')
        saved=page.evaluate('state.academicTower')
        page.reload();page.wait_for_function('!!window.AcademicTowerRuntime');assert page.evaluate('GameFlow.resume()')
        assert page.evaluate('state.academicTower')==saved
        solve(page)
        if page.locator('[data-academic-action="finish-mvp"]').count():
            choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        assert "두 사실을 살려 메모를 고침" in page.locator("#completionBar").inner_text()
        page.screenshot(path=str(OUT / "academic-tower-01-complete-375x812.png"), full_page=True)
        page.locator("#flowNext").click()

        assert "메모에 남길 것" in page.locator("#storyTitle").inner_text()
        finish_story(page)
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구 1/5" in page.locator("#academicTowerSummary").inner_text()
        assert page.locator('[data-room-id="academic-tower-turn-01-que"]').get_attribute("data-state") == "complete"
        assert page.locator('[data-room-id="academic-tower-turn-02-raner"]').get_attribute("data-state") == "available"
        assert page.locator('[data-room-id="academic-tower-turn-03-expectation"]').get_attribute("data-state") == "available"

        page.locator('[data-room-id="academic-tower-turn-03-expectation"]').click()
        solve(page)
        choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        assert "예상과 실제의 관계를 분류함" in page.locator("#completionBar").inner_text()
        page.screenshot(path=str(OUT / "academic-tower-03-complete-375x812.png"), full_page=True)
        page.locator("#flowNext").click()
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구 2/5" in page.locator("#academicTowerSummary").inner_text()
        assert page.locator('[data-room-id="academic-tower-turn-02-raner"]').get_attribute("data-state") == "available"

        page.locator('[data-room-id="academic-tower-turn-02-raner"]').click()
        solve(page)
        if page.locator('[data-academic-action="finish-mvp"]').count():
            choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        page.locator("#flowNext").click()
        assert "다르다는 것과 대신 생긴 것" in page.locator("#storyTitle").inner_text()
        finish_story(page)
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구 3/5" in page.locator("#academicTowerSummary").inner_text()
        assert page.locator('[data-room-id="academic-tower-turn-04-faner"]').get_attribute("data-state") == "available"

        page.locator('[data-room-id="academic-tower-turn-04-faner"]').click()
        replacement_records = " ".join(page.locator(".academicMvpSource").all_inner_texts())
        assert "水量增加了" in replacement_records
        assert "수량이 늘었다" not in replacement_records
        choose(page, "select-result", "stopped")
        choose(page, "select-slot", "actual")
        choose(page, "select-result", "stopped")
        choose(page, "submit-results")
        assert "실제로 생긴 결과" in page.locator(".academicMvpFeedback" if page.locator(".academicTowerMvp").count() else "#status").inner_text()
        choose(page, "select-slot", "absent")
        choose(page, "select-result", "faster")
        choose(page, "submit-results")
        assert "反而" in page.locator(".academicMvpMemo").inner_text()
        choose(page, "next-case")
        choose(page,'select-result','normal');choose(page,'submit-results')
        saved=page.evaluate('state.academicTower')
        page.reload();page.wait_for_function('!!window.AcademicTowerRuntime');assert page.evaluate('GameFlow.resume()')
        assert page.evaluate('state.academicTower')==saved
        choose(page, "select-result", "stop")
        choose(page, "submit-results")
        choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        page.locator("#flowNext").click()
        assert "흩어진 세 장" in page.locator("#storyTitle").inner_text()
        finish_story(page)
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구 4/5" in page.locator("#academicTowerSummary").inner_text()
        assert page.locator('[data-room-id="academic-tower-turn-05-synthesis"]').get_attribute("data-state") == "available"

        page.locator('[data-room-id="academic-tower-turn-05-synthesis"]').click()
        def check_synthesis(page,task,phase):
            if task['id']=='safety-scope':
                original=page.locator('[data-academic-zone="original"]').inner_text()
                assert '雖然增加水量可以讓水流更快' in original
                assert '反而可能損壞' in original
                assert page.locator('.academicMeaningPath.actual').count()==0
                assert page.locator('.academicMeaningPath.possible').count()==1
            if task['id']=='reread':
                original=page.locator('[data-academic-zone="original"]').inner_text()
                assert '第一次增加水量後' in original and '安全範圍' in original and '＿＿' not in original
            if task['id']=='dispatch' and phase=='initial':
                choose(page,'meaning-relation','decision-3');choose(page,'meaning-confirm')
                assert '정확한 적정량' in page.locator('.academicMvpFeedback').inner_text()
        solve(page,check_synthesis)
        choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        assert "기록과 전달할 판단을 정리함" in page.locator("#completionBar").inner_text()
        page.screenshot(path=str(OUT / "academic-tower-05-complete-375x812.png"), full_page=True)
        page.locator("#flowNext").click()
        assert "첫 번째 가설" in page.locator("#storyTitle").inner_text()
        finish_story(page)
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구 완료" in page.locator("#academicTowerSummary").inner_text()
        assert "첫 관찰 메모를 보관했어" in page.locator("#academicTowerSummary").inner_text()
        assert page.locator('.academicHubGroup h3').all_text_contents() == ['첫 기록', '두 갈래 연구', '기록 종합']
        side_room = page.locator('.academicHubGroup[data-group="branch"] .academicHubSideRoom')
        assert side_room.count() == 1
        assert side_room.locator('h4').inner_text() == '곁가지 연구'
        side_button = side_room.locator('[data-room-id="academic-tower-turn-03a-ran-family"]')
        assert side_button.count() == 1
        assert side_button.inner_text() == '색인 옆의 메모'
        assert '＋' not in side_button.inner_text()
        assert '연구 완료' not in side_button.inner_text()
        assert '선택 연구' not in side_button.inner_text()
        assert side_button.locator('.academicTowerSideRoomTitle').evaluate('(el) => getComputedStyle(el).whiteSpace') == 'nowrap'
        assert page.locator('.academicHubGroup[data-group="branch"] .academicHubSideRoom').count() == 1
        assert page.evaluate("""() => {
            const side = document.querySelector('.academicHubGroup[data-group="branch"] .academicHubSideRoom');
            const synthesis = document.querySelector('.academicHubGroup[data-group="synthesis"]');
            return !!(side && synthesis && (side.compareDocumentPosition(synthesis) & Node.DOCUMENT_POSITION_FOLLOWING));
        }""")
        branch_box = page.locator('.academicHubGroup[data-group="branch"]').bounding_box()
        side_box = side_room.bounding_box()
        assert branch_box and side_box and side_box['width'] < branch_box['width']
        assert abs((side_box['x'] + side_box['width']) - (branch_box['x'] + branch_box['width'])) < 12
        page.locator('#academicTowerRooms').evaluate('el => el.scrollTop = el.scrollHeight')
        page.locator('#academicTowerJourneyFooter').click()
        assert page.locator('[data-journey-filter="all"]').get_attribute('aria-pressed') == 'true'
        tower = page.locator('[data-chapter-id="academic-tower-research"]')
        tower_groups = tower.locator('.journeyRegionKo').all_text_contents()
        assert tower_groups[:2] == ['방향이 바뀌는 문장', '색인 옆의 메모 · 선택 연구'], tower_groups
        assert '비가 그친 물길 · 선택 연구' in tower_groups, tower_groups
        assert tower.locator('[data-node-id="story:academic-tower-turn-result"]').is_visible()
        assert '두 갈래 연구' in tower.inner_text()
        page.screenshot(path=str(OUT / 'academic-tower-journey-375x812.png'), full_page=True)
        page.evaluate('AcademicTowerRuntime.showHub()')
        assert page.locator('#academicTowerRooms').evaluate('el => el.scrollTop') == 0
        page.screenshot(path=str(OUT / 'academic-tower-hub-complete-375x812.png'), full_page=True)
        assert page.evaluate("GameFlow.progress().completedMilestones.includes('academic-tower-turn-foundation')")
        assert not page.evaluate("GameFlow.progress().completedMilestones.some(id => /academic-tower.*complete/.test(id))")

        page.evaluate('GameFlow.showWorld()')
        page.locator('#worldView').wait_for(state='visible')
        page.locator('.regionCard[data-region-id="academic-tower"]').click()
        assert page.locator('#worldPlaceGo').inner_text() == '탑으로 돌아가기'
        page.locator('#worldPlaceGo').click()
        page.locator('#academicTowerView').wait_for(state='visible')

        before_replay = json.loads(page.evaluate(
            "localStorage.getItem('chinese-word-tactics-journey-v1')"
        ))
        page.locator('[data-room-id="academic-tower-turn-03-expectation"]').click()
        solve(page)
        choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        assert page.locator("#flowNext").inner_text() == "연구실로"
        page.locator("#flowNext").click()
        after_replay = json.loads(page.evaluate(
            "localStorage.getItem('chinese-word-tactics-journey-v1')"
        ))
        assert after_replay == before_replay

        page.reload()
        page.wait_for_function("!!window.GameFlow && !!window.AcademicTowerRuntime")
        assert page.evaluate("GameFlow.resume()")
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구 완료" in page.locator("#academicTowerSummary").inner_text()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert not errors, errors
        assert not missing, missing
        context.close()
        browser.close()
finally:
    server.shutdown()

print(f"PASS: Academic Tower rooms 01-05 end-to-end mobile smoke. Screenshots: {OUT}")
