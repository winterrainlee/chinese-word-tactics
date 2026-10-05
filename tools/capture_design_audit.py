"""Read-only UI inventory; isolated synthetic saves, not an end-to-end playthrough.
Run: CHROMIUM_PATH=/path/to/chromium TEST_OUTPUT=/tmp/design-audit python tools/capture_design_audit.py
Outputs settled screenshots and computed geometry. Small targets are observations, not failures.
"""
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('TEST_OUTPUT', '/tmp/cwt-design-audit'))
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

METRICS = """() => {
 const root = document.querySelector('#scrim.open #sheet') || document.querySelector('.appView:not([hidden])');
 const rect = el => {const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
 const shown = el => {const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
 const targetRect = el => rect(el.tagName==='INPUT' && el.labels?.length && el.labels[0].contains(el) ? el.labels[0] : el);
 const targets = [...root.querySelectorAll('button,summary,select,input,[role="button"]')].filter(shown).map(el => ({
   id:el.id, text:(el.getAttribute('aria-label')||el.innerText||'').trim().slice(0,150),
   disabled:!!el.disabled, ariaDisabled:el.getAttribute('aria-disabled'), ...rect(el), effectiveTarget:targetRect(el), fontSize:getComputedStyle(el).fontSize,
   color:getComputedStyle(el).color, background:getComputedStyle(el).backgroundColor
 }));
 return {view:document.querySelector('.appView:not([hidden])')?.id, modal:root.id==='sheet',
   viewport:{width:innerWidth,height:innerHeight,visualHeight:visualViewport?.height},
   document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},
   root:rect(root),focus:document.activeElement?.id,
   headings:[...root.querySelectorAll('h1,h2,h3')].filter(shown).map(el=>({text:el.innerText,fontSize:getComputedStyle(el).fontSize,...rect(el)})),
   targets, smallTargets:targets.filter(t=>t.effectiveTarget.width<43.5||t.effectiveTarget.height<43.5),
   text:root.innerText, stylesheets:[...document.styleSheets].map(s=>s.href)};
}"""

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/'
results, failures = [], []
STAGE_MILESTONES = {}

def seed(nodes):
    return {'seenStories':[n['id'] for n in nodes if n['type']=='story'],
            'completedStages':[n['id'] for n in nodes if n['type']=='stage'],
            'completedMilestones':list(dict.fromkeys([n['milestone'] for n in nodes if n.get('milestone')] + [STAGE_MILESTONES[n['id']] for n in nodes if n['type']=='stage' and n['id'] in STAGE_MILESTONES])),
            'acknowledgedNodes':[], 'stageOutcomes':{}, 'lastLocation':{'view':'world'}}

def capture(page, name, size):
    # Finite entry animations finish before capture; do not turn a fade-in into a contrast defect.
    page.wait_for_timeout(650)
    page.evaluate('document.fonts.ready')
    data = page.evaluate(METRICS)
    slug = f'{name}-{size[0]}x{size[1]}'
    page.screenshot(path=str(OUT / f'{slug}.png'), full_page=True)
    results.append({'id':slug,'screenshot':f'{slug}.png',**data})
    (OUT / 'inventory.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')

def world(page):
    page.evaluate('GameFlow.showWorld()')
    page.wait_for_function("document.querySelector('.villageMapImage')?.naturalWidth > 0")

def room(page):
    page.evaluate('WorldInn.openRoom()')
    page.wait_for_function("document.querySelector('#innRoomBackdrop')?.dataset.loaded==='true' && document.querySelector('#innRoomHotspots')?.dataset.loaded==='true'")

try:
    with sync_playwright() as pw:
        launch = {'args':['--no-sandbox']}
        if os.environ.get('CHROMIUM_PATH'):
            launch['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = pw.chromium.launch(**launch)
        probe = browser.new_page()
        probe.goto(URL)
        probe.wait_for_function('!!window.GameFlow')
        nodes = probe.evaluate('JourneyProgress.allNodes()')
        STAGE_MILESTONES.update(probe.evaluate("Object.fromEntries(STAGES.filter(s=>s.milestone).map(s=>[s.id,s.milestone]))"))
        probe.close()
        campaign = [n for n in nodes if n['chapterId'] in ['prologue','chapter-1-three-roads']]
        first_quest = [n for n in nodes if n['id'] in ['first-free-quest-accepted','first-free-quest-forest','first-free-quest-return','first-free-quest-report','quest-board-installed']]
        fixtures = {'new':None, 'arrival':seed([n for n in nodes if n['chapterId']=='prologue']),
                    'home':seed(campaign), 'board':seed(campaign+first_quest), 'complete':seed(nodes)}
        for size in VIEWPORTS:
            for fixture, progress in fixtures.items():
                context = browser.new_context(viewport={'width':size[0],'height':size[1]},device_scale_factor=1,is_mobile=True,has_touch=True)
                if progress is not None:
                    context.add_init_script(f"localStorage.setItem({json.dumps(KEY)},JSON.stringify({json.dumps(progress)}));")
                page = context.new_page()
                page.set_default_timeout(10000)
                errors = []
                page.on('pageerror',lambda e:errors.append(str(e)))
                try:
                    page.goto(URL)
                    page.wait_for_function('!!window.GameFlow && !!window.WorldInn')
                    snap = lambda name: capture(page,name,size)
                    if fixture=='new':
                        snap('landing-new')
                        page.locator('#landingSettings').click(); snap('settings-new')
                        page.evaluate("SettingsRuntime.inspectFile(new File(['not json'],'bad.json',{type:'application/json'}))"); snap('settings-invalid-file')
                        page.evaluate("SettingsRuntime.inspectFile(new File([JSON.stringify(SaveData.createBackup(localStorage))],'backup.json',{type:'application/json'}))"); snap('settings-restore-preview')
                        page.locator('#settingsReset').click(); snap('settings-reset-confirm'); page.locator('#flowResetCancel').click()
                        page.locator('#settingsBack').click(); snap('landing-settings-return')
                        page.locator('#landingPrimary').click(); snap('story-opening')
                        page.locator('#storyTranslate').click(); snap('story-translation')
                        page.locator('#storyNext').click(); snap('story-speaker')
                        page.locator('#storyMenu').click(); snap('menu-from-story'); page.locator('#flowMenuClose').click()
                        page.evaluate('GameFlow.showWords()'); snap('lexicon-empty')
                    elif fixture=='arrival':
                        page.evaluate("LexiconRuntime.syncProgress(GameFlow.progress());GameFlow.showLanding()"); snap('landing-returning')
                        world(page); snap('world-arrival')
                        for region in ['gate-town','academic-tower','council-town','border-village']:
                            marker = page.locator(f'[data-region-id="{region}"]')
                            marker.click()
                            snap('place-'+region); page.evaluate('TacticalGame.closeSheet()')
                        page.evaluate('GameFlow.showJourney()'); snap('journey-arrival')
                    elif fixture=='home':
                        world(page); snap('world-chapter-complete')
                        page.locator('.worldInnMarker').click(); snap('inn-first-offer'); page.evaluate('TacticalGame.closeSheet()')
                        room(page); snap('room-keepsakes')
                        page.locator('#hotspot-bed').click(); snap('room-word-sheet'); page.locator('#innRoomWordClose').click()
                        page.locator('#innRoomBack').click(); snap('room-return-world')
                        page.evaluate('AcademicTowerRuntime.showHub()'); snap('tower-hub-new')
                    elif fixture=='board':
                        world(page); snap('world-board-unlocked')
                        page.evaluate('NorthForestWorld.openBoardSheet()'); snap('quest-board-new'); page.evaluate('TacticalGame.closeSheet()')
                        page.evaluate('NorthForestWorld.openForestSheet()'); snap('forest-place'); page.evaluate('TacticalGame.closeSheet()')
                        page.evaluate('GameFlow.showJourney()'); snap('journey-first-quest-complete')
                    else:
                        world(page); snap('world-complete')
                        page.evaluate('NorthForestWorld.openBoardSheet()'); snap('quest-board-complete'); page.evaluate('TacticalGame.closeSheet()')
                        room(page); snap('room-observation-card')
                        page.locator('[data-keepsake-id="observation-card"]').click(); snap('room-observation-detail'); page.evaluate('TacticalGame.closeSheet()')
                        page.evaluate('AcademicTowerRuntime.showHub()'); snap('tower-hub-complete')
                        page.locator('#academicTowerJourneyFooter').click(); snap('journey-tower-focus')
                        page.evaluate('GameFlow.showWords()'); page.locator('#wordsChapterSelect').select_option('chapter-1'); snap('lexicon-home')
                        page.locator('[data-lexicon-region="market-town"]').click(); snap('lexicon-market')
                        page.locator('[data-lexicon-group="market-buy-sell"]').click(); snap('lexicon-comparison')
                        page.locator('[data-lexicon-word="買"]').first.click(); snap('lexicon-word')
                        page.locator('#wordsSearchBtn').click(); page.locator('#lexiconSearchInput').fill('가격'); snap('lexicon-search')
                        page.locator('#lexiconSearchInput').fill('없는검색어xyz'); snap('lexicon-no-results')
                    if errors:
                        failures.append({'fixture':fixture,'viewport':size,'pageErrors':errors})
                except Exception as error:
                    failures.append({'fixture':fixture,'viewport':size,'error':str(error)})
                finally:
                    context.close()
        browser.close()
finally:
    server.shutdown()
    (OUT / 'manifest.json').write_text(json.dumps({'commit':os.environ.get('GITHUB_SHA'),'viewports':VIEWPORTS,'captureCount':len(results),'failures':failures,'method':'isolated synthetic progress snapshots; finite animations settled; not an end-to-end playthrough; geometry includes offscreen scroll content; input targets use wrapping labels; place information uses normal pointer clicks' },ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'captureCount':len(results),'failures':failures},ensure_ascii=False))
if failures:
    raise SystemExit(1)
