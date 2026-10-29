"""04A: mobile first-play, hidden fieldwork, independent resume and first outcome."""
import http.server
import json
import os
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ER = "academic-tower-turn-04a-er-family"
OUT = Path(os.environ.get("TEST_OUTPUT", "/tmp/chinese-word-tactics-04a-observation"))
OUT.mkdir(parents=True, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, url):
        return str(ROOT / url.split("?", 1)[0].removeprefix("/chinese-word-tactics/"))


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()

seed = {
    "seenStories": ["chapter1-room-finale", "academic-tower-arrival",
                    "academic-tower-turn-intro", "academic-tower-turn-after-que",
                    "academic-tower-turn-before-faner"],
    "completedStages": ["stage-5", "academic-tower-turn-01-que",
                        "academic-tower-turn-02-raner",
                        "academic-tower-turn-03-expectation",
                        "academic-tower-turn-04-faner"],
    "completedMilestones": ["chapter1-complete", "academic-tower-entered"],
    "acknowledgedNodes": [],
    "stageOutcomes": {},
    "lastLocation": {"view": "world"}
}


def click(page, op, value=None):
    sel = f'[data-academic-action="{op}"]'
    if value is not None:
        sel += f'[data-value="{value}"]'
    page.locator(sel).click()


def all_story(page):
    for _ in range(24):
        if not page.locator("#storyView").is_visible():
            return
        page.locator("#storyNext").click()
    raise AssertionError("story did not end")


def layout(page, width):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "horizontal page overflow"
    assert page.locator("#grid").evaluate("el => el.scrollWidth <= el.clientWidth + 1"), "workbench overflow"
    assert page.locator('[data-academic-zone="original"]').count() == 1
    assert page.locator('[data-academic-zone="work"]').count() == 1
    violations = page.locator('#grid button, #grid summary, #academicMvpConfirm').evaluate_all("""
      nodes => nodes.filter(el => {
        const r=el.getBoundingClientRect();
        const s=getComputedStyle(el);
        return r.width && r.height && s.display!=='none' &&
          (r.width<44 || r.height<44);
      }).map(el=>[el.outerHTML.slice(0,120),el.getBoundingClientRect().width,el.getBoundingClientRect().height])
    """)
    assert not violations, (width, violations)


try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--no-sandbox"])
        for width, height in [(375, 640), (375, 667), (375, 812), (360, 640)]:
            page = browser.new_page(viewport={"width": width, "height": height},
                                    is_mobile=True, has_touch=True)
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            first_progress = json.loads(json.dumps(seed))
            # 03B-familiar greeting gets its own first-play variant on the
            # narrowest viewport. Other viewports exercise the ordinary one.
            if width == 360:
                first_progress["completedStages"].append("academic-tower-turn-03b-ran-village")
            page.add_init_script("""
              if (!localStorage.getItem("chinese-word-tactics-journey-v1"))
                localStorage.setItem("chinese-word-tactics-journey-v1", JSON.stringify(%s));
            """ % json.dumps(first_progress, ensure_ascii=False))
            page.goto(f"http://127.0.0.1:{server.server_port}/chinese-word-tactics/")
            page.wait_for_function("!!window.GameFlow && !!window.AcademicTowerEr04A")
            assert page.evaluate("GameFlow.enterRegion('academic-tower')")
            room = page.locator(f'[data-room-id="{ER}"]')
            assert room.get_attribute("data-state") == "available"
            synthesis = page.locator('.academicHubGroup[data-group="synthesis"]')
            # A side room belonging to floor 04 must be between 04 and 05,
            # not trailing at the end of the whole synthesis section.
            assert synthesis.locator('[data-room-id]').evaluate_all(
                "nodes => nodes.map(n => n.dataset.roomId)") == [
                "academic-tower-turn-04-faner",
                ER,
                "academic-tower-turn-05-synthesis"
            ]
            assert synthesis.locator(".academicHubSideRoom").count() == 1
            assert synthesis.locator(".academicHubSideRoom").evaluate("""side => (
                side.previousElementSibling?.dataset.roomId ===
                    'academic-tower-turn-04-faner' &&
                side.nextElementSibling?.dataset.roomId ===
                    'academic-tower-turn-05-synthesis' &&
                side.querySelector('.academicTowerSideRoomTitle')?.textContent ===
                    '비가 그친 물길'
            )""")
            assert room.locator('.academicTowerRoomNumber').count() == 0
            if width == 375 and height == 640:
                page.screenshot(path=str(OUT / "04a-below-floor-04-375x640.png"))
            room.click()
            assert page.locator("#storyView").is_visible()
            assert "雨" in page.locator("#storyZh").inner_text()
            page.locator("#storyNext").click()
            assert ("又在這裡遇到" in page.locator("#storyZh").inner_text()) == (width == 360)
            frozen = page.evaluate("(id)=>GameFlow.progress().sideResearchProgress[id].introVariantId", ER)
            assert frozen == ("familiar" if width == 360 else "ordinary")
            all_story(page)
            assert page.evaluate("TacticalGame.stageId()") == ER
            layout(page, width)
            assert "而且" in page.locator("#grid").inner_text()
            assert page.locator(".academicErUpstream").count() == 1
            assert "이번 큰비의 물 자국" in page.locator(".academicErUpstream svg").text_content()
            assert "지난 큰비의 물 자국" not in page.locator("#grid").inner_text()
            assert page.locator('.academicOriginal > .academicRegionLabel').inner_text() == '현장 관찰'
            if width == 375 and height == 640:
                page.screenshot(path=str(OUT / "04a-T1-first-observation-375x640.png"))
            assert page.locator('[data-academic-action="er-observe"]').count() == 2
            assert page.locator("#academicMvpConfirm").is_disabled()
            assert "높은 석틈에 풀잎이 걸려 있어" not in page.locator("#grid").inner_text()
            click(page, "er-observe", "a-current-level")
            assert page.evaluate("state.academicTower.t1CurrentRecorded") is True
            assert page.evaluate("state.academicTower.phase") == "work"
            assert "오늘의 관측" in page.locator("#grid").inner_text()
            assert page.locator(".academicMvpFeedback").get_attribute("data-verdict") != "incorrect"
            if width == 375 and height == 640:
                page.screenshot(path=str(OUT / "04a-T1-current-water-valid-375x640.png"))
            if width == 375 and height == 640:
                page.reload()
                page.wait_for_function("!!window.GameFlow")
                assert page.evaluate("GameFlow.resume()")
                assert page.evaluate("state.academicTower.t1CurrentRecorded") is True
            click(page, "er-observe", "a-grass-high")
            assert "높은 틈에 풀잎이 걸려 있어" in page.locator("#grid").inner_text()
            assert not page.locator("#academicMvpConfirm").is_disabled()
            click(page, "er-confirm")
            assert page.evaluate("state.academicTower.phase") == "review"
            assert "而且" in page.locator("#grid").inner_text()
            click(page, "er-next")

            assert page.evaluate("state.academicTower.taskIndex") == 1
            assert page.locator(".academicErRoute").count() == 1
            assert page.locator('.academicOriginal > .academicRegionLabel').inner_text() == '관측 자료'
            if width == 375 and height == 640:
                page.screenshot(path=str(OUT / "04a-T2-source-route-375x640.png"))
            assert "아직 확인하지 않은 구간" in page.locator("#grid").inner_text()
            click(page, "er-select", "check-between-b-c")
            click(page, "er-confirm")
            click(page, "er-next")
            assert page.locator("#storyView").is_visible()
            assert page.evaluate("state.academicTower.sceneId") == "retrace"
            for _ in range(3):
                page.locator("#storyNext").click()
            assert "這條水道通往工坊" in page.locator("#storyZh").inner_text()
            assert "草叢裡的雨水" not in page.locator("#storyZh").inner_text()
            all_story(page)
            assert page.evaluate("state.academicTower.taskIndex") == 2
            assert page.evaluate("state.academicTower.openingFound") is False
            assert page.locator('[data-value="flow-out"]').count() == 0
            assert page.locator('.academicErWaterDiagram.found').count() == 0
            assert "이 수로는 공방으로 이어져" in page.locator("#grid").inner_text()
            assert "수풀의 빗물이 수로로 들어오는" not in page.locator("#grid").inner_text()
            assert page.locator('.academicOriginal > .academicRegionLabel').inner_text() == '현장 관찰'
            assert page.locator('.controls .academicErFooterPrompt').count() == 1
            assert page.locator('#academicMvpConfirm').count() == 0
            layout(page, width)
            if width == 375 and height == 640:
                page.screenshot(path=str(OUT / "04a-T3-hidden-bank-375x640.png"))

            click(page, "er-search", "top-stone")
            assert page.evaluate("state.academicTower.openingFound") is False
            assert page.locator('.controls .academicErFooterPrompt').count() == 1, 'footer prompt must not duplicate'
            click(page, "er-search", "low-bank")
            assert page.locator('.controls .academicErFooterPrompt').count() == 0
            assert page.evaluate("state.academicTower.openingFound") is True
            assert page.locator("#grid").evaluate("el => el.scrollTop") <= 4
            layout(page, width)
            if width == 375 and height == 640:
                page.screenshot(path=str(OUT / "04a-T3-opening-discovered-375x640.png"))

            # A different stage overwrites the legacy tactical slot, not 04A's
            # per-study checkpoint. Return through the real tower hub.
            if width == 375 and height == 640:
                before = page.evaluate("GameFlow.progress().sideResearchProgress[%s]" % json.dumps(ER))
                assert page.evaluate("TacticalGame.playStage('academic-tower-turn-01-que',{mode:'first-play'})")
                assert page.evaluate("GameFlow.enterRegion('academic-tower')")
                page.locator(f'[data-room-id="{ER}"]').click()
                page.wait_for_function("(id)=>TacticalGame.stageId()===id", arg=ER)
                after = page.evaluate("state.academicTower")
                assert after == before, "04A resumed after another stage"
                page.reload()
                page.wait_for_function("!!window.GameFlow")
                assert page.evaluate("GameFlow.resume()")
                assert page.evaluate("state.academicTower.openingFound") is True

            assert "수로의 물 일부가 측벽의 틈으로 갈라져 나가" in page.locator("#grid").inner_text()
            click(page, "er-select", "flow-in")
            click(page, "er-confirm")
            assert page.evaluate("state.academicTower.phase") == "work"
            assert page.evaluate("state.academicTower.openingFound") is True
            click(page, "er-select", "flow-out")
            click(page, "er-confirm")
            assert page.evaluate("state.academicTower.phase") == "review"
            assert "有一部分反而從旁邊的孔口流走了" in page.locator("#grid").inner_text()
            assert "일부가 옆으로 유출" in page.locator("#grid").inner_text()
            click(page, "er-next")
            assert page.locator("#storyView").is_visible()
            assert "有一部分水從旁邊流走了" in page.locator("#storyZh").inner_text()
            all_story(page)
            assert page.evaluate("state.academicTower.taskIndex") == 3
            assert page.locator(".academicErStone").count() == 1
            assert page.locator('.academicOriginal > .academicRegionLabel').inner_text() == '현장·도면 대조'
            assert page.locator('[data-academic-action="er-inspect-d"]').count() == 1
            assert "反覆鑿刻的痕跡" not in page.locator("#grid").inner_text()
            click(page, "er-inspect-d")
            assert page.evaluate("state.academicTower.t4Inspected") is True
            assert "反覆鑿刻的痕跡" in page.locator("#grid").inner_text()
            if width == 375 and height == 640:
                page.screenshot(path=str(OUT / "04a-T4-toolmarks-inspected-375x640.png"))
            click(page, "er-select", "natural-crack")
            click(page, "er-confirm")
            assert page.evaluate("state.academicTower.step") == "correct"
            click(page, "er-select", "artificial-passage")
            click(page, "er-confirm")
            assert page.evaluate("state.academicTower.step") == "scope"
            assert page.locator(".academicErPlans").count() == 1
            assert page.locator("#grid").evaluate("el => el.scrollTop") <= 4
            click(page, "er-select", "scope-original-only")
            click(page, "er-confirm")
            click(page, "er-next")
            assert page.evaluate("state.academicTower.taskIndex") == 4
            assert page.locator('.academicOriginal > .academicRegionLabel').inner_text() == '관측 기록'
            layout(page, width)
            click(page, "er-note", "method:method-compare")
            click(page, "er-note", "action:notify-manager")
            inquiry = "inquiry-outlet" if width == 360 else "inquiry-records"
            click(page, "er-note", "inquiry:" + inquiry)
            click(page, "er-confirm")
            assert page.evaluate("state.academicTower.phase") == "complete"
            assert page.locator(".academicErFinalReport").count() == 1
            if width == 375 and height == 640:
                page.screenshot(path=str(OUT / "04a-T5-completed-report-375x640.png"))
            assert "從而確認" in page.locator(".academicErFinalReport").inner_text()
            assert "因而需要" in page.locator(".academicErFinalReport").inner_text()
            assert "進而" in page.locator(".academicErFinalReport").inner_text()
            assert page.evaluate("(id)=>GameFlow.progress().stageOutcomes[id].nextInquiryId", ER) == inquiry
            assert page.evaluate("(id)=>GameFlow.progress().completedStages.filter(x=>x===id).length", ER) == 1
            click(page, "finish-mvp")
            page.locator("#flowNext").click()
            assert page.locator("#storyView").is_visible()
            for _ in range(3):
                page.locator("#storyNext").click()
            expected = "下游出口" if inquiry == "inquiry-outlet" else "修繕紀錄"
            assert expected in page.locator("#storyZh").inner_text()
            all_story(page)
            assert page.evaluate("GameFlow.progress().seenStories.includes('academic-tower-er-result')")
            assert page.evaluate("(id)=>GameFlow.progress().stageOutcomes[id].nextInquiryId", ER) == inquiry
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            assert not errors, errors
            page.close()
        browser.close()
    print("04A fieldwork browser smoke passed: four mobile viewports, first-play and independent resume.")
finally:
    server.shutdown()
