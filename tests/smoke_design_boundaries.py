"""A09a browser regression for travel-menu and settings boundary language."""
import http.server
import json
import os
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-design-boundaries'))
OUT.mkdir(parents=True, exist_ok=True)
VIEWPORTS = [(375, 812), (375, 667), (375, 640), (360, 640)]
JOURNEY_KEY = 'chinese-word-tactics-journey-v1'


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, request_path):
        path = request_path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        target = (ROOT / (path[len(prefix):] if path.startswith(prefix) else '__missing__')).resolve()
        return str(target if target.is_relative_to(ROOT) else ROOT / '__missing__')


def progress(*, stages=(), location=None):
    return {
        'seenStories': [],
        'completedStages': list(stages),
        'completedMilestones': [],
        'acknowledgedNodes': [],
        'stageOutcomes': {},
        'lastLocation': location,
    }


def reset(page, value=None):
    page.evaluate(
        """({key,value}) => {
          localStorage.clear();
          if (value) localStorage.setItem(key, JSON.stringify(value));
        }""",
        {'key': JOURNEY_KEY, 'value': value},
    )
    page.reload()
    page.wait_for_function('!!window.GameFlow && !!window.TacticalGame && !!window.SettingsRuntime')


def visible_boxes(page, selector):
    boxes = page.locator(selector).evaluate_all("""nodes => nodes.filter(node => {
      const style = getComputedStyle(node), box = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && box.width && box.height;
    }).map(node => {
      const box = node.getBoundingClientRect();
      return {id:node.id,x:box.x,y:box.y,right:box.right,bottom:box.bottom,width:box.width,height:box.height};
    })""")
    assert boxes, selector
    return boxes


def assert_touch_targets(page, selector):
    boxes = visible_boxes(page, selector)
    assert all(box['width'] >= 44 and box['height'] >= 44 for box in boxes), boxes
    return boxes


def assert_no_overlap(page, selector):
    boxes = visible_boxes(page, selector)
    for index, first in enumerate(boxes):
        for second in boxes[index + 1:]:
            horizontal = min(first['right'], second['right']) - max(first['x'], second['x'])
            vertical = min(first['bottom'], second['bottom']) - max(first['y'], second['y'])
            assert horizontal <= 0 or vertical <= 0, (first, second)


def style_rows(page, selector):
    return page.locator(selector).evaluate_all("""nodes => nodes.map(node => {
      const style = getComputedStyle(node);
      return {id:node.id,disabled:!!node.disabled,background:style.backgroundColor,color:style.color,
        radius:style.borderRadius,top:style.borderTopWidth,right:style.borderRightWidth,
        bottom:style.borderBottomWidth,left:style.borderLeftWidth,shadow:style.boxShadow,opacity:style.opacity};
    })""")


def assert_focus_ring(page, selector):
    target = page.locator(selector)
    for _ in range(120):
        page.keyboard.press('Tab')
        if target.evaluate('node => node === document.activeElement'):
            break
    else:
        raise AssertionError(f'keyboard focus did not reach {selector}')
    style = target.evaluate("""node => {
      const value = getComputedStyle(node); return {style:value.outlineStyle,width:value.outlineWidth};
    }""")
    assert style == {'style': 'solid', 'width': '3px'}, (selector, style)


def capture(page, name, width, height):
    page.evaluate('document.fonts.ready')
    page.screenshot(path=str(OUT / f'{name}-{width}x{height}.png'), full_page=True)


def assert_travel_menu(page):
    rows = style_rows(page, '.flowTravelMenu button')
    assert len(rows) == 6, rows
    for index, row in enumerate(rows):
        assert row['background'] == 'rgba(0, 0, 0, 0)', row
        assert row['radius'] == '0px', row
        assert row['left'] == row['right'] == row['bottom'] == '0px', row
        assert row['top'] == ('0px' if index == 0 else '1px'), row
    assert page.locator('#flowWorld').is_disabled()
    assert next(row for row in rows if row['id'] == 'flowWorld')['opacity'] == '0.72'
    assert_touch_targets(page, '.flowTravelMenu button, #flowMenuClose')
    assert_no_overlap(page, '.flowTravelMenu button, #flowMenuClose')
    assert_focus_ring(page, '#flowJourney')
    assert_focus_ring(page, '#flowMenuClose')
    assert page.locator('#flowMenuClose').get_attribute('data-action-role') == 'close'
    assert page.locator('#flowMenuClose').evaluate('node => getComputedStyle(node).backgroundColor') == 'rgb(233, 227, 216)'
    assert page.locator('#sheet').evaluate('node => node.scrollWidth <= node.clientWidth + 1')


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'

try:
    with sync_playwright() as playwright:
        launch = {'args': ['--no-sandbox']}
        if os.environ.get('CHROMIUM_PATH'):
            launch['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = playwright.chromium.launch(**launch)

        for width, height in VIEWPORTS:
            context = browser.new_context(
                viewport={'width': width, 'height': height}, device_scale_factor=1,
                is_mobile=True, has_touch=True,
            )
            page = context.new_page()
            page.set_default_timeout(8000)
            errors, missing = [], []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('response', lambda response: missing.append(response.url)
                    if response.status >= 400 and 'favicon' not in response.url else None)
            page.goto(URL)
            page.wait_for_function('!!window.GameFlow && !!window.TacticalGame && !!window.SettingsRuntime')

            # The story menu is one sheet with an open list, not six nested cards.
            reset(page)
            page.locator('#landingPrimary').click()
            page.locator('#storyView').wait_for(state='visible')
            page.locator('#storyMenu').click()
            assert_travel_menu(page)
            capture(page, 'a09a-menu-focus-from-story', width, height)
            page.evaluate('document.activeElement?.blur()')
            capture(page, 'a09a-menu-from-story', width, height)
            page.locator('#flowMenuClose').click()

            # The same contract applies when the tactical top bar opens the menu.
            reset(page, progress(stages=('stage-0',), location={'view': 'world'}))
            assert page.evaluate("GameFlow.playStage('stage-1')") is True
            page.locator('#menuBtn').click()
            assert_travel_menu(page)
            capture(page, 'a09a-menu-focus-from-tactical', width, height)
            page.evaluate('document.activeElement?.blur()')
            capture(page, 'a09a-menu-from-tactical', width, height)
            page.locator('#flowMenuClose').click()

            # Settings sections and ordinary rows are open; switch, state, and danger retain meaning.
            reset(page)
            page.locator('#landingSettings').click()
            sections = style_rows(page, '.settingsSection')
            assert len(sections) == 4, sections
            for index, section in enumerate(sections):
                assert section['background'] == 'rgba(0, 0, 0, 0)', section
                assert section['radius'] == '0px' and section['shadow'] == 'none', section
                assert section['left'] == section['right'] == section['bottom'] == '0px', section
                assert section['top'] == ('0px' if index == 0 else '1px'), section

            actions = style_rows(page, '#settingsExport, #settingsImport')
            for index, action in enumerate(actions):
                assert action['background'] == 'rgba(0, 0, 0, 0)', action
                assert action['radius'] == '0px', action
                assert action['left'] == action['right'] == action['bottom'] == '0px', action
                assert action['top'] == ('0px' if index == 0 else '1px'), action

            toggle = style_rows(page, '.settingsToggle')[0]
            assert toggle['background'] == 'rgba(0, 0, 0, 0)' and toggle['radius'] == '0px', toggle
            switch_radius = page.locator('#settingsPronunciation').evaluate('node => getComputedStyle(node).borderRadius')
            assert switch_radius == '999px', switch_radius
            assert_touch_targets(page, '#settingsBack, .settingsToggle, .settingsAction')
            assert_no_overlap(page, '.settingsToggle, .settingsAction')
            assert_focus_ring(page, '#settingsExport')
            capture(page, 'a09a-settings-focus', width, height)
            page.evaluate('document.activeElement?.blur()')
            capture(page, 'a09a-settings-base', width, height)
            page.locator('#settingsPronunciation').check()
            assert page.locator('#settingsPronunciation').is_checked()

            danger = style_rows(page, '#settingsReset')[0]
            assert danger['left'] == '2px' and danger['right'] == danger['top'] == danger['bottom'] == '0px', danger
            assert danger['background'] != 'rgba(0, 0, 0, 0)', danger
            capture(page, 'a09a-settings-selected', width, height)

            page.evaluate("""async () => {
              const backup = SaveData.createBackup(localStorage);
              await SettingsRuntime.inspectFile(new File([JSON.stringify(backup)], 'backup.json', {type:'application/json'}));
            }""")
            page.locator('#settingsRestorePreview').wait_for(state='visible')
            preview = style_rows(page, '#settingsRestorePreview')[0]
            assert preview['background'] != 'rgba(0, 0, 0, 0)', preview
            assert preview['left'] == preview['right'] == preview['top'] == preview['bottom'] == '1px', preview
            assert preview['radius'] == '14px', preview
            assert_touch_targets(page, '#settingsRestoreConfirm')
            capture(page, 'a09a-settings-restore-preview', width, height)

            page.evaluate("SettingsRuntime.inspectFile(new File(['not json'], 'bad.json', {type:'application/json'}))")
            page.locator('#settingsMessage').wait_for(state='visible')
            assert page.locator('#settingsRestorePreview').is_hidden()
            assert 'bad' in (page.locator('#settingsMessage').get_attribute('class') or '')
            capture(page, 'a09a-settings-invalid-file', width, height)

            page.evaluate('SettingsRuntime.open()')
            page.locator('#settingsReset').click()
            assert_touch_targets(page, '#flowResetCancel, #flowResetConfirm')
            assert_no_overlap(page, '#flowResetCancel, #flowResetConfirm')
            capture(page, 'a09a-settings-reset-confirm', width, height)
            page.locator('#flowResetCancel').click()

            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert not errors, errors
            assert not missing, missing
            context.close()

        browser.close()
finally:
    server.shutdown()
    server.server_close()

print(f'PASS: A09a boundary regression ({len(VIEWPORTS)} viewports). Screenshots: {OUT}')
