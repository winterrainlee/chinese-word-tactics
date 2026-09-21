"""Stage 3 tutorial/gate layout audit in the requested Chrome executable."""
import http.server
import json
import os
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = [(375, 812), (375, 667), (375, 640), (360, 640)]
STAGES = ["stage-0", "stage-1", "stage-2"] + [f"gate-stage-{n}" for n in range(1, 8)]
OUT = Path(os.environ.get("TEST_OUTPUT", "/tmp/chinese-word-tactics-gate-layout"))
OUT.mkdir(parents=True, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, request_path):
        request_path = request_path.split("?", 1)[0]
        prefix = "/chinese-word-tactics/"
        if not request_path.startswith(prefix):
            return str(ROOT / "__missing__")
        return str(ROOT / request_path[len(prefix):])


def metrics(page):
    return page.evaluate(
        """() => {
          const rect = selector => {
            const el = document.querySelector(selector);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};
          };
          const buttons = [...document.querySelectorAll('button')].filter(el => {
            const r = el.getBoundingClientRect();
            return !el.hidden && getComputedStyle(el).display !== 'none' &&
              getComputedStyle(el).visibility !== 'hidden' && r.width > 0 && r.height > 0;
          }).map(el => {
            const r = el.getBoundingClientRect();
            return {text: el.textContent.trim(), x:r.x, y:r.y, width:r.width, height:r.height};
          });
          const grid = rect('#grid');
          return {
            viewport: {width: innerWidth, height: innerHeight},
            document: {width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight},
            grid,
            key: Object.fromEntries(['.topbar','.goalbox','#words','.mapwrap','#status','.controls'].map(s => [s,rect(s)])),
            buttons,
            stage: document.querySelector('#stageTitle')?.textContent,
            status: document.querySelector('#status')?.textContent,
            g7Judgment: document.querySelector('.g7-judgment')?.textContent,
            g7JudgmentVisible: (() => { const el = document.querySelector('.g7-judgment');
              return !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0; })(),
            visibleNext: [...document.querySelectorAll('button')].some(el => /다음|문 열기|돌 치우기|살펴|이동|앞|뒤/.test(el.textContent) && !el.hidden),
          };
        }"""
    )


def assert_layout(page, stage, width, height, rows):
    data = metrics(page)
    assert data["document"]["width"] <= width, (stage, data)
    assert data["document"]["height"] <= height, (stage, data)
    if height == 640:
        for key in (".topbar", ".goalbox", "#words", ".mapwrap", "#status", ".controls"):
            box = data["key"].get(key)
            assert not box or box["bottom"] <= 620.5, (stage, key, box, data)
    small = [b for b in data["buttons"] if b["width"] < 44 or b["height"] < 44]
    assert not small, (stage, "button<44", small)
    rows.append(data)
    return data


def set_stage(page, stage):
    page.evaluate("id => TacticalGame.playStage(id, {mode: 'replay'})", stage)
    page.wait_for_function("id => TacticalGame.stageId() === id", arg=stage)
    page.wait_for_timeout(20)


def representative_states(page, stage):
    # Keep the authored mechanics intact while exposing the longest/next-action states.
    if stage == "stage-0":
        page.evaluate("state.hero=[2,1]; render()")
    elif stage == "stage-1":
        page.evaluate("state.hero=[5,2]; render()")
    elif stage == "stage-2":
        page.evaluate("state.hero=[4,2]; render()")
    elif stage == "gate-stage-1":
        page.evaluate("state.hero=[2,3]; state.entered=true; render()")
        page.locator("#inspectBtn").click()
    elif stage == "gate-stage-2":
        page.evaluate("state.hero=[2,2]; render()")
    elif stage == "gate-stage-3":
        page.evaluate("state.hero=[3,1]; render()")
    elif stage == "gate-stage-4":
        page.evaluate("state.hero=[2,1]; render()")
        page.locator("#inspectBtn").click()
        page.locator("[data-context-action-choices] button", has_text="짐상자 살펴보기").click()
    elif stage == "gate-stage-5":
        page.evaluate("state.hero=[1,1]; state.doorInspected=true; state.doorClear=true; render()")
        page.evaluate("ContextActionHandlers['g5-open-door']([1,2])")
    elif stage == "gate-stage-6":
        page.evaluate("state.hero=[5,2]; state.followerPos=[5,2]; render()")
        page.evaluate("attemptMove([4,2], false)")
    elif stage == "gate-stage-7":
        page.evaluate("state.hero=[4,2]; state.followerPositions=[[5,2],[6,2]]; render()")
        page.evaluate("attemptMove([4,3], false); attemptMove([3,3], false)")
    page.wait_for_timeout(30)


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{server.server_port}/chinese-word-tactics/"
results = []

try:
    with sync_playwright() as playwright:
        executable = os.environ.get("CHROMIUM_PATH")
        launch = {"args": ["--no-sandbox"]}
        if executable:
            launch["executable_path"] = executable
        browser = playwright.chromium.launch(**launch)
        for width, height in VIEWPORTS:
            context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1, is_mobile=True, has_touch=True)
            page = context.new_page()
            errors, missing = [], []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("response", lambda response: missing.append(response.url) if response.status >= 400 and "favicon" not in response.url else None)
            page.goto(url)
            page.wait_for_function("!!window.TacticalGame")
            for stage in STAGES:
                set_stage(page, stage)
                initial = assert_layout(page, stage, width, height, results)
                representative_states(page, stage)
                representative = assert_layout(page, stage + ":representative", width, height, results)
                for axis in ("x", "y", "width", "height"):
                    assert abs(initial["grid"][axis] - representative["grid"][axis]) <= 1, (stage, axis, initial, representative)
                if stage in {"gate-stage-1", "gate-stage-4", "gate-stage-5", "gate-stage-6", "gate-stage-7"}:
                    assert metrics(page)["visibleNext"], (stage, "next action not visible", metrics(page))
                if stage == "gate-stage-7":
                    assert representative["g7JudgmentVisible"], representative
                    assert "經由" in (representative["g7Judgment"] or ""), representative
                    assert "跟隨" in (representative["g7Judgment"] or ""), representative
                    page.evaluate("""() => {
                      state.via = true; state.viaIds = ['east-post']; state.chainStuck = true; render();
                    }""")
                    blocked = assert_layout(page, stage + ":blocked", width, height, results)
                    assert "東哨站" in (blocked["g7Judgment"] or ""), blocked
                    assert "행렬 단절" in (blocked["g7Judgment"] or ""), blocked
                page.screenshot(path=str(OUT / f"{stage}-{width}x{height}.png"), full_page=True)
            assert not errors, errors
            assert not missing, missing
            context.close()
        browser.close()
finally:
    server.shutdown()

summary = {
    "rows": len(results),
    "viewports": VIEWPORTS,
    "stages": STAGES,
    "max_document_height": max(row["document"]["height"] for row in results),
    "max_document_width": max(row["document"]["width"] for row in results),
    "min_button_width": min(button["width"] for row in results for button in row["buttons"]),
    "min_button_height": min(button["height"] for row in results for button in row["buttons"]),
    "max_grid_state_delta": 1,
    "output": str(OUT),
}
print(json.dumps(summary, ensure_ascii=False))
