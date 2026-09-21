"""Mobile browser matrix for opt-in story Zhuyin ruby rendering.

Requires Python Playwright and Chromium.
Run: python3 tests/smoke_story_pronunciation.py
"""
import http.server
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

try:
    with sync_playwright() as pw:
        launch = {'args': ['--no-sandbox']}
        if os.environ.get('CHROMIUM_PATH'): launch['executable_path'] = os.environ['CHROMIUM_PATH']
        browser_name = os.environ.get('PLAYWRIGHT_BROWSER', 'chromium')
        browser = getattr(pw, browser_name).launch(**launch)
        context = browser.new_context(viewport={'width': 375, 'height': 812}, is_mobile=True, has_touch=True)
        page = context.new_page()
        errors, missing = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: missing.append(response.url) if response.status >= 400 and 'favicon' not in response.url else None)
        page.goto(url)
        page.wait_for_function('!!window.StoryRuntime && !!window.StoryPronunciation && !!window.SettingsRuntime')
        page.evaluate("localStorage.setItem(SettingsRuntime.KEY, JSON.stringify({showPronunciation:true}))")
        page.evaluate("TacticalGame.showView('story')")

        matrix = [(360, 640), (375, 812), (390, 844)]
        for width, height in matrix:
            page.set_viewport_size({'width': width, 'height': height})
            failures = page.evaluate('''() => {
              const failures = [];
              const options = { seen: false, beat: 0, endLabel: '다음', onPosition() {}, onFinish() {} };
              const cases = [];
              for (const id of StoryPronunciation.supportedStories) {
                const story = JourneyContent.STORIES[id];
                if (story) cases.push([id, story]);
              }
              for (const [id, config] of Object.entries(StoryOutcomeContent.marketVariants || {})) {
                const base = JourneyContent.STORIES[id];
                for (const [variant, beats] of Object.entries(config.variants)) {
                  cases.push([`${id}:${variant}`, { ...base, beats }]);
                }
              }
              for (const [label, story] of cases) {
                for (let beat = 0; beat < story.beats.length; beat++) {
                  StoryRuntime.play(story, { ...options, beat });
                  const text = story.beats[beat].zh;
                  const expected = [...text].filter(character => /\p{Script=Han}/u.test(character)).length;
                  const actual = document.querySelectorAll('#storyZh ruby').length;
                  const action = document.querySelector('#storyNext').getBoundingClientRect();
                  if (actual !== expected) failures.push(`${label}:${beat}: ruby ${actual}/${expected}`);
                  if ([...document.querySelectorAll('#storyZh rt')].some(node => !node.textContent.trim())) failures.push(`${label}:${beat}: empty rt`);
                  if (document.documentElement.scrollWidth > innerWidth) failures.push(`${label}:${beat}: horizontal overflow`);
                  if (action.bottom > innerHeight || action.height < 44) failures.push(`${label}:${beat}: action out of viewport`);
                }
              }
              return failures;
            }''')
            assert not failures, failures[:10]

            page.evaluate('''() => StoryRuntime.play(JourneyContent.STORIES['market-arrival'], {
              seen:false, beat:1, endLabel:'다음', onPosition(){}, onFinish(){}
            })''')
            page.locator('#storyTranslate').click()
            next_box = page.locator('#storyNext').bounding_box()
            assert next_box and next_box['y'] + next_box['height'] <= height
            page.screenshot(path=str(OUT / f'story-zhuyin-{width}x{height}.png'))

        page.evaluate('''() => StoryRuntime.play(JourneyContent.STORIES['gate-arrival'], {
          seen:false, beat:0, endLabel:'다음', onPosition(){}, onFinish(){}
        })''')
        assert page.locator('#storyZh ruby').count() == 0
        assert not errors, errors
        assert not missing, missing
        print('STORY_PRONUNCIATION_SMOKE_OK', flush=True)
        browser.close()
finally:
    server.shutdown()
    server.server_close()
