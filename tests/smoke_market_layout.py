"""UI/layout smoke for the market M1-M8 stages.

The test deliberately drives the market through visible board cells and action
buttons.  It uses the repository's local-server/Playwright pattern and honors
CHROMIUM_PATH; it does not call a completion API or mutate game state to solve.
"""
import http.server
import json
import os
import threading
from collections import deque
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = [(375, 812), (375, 667), (375, 640), (360, 640)]
STAGES = [f"market-stage-{number}" for number in range(1, 9)]
if os.environ.get("MARKET_SMOKE_VIEWPORT_LIMIT"):
    VIEWPORTS = VIEWPORTS[: int(os.environ["MARKET_SMOKE_VIEWPORT_LIMIT"])]
if os.environ.get("MARKET_SMOKE_STAGE_LIMIT"):
    STAGES = STAGES[: int(os.environ["MARKET_SMOKE_STAGE_LIMIT"])]
OUT = Path(os.environ.get("TEST_OUTPUT", "/tmp/chinese-word-tactics-market-layout"))
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


def rect(page, selector):
    return page.locator(selector).bounding_box() if page.locator(selector).count() else None


def metrics(page):
    return page.evaluate(
        """() => {
          const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
            return !el.hidden && s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
          const box = s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect();
            return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; };
          const buttons = [...document.querySelectorAll('button')].filter(visible).map(el => {
            const r = el.getBoundingClientRect(); return {text:el.textContent.trim(), width:r.width, height:r.height, disabled:el.disabled};
          });
          const texts = [...document.querySelectorAll('#status,#goal,#ruleLine,.market-panel,.market-m8-summary,.market-carry')]
            .filter(visible).map(el => el.textContent.trim()).join(' | ');
          return { viewport:{width:innerWidth,height:innerHeight}, document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},
            grid:box('#grid'), key:Object.fromEntries(['.topbar','.goalbox','#words','.mapwrap','#status','.controls'].map(s => [s,box(s)])),
            buttons, text:texts, status:document.querySelector('#status')?.textContent.trim() || '', win:typeof isWin === 'function' && isWin(),
            stage:document.querySelector('#stageTitle')?.textContent.trim() || '' };
        }"""
    )


def m3_tray_metrics(page):
    return page.evaluate(
        """() => {
          const box = selector => { const node = document.querySelector(selector); if (!node) return null;
            const r = node.getBoundingClientRect(); return {x:r.x,top:r.top,right:r.right,width:r.width,height:r.height,bottom:r.bottom}; };
          const context = document.querySelector('#contextPanel');
          const rail = document.querySelector('.market-supplement-rail');
          const action = document.querySelector('.market-decision-action button');
          const grid = document.querySelector('.market-grid')?.getBoundingClientRect();
          return {
            cell: box('.market-cell'), status: box('#status'), context: box('#contextPanel'), controls: box('.controls'),
            undo: box('.market-decision-undo-slot #undoBtn'), actionButton: box('.market-decision-action button'),
            supplementCards: [...document.querySelectorAll('.market-supplement-card')].map(node => {
              const r = node.getBoundingClientRect(); return {x:r.x,right:r.right,width:r.width,height:r.height};
            }),
            rail: box('.market-supplement-rail'), actions: box('.market-decision-actions'),
            gridContextGap: grid && context ? context.getBoundingClientRect().top - grid.bottom : null,
            contextOverflow: context ? context.scrollHeight - context.clientHeight : null,
            railOverflow: rail ? rail.scrollWidth - rail.clientWidth : null,
            railDisplay: rail ? getComputedStyle(rail).display : null,
            controlsDisplay: getComputedStyle(document.querySelector('.controls')).display,
            actionsDisplay: getComputedStyle(document.querySelector('.market-decision-actions')).display,
            completionEmbedded: document.querySelector('.market-decision-actions > #completionBar') !== null,
            actionDisabled: action ? action.disabled : null,
            summary: document.querySelector('.market-decision-summary')?.textContent.trim() || '',
            action: document.querySelector('.market-decision-action')?.textContent.trim() || ''
          };
        }"""
    )


def assert_layout(page, stage, width, height, rows):
    data = metrics(page)
    assert data["document"]["width"] <= width, (stage, "horizontal overflow", data)
    assert data["document"]["height"] <= height, (stage, "vertical overflow", data)
    if height == 640:
        for key in (".topbar", ".goalbox", "#words", ".mapwrap", "#status", ".controls"):
            box = data["key"].get(key)
            assert not box or box["bottom"] <= 620.5, (stage, key, box, data)
    small = [button for button in data["buttons"] if button["width"] < 44 or button["height"] < 44]
    assert not small, (stage, "visible button<44", small)
    rows.append({"stage": stage, "viewport": [width, height], **data})
    return data


def stage_state(page):
    return page.evaluate("({hero: [...state.hero], focus: state.market?.focus, market: state.market})")


def cell(page, pos):
    return page.locator(f'.market-cell[data-row="{pos[0]}"][data-col="{pos[1]}"]')


def click_cell(page, pos):
    cell(page, pos).click()
    page.wait_for_timeout(15)


def move_to_adjacent(page, target):
    snapshot = page.evaluate(
        """() => ({
          hero: [...state.hero], rows: current().grid.length,
          cols: current().grid[0].length,
          blocked: [...document.querySelectorAll('.market-location')]
            .map(node => [+node.dataset.row, +node.dataset.col])
        })"""
    )
    start = tuple(snapshot["hero"])
    blocked = {tuple(pos) for pos in snapshot["blocked"]}
    blocked.discard(start)
    goals = {
        (target[0] + dr, target[1] + dc)
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1))
        if 0 <= target[0] + dr < snapshot["rows"]
        and 0 <= target[1] + dc < snapshot["cols"]
        and (target[0] + dr, target[1] + dc) not in blocked
    }
    queue = deque([(start, [])])
    seen = {start}
    route = None
    while queue:
        pos, path = queue.popleft()
        if pos in goals:
            route = path
            break
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nxt = (pos[0] + dr, pos[1] + dc)
            if not (0 <= nxt[0] < snapshot["rows"] and 0 <= nxt[1] < snapshot["cols"]):
                continue
            if nxt in blocked or nxt in seen:
                continue
            seen.add(nxt)
            queue.append((nxt, path + [nxt]))
    assert route is not None, ("no orthogonal route", start, target, blocked)
    for pos in route:
        click_cell(page, pos)
    assert tuple(stage_state(page)["hero"]) in goals, ("could not reach adjacent cell", stage_state(page), goals, target)


def inspect(page, pos):
    click_cell(page, pos)
    assert page.locator(".market-panel").count(), ("panel missing", pos)


def action(page, label=None, action_type=None, location=None, item=None):
    selector = ".market-panel-actions button:not([disabled])"
    if action_type:
        selector = f'[data-market-action="{action_type}"][data-location="{location}"]'
        if item:
            selector += f'[data-item="{item}"]'
        selector += ":not([disabled])"
    button = page.locator(selector)
    if label:
        button = button.filter(has_text=label)
    assert button.count(), ("action not visible", label, action_type, location, item, metrics(page))
    button.first.click()
    page.wait_for_timeout(25)


def inspect_and_action(page, pos, action_type, location, item=None):
    move_to_adjacent(page, pos)
    inspect(page, pos)
    action(page, action_type=action_type, location=location, item=item)


def solve_stage(page, stage):
    if stage == "market-stage-1":
        inspect(page, [0, 0]); inspect(page, [0, 4])
        inspect_and_action(page, [4, 2], "take", "merchant", "flour")
        inspect_and_action(page, [0, 0], "put", "bread-stall", "flour")
    elif stage == "market-stage-2":
        move_to_adjacent(page, [0, 2])
        inspect(page, [0, 2])
        assert page.locator("[data-market-inference-confirm]").count()
        page.locator("[data-market-inference-confirm]").click(); page.wait_for_timeout(20)
        inspect_and_action(page, [0, 2], "take", "merchant", "oil")
        action(page, action_type="take", location="merchant", item="oil")
        inspect_and_action(page, [4, 2], "put", "warehouse", "oil")
        action(page, action_type="put", location="warehouse", item="oil")
    elif stage == "market-stage-3":
        move_to_adjacent(page, [0, 4]); inspect(page, [0, 4])
        tray = m3_tray_metrics(page)
        assert 135 <= tray["actionButton"]["width"] <= 137 and tray["actionDisabled"] is False, tray
        action(page, action_type="exchange", location="rope-stall")
        move_to_adjacent(page, [0, 0]); inspect(page, [0, 0])
        tray = m3_tray_metrics(page)
        assert 103 <= tray["actionButton"]["width"] <= 105 and tray["actionDisabled"] is False, tray
        action(page, action_type="put", location="merchant", item="rope")
    elif stage == "market-stage-4":
        for pos in ([0, 0], [0, 4], [4, 4]): inspect(page, pos)
        inspect_and_action(page, [0, 0], "buy", "vegetable-stall")
        inspect_and_action(page, [0, 4], "buy", "bread-shop")
        inspect_and_action(page, [4, 0], "put", "innkeeper", "vegetable")
        action(page, action_type="put", location="innkeeper", item="bread")
    elif stage == "market-stage-5":
        inspect(page, [0, 0]); inspect(page, [0, 4])
        inspect_and_action(page, [0, 4], "choose", "large-crate")
        inspect_and_action(page, [2, 2], "take", "cargo", "package")
        action(page, action_type="take", location="cargo", item="package")
        action(page, action_type="take", location="cargo", item="package")
        inspect_and_action(page, [4, 2], "put", "destination", "package")
        action(page, action_type="put", location="destination", item="package")
        action(page, action_type="put", location="destination", item="package")
    elif stage == "market-stage-6":
        inspect(page, [0, 0]); inspect(page, [0, 4])
        inspect_and_action(page, [0, 0], "choose", "flour-load")
        inspect_and_action(page, [0, 0], "take", "flour-load", "flour")
        inspect_and_action(page, [4, 0], "put", "bakery", "flour")
    elif stage == "market-stage-7":
        for pos in ([0, 0], [0, 5], [4, 0], [2, 3]): inspect(page, pos)
        for _ in range(3):
            if _ == 0: inspect_and_action(page, [2, 3], "take", "late-goods", "flour")
            else: action(page, action_type="take", location="late-goods", item="flour")
        for _ in range(2):
            if _ == 0: inspect_and_action(page, [0, 0], "put", "bakery", "flour")
            else: action(page, action_type="put", location="bakery", item="flour")
        inspect_and_action(page, [0, 5], "put", "noodle-stall", "flour")
        for _ in range(3):
            if _ == 0: inspect_and_action(page, [2, 3], "take", "late-goods", "oil")
            else: action(page, action_type="take", location="late-goods", item="oil")
        for _ in range(3):
            if _ == 0: inspect_and_action(page, [4, 0], "put", "oil-stall", "oil")
            else: action(page, action_type="put", location="oil-stall", item="oil")
        inspect_and_action(page, [2, 3], "take", "late-goods", "cloth")
        inspect_and_action(page, [4, 5], "put", "warehouse", "cloth")
    elif stage == "market-stage-8":
        # Natural M8 completion: carry -> put -> exchange -> buy, all through UI.
        for pos in ([0, 0], [4, 0], [0, 4], [2, 5], [0, 2], [2, 0], [1, 5]): inspect(page, pos)
        inspect_and_action(page, [2, 0], "take", "late-goods", "cloth")
        inspect_and_action(page, [0, 2], "exchange", "rope-stall")
        inspect_and_action(page, [0, 4], "put", "market-tent", "rope")
        for _ in range(2):
            if _ == 0: inspect_and_action(page, [2, 0], "take", "late-goods", "flour")
            else: action(page, action_type="take", location="late-goods", item="flour")
        for _ in range(2):
            if _ == 0: inspect_and_action(page, [0, 0], "put", "bakery", "flour")
            else: action(page, action_type="put", location="bakery", item="flour")
        inspect_and_action(page, [2, 0], "take", "late-goods", "oil")
        inspect_and_action(page, [4, 0], "put", "oil-stall", "oil")
        inspect_and_action(page, [1, 5], "buy", "vegetable-stall")
        inspect_and_action(page, [2, 5], "put", "inn", "vegetable")
    else:
        raise AssertionError(stage)


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
            print(f"viewport {width}x{height}", flush=True)
            context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1, is_mobile=True, has_touch=True)
            page = context.new_page()
            errors, missing = [], []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("response", lambda response: missing.append(response.url) if response.status >= 400 and "favicon" not in response.url else None)
            page.goto(url)
            page.wait_for_function("!!window.TacticalGame")
            for stage in STAGES:
                print(f"  stage {stage}", flush=True)
                page.evaluate("id => TacticalGame.playStage(id, {mode: 'replay'})", stage)
                page.wait_for_function("id => TacticalGame.stageId() === id", arg=stage)
                page.wait_for_timeout(35)
                initial = assert_layout(page, stage + ":initial", width, height, rows)
                if stage == "market-stage-4":
                    assert page.locator(".controls > #undoBtn").count() == 1, "M3 embedded undo did not return to shared controls"
                # Far selection state: selecting a remote location shows facts/quantity
                # without silently moving the hero.
                # The first authored location is remote from each M1-M8 start;
                # the last one is adjacent in M1 and would skip the far state.
                remote = page.locator(".market-location").first
                remote.click(); page.wait_for_timeout(20)
                far = assert_layout(page, stage + ":far-selection", width, height, rows)
                # Initial and every subsequent state must preserve the board box.
                assert all(abs(initial["grid"][axis] - far["grid"][axis]) <= 1 for axis in ("x", "y", "width", "height")), (stage, initial, far)
                # A remote selection exposes the distance hint before the adjacent action.
                assert "가까이" in far["text"] or "인접" in far["text"] or "해" in far["text"], (stage, far)
                if stage == "market-stage-3":
                    tray = m3_tray_metrics(page)
                    assert tray["status"]["height"] <= 1, tray
                    assert tray["context"]["height"] >= 140, tray
                    assert tray["contextOverflow"] <= 1, tray
                    assert tray["railOverflow"] <= 1, tray
                    assert "繩子 0/1" in tray["summary"], tray
                    assert "인접 필요" in tray["summary"], tray
                    assert tray["controlsDisplay"] == "none", tray
                    assert 99 <= tray["undo"]["width"] <= 101 and tray["undo"]["height"] >= 44, tray
                    assert 103 <= tray["actionButton"]["width"] <= 105 and tray["actionButton"]["height"] >= 44, tray
                    assert tray["actionDisabled"] is True, tray
                    assert tray["gridContextGap"] >= 8, tray
                    assert len(tray["supplementCards"]) == 2, tray
                    expected_card_width = (tray["rail"]["width"] - 6) / 2
                    assert all(abs(card["width"] - expected_card_width) <= 1 for card in tray["supplementCards"]), tray
                    assert all(card["x"] >= tray["rail"]["x"] - 1 and card["right"] <= tray["rail"]["right"] + 1 for card in tray["supplementCards"]), tray
                    assert tray["actions"]["height"] >= 44, tray
                    if height <= 700:
                        assert tray["gridContextGap"] <= 12, tray
                        assert 44 <= tray["cell"]["width"] <= 46.5, tray
                        assert tray["undo"]["bottom"] <= 620.5, tray
                    page.screenshot(path=str(OUT / f"{stage}-selection-{width}x{height}.png"), full_page=True)
                solve_stage(page, stage)
                page.locator("#flowNext").wait_for(state="visible", timeout=2500)
                complete = assert_layout(page, stage + ":complete", width, height, rows)
                assert complete["win"], (stage, "not naturally complete", complete)
                assert all(abs(initial["grid"][axis] - complete["grid"][axis]) <= 1 for axis in ("x", "y", "width", "height")), (stage, initial, complete)
                assert any(token in complete["text"] for token in ("數量", "價格", "交換", "選擇", "分配", "購買", "買", "짐", "수량")), (stage, complete)
                if stage == "market-stage-3":
                    tray = m3_tray_metrics(page)
                    assert tray["contextOverflow"] <= 1, tray
                    assert tray["railDisplay"] == "none", tray
                    assert tray["actionsDisplay"] == "flex", tray
                    assert tray["completionEmbedded"] is True, tray
                page.screenshot(path=str(OUT / f"{stage}-{width}x{height}.png"), full_page=True)
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
    "max_document_height": max(row["document"]["height"] for row in rows),
    "max_document_width": max(row["document"]["width"] for row in rows),
    "min_button_width": min(button["width"] for row in rows for button in row["buttons"]),
    "min_button_height": min(button["height"] for row in rows for button in row["buttons"]),
    "output": str(OUT),
}
print(json.dumps(summary, ensure_ascii=False))
