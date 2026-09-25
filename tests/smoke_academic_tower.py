"""End-to-end mobile smoke for Academic Tower rooms 01 through 03."""
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
        page.locator("#words .wordbtn", has_text="卻").click()
        assert "그런데" in page.locator("#sheet").inner_text()
        page.locator("#sheet .sheetactions button").click()
        choose(page, "select-claim", "fact-short")
        choose(page, "submit-claim")
        assert page.locator("#flowNext").count() == 0 or not page.locator("#flowNext").is_visible()
        assert "수로의 길이" in page.locator("#status").inner_text()
        page.locator("#undoBtn").click()
        choose(page, "select-claim", "overreach-use")
        choose(page, "submit-claim")
        choose(page, "select-revision", "ignore-danger")
        choose(page, "submit-revision")
        assert "위험을 빼면 안 돼" in page.locator("#status").inner_text()
        choose(page, "select-revision", "keep-both")
        choose(page, "submit-revision")
        assert "卻" in page.locator(".academicEvidenceMap").inner_text()
        choose(page, "next-case")
        choose(page, "select-revision", "old-not-working")
        choose(page, "submit-revision")
        assert page.locator("#flowNext").count() == 0 or not page.locator("#flowNext").is_visible()
        choose(page, "select-revision", "old-and-working")
        choose(page, "submit-revision")
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
        page.locator("#words .wordbtn", has_text="果然").click()
        assert "과연" in page.locator("#sheet").inner_text()
        page.locator("#sheet .sheetactions button").click()
        choose(page, "select-relation", "surprising")
        choose(page, "submit-relation")
        assert "다시 비교" in page.locator("#status").inner_text()
        choose(page, "select-relation", "matched")
        choose(page, "submit-relation")
        choose(page, "next-case")
        choose(page, "select-relation", "surprising")
        choose(page, "submit-relation")
        choose(page, "next-case")
        assert "果然" not in page.locator(".academicExpectationCard.result").inner_text()
        choose(page, "select-relation", "matched")
        choose(page, "submit-relation")
        assert "果然" in page.locator(".academicExpectationReview").inner_text()
        choose(page, "next-case")
        choose(page, "select-relation", "surprising")
        choose(page, "submit-relation")
        assert "竟然" in page.locator(".academicExpectationReview").inner_text()
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
        page.locator("#flowNext").wait_for(state="visible")
        page.locator("#flowNext").click()
        page.locator("#academicTowerView").wait_for(state="visible")
        assert "연구한 방 3 / 5" in page.locator("#academicTowerSummary").inner_text()
        assert page.locator('[data-room-id="academic-tower-turn-04-faner"]').get_attribute("data-state") == "planned"
        assert "준비 중" in page.locator('[data-room-id="academic-tower-turn-04-faner"]').inner_text()

        before_replay = json.loads(page.evaluate(
            "localStorage.getItem('chinese-word-tactics-journey-v1')"
        ))
        page.locator('[data-room-id="academic-tower-turn-03-expectation"]').click()
        for relation in ["matched", "surprising", "matched", "surprising"]:
            choose(page, "select-relation", relation)
            choose(page, "submit-relation")
            if page.locator('[data-academic-action="next-case"]').count():
                choose(page, "next-case")
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

print(f"PASS: Academic Tower rooms 01-03 end-to-end mobile smoke. Screenshots: {OUT}")
