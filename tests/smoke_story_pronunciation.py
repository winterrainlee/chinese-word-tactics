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
        geometry_results = []
        for width, height in matrix:
            page.set_viewport_size({'width': width, 'height': height})
            geometry = page.evaluate('''async () => {
              await document.fonts.ready;
              const text = '天亮了。少年站在村口，背上是小小的行李。';
              const story = JourneyContent.STORIES['prologue-departure'];
              const options = { seen: false, beat: 0, endLabel: '다음', onPosition() {}, onFinish() {} };
              const setPronunciation = enabled => {
                localStorage.setItem(SettingsRuntime.KEY, JSON.stringify({ showPronunciation: enabled }));
                StoryRuntime.play(story, options);
              };
              const rounded = value => Math.round(value * 1000) / 1000;
              const characterRects = container => {
                const result = [];
                for (const node of container.childNodes) {
                  if (node.nodeType === Node.ELEMENT_NODE && node.matches('ruby')) {
                    const base = node.querySelector('rb');
                    const baseRange = document.createRange();
                    baseRange.selectNodeContents(base);
                    const baseRect = baseRange.getBoundingClientRect();
                    const baseCellRect = base.getBoundingClientRect();
                    const rubyRect = node.getBoundingClientRect();
                    const rtRect = node.querySelector('.storyPronunciation').getBoundingClientRect();
                    result.push({
                      character: base.textContent, left: rounded(baseRect.left), top: rounded(baseRect.top),
                      width: rounded(baseRect.width), rubyWidth: rounded(rubyRect.width),
                      rtHeight: rounded(rtRect.height), annotationGap: rounded(baseCellRect.top - rtRect.bottom)
                    });
                    continue;
                  }
                  if (node.nodeType !== Node.TEXT_NODE) continue;
                  let offset = 0;
                  for (const character of node.data) {
                    const range = document.createRange();
                    range.setStart(node, offset);
                    offset += character.length;
                    range.setEnd(node, offset);
                    const rect = range.getBoundingClientRect();
                    result.push({
                      character, left: rounded(rect.left), top: rounded(rect.top), width: rounded(rect.width)
                    });
                  }
                }
                return result;
              };
              const lineSignature = rects => {
                const lines = [{ text: '' }];
                let previous = null;
                for (const rect of rects) {
                  if (previous && rect.left < previous.left - .5) lines.push({ text: '' });
                  lines.at(-1).text += rect.character;
                  previous = rect;
                }
                return lines.map(line => line.text);
              };
              const stableUi = () => {
                const reading = document.querySelector('#storyReading').getBoundingClientRect();
                const next = document.querySelector('#storyNext').getBoundingClientRect();
                return { readingHeight: rounded(reading.height), nextTop: rounded(next.top) };
              };

              setPronunciation(true);
              const on = characterRects(document.querySelector('#storyZh'));
              const expectedReadings = ['ㄊㄧㄢ', 'ㄌㄧㄤˋ', 'ㄌㄜ˙', 'ㄕㄠˋ', 'ㄋㄧㄢˊ', 'ㄓㄢˋ', 'ㄗㄞˋ', 'ㄘㄨㄣ', 'ㄎㄡˇ', 'ㄅㄟˋ', 'ㄕㄤˋ', 'ㄕˋ', 'ㄒㄧㄠˇ', 'ㄒㄧㄠˇ', 'ㄉㄜ˙', 'ㄒㄧㄥˊ', 'ㄌㄧˇ'];
              const actualReadings = [...document.querySelectorAll('#storyZh rt')].map(node => node.textContent);
              const onUi = stableUi();
              setPronunciation(false);
              const off = characterRects(document.querySelector('#storyZh'));
              const offUi = stableUi();

              const fixturePairs = [['一', 'ㄧ'], ['的', 'ㄉㄜ˙'], ['天', 'ㄊㄧㄢ'], ['亮', 'ㄌㄧㄤˋ'], ['小', 'ㄒㄧㄠˇ'], ['站', 'ㄓㄢˋ'], ['村', 'ㄘㄨㄣ']];
              const fixtureOn = document.createElement('p');
              fixtureOn.className = 'storyZh';
              fixtureOn.dataset.pronunciation = 'true';
              fixtureOn.style.cssText = 'position:fixed;left:16px;top:0;width:66px;visibility:hidden;z-index:-1';
              for (const [baseText, readingText] of fixturePairs) {
                const ruby = document.createElement('ruby');
                const base = document.createElement('rb');
                const reading = document.createElement('rt');
                const readingTextNode = document.createElement('span');
                base.textContent = baseText;
                readingTextNode.className = 'storyPronunciation';
                readingTextNode.textContent = readingText;
                reading.append(readingTextNode);
                ruby.append(base, reading);
                fixtureOn.append(ruby);
              }
              const fixtureOff = document.createElement('p');
              fixtureOff.className = 'storyZh';
              fixtureOff.style.cssText = fixtureOn.style.cssText;
              fixtureOff.textContent = fixturePairs.map(pair => pair[0]).join('');
              document.body.append(fixtureOn, fixtureOff);
              const fixtureOnRects = characterRects(fixtureOn);
              const fixtureOffRects = characterRects(fixtureOff);
              fixtureOn.remove();
              fixtureOff.remove();

              const failures = [];
              if (on.map(item => item.character).join('') !== text) failures.push('ON character mapping changed');
              if (off.map(item => item.character).join('') !== text) failures.push('OFF character mapping changed');
              if (on.length !== off.length) failures.push(`character count ${on.length}/${off.length}`);
              const coordinateDeltas = on.map((item, index) => ({
                character: item.character, index,
                x: rounded(Math.abs(item.left - off[index].left)),
                y: rounded(Math.abs(item.top - off[index].top))
              }));
              const maxXDelta = Math.max(...coordinateDeltas.map(item => item.x));
              const expanded = on.filter(item => item.rubyWidth != null && item.rubyWidth - item.width > .5);
              const onLines = lineSignature(on);
              const offLines = lineSignature(off);
              const rtHeights = on.filter(item => item.rtHeight != null).map(item => item.rtHeight);
              const annotationGaps = on.filter(item => item.annotationGap != null).map(item => item.annotationGap);
              const baseWidths = on.filter(item => item.rubyWidth != null).map(item => item.width);
              const rubyRowTops = [];
              for (const item of fixtureOnRects) {
                if (!rubyRowTops.some(top => Math.abs(top - item.top) <= .5)) rubyRowTops.push(item.top);
              }
              const rowGaps = rubyRowTops.slice(1).map((top, index) => rounded(top - rubyRowTops[index]));
              const fixtureMaxXDelta = Math.max(...fixtureOnRects.map((item, index) => Math.abs(item.left - fixtureOffRects[index].left)));
              const fixtureExpanded = fixtureOnRects.filter(item => item.rubyWidth - item.width > .5);
              const spread = values => rounded(Math.max(...values) - Math.min(...values));
              const rtHeightSpread = spread(rtHeights);
              const annotationGapSpread = spread(annotationGaps);
              const baseWidthSpread = spread(baseWidths);
              const rowGapSpread = spread(rowGaps);
              if (JSON.stringify(actualReadings) !== JSON.stringify(expectedReadings)) failures.push('representative readings changed');
              if (maxXDelta > .5) failures.push(`max ON/OFF x delta ${maxXDelta}px`);
              if (expanded.length) failures.push(`ruby cells wider than bases: ${expanded.map(item => item.character).join('')}`);
              if (fixtureMaxXDelta > .5) failures.push(`short/long fixture x delta ${rounded(fixtureMaxXDelta)}px`);
              if (fixtureExpanded.length) failures.push(`fixture ruby cells wider than bases: ${fixtureExpanded.map(item => item.character).join('')}`);
              if (JSON.stringify(onLines) !== JSON.stringify(offLines)) failures.push(`line breaks ${JSON.stringify(onLines)} / ${JSON.stringify(offLines)}`);
              if (baseWidthSpread > .5) failures.push(`base width spread ${baseWidthSpread}px`);
              if (rtHeightSpread > .5) failures.push(`rt height spread ${rtHeightSpread}px`);
              if (annotationGapSpread > .5) failures.push(`annotation gap spread ${annotationGapSpread}px`);
              if (annotationGaps.some(gap => gap < -.5)) failures.push('rt overlaps the base row');
              if (rowGaps.length < 2) failures.push('fixture did not wrap to at least three rows');
              if (rowGapSpread > .5) failures.push(`ruby row gap spread ${rowGapSpread}px`);
              if (Math.abs(onUi.readingHeight - offUi.readingHeight) > .5) failures.push('reading card height changed');
              if (Math.abs(onUi.nextTop - offUi.nextTop) > .5) failures.push('action row moved');
              setPronunciation(true);
              return { failures, maxXDelta, fixtureMaxXDelta: rounded(fixtureMaxXDelta), expanded: expanded.map(item => ({
                character: item.character, base: item.width, ruby: item.rubyWidth
              })), onLines, offLines, onUi, offUi, baseWidthSpread, rtHeightSpread,
                annotationGapSpread, rowGaps, rowGapSpread };
            }''')
            page.screenshot(path=str(OUT / f'story-zhuyin-representative-{width}x{height}.png'))
            assert not geometry['failures'], geometry
            geometry_results.append({'viewport': f'{width}x{height}', **geometry})
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
        print('STORY_PRONUNCIATION_GEOMETRY_OK', geometry_results, flush=True)
        print('STORY_PRONUNCIATION_SMOKE_OK', flush=True)
        browser.close()
finally:
    server.shutdown()
    server.server_close()
