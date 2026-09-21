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
            result = page.evaluate('''() => {
              const failures = [];
              const options = { seen: false, beat: 0, endLabel: '다음', onPosition() {}, onFinish() {} };
              const cases = [];
              const addVariants = (group, configs) => {
                for (const [id, config] of Object.entries(configs || {})) {
                  const base = JourneyContent.STORIES[id];
                  for (const [variant, beats] of Object.entries(config.variants || {})) {
                    cases.push([`${group}:${id}:${variant}`, { ...base, beats }]);
                  }
                }
              };
              for (const id of StoryPronunciation.supportedStories) {
                const story = JourneyContent.STORIES[id];
                if (story) cases.push([id, story]);
              }
              addVariants('outcome', StoryOutcomeContent.VARIANTS);
              addVariants('market', StoryOutcomeContent.marketVariants);
              for (const [variant, beats] of Object.entries(StoryOutcomeContent.g7Variants || {})) {
                cases.push([`g7:gate-after-convoy:${variant}`, {
                  ...JourneyContent.STORIES['gate-after-convoy'], beats
                }]);
              }
              cases.push(['gate-after-convoy:reward', {
                ...JourneyContent.STORIES['gate-after-convoy'],
                beats: StoryOutcomeContent.gateRewardBeats || []
              }]);
              let longest = null;
              for (const [label, story] of cases) {
                for (let beat = 0; beat < story.beats.length; beat++) {
                  StoryRuntime.play(story, { ...options, beat });
                  const text = story.beats[beat].zh;
                  const expected = [...text].filter(character => /\p{Script=Han}/u.test(character)).length;
                  const actual = document.querySelectorAll('#storyZh ruby').length;
                  const placeExpected = [...story.placeZh].filter(character => /\p{Script=Han}/u.test(character)).length;
                  const placeActual = document.querySelectorAll('#storyPlace ruby').length;
                  const speakerExpected = [...document.querySelector('#storySpeaker').getAttribute('aria-label').split(' · ')[0]]
                    .filter(character => /\p{Script=Han}/u.test(character)).length;
                  const speakerActual = document.querySelectorAll('#storySpeaker ruby').length;
                  const action = document.querySelector('#storyNext').getBoundingClientRect();
                  const scene = document.querySelector('#storyScene').getBoundingClientRect();
                  const place = document.querySelector('#storyPlace').getBoundingClientRect();
                  const reading = document.querySelector('#storyReading');
                  if (actual !== expected) failures.push(`${label}:${beat}: ruby ${actual}/${expected}`);
                  if (placeActual !== placeExpected) failures.push(`${label}:${beat}: place ruby ${placeActual}/${placeExpected}`);
                  if (speakerActual !== speakerExpected) failures.push(`${label}:${beat}: speaker ruby ${speakerActual}/${speakerExpected}`);
                  if ([...document.querySelectorAll('#storyZh rt, #storySpeaker rt, #storyPlace rt')].some(node => !node.textContent.trim())) failures.push(`${label}:${beat}: empty rt`);
                  if (document.documentElement.scrollWidth > innerWidth) failures.push(`${label}:${beat}: horizontal overflow`);
                  if (reading.scrollWidth > reading.clientWidth + 1) failures.push(`${label}:${beat}: reading horizontal overflow`);
                  if (action.bottom > innerHeight || action.height < 44) failures.push(`${label}:${beat}: action out of viewport`);
                  if (place.top < scene.top || place.bottom > scene.bottom || place.right > scene.right) failures.push(`${label}:${beat}: place clipped`);
                  if (!longest || expected > longest.count) longest = { label, story, beat, count: expected };
                }
              }
              window.__pronunciationLongest = longest;
              return { failures, longest: longest && { label: longest.label, beat: longest.beat, count: longest.count } };
            }''')
            assert not result['failures'], result['failures'][:10]

            page.evaluate('''() => StoryRuntime.play(window.__pronunciationLongest.story, {
              seen:false, beat:window.__pronunciationLongest.beat, endLabel:'다음', onPosition(){}, onFinish(){}
            })''')
            page.locator('#storyTranslate').click()
            scroll_ok = page.evaluate('''() => {
              const reading = document.querySelector('#storyReading');
              reading.scrollTop = reading.scrollHeight;
              const ko = document.querySelector('#storyKo').getBoundingClientRect();
              const box = reading.getBoundingClientRect();
              return reading.scrollHeight >= reading.clientHeight && ko.bottom <= box.bottom + 1;
            }''')
            assert scroll_ok, result['longest']
            next_box = page.locator('#storyNext').bounding_box()
            assert next_box and next_box['y'] + next_box['height'] <= height
            page.screenshot(path=str(OUT / f'story-zhuyin-{width}x{height}.png'))

        page.evaluate('''() => StoryRuntime.play({ ...JourneyContent.STORIES['gate-arrival'], id:'unsupported-story' }, {
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
