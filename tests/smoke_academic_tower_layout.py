"""Four-viewport layout matrix for the Academic Tower hub and workbench."""
import http.server
import os
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get("TEST_OUTPUT", "/tmp/chinese-word-tactics-layout"))
OUT.mkdir(parents=True, exist_ok=True)
VIEWPORTS = [(375, 812), (375, 667), (375, 640), (360, 640)]


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, request_path):
        request_path = request_path.split("?", 1)[0]
        prefix = "/chinese-word-tactics/"
        return str(ROOT / (request_path[len(prefix):] if request_path.startswith(prefix) else "__missing__"))


def visible_button_metrics(page, root):
    return page.locator(f"{root} button").evaluate_all("""items => items.filter(el => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return !el.hidden && s.display !== 'none' && s.visibility !== 'hidden' && r.width && r.height;
    }).map(el => { const r = el.getBoundingClientRect(); return {
      text: el.innerText, width: r.width, height: r.height, left: r.left, right: r.right
    }; })""")


def assert_view(page, selector, width, height, label):
    page.locator(selector).wait_for(state="visible")
    metrics = page.evaluate("""selector => {
      const el = document.querySelector(selector), r = el.getBoundingClientRect();
      return {docWidth:document.documentElement.scrollWidth, docHeight:document.documentElement.scrollHeight,
        width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};
    }""", selector)
    assert metrics["docWidth"] <= width, (label, metrics)
    assert metrics["left"] >= -0.5 and metrics["right"] <= width + 0.5, (label, metrics)
    if height == 640:
        assert metrics["height"] <= 620.5, (label, metrics)
    small = [item for item in visible_button_metrics(page, selector)
             if item["width"] < 44 or item["height"] < 44]
    assert not small, (label, small)


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
        for width, height in VIEWPORTS:
            context = browser.new_context(viewport={"width": width, "height": height},
                                          device_scale_factor=1, is_mobile=True, has_touch=True)
            page = context.new_page()
            page.set_default_timeout(6000)
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("response", lambda response: missing.append(response.url)
                    if response.status >= 400 and "favicon" not in response.url else None)
            page.goto(URL)
            page.wait_for_function("!!window.GameFlow && !!window.AcademicTowerRuntime")

            page.evaluate("AcademicTowerRuntime.showHub()")
            assert_view(page, "#academicTowerView", width, height, f"hub-{width}x{height}")
            assert page.locator("#academicTowerRooms").evaluate("el => el.scrollHeight >= el.clientHeight")
            page.screenshot(path=str(OUT / f"academic-tower-hub-{width}x{height}.png"), full_page=True)

            page.evaluate("TacticalGame.playStage('academic-tower-turn-01-que', {mode:'replay', returnTo:'academic-tower'})")
            assert_view(page, "#tutorialView", width, height, f"01-initial-{width}x{height}")
            page.locator('[data-academic-action="select-claim"][data-value="overreach-use"]').click()
            page.locator('[data-academic-action="submit-claim"]').click()
            assert_view(page, "#tutorialView", width, height, f"01-long-{width}x{height}")
            assert page.locator("#grid").evaluate("el => el.scrollWidth <= el.clientWidth + 1")

            page.evaluate("TacticalGame.playStage('academic-tower-turn-02-raner', {mode:'replay', returnTo:'academic-tower'})")
            assert_view(page, "#tutorialView", width, height, f"02-long-{width}x{height}")
            assert page.locator("#grid").evaluate("el => el.scrollWidth <= el.clientWidth + 1")
            page.screenshot(path=str(OUT / f"academic-tower-02-{width}x{height}.png"), full_page=True)

            page.evaluate("TacticalGame.playStage('academic-tower-turn-03-expectation', {mode:'replay', returnTo:'academic-tower'})")
            assert_view(page, "#tutorialView", width, height, f"03-initial-{width}x{height}")
            assert page.locator("#grid").evaluate("el => el.scrollWidth <= el.clientWidth + 1")
            page.locator('[data-academic-action="select-relation"][data-value="matched"]').click()
            page.locator('[data-academic-action="submit-relation"]').click()
            assert_view(page, "#tutorialView", width, height, f"03-review-{width}x{height}")
            page.locator('[data-academic-action="next-case"]').click()
            page.locator('[data-academic-action="select-relation"][data-value="surprising"]').click()
            page.locator('[data-academic-action="submit-relation"]').click()
            page.locator('[data-academic-action="next-case"]').click()
            assert "果然" not in page.locator(".academicExpectationCard.result").inner_text()
            assert_view(page, "#tutorialView", width, height, f"03-transfer-{width}x{height}")
            page.screenshot(path=str(OUT / f"academic-tower-03-{width}x{height}.png"), full_page=True)
            context.close()
        assert not errors, errors
        assert not missing, missing
        browser.close()
finally:
    server.shutdown()

print(f"PASS: Academic Tower four-viewport layout matrix. Screenshots: {OUT}")
