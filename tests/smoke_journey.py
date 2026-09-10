"""Browser regression suite. Requires Python Playwright and a Chromium installation.
Run: python tests/smoke_journey.py
Optional: CHROMIUM_PATH=/path/to/chromium; TEST_OUTPUT=/path/to/screenshots
BROWSER_TEST_MODE=memory renders without navigation using a test-only storage fixture.
The server is local-only and serves the repository under /chinese-word-tactics/.
"""
import base64
import mimetypes
import re
from urllib.parse import urlparse
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/chinese-word-tactics-tests'))
OUT.mkdir(parents=True, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass
    def translate_path(self, path):
        # Test the deployed project subpath even if the local checkout has another name.
        path = path.split('?', 1)[0]
        prefix = '/chinese-word-tactics/'
        if path.startswith(prefix):
            path = path[len(prefix):]
        else:
            path = '__missing__'
        return str(ROOT / path)

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'
MEMORY = os.environ.get('BROWSER_TEST_MODE') == 'memory'
KEY = 'chinese-word-tactics-journey-v1'
LEGACY = 'chufa-tutorial-v03'
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

def assert_view(page, view):
    assert page.locator('.appView:visible').count() == 1
    assert page.locator(f'#{view}View').is_visible()

def finish_story(page):
    for _ in range(20):
        if not page.locator('#storyView').is_visible():
            return
        old = page.locator('#storyTitle').inner_text()
        page.locator('#storyNext').click()
        if page.locator('#storyTitle').inner_text() != old:
            return
    raise AssertionError('Story did not finish')

def solve(page):
    actions = page.evaluate(SOLVER)
    if not page.evaluate('selected'):
        page.locator('.cell:has(.hero)').click()
    cols = page.evaluate('current().grid[0].length')
    for action in actions:
        if action == 'wait':
            page.locator('#waitBtn').click()
        else:
            page.locator('#grid .cell').nth(action[0] * cols + action[1]).click()
    page.locator('#flowNext').wait_for(state='visible')
    return len(actions)

def memory_document(seed):
    """No network/navigation: inline original assets and substitute a test-only Storage fixture.
    This mode tests DOM/flow behavior, not native storage persistence or HTTP delivery.
    """
    assets = {}
    for path in (ROOT / 'icons').rglob('*.svg'):
        assets[str(path.relative_to(ROOT))] = 'data:image/svg+xml;base64,' + base64.b64encode(path.read_bytes()).decode()
    html = (ROOT / 'index.html').read_text()
    def stylesheet(match):
        path = ROOT / match.group(1)
        assert path.is_file(), path
        css = path.read_text()
        def url_rewrite(found):
            target = (path.parent / found.group(1)).resolve()
            assert target.is_relative_to(ROOT) and target.is_file(), target
            return 'url("data:image/svg+xml;base64,' + base64.b64encode(target.read_bytes()).decode() + '")'
        css = re.sub(r'url\([\"\']?([^\)\"\']+)[\"\']?\)', url_rewrite, css)
        return '<style>' + css + '</style>'
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', stylesheet, html)
    def script(match):
        path = ROOT / match.group(1)
        assert path.is_file(), path
        return '<script>' + path.read_text() + '</script>'
    html = re.sub(r'<script src="([^"]+)"></script>', script, html)
    html = re.sub(r'src="\./(icons/[^\"]+)"', lambda match: 'src="' + assets[match.group(1)] + '"', html)
    fixture = r"""<base href="https://example.invalid/chinese-word-tactics/"><script>
    (()=>{
      const data = new Map(Object.entries(SEED));
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(String(k),String(v)),
        removeItem:k=>data.delete(k),clear:()=>data.clear(),key:i=>Array.from(data.keys())[i]||null,
        get length(){return data.size}
      }});
      const assets=ASSETS, src=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
      Object.defineProperty(HTMLImageElement.prototype,'src',{...src,set(value){
        const key=String(value).replace(/^.*?icons\//,'icons/');
        src.set.call(this,assets[key]||value);
      }});
    })();</script>""".replace('SEED',json.dumps(seed)).replace('ASSETS',json.dumps(assets))
    return html.replace('<head>', '<head>' + fixture)

def reload_app(page, context):
    if not MEMORY:
        page.reload(); return page
    seed=page.evaluate('Object.fromEntries(Array.from({length:localStorage.length},(_,i)=>{const k=localStorage.key(i);return [k,localStorage.getItem(k)]}))')
    page.close()
    new_page=context.new_page()
    new_page.set_default_timeout(5000)
    new_page.on('pageerror', lambda error: errors.append(str(error)))
    new_page.set_content(memory_document(seed))
    return new_page

results=[]
def passed(name):
    results.append(name)
    print('PASS:', name, flush=True)

try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        context = browser.new_context(viewport={'width':375,'height':812}, device_scale_factor=1, is_mobile=True, has_touch=True)
        page = context.new_page(); errors=[]; missing=[]
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: missing.append(response.url) if response.status>=400 and 'favicon' not in response.url else None)
        page.set_default_timeout(5000)
        (page.set_content(memory_document({})) if MEMORY else page.goto(URL)); page.wait_for_function('!!window.GameFlow')
        assert_view(page,'story'); assert page.locator('#storyKo').is_hidden(); assert page.locator('#storySkip').is_hidden()
        page.locator('#storyTranslate').click(); assert page.locator('#storyKo').is_visible()
        page.screenshot(path=str(OUT/'story-375.png'))
        page.locator('#storyNext').click(); assert page.locator('#storyKo').is_hidden()
        page.locator('#storyPrev').click(); assert page.locator('#storyCount').inner_text()=='1 / 4'
        page.locator('#storyNext').click(); page=reload_app(page, context); assert page.locator('#storyCount').inner_text()=='2 / 4'
        assert page.evaluate('GameFlow.progress().seenStories.length')==0
        passed('fresh story, translation reset, previous beat and refresh resume')
        page.locator('#storyMenu').click(); page.locator('#flowJourney').click(); assert_view(page,'journey')
        assert page.locator('[data-node-id="stage:stage-1"]').is_disabled()
        page.locator('[data-journey-filter="stage"]').click(); assert page.locator('.journeyNode').count()==7
        page.locator('[data-journey-filter="story"]').click(); assert page.locator('.journeyNode').count()==5
        page.locator('#journeyContinue').click(); assert page.locator('#storyCount').inner_text()=='2 / 4'
        finish_story(page); assert_view(page,'tutorial')
        passed('journey filters, future locks, story exit and continuation')
        # The entire first-play campaign uses real grid taps, not direct wins.
        paths=[]
        for index in range(6):
            assert page.evaluate('current().id')==f'stage-{index}'
            paths.append(solve(page)); page.locator('#flowNext').click()
        assert_view(page,'story'); assert page.locator('#storyTitle').inner_text()=='숲 너머의 목소리'
        finish_story(page); assert page.locator('#storyTitle').inner_text()=='길가의 행상인'
        finish_story(page); assert_view(page,'world')
        assert page.evaluate('GameFlow.progress().completedStages.length')==6
        assert page.evaluate('GameFlow.progress().seenStories.length')==3
        passed(f'first-play: departure → six solved stages {paths} → two stories → world')
        page.screenshot(path=str(OUT/'world-375.png'))
        assert page.locator('#worldContinue').is_hidden()
        page.locator('[data-region-id="gate-town"]').click()
        assert_view(page,'story'); assert page.locator('#storyTitle').inner_text()=='관문에 도착하다'
        finish_story(page); assert_view(page,'tutorial'); assert page.evaluate('current().id')=='gate-stage-1'
        page.screenshot(path=str(OUT/'gate-g1-375.png'))
        cols=page.evaluate('current().grid[0].length')
        for idx in [27,22,17,22,27]: page.locator('#grid .cell').nth(idx).click()
        assert page.evaluate('state.entered') and not page.evaluate('state.exited')
        assert '路標還沒看' in page.locator('#status').inner_text()
        for idx in [22,17,18,13]: page.locator('#grid .cell').nth(idx).click()
        page.locator('#inspectBtn').click(); page.locator('#grid .cell').nth(8).click()
        assert page.evaluate('state.inspected'); assert '北門' in page.locator('#sheet').inner_text()
        page.locator('#sheet button').click(); page.locator('#inspectBtn').click()
        for idx in [18,17,22,27]: page.locator('#grid .cell').nth(idx).click()
        page.locator('#flowNext').wait_for(state='visible'); assert page.evaluate('state.exited')
        page.locator('#flowNext').click(); assert page.locator('#storyTitle').inner_text()=='안팎은 잘 보네'
        finish_story(page); assert_view(page,'world')
        assert page.evaluate('GameFlow.progress().completedStages.length')==7
        assert page.evaluate('GameFlow.progress().seenStories.length')==5
        page.evaluate('GameFlow.showJourney()')
        assert '스테이지 1/7 · 이야기 2/2' in page.locator('.journeyRegion').filter(has_text='길목').inner_text()
        page.evaluate('GameFlow.showWorld()')
        passed('gate-town G1: region choice → story → enter/inspect/exit → story → world')
        before=page.evaluate('localStorage.getItem("'+KEY+'")'); legacy_before=page.evaluate('localStorage.getItem("'+LEGACY+'")')
        page.evaluate('GameFlow.showJourney()'); page.locator('[data-journey-filter="all"]').click()
        page.screenshot(path=str(OUT/'journey-375.png'),full_page=True)
        page.locator('[data-node-id="story:prologue-departure"]').click(); assert page.locator('#storySkip').is_visible()
        page.locator('#storySkip').click(); assert_view(page,'journey')
        for index in range(6):
            page.locator(f'[data-node-id="stage:stage-{index}"]').click(); solve(page)
            assert page.locator('#flowNext').inner_text()=='여정으로'
            page.locator('#flowNext').click(); assert_view(page,'journey')
        assert page.evaluate('localStorage.getItem("'+KEY+'")')==before
        assert page.evaluate('localStorage.getItem("'+LEGACY+'")')==legacy_before
        passed('all six replay completions and story reread leave both campaign saves unchanged')
        page.evaluate('GameFlow.playStage("stage-5",{mode:"replay"})')
        state_before=page.evaluate('JSON.stringify(state)')
        page.locator('#waitBtn').click(); assert page.evaluate('state.turn')==1
        page.locator('#undoBtn').click(); assert page.evaluate('JSON.stringify(state)')==state_before
        page.locator('#words button').first.click(); assert page.locator('#sheet .pinyin').inner_text(); page.locator('#sheet button').click()
        page.locator('#inspectBtn').click(); page.locator('.cell:has(.wolf)').click(); assert '위험 범위' in page.locator('#sheet').inner_text()
        page.locator('#sheet button').click(); page.locator('#inspectBtn').click()
        passed('waiting, undo, word cards and wolf inspection remain functional')
        for stage_id, positions in [('stage-4',[27,22,17]),('stage-2',[27,22,17])]:
            page.evaluate('(id)=>GameFlow.playStage(id,{mode:"replay"})',stage_id)
            for cell in positions[:2]: page.locator('#grid .cell').nth(cell).click()
            snapshot=page.evaluate('JSON.stringify(state)')
            page.locator('#grid .cell').nth(positions[2]).click()
            assert page.evaluate('JSON.stringify(state)')==snapshot
            assert page.locator('#status').get_attribute('class')=='status bad'
            assert page.locator('.hero').get_attribute('data-mood')=='panic'
        passed('thorns and wolf danger reject moves without spending a turn; reaction still appears')
        # An old completion callback must not open a sheet after navigating away.
        page.evaluate('GameFlow.playStage("stage-0",{mode:"replay"})')
        page.locator('.cell:has(.hero)').click()
        page.locator('#grid .cell').nth(7).click(); page.locator('#grid .cell').nth(4).click()
        page.evaluate('document.querySelectorAll("#grid .cell")[1].click();GameFlow.showJourney()')
        page.wait_for_timeout(180); assert_view(page,'journey'); assert not page.locator('#scrim').is_visible()
        passed('completion timer is cancelled on navigation')
        for width,height in [(360,640),(375,667),(390,844)]:
            page.set_viewport_size({'width':width,'height':height})
            page.evaluate('GameFlow.playStory("chapter1-roadside-merchant",{mode:"replay"})')
            for _ in range(4): page.locator('#storyNext').click()
            page.locator('#storyTranslate').click()
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            rect=page.locator('#storyNext').bounding_box(); assert rect['y']+rect['height']<=height
            assert rect['height']>=44
            page.screenshot(path=str(OUT/f'story-{width}x{height}.png'))
            page.evaluate('GameFlow.showJourney()'); assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        passed('360–390px layouts: no horizontal overflow and 44px+ story actions in viewport')
        # Existing graduate with old-key-only data gets new stories, not a tutorial reset.
        old=json.loads(legacy_before); old['completed']=[f'stage-{i}' for i in range(6)]
        page.evaluate('([k,v])=>{localStorage.clear();localStorage.setItem(k,v)}',[LEGACY,json.dumps(old)])
        page=reload_app(page, context); assert_view(page,'journey'); assert page.evaluate('GameFlow.progress().seenStories.length')==0
        page.locator('#journeyContinue').click(); assert page.locator('#storyTitle').inner_text()=='숲 너머의 목소리'
        passed('old-key-only graduate keeps all clears and starts the unseen epilogue')
        # Legacy partial campaign: replay must restore its original exact tactical position.
        partial={'stageIndex':0,'state':{'hero':[2,1],'phase':0,'stone':False,'crossed':False,'entry':None,'turn':1},'history':[],'selected':True,'inspect':False,'completed':[]}
        page.evaluate('([k,v])=>{localStorage.clear();localStorage.setItem(k,v)}',[LEGACY,json.dumps(partial)])
        page=reload_app(page, context); assert_view(page,'tutorial')
        page.evaluate('GameFlow.showJourney()'); page.locator('[data-journey-filter="all"]').click()
        page.locator('[data-node-id="stage:stage-0"]').click(); solve(page); page.locator('#flowNext').click()
        page.locator('#journeyContinue').click(); assert page.evaluate('state.hero')==[2,1]
        assert page.evaluate('GameFlow.progress().completedStages.length')==0
        passed('replay of an open unfinished stage does not complete it or lose campaign position')
        page.evaluate("""() => {
          const story=JourneyContent.STORIES['prologue-departure'];
          story.beats=Array.from({length:15},()=>({speaker:'boy',zh:'路還很長。'.repeat(45),ko:'길은 아직 멀다. '.repeat(45)}));
          GameFlow.playStory(story.id);
        }""")
        page.locator('#storyTranslate').click()
        rect=page.locator('#storyNext').bounding_box()
        assert rect['y']+rect['height']<=page.viewport_size['height']
        for _ in range(14): page.locator('#storyNext').click()
        assert page.locator('#storyCount').inner_text()=='15 / 15'
        assert page.evaluate('GameFlow.progress().seenStories.length')==0
        passed('15-beat long-text fixture stays operable and is not marked seen merely on its last beat')
        page.evaluate('GameFlow.showJourney()')
        page.locator('#journeyReset').click()
        assert '튜토리얼 스테이지' in page.locator('#sheet').inner_text()
        assert page.locator('#flowResetConfirm').inner_text()=='처음부터 시작'
        page.locator('#flowResetCancel').click(); assert not page.locator('#scrim').is_visible()
        passed('journey reset has an explicit destructive confirmation and cancel path')
        if not MEMORY:
            page.locator('#journeyReset').click(); page.locator('#flowResetConfirm').click()
            page.wait_for_function('!!window.GameFlow')
            assert_view(page,'story'); assert page.locator('#storyTitle').inner_text()=='고향을 떠나다'
            assert page.evaluate('GameFlow.progress().completedStages.length')==0
            assert page.evaluate('localStorage.getItem("chufa-tutorial-v03")') is None
            assert page.evaluate('localStorage.getItem("chinese-word-tactics-world-v1")') is None
            passed('journey reset clears all campaign saves and restarts at P-01')
        page.evaluate("""() => {
          Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(){throw Error('denied')},setItem(){throw Error('full')}}});
          GameFlow.playStory('prologue-departure');
        }""")
        assert page.locator('#flowNotice').is_visible()
        page.locator('#storyNext').click(); assert page.locator('#storyCount').inner_text()=='2 / 15'
        passed('storage failures are visible and story still advances in memory')
        assert not errors, errors
        assert not missing, missing
        passed('no JavaScript exceptions; all static relative assets resolved' if MEMORY else 'no JavaScript exceptions or missing project-subpath resources')
        context.close(); browser.close()
finally:
    server.shutdown()
(OUT/'results.json').write_text(json.dumps({'mode':'memory-fixture' if MEMORY else 'http', 'passed':results},ensure_ascii=False,indent=2))
print(f'{len(results)} browser checks passed. Screenshots: {OUT}')
