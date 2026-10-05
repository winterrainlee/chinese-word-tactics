"""End-to-end mobile smoke for Academic Tower rooms 01 through 05."""
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
        page.locator('[data-academic-word="卻"]').click()
        assert "그런데" in page.locator("#sheet").inner_text()
        page.locator("#sheet .sheetactions button").click()
        choose(page, "select-claim", "fact-short")
        choose(page, "submit-claim")
        assert page.locator("#flowNext").count() == 0 or not page.locator("#flowNext").is_visible()
        assert "수로의 길이" in page.locator(".academicMvpFeedback" if page.locator(".academicTowerMvp").count() else "#status").inner_text()
        page.locator("#undoBtn").click()
        choose(page, "select-claim", "overreach-use")
        choose(page, "submit-claim")
        choose(page, "select-revision", "ignore-danger")
        choose(page, "submit-revision")
        assert "위험을 빼면 안 돼" in page.locator(".academicMvpFeedback" if page.locator(".academicTowerMvp").count() else "#status").inner_text()
        choose(page, "select-revision", "keep-both")
        choose(page, "submit-revision")
        assert "卻" in page.locator(".academicMvpMemo").inner_text()
        choose(page, "next-case")
        assert not page.locator('[data-mvp-detail="source-meaning"] p').is_visible()
        assert page.locator('[data-academic-action="select-revision"] [lang="zh-Hant"]').count() == 4
        page.locator('[data-mvp-detail="source-meaning"] summary').click()
        assert page.locator('[data-mvp-detail="source-meaning"] p').is_visible()
        choose(page, "select-revision", "old-not-working")
        choose(page, "submit-revision")
        assert page.locator("#flowNext").count() == 0 or not page.locator("#flowNext").is_visible()
        choose(page, "select-revision", "old-and-working")
        choose(page, "submit-revision")
        if page.locator('[data-academic-action="finish-mvp"]').count():
            choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        assert "두 사실을 살려 메모를 고침" in page.locator("#completionBar").inner_text()
        page.screenshot(path=str(OUT / "academic-tower-01-complete-375x812.png"), full_page=True)
        page.locator("#flowNext").click()

        assert "메모에 남길 것" in page.locator("#storyTitle").inner_text()
        finish_story(page)
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구한 방 1 / 5" in page.locator("#academicTowerSummary").inner_text()
        assert page.locator('[data-room-id="academic-tower-turn-01-que"]').get_attribute("data-state") == "complete"
        assert page.locator('[data-room-id="academic-tower-turn-02-raner"]').get_attribute("data-state") == "available"
        assert page.locator('[data-room-id="academic-tower-turn-03-expectation"]').get_attribute("data-state") == "available"

        page.locator('[data-room-id="academic-tower-turn-03-expectation"]').click()
        initial_pair = page.locator(".academicExpectationPair").inner_text()
        assert "水量增加了" in initial_pair
        assert "수량이 늘었다" not in initial_pair
        assert "수차가 과연" not in initial_pair
        page.locator('[data-mvp-detail="word-help"] > summary').click()
        page.locator('[data-academic-word="果然"]').first.click()
        assert "과연" in page.locator("#sheet").inner_text()
        page.locator("#sheet .sheetactions button").click()
        choose(page, "select-relation", "surprising")
        choose(page, "submit-relation")
        assert "다시 비교" in page.locator(".academicMvpFeedback" if page.locator(".academicTowerMvp").count() else "#status").inner_text()
        choose(page, "select-relation", "matched")
        choose(page, "submit-relation")
        choose(page, "next-case")
        choose(page, "select-relation", "surprising")
        choose(page, "submit-relation")
        choose(page, "next-case")
        assert "果然" not in page.locator(".academicExpectationCard.result").inner_text()
        transfer_pair = page.locator(".academicExpectationPair").inner_text()
        assert "톱니의 균열" not in transfer_pair
        assert "수차가 멈췄다" not in transfer_pair
        choose(page, "select-relation", "matched")
        choose(page, "submit-relation")
        assert "果然" in page.locator(".academicExpectationReview").inner_text()
        choose(page, "next-case")
        choose(page, "select-relation", "surprising")
        choose(page, "submit-relation")
        assert "竟然" in page.locator(".academicExpectationReview").inner_text()
        choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        assert "예상과 실제의 관계를 분류함" in page.locator("#completionBar").inner_text()
        page.screenshot(path=str(OUT / "academic-tower-03-complete-375x812.png"), full_page=True)
        page.locator("#flowNext").click()
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구한 방 2 / 5" in page.locator("#academicTowerSummary").inner_text()
        assert page.locator('[data-room-id="academic-tower-turn-02-raner"]').get_attribute("data-state") == "available"

        page.locator('[data-room-id="academic-tower-turn-02-raner"]').click()
        choose(page, "select-claim", "fact-increased")
        choose(page, "submit-claim")
        assert page.locator("#flowNext").count() == 0 or not page.locator("#flowNext").is_visible()
        choose(page, "select-claim", "overreach-restored")
        choose(page, "submit-claim")
        choose(page, "select-revision", "restore-all")
        choose(page, "submit-revision")
        choose(page, "select-revision", "keep-both")
        choose(page, "submit-revision")
        choose(page, "next-case")
        choose(page, "select-revision", "deny-water")
        choose(page, "submit-revision")
        choose(page, "select-revision", "keep-both")
        choose(page, "submit-revision")
        if page.locator('[data-academic-action="finish-mvp"]').count():
            choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        page.locator("#flowNext").click()
        assert "다르다는 것과 대신 생긴 것" in page.locator("#storyTitle").inner_text()
        finish_story(page)
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구한 방 3 / 5" in page.locator("#academicTowerSummary").inner_text()
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
        choose(page, "select-result", "stop")
        choose(page, "select-slot", "actual")
        choose(page, "select-result", "normal")
        choose(page, "submit-results")
        choose(page, "select-link", "jingran")
        choose(page, "submit-link")
        assert "뜻밖" in page.locator(".academicMvpFeedback" if page.locator(".academicTowerMvp").count() else "#status").inner_text()
        choose(page, "select-link", "faner")
        choose(page, "submit-link")
        choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        page.locator("#flowNext").click()
        assert "흩어진 세 장" in page.locator("#storyTitle").inner_text()
        finish_story(page)
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구한 방 4 / 5" in page.locator("#academicTowerSummary").inner_text()
        assert page.locator('[data-room-id="academic-tower-turn-05-synthesis"]').get_attribute("data-state") == "available"

        page.locator('[data-room-id="academic-tower-turn-05-synthesis"]').click()
        assert page.locator('[data-academic-zone="original"]').count() == 1
        assert page.locator('[data-academic-zone="work"]').count() == 1
        assert page.locator('.academicMvpPreview').count() == 1
        assert "研究員先前預計" in page.locator(".academicClozeRecord").inner_text()
        assert "더 빨라질" not in page.locator(".academicClozeRecord").inner_text()
        choose(page, "select-connector", "所以")
        choose(page, "submit-connector")
        assert page.locator('.academicMvpPreview').get_attribute('data-verdict') == 'incorrect'
        assert "결과로 잇는 말" in page.locator(".academicMvpFeedback" if page.locator(".academicTowerMvp").count() else "#status").inner_text()
        for connector in ["果然", "卻", "竟然", "然而", "反而", "然而", "反而", "不能只憑這些記錄決定水量，還要確認裝置的情況。"]:
            if connector == "反而" and "記錄 3" in page.locator(".academicCaseProgress").inner_text():
                choose(page, "select-connector", "而且")
                choose(page, "submit-connector")
                assert "문장으로는 가능해" in page.locator(".academicMvpFeedback" if page.locator(".academicTowerMvp").count() else "#status").inner_text()
            if "안전 기록 · 첫" in page.locator(".academicCaseProgress").inner_text():
                assert "剛修復的裝置也可能損壞" in page.locator(".academicClozeRecord").inner_text()
            if connector.startswith("不能"):
                assert page.locator(".academicArchive").count() == 7
                page.locator('[data-mvp-detail="archive"] > summary').click()
                assert "第一次增加水量後" in page.locator(".academicArchive").first.inner_text()
                choose(page, "select-connector", "已經知道確切的安全水量，不用再檢查。")
                choose(page, "submit-connector")
                assert "정확한 적정량" in page.locator(".academicMvpFeedback" if page.locator(".academicTowerMvp").count() else "#status").inner_text()
                assert not page.locator("#flowNext").is_visible()
                page.locator("#undoBtn").click()
            choose(page, "select-connector", connector)
            assert page.locator('[data-academic-zone="work"] .academicTaskTitle').count() == 1
            assert page.locator('.academicMvpPreview').get_attribute('data-verdict') is None
            choose(page, "submit-connector")
            assert page.locator('.academicMvpPreview').get_attribute('data-verdict') == 'correct'
            if page.locator('[data-academic-action="next-blank"]').count():
                choose(page, "next-blank")
        choose(page, "finish-mvp")
        page.locator("#flowNext").wait_for(state="visible")
        assert "기록과 전달할 판단을 정리함" in page.locator("#completionBar").inner_text()
        page.screenshot(path=str(OUT / "academic-tower-05-complete-375x812.png"), full_page=True)
        page.locator("#flowNext").click()
        assert "첫 번째 가설" in page.locator("#storyTitle").inner_text()
        finish_story(page)
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구한 방 5 / 5" in page.locator("#academicTowerSummary").inner_text()
        assert "네 기록 칸" in page.locator(".academicHubNote").inner_text()
        assert page.evaluate("GameFlow.progress().completedMilestones.includes('academic-tower-turn-foundation')")
        assert not page.evaluate("GameFlow.progress().completedMilestones.some(id => /academic-tower.*complete/.test(id))")

        before_replay = json.loads(page.evaluate(
            "localStorage.getItem('chinese-word-tactics-journey-v1')"
        ))
        page.locator('[data-room-id="academic-tower-turn-03-expectation"]').click()
        for relation in ["matched", "surprising", "matched", "surprising"]:
            choose(page, "select-relation", relation)
            choose(page, "submit-relation")
            if page.locator('[data-academic-action="next-case"]').count():
                choose(page, "next-case")
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
        assert "탑 전체 완료 조건 없음" in page.locator("#academicTowerSummary").inner_text()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert not errors, errors
        assert not missing, missing
        context.close()
        browser.close()
finally:
    server.shutdown()

print(f"PASS: Academic Tower rooms 01-05 end-to-end mobile smoke. Screenshots: {OUT}")
