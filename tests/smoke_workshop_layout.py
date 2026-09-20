"""W1-W7 workshop layout and state-marker smoke test."""
import http.server
import json
import os
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = [(375, 812), (375, 667), (375, 640), (360, 640)]
STAGES = [f"workshop-stage-{number}" for number in range(1, 8)]
OUT = Path(os.environ.get("TEST_OUTPUT", "/tmp/chinese-word-tactics-workshop-layout"))
OUT.mkdir(parents=True, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, request_path):
        request_path = request_path.split("?", 1)[0]
        prefix = "/chinese-word-tactics/"
        if not request_path.startswith(prefix):
            return str(ROOT / "__missing__")
        return str(ROOT / request_path[len(prefix) :])


def visible(locator):
    return locator.is_visible() and locator.bounding_box() is not None


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
            const r = el.getBoundingClientRect(), s = getComputedStyle(el);
            return !el.hidden && s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
          }).map(el => {
            const r = el.getBoundingClientRect();
            return {text: el.textContent.trim(), aria: el.getAttribute('aria-label'), x:r.x, y:r.y, width:r.width, height:r.height};
          });
          return {
            viewport: {width: innerWidth, height: innerHeight},
            document: {width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight},
            grid: rect('#grid'),
            key: Object.fromEntries(['.topbar','.goalbox','#words','.mapwrap','#status','.controls'].map(s => [s,rect(s)])),
            buttons,
            stage: document.querySelector('#stageTitle')?.textContent,
            status: document.querySelector('#status')?.textContent,
            bodyText: document.body.innerText,
          };
        }"""
    )


def assert_layout(page, stage, width, height, state_name, rows):
    data = metrics(page)
    assert data["document"]["width"] <= width, (stage, state_name, data)
    assert data["document"]["height"] <= height, (stage, state_name, data)
    if height == 640:
        for key in (".topbar", ".goalbox", "#words", ".mapwrap", "#status", ".controls", "#grid"):
            box = data["key"].get(key) if key != "#grid" else data["grid"]
            assert not box or box["bottom"] <= 620.5, (stage, state_name, key, box, data)
    small = [button for button in data["buttons"] if button["width"] < 44 or button["height"] < 44]
    assert not small, (stage, state_name, "button<44", small)
    rows.append({"stage": stage, "state": state_name, **data})
    return data


def set_stage(page, stage):
    page.evaluate("id => TacticalGame.playStage(id, {mode: 'replay'})", stage)
    page.wait_for_function("id => TacticalGame.stageId() === id", arg=stage)
    page.wait_for_timeout(30)


def click_action(page, component, action):
    button = page.locator(f'[data-workshop-action="{action}"][data-component="{component}"], [data-workshop-late-action="{action}"][data-component="{component}"]')
    assert visible(button), (component, action, metrics(page))
    button.click()
    page.wait_for_timeout(30)


def marker_assertions(page, stage):
    text = page.locator("body").inner_text()
    if stage == "workshop-stage-1":
        assert page.locator(".workshop-wheel").count() == 1
        assert "水車" in text or "물레방아" in text
    elif stage == "workshop-stage-2":
        assert page.locator(".workshop-fire-visual").count() == 1
        assert page.locator(".workshop-bellows-visual").count() == 1
        assert page.locator(".workshop-flame").count() == 1
        assert page.locator(".workshop-wind-lines").count() == 1
    elif stage == "workshop-stage-3":
        assert page.locator(".workshop-coupler").count() == 3
        assert page.locator(".workshop-link-state").count() == 3
        assert page.locator(".workshop-coupling-device.connected").count() + page.locator(".workshop-coupling-device.separated").count() == 3
    elif stage == "workshop-stage-4":
        assert page.locator(".workshop-condition-badge").count() == 3
        assert page.locator(".workshop-bench").count() == 1
    elif stage == "workshop-stage-5":
        assert page.locator(".workshop-flame-large").count() == 1
        assert page.locator(".workshop-smoke").count() == 1
        assert "保持" in text and "調整" in text
    elif stage == "workshop-stage-6":
        assert page.locator(".workshop-gear").count() == 3
        assert page.locator(".workshop-machine-output").count() == 1
        assert "損壞" in text or "？" in text
    elif stage == "workshop-stage-7":
        assert page.locator(".workshop-regulator-grid").count() == 1
        assert page.locator(".workshop-repair-button").count() == 1
        assert "保持" in text and "修復" in text


def prepare_state(page, stage, state_name):
    if state_name == "initial":
        return
    if stage == "workshop-stage-1":
        click_action(page, "mainGate", "step-up")
        return
    if stage == "workshop-stage-2":
        if state_name in {"longest", "near"}:
            click_action(page, "air", "step-up")
            click_action(page, "air", "step-up")
            click_action(page, "fire", "step-down")
        else:
            click_action(page, "fire", "step-down")
        return
    if stage == "workshop-stage-3":
        click_action(page, "grinderLink", "toggle")
        return
    if stage == "workshop-stage-4":
        click_action(page, "conditionWater", "step-down")
        return
    if stage == "workshop-stage-5":
        click_action(page, "flameAir", "step-up")
        return
    if stage == "workshop-stage-6":
        inspect = page.locator('[data-workshop-inspect="gearA"]')
        assert visible(inspect), metrics(page)
        inspect.click()
        if state_name in {"longest", "near"}:
            if state_name == "longest":
                page.locator('[data-workshop-inspect="gearB"]').click()
                page.locator('[data-workshop-inspect="gearC"]').click()
            elif state_name == "near":
                page.locator('[data-workshop-inspect="gearB"]').click()
        return
    if stage == "workshop-stage-7":
        click_action(page, "regulatorGate", "step-up")
        if state_name in {"longest", "near"}:
            click_action(page, "regulatorMainLink", "toggle")
            click_action(page, "regulatorIdleLink", "toggle")
        return
    raise AssertionError((stage, state_name))


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{server.server_port}/chinese-word-tactics/"
rows = []

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
                states = ["initial", "longest", "mid", "near"]
                for state_name in states:
                    set_stage(page, stage)
                    marker_assertions(page, stage)
                    initial = assert_layout(page, stage, width, height, state_name, rows)
                    prepare_state(page, stage, state_name)
                    marker_assertions(page, stage)
                    representative = assert_layout(page, stage, width, height, state_name, rows)
                    assert page.evaluate("typeof isWin === 'function' ? isWin() : false") is False, (stage, state_name, "state completed too early")
                    for axis in ("x", "y", "width", "height"):
                        assert abs(initial["grid"][axis] - representative["grid"][axis]) <= 1, (stage, state_name, axis, initial, representative)
                    if stage == "workshop-stage-6" and state_name == "near":
                        page.locator('[data-workshop-late-action="repair"][data-component="gearB"]').click()
                        page.wait_for_timeout(30)
                        assert page.locator(".workshop-machine-output.running").count() == 1
                    if stage == "workshop-stage-7" and state_name == "near":
                        page.locator('[data-workshop-late-action="repair"][data-component="regulatorGear"]').click()
                        page.wait_for_timeout(30)
                        assert page.locator(".workshop-regulator-scene.recovered").count() == 1
                    next_buttons = [button for button in representative["buttons"] if button["text"] or button["aria"]]
                    assert next_buttons, (stage, state_name, "no next action discoverable", representative)
                    page.screenshot(path=str(OUT / f"{stage}-{state_name}-{width}x{height}.png"), full_page=True)
            assert not errors, errors
            assert not missing, missing
            context.close()
        browser.close()
finally:
    server.shutdown()


summary = {
    "rows": len(rows),
    "viewports": VIEWPORTS,
    "stages": STAGES,
    "states": ["initial", "longest", "mid", "near"],
    "max_document_height": max(row["document"]["height"] for row in rows),
    "max_document_width": max(row["document"]["width"] for row in rows),
    "min_button_width": min(button["width"] for row in rows for button in row["buttons"]),
    "min_button_height": min(button["height"] for row in rows for button in row["buttons"]),
    "max_grid_state_delta": 1,
    "output": str(OUT),
}
print(json.dumps(summary, ensure_ascii=False))
