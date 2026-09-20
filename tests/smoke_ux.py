"""Focused 375x812 browser UX regression for tactical information hierarchy and flow.

Requires Python Playwright and Chromium.
Run: python tests/smoke_ux.py
Optional: CHROMIUM_PATH=/path/to/chromium TEST_OUTPUT=/path/to/screenshots
"""
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-ux'))
OUT.mkdir(parents=True, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
    def translate_path(self, request_path):
        request_path = request_path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        if not request_path.startswith(prefix): return str(ROOT / '__missing__')
        return str(ROOT / request_path[len(prefix):])

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'

def box(page, selector): return page.locator(selector).first.evaluate('(el)=>el.getBoundingClientRect().toJSON()')

def visible_layout(page):
    selectors = {'topbar':'.topbar','goal':'.goalbox','board':'.mapwrap','grid':'#grid','status':'#status','context':'#contextPanel','completion':'#completionBar','words':'#words','controls':'.controls'}
    result = {'viewport':{'width':page.evaluate('innerWidth'),'height':page.evaluate('innerHeight')},'document':{'width':page.evaluate('document.documentElement.scrollWidth'),'height':page.evaluate('document.documentElement.scrollHeight')}}
    for name, selector in selectors.items():
        locator = page.locator(selector).first
        if locator.count() and locator.is_visible(): result[name] = box(page, selector)
    return result

def assert_tactical_viewport(layout, *, max_vertical_scroll=0):
    viewport, document = layout['viewport'], layout['document']
    assert document['width'] <= viewport['width'], layout
    assert max(0, document['height'] - viewport['height']) <= max_vertical_scroll, layout
    for name in ('goal','words','grid','status'):
        item = layout[name]
        assert item['x'] >= 0 and item['x'] + item['width'] <= viewport['width'] + 1, (name, layout)
        assert item['y'] >= 0 and item['y'] + item['height'] <= document['height'] + 1, (name, layout)
    assert layout['goal']['y'] < layout['words']['y'] < layout['grid']['y'] < layout['status']['y'], layout
    if 'controls' in layout: assert layout['status']['y'] < layout['controls']['y'], layout

def assert_touch_targets(page, selector):
    targets = page.locator(selector).evaluate_all('''nodes => nodes.filter(node => { const style=getComputedStyle(node), box=node.getBoundingClientRect(); return style.display!=='none'&&style.visibility!=='hidden'&&box.width&&box.height; }).map(node => { const box=node.getBoundingClientRect(); return {text:node.textContent.trim(),width:box.width,height:box.height,className:node.className}; })''')
    assert targets, selector
    assert all(item['width'] >= 44 and item['height'] >= 44 for item in targets), targets
    return targets

VIEWPORTS = [(375,812), (375,667), (375,640), (360,640)]

def layout_measurement(page, state):
    layout = visible_layout(page)
    targets = page.locator('button:visible, [role="button"]:visible').evaluate_all('''nodes => nodes.map(node => {
      const rect=node.getBoundingClientRect(); return {text:(node.innerText||node.getAttribute('aria-label')||'').trim(), ariaLabel:node.getAttribute('aria-label'), x:rect.x,y:rect.y,width:rect.width,height:rect.height};
    })''')
    core = [layout[name] for name in ('topbar','goal','words','board','grid','status','context','completion','controls') if name in layout]
    layout['state'] = state
    layout['coreUiSpan'] = max(item['y'] + item['height'] for item in core) - min(item['y'] for item in core)
    layout['touchTargets'] = targets
    return layout

def capture_layout_matrix(browser, output_dir):
    measurements = []
    for width, height in VIEWPORTS:
        context = browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=True,has_touch=True)
        page = context.new_page(); page.set_default_timeout(5000)
        page.goto(url); page.wait_for_function('!!window.GameFlow && !!window.TacticalGame && !!window.UXPlay')
        def capture(stage, state):
            measurement = layout_measurement(page, f'{stage}:{state}')
            measurements.append(measurement)
            page.screenshot(path=str(output_dir / f'{stage}-{state}-{width}x{height}.png'), full_page=True)
        page.evaluate('TacticalGame.playStage("gate-stage-1",{mode:"replay",returnTo:"journey"})')
        capture('g1', 'entry')
        page.locator('#grid .cell').nth(0).click()
        capture('g1', 'after-action')
        page.evaluate('TacticalGame.playStage("workshop-stage-2",{mode:"replay",returnTo:"journey"})')
        capture('w2', 'entry')
        page.locator('#status .statusMeaningBtn').click()
        capture('w2', 'meaning-open')
        page.locator('#status .statusMeaningBtn').click()
        page.locator('[data-workshop-action="step-down"]').first.click()
        capture('w2', 'after-action')
        page.evaluate('TacticalGame.playStage("market-stage-8",{mode:"replay",returnTo:"journey"})')
        capture('m8', 'entry')
        locations = page.locator('.market-location')
        farthest = locations.evaluate_all('''nodes => nodes.reduce((best,node,index) => { const r=+node.dataset.row,c=+node.dataset.col,d=Math.abs(r-1)+Math.abs(c-2); return d>best.d ? {d,index} : best; }, {d:-1,index:0}).index''')
        locations.nth(farthest).click()
        capture('m8', 'far-selection')
        page.locator('.market-cell[data-row="1"][data-col="2"]').click()
        page.locator('.market-cell[data-row="0"][data-col="2"]').click()
        capture('m8', 'adjacent-action')
        page.evaluate('GameFlow.showStageComplete("market-stage-8",{mode:"replay",returnTo:"journey"})')
        capture('m8', 'complete')
        context.close()
    return measurements

def assert_layout_matrix(measurements):
    assert len(measurements) == len(VIEWPORTS) * 9, len(measurements)
    boards = {}
    for item in measurements:
        viewport, document = item['viewport'], item['document']
        assert document['width'] <= viewport['width'], item
        assert document['height'] <= viewport['height'], item
        assert all(target['width'] >= 44 and target['height'] >= 44 for target in item['touchTargets']), item['touchTargets']
        stage, state = item['state'].split(':', 1)
        boards.setdefault((viewport['width'], viewport['height'], stage), []).append(item['board'])
        if viewport == {'width': 375, 'height': 640}:
            assert item['coreUiSpan'] <= 620, item
    for key, boxes in boards.items():
        reference = boxes[0]
        for candidate in boxes[1:]:
            assert all(abs(reference[dimension] - candidate[dimension]) <= 1 for dimension in ('x','y','width','height')), (key, reference, candidate)

try:
    with sync_playwright() as pw:
        executable = os.environ.get('CHROMIUM_PATH')
        launch = {'args':['--no-sandbox']}
        if executable: launch['executable_path'] = executable
        browser = pw.chromium.launch(**launch)
        measurement_path = os.environ.get('LAYOUT_MEASUREMENT_PATH')
        if measurement_path:
            measurement_output = Path(os.environ.get('LAYOUT_SCREENSHOT_DIR', '/tmp/cwt-layout-baseline-before'))
            measurement_output.mkdir(parents=True, exist_ok=True)
            measurement = capture_layout_matrix(browser, measurement_output)
            Path(measurement_path).write_text(json.dumps(measurement, ensure_ascii=False, indent=2))
            assert_layout_matrix(measurement)
        context = browser.new_context(viewport={'width':375,'height':812},device_scale_factor=1,is_mobile=True,has_touch=True)
        page = context.new_page(); page.set_default_timeout(5000)
        errors, missing = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: missing.append(response.url) if response.status >= 400 and 'favicon' not in response.url else None)
        page.goto(url); page.wait_for_function('!!window.GameFlow && !!window.TacticalGame && !!window.UXPlay')

        assert page.locator('#landingView').is_visible() and not page.locator('#tutorialView').is_visible()
        assert page.locator('#landingTitle').inner_text() == '따라온 단어들'
        assert page.locator('#landingPrimary').inner_text() == '여행 시작'
        assert page.locator('.landingScene').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert_touch_targets(page, '#landingPrimary:visible')
        page.screenshot(path=str(OUT/'ux-00-title-375x812.png'),full_page=True)

        page.evaluate('TacticalGame.playStage("gate-stage-1",{mode:"replay",returnTo:"journey"})')
        layout = visible_layout(page); assert_tactical_viewport(layout)
        assert layout['goal']['height'] <= 72, layout
        assert page.locator('#ruleLine').evaluate('(el)=>getComputedStyle(el).display') == 'none'
        assert page.locator('#goalDetailBtn').is_visible()
        assert_touch_targets(page, '.wordbtn:visible, .control:visible, .iconbtn:visible, #goalDetailBtn:visible')
        page.screenshot(path=str(OUT/'ux-01-gate-g1-entry-375x812.png'),full_page=True)
        print('UX_LAYOUT_GATE_G1',json.dumps(layout,ensure_ascii=False),flush=True)

        # Learning feedback is Chinese-first. Each new message starts with Korean hidden.
        page.evaluate('setStatus("風量增加了，但還不夠。 바람이 늘었지만 아직 부족해.","good")')
        assert page.locator('#status .statusZh').inner_text() == '風量增加了，但還不夠。'
        assert page.locator('#status .statusMeaningBtn').inner_text() == '뜻'
        assert page.locator('#status .statusKo').is_hidden()
        assert_touch_targets(page, '#status .statusMeaningBtn:visible')
        page.screenshot(path=str(OUT/'ux-02-feedback-meaning-closed-375x812.png'),full_page=True)
        page.locator('#status .statusMeaningBtn').click()
        assert page.locator('#status .statusKo').is_visible()
        assert page.locator('#status .statusKo').inner_text() == '바람이 늘었지만 아직 부족해.'
        assert page.locator('#status .statusMeaningBtn').inner_text() == '접기'
        page.evaluate('setStatus("水量增加了。 물이 늘었어.","good")')
        assert page.locator('#status .statusKo').is_hidden()
        assert page.locator('#status .statusMeaningBtn').inner_text() == '뜻'
        page.screenshot(path=str(OUT/'ux-02-feedback-new-message-reset-375x812.png'),full_page=True)
        # Korean-only usability/system feedback stays immediate and gets no translation control.
        page.evaluate('setStatus("진행 상태를 저장하지 못했어.","bad")')
        assert page.locator('#status .statusMeaningBtn').count() == 0
        assert '진행 상태를 저장하지 못했어.' in page.locator('#status').inner_text()

        page.evaluate('TacticalGame.playStage("workshop-stage-2",{mode:"replay",returnTo:"journey"})')
        workshop_layout = visible_layout(page); assert_tactical_viewport(workshop_layout)
        assert workshop_layout['goal']['height'] <= 72, workshop_layout
        assert_touch_targets(page,'.workshop-device-controls button:visible, .wordbtn:visible, .control:visible, .iconbtn:visible, #goalDetailBtn:visible')
        page.screenshot(path=str(OUT/'ux-01-workshop-w2-entry-375x812.png'),full_page=True)
        print('UX_LAYOUT_WORKSHOP_W2',json.dumps(workshop_layout,ensure_ascii=False),flush=True)

        page.evaluate('TacticalGame.playStage("market-stage-8",{mode:"replay",returnTo:"journey"})')
        market_layout = visible_layout(page); assert_tactical_viewport(market_layout)
        assert market_layout['goal']['height'] <= 72, market_layout
        assert page.locator('#goal').inner_text() == '開市以前，補齊各處需要的東西。'
        assert 'context' in market_layout and market_layout['context']['y'] > market_layout['status']['y'], market_layout
        assert page.locator('#grid .market-panel').count() == 0 and page.locator('#contextPanel .market-panel').count() == 1
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert_touch_targets(page,'.market-cell:visible, .wordbtn:visible, .control:visible, .iconbtn:visible, #goalDetailBtn:visible')
        page.screenshot(path=str(OUT/'ux-01-market-m8-entry-375x812.png'),full_page=True)
        print('UX_LAYOUT_MARKET_M8',json.dumps(market_layout,ensure_ascii=False),flush=True)

        assert page.locator('#inspectBtn').is_hidden()
        page.evaluate('inspect=true; render()')
        assert page.evaluate('inspect') is False
        assert page.locator('#inspectBtn').is_hidden()
        assert page.locator('.market-floor.moveable').count() > 0

        location_count=page.locator('.market-location').count(); selected_layouts=[]
        for index in range(location_count):
            cell=page.locator('.market-location').nth(index); label=cell.get_attribute('aria-label') or f'location-{index}'; cell.click(); selected=visible_layout(page)
            assert page.locator('#contextPanel .market-panel-actions').count() == 0, label
            assert '가까이 가면' in page.locator('#contextPanel .market-action-hint').inner_text(), label
            assert selected['document']['width'] <= selected['viewport']['width'],(label,selected)
            assert selected['context']['y'] >= selected['status']['y'] + selected['status']['height'],(label,selected)
            overflow=max(0,selected['document']['height']-selected['viewport']['height']); assert overflow <= 240,(label,selected)
            selected_layouts.append({'index':index,'label':label,'overflow':overflow,'contextHeight':selected['context']['height']})
        worst=max(selected_layouts,key=lambda item:(item['overflow'],item['contextHeight'])); page.locator('.market-location').nth(worst['index']).click()
        page.screenshot(path=str(OUT/'ux-02-market-m8-selected-context-375x812.png'),full_page=True)
        print('UX_MARKET_SELECTED',json.dumps(selected_layouts,ensure_ascii=False),flush=True)

        page.locator('.market-cell[data-row="1"][data-col="2"]').click()
        page.locator('.market-cell[data-row="0"][data-col="2"]').click()
        assert page.locator('#contextPanel .market-panel-actions').count() == 1
        assert page.locator('#contextPanel [data-market-action="exchange"]').count() == 1

        page.evaluate('GameFlow.showStageComplete("market-stage-8",{mode:"replay",returnTo:"journey"})')
        assert page.locator('#completionBar').is_visible() and page.locator('#flowNext').is_visible()
        assert not page.locator('#scrim').evaluate('(el)=>el.classList.contains("open")')
        assert page.locator('#grid').is_visible() and not page.locator('.controls').is_visible()
        assert_touch_targets(page,'#flowNext:visible'); page.screenshot(path=str(OUT/'ux-05-inline-completion-375x812.png'),full_page=True)

        # Only ordinary region sequences use the multi-story handoff contract; quest locations own quests[] instead.
        flow_flags=page.evaluate('''() => Object.fromEntries(JourneyContent.JOURNEY.flatMap(ch=>ch.sections).filter(s=>s.regionId && Array.isArray(s.sequence) && !s.hiddenFromJourney).map(section=>[section.id,section.sequence.filter(n=>n.type==='story').map(n=>[n.id,!!n.returnToWorldAfter])]))''')
        for region, stories in flow_flags.items():
            assert len(stories)>1,(region,stories); assert all(not flag for _,flag in stories[:-1]),(region,stories); assert stories[-1][1] is True,(region,stories)
        print('UX_REGION_FLOW',json.dumps(flow_flags,ensure_ascii=False),flush=True)

        page.evaluate('localStorage.clear(); location.reload()')
        page.wait_for_function('!!window.GameFlow && !!window.UXPlay && document.querySelector("#landingView") && !document.querySelector("#landingView").hidden')
        assert page.locator('#landingPrimary').inner_text() == '여행 시작'
        page.locator('#landingPrimary').click()
        page.wait_for_function('document.querySelector("#storyView") && !document.querySelector("#storyView").hidden')
        while page.locator('#storyView').is_visible():
            label=page.locator('#storyNext').inner_text()
            if label=='스테이지 시작': break
            page.locator('#storyNext').click()
        assert page.locator('#storyNext').inner_text()=='스테이지 시작'; page.locator('#storyNext').click()
        assert page.locator('#tutorialView').is_visible() and page.evaluate('current().id')=='stage-0' and not page.locator('#journeyView').is_visible()
        page.screenshot(path=str(OUT/'ux-08-story-to-stage-375x812.png'),full_page=True)

        page.locator('.cell:has(.hero)').click()
        for index in [7,4,1]: page.locator('#grid .cell').nth(index).click()
        page.locator('#completionBar').wait_for(state='visible')
        assert page.locator('#flowNext').inner_text()=='다음 판 시작'
        assert page.evaluate('JSON.parse(localStorage.getItem("chinese-word-tactics-pending-completion-v1")).stageId')=='stage-0'
        page.screenshot(path=str(OUT/'ux-11-stage0-complete-before-refresh-375x812.png'),full_page=True)

        page.reload(); page.wait_for_function('!!window.GameFlow && !!window.UXPlay && document.querySelector("#landingView") && !document.querySelector("#landingView").hidden')
        assert page.locator('#landingPrimary').inner_text() == '이어서 여행하기'
        page.locator('#landingPrimary').click()
        page.wait_for_function('document.querySelector("#tutorialView") && !document.querySelector("#tutorialView").hidden')
        assert page.evaluate('current().id')=='stage-0' and page.locator('#completionBar').is_visible()
        assert page.locator('#status').evaluate('(el)=>el.classList.contains("good")')
        assert page.evaluate('JSON.parse(localStorage.getItem("chinese-word-tactics-pending-completion-v1")).stageId')=='stage-0'
        page.screenshot(path=str(OUT/'ux-11-stage0-complete-after-refresh-375x812.png'),full_page=True)
        page.locator('#flowNext').click(); assert page.locator('#tutorialView').is_visible() and page.evaluate('current().id')=='stage-1'
        assert page.evaluate('localStorage.getItem("chinese-word-tactics-pending-completion-v1")') is None

        assert not errors,errors; assert not missing,missing
        context.close(); browser.close()
finally:
    server.shutdown()

print(f'PASS: compact mobile UX browser smoke. Screenshots: {OUT}')
