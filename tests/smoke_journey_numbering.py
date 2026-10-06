"""A10+A06: stable journey references and state-aware guidance across mobile viewports."""
import http.server
import json
import os
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-journey-numbering'))
OUT.mkdir(parents=True, exist_ok=True)
VIEWPORTS = [(375, 812), (375, 667), (375, 640), (360, 640)]
KEY = 'chinese-word-tactics-journey-v1'


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, request_path):
        path = request_path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        target = (ROOT / (path[len(prefix):] if path.startswith(prefix) else '__missing__')).resolve()
        return str(target if target.is_relative_to(ROOT) else ROOT / '__missing__')


def wait_ready(page):
    page.wait_for_function('!!window.GameFlow && !!window.JourneyStageReference && !!window.AcademicTowerRuntime')


def seed(page, state):
    page.evaluate(
        """({key,state}) => {
          const P = JourneyProgress;
          const base = P.normalize(null);
          const finishChapters = () => {
            const nodes = P.allNodes().filter(node => ['prologue', 'chapter-1-three-roads'].includes(node.chapterId));
            base.seenStories = nodes.filter(node => node.type === 'story').map(node => node.id);
            base.completedStages = nodes.filter(node => node.type === 'stage').map(node => node.id);
            base.completedMilestones = ['inn-unlocked', 'gate-core', 'workshop-core', 'market-core', 'chapter1-complete'];
            base.lastLocation = {view:'world'};
          };
          if (state === 'chapter-progress') {
            base.seenStories = ['prologue-departure', 'prologue-forest-edge', 'chapter1-roadside-merchant'];
            base.completedStages = Array.from({length:6}, (_, index) => `stage-${index}`);
            base.lastLocation = {view:'world'};
          } else if (state !== 'early') {
            finishChapters();
            if (state === 'free-quest') base.seenStories.push('first-free-quest-accepted');
            if (state === 'tower-started' || state === 'tower-partial') {
              base.seenStories.push('academic-tower-arrival', 'academic-tower-turn-intro');
              base.completedMilestones.push('academic-tower-entered');
            }
            if (state === 'tower-partial') {
              base.completedStages.push('academic-tower-turn-01-que');
              base.seenStories.push('academic-tower-turn-after-que');
            }
          }
          localStorage.clear();
          localStorage.setItem(key, JSON.stringify(base));
        }""",
        {'key': KEY, 'state': state},
    )
    page.reload()
    wait_ready(page)
    page.evaluate('GameFlow.showJourney()')


def assert_guidance_states(page, width, height):
    cases = [
        ('early', True, '이어서 여행하기', '고향을 떠나는 여정'),
        ('chapter-progress', False, '', '다음 본편은 월드맵'),
        ('chapter-complete', False, '', '1장의 여행을 마쳤어'),
        ('free-quest', False, '', '진행 중인 자유 의뢰'),
        ('tower-started', False, '', '학술탑 연구가 시작됐어'),
        ('tower-partial', False, '', '학술탑 본선 연구 1/5'),
    ]
    for state, button_visible, button_text, guidance_text in cases:
        seed(page, state)
        continue_button = page.locator('#journeyContinue')
        assert continue_button.is_visible() is button_visible
        assert continue_button.inner_text() == button_text
        assert guidance_text in page.locator('#journeyGuidance').inner_text()
        assert continue_button.get_attribute('data-destination') == ('node' if button_visible else None)
        assert page.locator('#journeyReplayGuidance').is_hidden()
        if state == 'free-quest':
            assert '진행 중' in page.locator('.journeyQuestState').all_inner_texts()
        page.screenshot(path=str(OUT / f'a06-{state}-{width}x{height}.png'), full_page=True)

    page.locator('[data-journey-filter="stage"]').click()
    assert page.locator('#journeyReplayGuidance').is_visible()
    assert '본편 위치는 바뀌지 않아' in page.locator('#journeyReplayGuidance').inner_text()
    page.locator('[data-journey-filter="all"]').click()
    assert page.locator('#journeyReplayGuidance').is_hidden()


def seed_complete(page):
    page.evaluate(
        """key => {
          const nodes = JourneyProgress.allNodes();
          const value = JourneyProgress.normalize({
            seenStories:nodes.filter(node => node.type === 'story').map(node => node.id),
            completedStages:nodes.filter(node => node.type === 'stage').map(node => node.id),
            completedMilestones:['inn-unlocked','gate-core','workshop-core','market-core','chapter1-complete',
              'academic-tower-entered','academic-tower-turn-foundation','quest-board-unlocked'],
            lastLocation:{view:'world'}
          });
          localStorage.clear(); localStorage.setItem(key, JSON.stringify(value));
        }""",
        KEY,
    )
    page.reload()
    wait_ready(page)
    page.evaluate('GameFlow.showJourney()')


def number_map(page):
    return page.locator('.journeyNode[data-stage-number]').evaluate_all(
        "nodes => Object.fromEntries(nodes.map(node => [node.dataset.nodeId, node.dataset.stageNumber]))"
    )


def assert_number_layout(page, width, height):
    seed_complete(page)
    missing = page.evaluate(
        "JourneyProgress.allNodes().filter(node => node.type === 'stage' && !node.stageReference).map(node => node.id)"
    )
    assert missing == [], missing

    references = page.evaluate("JourneyStageReference.all().map(({stageId,groupId,number}) => ({stageId,groupId,number}))")
    groups = {}
    for item in references:
        groups.setdefault(item['groupId'], []).append(item['number'])
    assert all(len(numbers) == len(set(numbers)) for numbers in groups.values()), groups

    page.evaluate("document.querySelectorAll('#journeyList details').forEach(item => item.open = true)")
    all_numbers = number_map(page)
    assert all_numbers['stage:stage-0'] == '01'
    assert all_numbers['stage:stage-5'] == '06'
    assert all_numbers['stage:first-free-quest-forest'] == '01'
    assert all_numbers['stage:north-forest-stage-8'] == '08'
    assert all_numbers['stage:academic-tower-turn-03a-ran-family'] == '03A'
    assert page.locator('.journeyNode[data-node-id^="story:"] .journeyNodeNumber').count() == 0

    tower_optional = page.locator('[data-node-id="stage:academic-tower-turn-03a-ran-family"]')
    assert tower_optional.locator('.journeyType').inner_text() == '선택 연구'
    assert '방향이 바뀌는 문장 03A' in tower_optional.get_attribute('aria-label')

    page.locator('[data-journey-filter="stage"]').click()
    page.evaluate("document.querySelectorAll('#journeyList details').forEach(item => item.open = true)")
    assert number_map(page) == all_numbers

    metrics = page.locator('.journeyNode[data-stage-number]:visible').evaluate_all(
        """nodes => nodes.map(node => {
          const box = element => element.getBoundingClientRect().toJSON();
          const number = node.querySelector('.journeyNodeNumber');
          const title = node.querySelector('.journeyNodeTitle');
          const state = node.querySelector('.journeyNodeState');
          const style = getComputedStyle(number);
          return {id:node.dataset.nodeId,row:box(node),number:box(number),title:box(title),state:box(state),
            numberStyle:{background:style.backgroundColor,border:style.borderTopWidth,radius:style.borderRadius}};
        })"""
    )
    assert metrics
    for item in metrics:
        assert item['row']['height'] >= 58, item
        assert item['number']['right'] <= item['title']['x'] + 0.5, item
        assert item['title']['right'] <= item['state']['x'] + 0.5, item
        assert item['numberStyle'] == {'background': 'rgba(0, 0, 0, 0)', 'border': '0px', 'radius': '0px'}, item
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path=str(OUT / f'a10-stage-filter-{width}x{height}.png'), full_page=True)

    # The same tutorial metadata aligns the tactical header without changing internal IDs.
    assert page.evaluate("GameFlow.playStage('stage-0',{mode:'replay'})") is True
    assert page.locator('#stageKicker').inner_text() == '튜토리얼 01/06'

    # 03A is a journey reference only; the research-room side room stays numberless.
    assert page.evaluate('AcademicTowerRuntime.showHub()') is True
    side_room = page.locator('.academicHubSideRoom')
    assert side_room.is_visible()
    assert '03A' not in side_room.inner_text()
    assert side_room.locator('.academicTowerRoomNumber').count() == 0


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
            page.set_default_timeout(10000)
            errors, missing = [], []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('response', lambda response: missing.append(response.url)
                    if response.status >= 400 and 'favicon' not in response.url else None)
            page.goto(URL)
            wait_ready(page)
            assert_guidance_states(page, width, height)
            assert_number_layout(page, width, height)
            assert errors == [], errors
            assert missing == [], missing
            context.close()
        browser.close()
finally:
    server.shutdown()

(OUT / 'journey-numbering-results.json').write_text(json.dumps({
    'viewports': [f'{width}x{height}' for width, height in VIEWPORTS],
    'states': ['early', 'chapter-progress', 'chapter-complete', 'free-quest', 'tower-started', 'tower-partial']
}, ensure_ascii=False, indent=2))
print('PASS: stable journey references, state-aware guidance, replay help and 03A exception across four viewports.')
