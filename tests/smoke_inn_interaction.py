"""Standalone bundle: real game, namespaced saves, mobile touch, browser matrix.
BASE_URL may point to the deployed Pages subtree. No production game keys are touched there.
"""
import json, os, threading, http.server
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('TEST_OUTPUT','/tmp/inn-integration-evidence'));OUT.mkdir(parents=True,exist_ok=True)
server=None
if os.environ.get('BASE_URL'): url=os.environ['BASE_URL']
else:
 class Handler(http.server.SimpleHTTPRequestHandler):
  def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
  def log_message(self,*a):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
 threading.Thread(target=server.serve_forever,daemon=True).start()
 url=f'http://127.0.0.1:{server.server_port}/inn-interaction-test/'
KEY='cwt-inn-interaction-v1:chinese-word-tactics-journey-v1'
basic={'seenStories':[],'completedStages':['stage-5'],'completedMilestones':['inn-unlocked'],'acknowledgedNodes':[],'stageOutcomes':{},'lastLocation':{'view':'world'},'innVisited':False}
chapter={**basic,'innVisited':True,'seenStories':['chapter1-room-finale','chapter1-inn-convergence'],'completedMilestones':['inn-unlocked','chapter1-complete','market-core','gate-core','workshop-core']}
rain={**chapter,'seenStories':chapter['seenStories']+['chapter2-rain-opening'],'completedMilestones':chapter['completedMilestones']+['chapter2-rain-passed']}
report={**rain,'seenStories':rain['seenStories']+['first-free-quest-accepted'],'completedStages':['stage-5','first-free-quest-forest']}
board={**report,'seenStories':report['seenStories']+['first-free-quest-report','quest-board-installed'],'completedMilestones':rain['completedMilestones']+['first-free-quest-completed','quest-board-unlocked']}

def seed(page,state):
 page.evaluate('([key,state])=>GameStorage.setItem(key,JSON.stringify(state))',['chinese-word-tactics-journey-v1',state])
 page.reload();page.wait_for_function('!!window.InnLobby && !!window.FirstFreeQuest')

def lobby(page):
 page.evaluate('GameFlow.showWorld(); WorldInn.enterInn()')
 page.locator('#innLobbyView').wait_for(state='visible')
 page.wait_for_function("document.querySelector('#innLobbyScene')?.dataset.state && !document.querySelector('#innLobbyStatus').textContent")
 page.wait_for_function("[...document.querySelectorAll('#innLobbyLayers img')].every(i=>i.complete&&i.naturalWidth>0)")

def finish_story(page):
 for _ in range(60):
  if not page.locator('#storyView').is_visible():return
  page.locator('#storyNext').click()
 raise AssertionError('Story did not finish')

try:
 with sync_playwright() as pw:
  for engine in os.environ.get('BROWSERS','chromium,webkit').split(','):
   browser=getattr(pw,engine).launch()
   for w,h in [(360,640),(375,812)]:
    ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True)
    page=ctx.new_page();page.set_default_timeout(12000)
    errors=[];missing=[];requests=[];page.on('request',lambda r:requests.append((r.resource_type,r.url)));page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:missing.append(r.url) if r.status>=400 and 'favicon' not in r.url else None)
    page.goto(url);page.wait_for_function('!!window.FirstFreeQuest')
    # Observe existing production keys without seeding/writing them, including on public URLs.
    before=page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.startsWith('cwt-inn-')))")
    seed(page,basic);page.evaluate('GameFlow.showWorld();WorldInn.openInnSheet()');page.locator('#worldInnEnter').click()
    page.locator('#innRoomView').wait_for(state='visible')
    assert page.evaluate('GameFlow.progress().innVisited')
    page.wait_for_selector('#innRoomScene .innHalo')
    assert page.locator('#innRoomScene .innHalo').count()==3
    page.wait_for_function("!document.querySelector('#innRoomScene .innHalo')")
    page.evaluate('WorldInn.openRoom()');page.wait_for_timeout(200)
    assert page.locator('#innRoomScene .innHalo').count()==0
    page.locator('#hotspot-bed').click();assert page.locator('#innRoomView .innWord').inner_text()=='床'
    page.locator('#hotspot-door').click();page.locator('#innLobbyView').wait_for(state='visible')
    page.locator('#innLobbyTargets [data-interaction="door"]').click();page.locator('#worldView').wait_for(state='visible')
    page.reload();lobby(page)
    for name in ['keeper','table','pot','cup','ledger','stairs','door']:
     b=page.locator(f'#innLobbyTargets [data-interaction="{name}"]');box=b.bounding_box();assert box['width']>=44 and box['height']>=44,(name,box)
     # Each center must be its own target, not an overlapping neighbor.
     assert b.evaluate('(b)=>{let r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}'),name
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    for target,zh in [('pot','茶壺'),('cup','茶杯'),('ledger','帳簿'),('table','餐桌')]:
     page.locator(f'#innLobbyTargets [data-interaction="{target}"]').tap()
     assert page.locator('#innLobbyView .innWord').inner_text()==zh
     assert not page.locator('#sheet').is_visible()
    page.locator('#innLobbyTargets [data-interaction="keeper"]').tap()
    assert page.locator('.innDialogue:visible').inner_text()
    assert page.locator('#innLobbyView .innMeaning').is_hidden()
    page.get_by_role('button',name='한국어 뜻 보기',exact=True).tap()
    assert page.locator('#innLobbyView .innMeaning').is_visible()
    page.locator('#innLobbyView .innHelp').tap()
    assert page.locator('#innLobbyLayers .innHalo').count()==4
    assert page.locator('#innLobbyTargets .innHintPoint.innHalo').count()==3
    page.screenshot(path=str(OUT/f'lobby-halo-{engine}-{w}x{h}.png'),full_page=True)
    page.wait_for_function("!document.querySelector('#innLobbyScene .innHalo')")
    page.screenshot(path=str(OUT/f'lobby-dry-{engine}-{w}x{h}.png'),full_page=True)
    page.locator('#innLobbyTargets [data-interaction="stairs"]').click();page.locator('#innRoomView').wait_for(state='visible')
    page.locator('#innRoomBack').click()
    page.locator('#innLobbyMenu').click();page.locator('#flowSettings').click();page.locator('#settingsBack').click();assert page.locator('#innLobbyView').is_visible()
    seed(page,chapter);page.evaluate('WorldInn.openRoom()');page.locator('#hotspot-door').click();assert page.locator('#storyTitle').inner_text()=='큰비가 내리던 밤'
    finish_story(page);page.locator('#innLobbyView').wait_for(state='visible')
    assert page.evaluate('InnLobby.stateFor().rain')
    page.locator('#innLobbyTargets [data-interaction="keeper"]').click();page.locator('#firstQuestAccept').click();finish_story(page)
    assert page.evaluate('FirstFreeQuest.accepted(GameFlow.progress())')
    # Real report -> board installation; actual stage id comes from content.
    real_report=page.evaluate('(p)=>({...p,completedStages:["stage-5",FirstFreeQuestContent.STAGE_ID]})',report)
    seed(page,real_report);lobby(page);page.locator('#innLobbyTargets [data-interaction="keeper"]').click();page.locator('#firstQuestReport').click();finish_story(page)
    page.evaluate('WorldInn.openLobby()');page.wait_for_selector('#innLobbyTargets [data-interaction="board"]')
    assert page.evaluate('FirstFreeQuest.boardUnlocked(GameFlow.progress())')
    page.locator('#innLobbyTargets [data-interaction="board"]').click();assert '의뢰 게시판' in page.locator('#sheet').inner_text();page.locator('#questBoardClose').click()
    page.screenshot(path=str(OUT/f'lobby-board-{engine}-{w}x{h}.png'),full_page=True)
    # Independent projection combinations, using the real runtime's condition projector.
    assert page.evaluate('''async()=>{let s=await (await fetch('./inn-layer-test/scene.json')).json();
      for(let b of [false,true]) for(let r of [false,true]) for(let n of [false,true]){
       let ids=s.objects.filter(o=>InnLobby.visible(s.conditions[o.condition],{board:b,rain:r,newQuest:n})).map(o=>o.id);
       if(ids.includes('inn.lobby.board')!==b || ids.includes('inn.lobby.rain.water')!==r || ids.includes('inn.lobby.notice.new')!==(b&&n))return false;
      }return true;}''')
    # Old save: known story evidence migrates; missing visit evidence retains first-visit experience.
    old={**board};old.pop('innVisited');seed(page,old);assert page.evaluate('GameFlow.progress().innVisited')
    lobby(page)
    # Backup roundtrip must keep visitor bit and original game logical key names.
    backup=page.evaluate('SaveData.createBackup(GameStorage)');assert backup['storage']['chinese-word-tactics-journey-v1']['innVisited']
    assert page.evaluate('(b)=>SaveData.validateBackup(b).ok',backup)
    page.evaluate('(b)=>SaveData.restoreBackup(GameStorage,b)',backup);page.reload();lobby(page)
    # Every keepsake retains its real story condition.
    gifts={**board,'seenStories':board['seenStories']+['gate-after-route','gate-after-convoy','workshop-finale','academic-tower-turn-result'],'stageOutcomes':{'gate-stage-3':{'viaIds':['west-post','east-post']}}}
    seed(page,gifts);page.evaluate('WorldInn.openRoom()');page.wait_for_selector('[data-keepsake-id="observation-card"]')
    assert page.locator('[data-keepsake-id]').count()==5
    for b in page.locator('[data-keepsake-id]').all():
     b.click();assert page.locator('#innRoomView .innWord').inner_text() in b.get_attribute('aria-label');assert not page.locator('#sheet').is_visible()
    page.wait_for_function("[...document.querySelectorAll('#innRoomScene img')].every(i=>i.complete&&i.naturalWidth>0)")
    for b in page.locator('#innRoomHotspots button, [data-keepsake-id]').all():
     box=b.bounding_box();assert box['width']>=44 and box['height']>=44,(b.get_attribute('aria-label'),box)
     assert b.evaluate('(b)=>{let r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}'),b.get_attribute('aria-label')
    for word,zh in [('bed','床'),('desk','桌子'),('chair','椅子'),('chest','箱子')]:
     page.locator('#hotspot-'+word).click();assert page.locator('#innRoomView .innWord').inner_text()==zh
    assert page.locator('#innRoomScene').bounding_box()['width']>=w-40
    page.emulate_media(reduced_motion='reduce')
    help=page.locator('#innRoomView .innHelp');help.focus();page.keyboard.press('Enter')
    assert page.locator('#innRoomScene .innHalo').count()==10
    assert page.locator('#innRoomLayers img').first.evaluate('(el)=>getComputedStyle(el).transitionDuration')=='0s'
    page.screenshot(path=str(OUT/f'room-halo-{engine}-{w}x{h}.png'),full_page=True)
    page.wait_for_function("!document.querySelector('#innRoomScene .innHalo')")
    page.locator('#hotspot-bed').focus();page.keyboard.press('Enter')
    assert page.locator('#innRoomView .innWord').inner_text()=='床'
    page.emulate_media(reduced_motion='no-preference')
    page.screenshot(path=str(OUT/f'room-keepsakes-{engine}-{w}x{h}.png'),full_page=True)
    # Story replay must leave the main progress and visitor flag unchanged.
    saved=page.evaluate('GameFlow.progress()')
    page.evaluate("GameFlow.playStory('chapter2-rain-opening',{mode:'replay',returnTo:'world'})")
    finish_story(page);assert page.evaluate('GameFlow.progress()')==saved
    # Missing room asset still leaves word inspection and door available; retry recovers.
    page.route('**/assets/inn-room-c/mobile/bed.webp*',lambda route:route.abort())
    page.reload();page.evaluate('WorldInn.openRoom()')
    page.get_by_role('button',name='다시 불러오기',exact=True).wait_for(state='visible')
    page.locator('#hotspot-bed').click();assert page.locator('#innRoomView .innWord').inner_text()=='床'
    page.unroute('**/assets/inn-room-c/mobile/bed.webp*')
    page.get_by_role('button',name='다시 불러오기',exact=True).click()
    page.wait_for_function("document.querySelector('#innRoomLoading').hidden")
    assert all(u.startswith(url) or u.startswith(('data:','blob:')) for typ,u in requests if typ in ['script','image','stylesheet']),[u for typ,u in requests if typ in ['script','image','stylesheet'] and not u.startswith(url)]
    after=page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.startsWith('cwt-inn-')))")
    assert before==after,'production storage changed'
    assert not errors,errors
    assert not missing,missing
    ctx.close()
   browser.close()
finally:
 if server:server.shutdown()
print('PASS: integrated inn mobile, save/backup isolation, real offer/report/rain and keepsakes')
