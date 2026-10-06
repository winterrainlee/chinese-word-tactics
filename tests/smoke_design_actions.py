"""A01-A03 browser regression: touch targets, locked-place meaning, and sheet action hierarchy."""
import http.server
import json
import os
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-design-actions'))
OUT.mkdir(parents=True, exist_ok=True)
VIEWPORTS = [(375, 812), (375, 667), (375, 640), (360, 640)]
JOURNEY_KEY = 'chinese-word-tactics-journey-v1'
LEXICON_KEY = 'chinese-word-tactics-lexicon-v1'


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, request_path):
        path = request_path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        target = (ROOT / (path[len(prefix):] if path.startswith(prefix) else '__missing__')).resolve()
        return str(target if target.is_relative_to(ROOT) else ROOT / '__missing__')


def progress(*, stories=(), stages=(), milestones=(), location=None):
    return {
        'seenStories': list(stories),
        'completedStages': list(stages),
        'completedMilestones': list(milestones),
        'acknowledgedNodes': [],
        'stageOutcomes': {},
        'lastLocation': location,
    }


CORE_STORIES = (
    'gate-after-convoy', 'workshop-finale', 'market-after-m8',
    'chapter1-inn-convergence', 'chapter1-room-finale',
)
CORE_STAGES = (
    'stage-5',
    *(f'gate-stage-{index}' for index in range(1, 8)),
    *(f'workshop-stage-{index}' for index in range(1, 8)),
    *(f'market-stage-{index}' for index in range(1, 9)),
)
CORE_MILESTONES = ('inn-unlocked', 'gate-core', 'workshop-core', 'market-core', 'chapter1-complete')
STARTED = progress(stages=('stage-0',), location={'view': 'world'})
ARRIVAL = progress(stages=('stage-5',), location={'view': 'world'})
OFFER = progress(stories=CORE_STORIES, stages=CORE_STAGES, milestones=CORE_MILESTONES, location={'view': 'world'})
REPORT = progress(
    stories=(*CORE_STORIES, 'first-free-quest-accepted'),
    stages=(*CORE_STAGES, 'first-free-quest-forest'),
    milestones=CORE_MILESTONES,
    location={'view': 'world'},
)
BOARD = progress(
    stories=(*CORE_STORIES, 'first-free-quest-accepted', 'first-free-quest-return',
             'first-free-quest-report', 'quest-board-installed'),
    stages=(*CORE_STAGES, 'first-free-quest-forest'),
    milestones=(*CORE_MILESTONES, 'first-free-quest-completed', 'quest-board-unlocked'),
    location={'view': 'world'},
)
LEXICON = {'discovered': ['接近'], 'visitedStages': ['stage-1'], 'lastChapterId': None, 'lastRegionId': None}


def reset(page, value=None, lexicon=None):
    page.evaluate(
        """({journeyKey,lexiconKey,value,lexicon}) => {
          localStorage.clear();
          if (value) localStorage.setItem(journeyKey, JSON.stringify(value));
          if (lexicon) localStorage.setItem(lexiconKey, JSON.stringify(lexicon));
        }""",
        {'journeyKey': JOURNEY_KEY, 'lexiconKey': LEXICON_KEY, 'value': value, 'lexicon': lexicon},
    )
    page.reload()
    page.wait_for_function('!!window.GameFlow && !!window.TacticalGame && !!window.SettingsRuntime')


def visible_boxes(page, selector):
    boxes = page.locator(selector).evaluate_all("""nodes => nodes.filter(node => {
      const style = getComputedStyle(node), box = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && box.width && box.height;
    }).map(node => {
      const box = node.getBoundingClientRect();
      return {text:(node.getAttribute('aria-label') || node.textContent || '').trim(),
        x:box.x,y:box.y,right:box.right,bottom:box.bottom,width:box.width,height:box.height};
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


def background(page, selector):
    return page.locator(selector).evaluate('(node) => getComputedStyle(node).backgroundColor')


def assert_flow_navigation(page, view_id, current):
    nav = page.locator(f'#{view_id} .flowNav')
    nav.scroll_into_view_if_needed()
    snapshot = nav.evaluate("""node => {
      const rgb = value => (value.match(/[\d.]+/g) || []).slice(0,3).map(Number);
      const luminance = value => {
        const channels=rgb(value).map(item => item/255).map(item => item <= .04045 ? item/12.92 : ((item+.055)/1.055)**2.4);
        return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
      };
      const background=getComputedStyle(document.body).backgroundColor, backgroundLuminance=luminance(background);
      const style = getComputedStyle(node);
      return {
        display:style.display,gap:style.gap,position:style.position,borderTopWidth:style.borderTopWidth,
        buttons:[...node.querySelectorAll('button')].map(button => {
          const item = getComputedStyle(button), box = button.getBoundingClientRect();
          const textLuminance=luminance(item.color);
          return {flow:button.dataset.flow,current:button.getAttribute('aria-current'),width:box.width,height:box.height,
            background:item.backgroundColor,radius:item.borderRadius,borderTop:item.borderTopWidth,
            borderRight:item.borderRightWidth,borderBottom:item.borderBottomWidth,borderBottomColor:item.borderBottomColor,
            borderLeft:item.borderLeftWidth,fontWeight:Number(item.fontWeight),
            contrast:(Math.max(textLuminance,backgroundLuminance)+.05)/(Math.min(textLuminance,backgroundLuminance)+.05)};
        })
      };
    }""")
    assert snapshot['display'] == 'grid', snapshot
    assert snapshot['gap'] == '0px', snapshot
    assert snapshot['position'] == 'static', snapshot
    assert snapshot['borderTopWidth'] == '1px', snapshot
    assert [button['flow'] for button in snapshot['buttons']] == ['world', 'journey', 'words'], snapshot
    assert all(button['width'] >= 44 and button['height'] >= 44 for button in snapshot['buttons']), snapshot
    assert all(button['radius'] == '0px' and button['background'] == 'rgba(0, 0, 0, 0)'
               for button in snapshot['buttons']), snapshot
    assert all(button['contrast'] >= 4.5 for button in snapshot['buttons']), snapshot
    assert all(button['borderTop'] == '0px' and button['borderRight'] == '0px' and
               button['borderBottom'] == '2px' and button['borderLeft'] == '0px'
               for button in snapshot['buttons']), snapshot
    selected = [button for button in snapshot['buttons'] if button['current'] == 'page']
    assert len(selected) == 1 and selected[0]['flow'] == current, snapshot
    assert selected[0]['fontWeight'] >= 800, snapshot
    unselected = [button for button in snapshot['buttons'] if button['current'] != 'page']
    assert all(button['borderBottomColor'] != selected[0]['borderBottomColor'] for button in unselected), snapshot
    return snapshot


def capture(page, name, width, height):
    page.wait_for_timeout(500)
    page.evaluate('document.fonts.ready')
    page.screenshot(path=str(OUT / f'{name}-{width}x{height}.png'), full_page=True)


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

            # Returning landing: quiet record links retain their typography but both are real 44px targets.
            reset(page, STARTED, LEXICON)
            assert page.locator('#landingJourney').is_visible()
            assert page.locator('#landingWords').is_visible()
            assert_touch_targets(page, '#landingJourney, #landingWords')
            assert_no_overlap(page, '#landingJourney, #landingWords')
            capture(page, 'landing-returning', width, height)
            page.locator('#landingJourney').click()
            assert page.locator('#journeyView').is_visible()
            page.evaluate('GameFlow.showLanding()')
            page.locator('#landingWords').click()
            assert page.locator('#wordsView').is_visible()

            # The two first-request meaning helpers share the same touch contract and still toggle in place.
            reset(page, OFFER)
            page.evaluate('GameFlow.showWorld()')
            page.locator('.worldInnMarker').click()
            assert_touch_targets(page, '#firstQuestOfferMeaning')
            capture(page, 'first-free-quest-offer', width, height)
            page.locator('#firstQuestOfferMeaning').click()
            assert page.locator('#firstQuestOfferKo').is_visible()
            page.locator('#firstQuestLater').click()

            reset(page, REPORT)
            page.evaluate('GameFlow.showWorld()')
            page.locator('.worldInnMarker').click()
            assert_touch_targets(page, '#firstQuestReportMeaning')
            page.locator('#firstQuestReportMeaning').click()
            assert page.locator('#firstQuestReportKo').is_visible()
            page.locator('#firstQuestReportLater').click()

            # Equal board choices remain visually equal, larger than 44px, and stronger in purpose than close.
            reset(page, BOARD)
            page.evaluate('() => { GameFlow.showWorld(); NorthForestWorld.openBoardSheet(); }')
            board_actions = assert_touch_targets(page, '.questBoardAction')
            assert len(board_actions) == 2, board_actions
            assert_touch_targets(page, '#questBoardClose')
            assert_no_overlap(page, '.questBoardAction, #questBoardClose')
            note_styles = page.locator('.questBoardNote').evaluate_all("""nodes => nodes.map(node => {
              const style=getComputedStyle(node); return {background:style.backgroundColor,radius:style.borderRadius,
                borderTop:style.borderTopWidth,borderRight:style.borderRightWidth,
                borderBottom:style.borderBottomWidth,borderLeft:style.borderLeftWidth,shadow:style.boxShadow};
            })""")
            assert all(style['background'] != 'rgba(0, 0, 0, 0)' and style['radius'] == '5px' and
                       style['borderTop'] == '1px' and style['borderRight'] == '1px' and
                       style['borderBottom'] == '1px' and style['borderLeft'] == '1px' and
                       style['shadow'] == 'none' for style in note_styles), note_styles
            action_styles = page.locator('.questBoardAction').evaluate_all("""nodes => nodes.map(node => {
              const style=getComputedStyle(node), box=node.getBoundingClientRect();
              return {background:style.backgroundColor,color:style.color,height:box.height,width:box.width,
                radius:style.borderRadius,borderTop:style.borderTopWidth,borderRight:style.borderRightWidth,
                borderBottom:style.borderBottomWidth,borderLeft:style.borderLeftWidth,shadow:style.boxShadow};
            })""")
            assert len({tuple(style.values()) for style in action_styles}) == 1, action_styles
            assert all(style['background'] == 'rgba(0, 0, 0, 0)' and style['radius'] == '0px' and
                       style['borderTop'] == '1px' and style['borderRight'] == '0px' and
                       style['borderBottom'] == '0px' and style['borderLeft'] == '0px' and
                       style['shadow'] == 'none' and style['width'] >= 240 for style in action_styles), action_styles
            assert page.locator('#questBoardClose').get_attribute('data-action-role') == 'close'
            assert background(page, '#questBoardClose') == 'rgb(233, 227, 216)'
            assert background(page, '#questBoardClose') != 'rgb(45, 98, 72)'
            capture(page, 'quest-board', width, height)
            page.locator('.questBoardAction').first.click()
            assert page.locator('#storyView').is_visible() or page.locator('#tutorialView').is_visible()
            reset(page, BOARD)
            page.evaluate('() => { GameFlow.showWorld(); NorthForestWorld.openBoardSheet(); }')
            page.locator('#questBoardClose').click()
            assert 'open' not in (page.locator('#scrim').get_attribute('class') or '')

            # The three destinations read as one navigation area; current state uses a line, not three cards.
            reset(page, BOARD, LEXICON)
            page.evaluate('GameFlow.showWorld()')
            assert_flow_navigation(page, 'worldView', 'world')
            capture(page, 'flow-navigation-world', width, height)
            page.evaluate('GameFlow.showJourney()')
            assert_flow_navigation(page, 'journeyView', 'journey')
            capture(page, 'flow-navigation-journey', width, height)
            page.evaluate('GameFlow.showWords()')
            assert_flow_navigation(page, 'wordsView', 'words')
            capture(page, 'flow-navigation-words', width, height)

            # A locked marker is an enabled information button; only the entrance action is unavailable.
            reset(page, ARRIVAL)
            page.evaluate('GameFlow.showWorld()')
            locked = page.locator('.regionCard[data-region-id="academic-tower"]')
            assert locked.is_enabled()
            assert locked.get_attribute('aria-disabled') is None
            assert '잠긴 장소' in (locked.get_attribute('aria-label') or '')
            assert '조건 확인' in (locked.get_attribute('aria-label') or '')
            before = page.evaluate(f"localStorage.getItem('{JOURNEY_KEY}')")
            locked.click()
            assert page.locator('.worldLockReason').is_visible()
            assert page.locator('#worldPlaceLockedGo').is_disabled()
            assert page.locator('#worldPlaceLockedGo').get_attribute('aria-describedby') == 'worldPlaceLockReason'
            assert background(page, '#worldPlaceLockedGo') == 'rgb(217, 222, 217)'
            assert page.locator('#worldPlaceGo').count() == 0
            assert page.locator('#worldView').is_visible()
            assert page.evaluate(f"localStorage.getItem('{JOURNEY_KEY}')") == before
            capture(page, 'world-locked-place', width, height)
            page.locator('#worldPlaceClose').click()
            locked.press('Enter')
            assert page.locator('.worldLockReason').is_visible()
            page.locator('#worldPlaceClose').click()

            # Story menu destinations remain the purpose; the explicit close role is quiet and touchable.
            reset(page)
            page.locator('#landingPrimary').click()
            page.locator('#storyView').wait_for(state='visible')
            page.locator('#storyMenu').click()
            assert_touch_targets(page, '.flowMenu button, #flowMenuClose')
            assert_no_overlap(page, '.flowMenu button, #flowMenuClose')
            assert page.locator('#flowMenuClose').get_attribute('data-action-role') == 'close'
            assert background(page, '#flowMenuClose') == 'rgb(233, 227, 216)'
            capture(page, 'menu-from-story', width, height)
            page.locator('#flowJourney').click()
            assert page.locator('#journeyView').is_visible()

            # Unrelated single-action word sheets keep their established primary close treatment.
            reset(page, progress(stages=('stage-0',), location={'view': 'world'}))
            assert page.evaluate("GameFlow.playStage('stage-1')") is True
            page.locator('#words .wordbtn').first.click()
            assert_touch_targets(page, '#sheet .sheetactions button')
            assert background(page, '#sheet .sheetactions button') == 'rgb(45, 98, 72)'
            capture(page, 'word-meaning-sheet', width, height)
            page.locator('#sheet .sheetactions button').click()

            # Restore stays primary; reset keeps a separate cancel and destructive confirmation.
            reset(page)
            page.evaluate("SettingsRuntime.open()")
            page.evaluate("""async () => {
              const backup = SaveData.createBackup(localStorage);
              await SettingsRuntime.inspectFile(new File([JSON.stringify(backup)], 'backup.json', {type:'application/json'}));
            }""")
            page.locator('#settingsRestorePreview').wait_for(state='visible')
            assert_touch_targets(page, '#settingsRestoreConfirm')
            assert background(page, '#settingsRestoreConfirm') == 'rgb(45, 98, 72)'
            capture(page, 'settings-restore-preview', width, height)
            page.locator('#settingsReset').click()
            assert_touch_targets(page, '#flowResetCancel, #flowResetConfirm')
            assert_no_overlap(page, '#flowResetCancel, #flowResetConfirm')
            assert background(page, '#flowResetCancel') == 'rgb(233, 227, 216)'
            assert background(page, '#flowResetConfirm') != background(page, '#flowResetCancel')
            page.locator('#flowResetCancel').click()

            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert not errors, errors
            assert not missing, missing
            context.close()

        browser.close()
finally:
    server.shutdown()
    server.server_close()

print(f'PASS: A01-A03 design action browser regression ({len(VIEWPORTS)} viewports). Screenshots: {OUT}')
