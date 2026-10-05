"""A05: return to the actual source view and restore reading context."""
import http.server
import json
import os
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-return-context'))
OUT.mkdir(parents=True, exist_ok=True)
VIEWPORTS = [(375, 812), (375, 667), (375, 640), (360, 640)]
JOURNEY_KEY = 'chinese-word-tactics-journey-v1'
LEXICON_KEY = 'chinese-word-tactics-lexicon-v1'

SOLVER = r'''() => {
  const st = current(), start = initialState(st), signature = s => JSON.stringify([s.hero,s.phase,s.stone,s.crossed,s.entry]);
  const tile = p => st.grid[p[0]]?.[p[1]], d = (a,b) => Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
  const same = (a,b) => a[0]===b[0]&&a[1]===b[1], k = locate(st.grid,'K');
  const queue = [[start,[]]], visited = new Set([signature(start)]);
  for(let cursor=0;cursor<queue.length;cursor++) {
    const [s,path]=queue[cursor];
    if(tile(s.hero)==='E'&&(!st.win.includes('stone')||s.stone)&&(!st.win.includes('crossed')||s.crossed))return path;
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1],...(st.wolf?[[0,0]]:[])]) {
      const waiting=dr===0&&dc===0, p=[s.hero[0]+dr,s.hero[1]+dc], ch=tile(p);
      if(!ch||['#','K','X'].includes(ch)||(ch==='G'&&!s.stone))continue;
      const phase=st.wolf?(s.phase+1)%st.wolf.cycle.length:s.phase;
      if(st.wolf&&(d(p,st.wolf.cycle[s.phase])<=st.wolf.radius||d(p,st.wolf.cycle[phase])<=st.wolf.radius))continue;
      const n=JSON.parse(JSON.stringify(s)); n.hero=p; n.phase=phase;
      if(k&&d(p,k)===1)n.stone=true;
      if(st.ruin&&!waiting) {
        const portals=st.ruin.portals;
        if(ch==='R'&&tile(s.hero)!=='R'){const i=portals.findIndex(q=>same(q,s.hero));n.entry=i<0?null:i;}
        if(tile(s.hero)==='R'&&ch!=='R'){const i=portals.findIndex(q=>same(q,p));if(s.entry!==null&&i>=0&&i!==s.entry)n.crossed=true;n.entry=null;}
      }
      const id=signature(n); if(visited.has(id))continue;visited.add(id);queue.push([n,[...path,waiting?'wait':p]]);
    }
  }
  throw Error('No solution');
}'''


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def translate_path(self, request_path):
        path = request_path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        target = (ROOT / (path[len(prefix):] if path.startswith(prefix) else '__missing__')).resolve()
        return str(target if target.is_relative_to(ROOT) else ROOT / '__missing__')


def wait_ready(page):
    page.wait_for_function('!!window.GameFlow && !!window.LexiconRuntime && !!window.JourneyRuntime')


def assert_view(page, name):
    assert page.locator('.appView:visible').count() == 1
    assert page.locator(f'#{name}View').is_visible()


def seed_complete(page):
    page.evaluate(
        """([journeyKey,lexiconKey]) => {
          const nodes = JourneyProgress.allNodes();
          const progress = JourneyProgress.normalize({
            seenStories:nodes.filter(node => node.type === 'story').map(node => node.id),
            completedStages:nodes.filter(node => node.type === 'stage').map(node => node.id),
            completedMilestones:['inn-unlocked','gate-core','workshop-core','market-core','chapter1-complete',
              'academic-tower-entered','academic-tower-turn-foundation','quest-board-unlocked'],
            lastLocation:{view:'world'}
          });
          localStorage.clear();
          localStorage.setItem(journeyKey, JSON.stringify(progress));
          localStorage.setItem(lexiconKey, JSON.stringify({
            discovered:Object.keys(WORDS), visitedStages:STAGES.map(stage => stage.id),
            lastChapterId:'chapter-1', lastRegionId:'market-town'
          }));
        }""",
        [JOURNEY_KEY, LEXICON_KEY],
    )
    page.reload()
    wait_ready(page)


def scroll_and_focus(page, selector):
    page.locator(selector).evaluate("element => { element.scrollIntoView({block:'center'}); element.focus(); }")
    return page.evaluate('window.scrollY')


def wait_for_restore(page, selector, expected_scroll):
    try:
        page.wait_for_function(
            """([selector,top]) => document.activeElement === document.querySelector(selector) && Math.abs(scrollY-top) <= 2""",
            arg=[selector, expected_scroll],
        )
    except Exception as error:
        actual = page.evaluate(
            """selector => ({scrollY,activeId:document.activeElement?.id || '',
              activeNode:document.activeElement?.dataset.nodeId || '', targetExists:!!document.querySelector(selector)})""",
            selector,
        )
        raise AssertionError({'selector': selector, 'expectedScroll': expected_scroll, 'actual': actual}) from error


def solve(page):
    actions = page.evaluate(SOLVER)
    if not page.evaluate('selected'):
        page.locator('.cell:has(.hero)').click()
    columns = page.evaluate('current().grid[0].length')
    for action in actions:
        if action == 'wait':
            page.locator('#waitBtn').click()
        else:
            page.locator('#grid .cell').nth(action[0] * columns + action[1]).click()
    page.locator('#flowNext').wait_for(state='visible')


def disclosure_state(page):
    return page.locator('#journeyList details[data-journey-state-key]').evaluate_all(
        "nodes => nodes.map(node => `${node.dataset.journeyDisclosure}:${node.dataset.journeyStateKey}:${node.open}`)"
    )


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
            seed_complete(page)

            # Landing → word book → back returns to the landing, not campaign resume.
            assert page.locator('#landingWords').is_visible()
            page.locator('#landingWords').click()
            assert_view(page, 'words')
            page.locator('#wordsBackBtn').click()
            assert_view(page, 'landing')
            page.wait_for_function("document.activeElement?.id === 'landingWords'")

            # World → word book → back restores the same world scroll and navigation focus.
            page.evaluate('GameFlow.showWorld()')
            world_words = '#worldView [data-flow="words"]'
            world_scroll = scroll_and_focus(page, world_words)
            page.locator(world_words).click()
            assert_view(page, 'words')
            page.locator('#wordsBackBtn').click()
            assert_view(page, 'world')
            wait_for_restore(page, world_words, world_scroll)

            # Journey → word book → back keeps filter, disclosure state, position, and focused node.
            page.evaluate('GameFlow.showJourney()')
            page.locator('[data-journey-filter="stage"]').click()
            page.evaluate("document.querySelectorAll('#journeyList details').forEach(item => item.open = true)")
            journey_target = '[data-node-id="stage:market-stage-8"]'
            journey_scroll = scroll_and_focus(page, journey_target)
            journey_disclosures = disclosure_state(page)
            page.evaluate('GameFlow.showWords()')
            assert_view(page, 'words')
            page.locator('#wordsBackBtn').click()
            assert_view(page, 'journey')
            wait_for_restore(page, journey_target, journey_scroll)
            assert page.locator('[data-journey-filter="stage"]').get_attribute('aria-pressed') == 'true'
            assert disclosure_state(page) == journey_disclosures
            page.screenshot(path=str(OUT / f'a05-journey-from-words-{width}x{height}.png'), full_page=True)

            # Long list → detail → back returns to the same row and reading position.
            page.evaluate('GameFlow.showWords()')
            page.locator('[data-lexicon-all="chapter"]').click()
            rows = page.locator('.lexiconWordRow')
            assert rows.count() > 20
            chosen = rows.nth(rows.count() - 4)
            chosen_word = chosen.get_attribute('data-lexicon-word')
            list_scroll = chosen.evaluate("element => { element.scrollIntoView({block:'center'}); element.focus(); return scrollY; }")
            chosen.click()
            assert page.locator('.lexiconWordDetail').is_visible()
            page.locator('#wordsBackBtn').click()
            restored_word = f'[data-lexicon-word="{chosen_word}"]'
            wait_for_restore(page, restored_word, list_scroll)
            assert page.locator('.lexiconWordRows').is_visible()
            page.screenshot(path=str(OUT / f'a05-lexicon-list-return-{width}x{height}.png'), full_page=True)

            # Search → detail → back keeps the query and restores the selected result focus.
            page.locator('#wordsSearchBtn').click()
            search = page.locator('#lexiconSearchInput')
            search.fill('가격')
            result = page.locator('#lexiconSearchResults [data-lexicon-word="價格"]')
            assert result.count() == 1
            result.click()
            assert page.locator('.lexiconWordDetail').is_visible()
            page.locator('#wordsBackBtn').click()
            page.wait_for_function("document.activeElement?.dataset.lexiconWord === '價格'")
            assert page.locator('#lexiconSearchInput').input_value() == '가격'

            # A lower journey stage replay restores the same journey context on completion.
            page.evaluate('GameFlow.showJourney()')
            page.locator('[data-journey-filter="stage"]').click()
            page.evaluate("document.querySelectorAll('#journeyList details').forEach(item => item.open = true)")
            replay_target = '[data-node-id="stage:stage-5"]'
            replay_scroll = scroll_and_focus(page, replay_target)
            replay_disclosures = disclosure_state(page)
            page.locator(replay_target).click()
            assert_view(page, 'tutorial')
            assert page.evaluate('stageSession.returnContext?.viewId') == 'journeyView'
            solve(page)
            page.locator('#flowNext').click()
            assert_view(page, 'journey')
            wait_for_restore(page, replay_target, replay_scroll)
            assert page.locator('[data-journey-filter="stage"]').get_attribute('aria-pressed') == 'true'
            assert disclosure_state(page) == replay_disclosures

            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert errors == [], errors
            assert missing == [], missing
            context.close()
        browser.close()
finally:
    server.shutdown()

(OUT / 'return-context-results.json').write_text(json.dumps({
    'viewports': [f'{width}x{height}' for width, height in VIEWPORTS],
    'flows': ['landing-words', 'world-words', 'journey-words', 'lexicon-detail', 'search-detail', 'journey-replay']
}, ensure_ascii=False, indent=2))
print('PASS: actual-source return and reading-context restoration across four viewports.')
