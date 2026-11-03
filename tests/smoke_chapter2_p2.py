"""Exercise the shipped entry points in isolated mobile contexts, locally or on Pages."""
import functools
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
COUNCIL = ('council-town', 'chapter2-council-first', 'council-stage-01-minutes',
           ['market', 'request', 'report', 'concern', 'resident', 'incoming', 'town'])
BORDER = ('border-village', 'chapter2-border-first', 'border-stage-01-notice',
          ['part', 'temporary', 'walk', 'check', 'limit', 'hearsay'])
KEY = 'chinese-word-tactics-journey-v1'

def enter(page, region):
    page.locator(f'.regionCard[data-region-id="{region}"]').tap()
    page.locator('#worldPlaceGo').tap()

def exercise(browser, url, height, order, legacy):
    ctx = browser.new_context(viewport={'width':375, 'height':height}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto(url)
    page.wait_for_function('!!window.GameFlow && !!window.Chapter2Fields')
    page.evaluate("""key=>localStorage.setItem(key,JSON.stringify({completedStages:['stage-5'],
        completedMilestones:['chapter1-complete'],lastLocation:{view:'world'}}))""", KEY)
    page.reload()
    page.evaluate('GameFlow.showWorld()')
    for region,prefix,stage,_ in order:
        page.locator(f'.regionCard[data-region-id="{region}"]').tap()
        assert page.get_by_role('button',name='큰비가 지난 뒤').is_disabled()
        assert not page.evaluate('id=>GameFlow.playStory(id)',prefix+'-intro')
        assert not page.evaluate('id=>GameFlow.playStage(id)',stage)
        page.locator('#worldPlaceClose').tap()
    page.evaluate("""([key,legacy]) => localStorage.setItem(key, JSON.stringify({
      completedStages:['stage-5'],seenStories:legacy?['first-free-quest-accepted','chapter2-market-first-look']:[],
      completedMilestones:['chapter1-complete',...(legacy?[]:['chapter2-rain-passed'])],
      lastLocation:{view:'world'}
    }))""", [KEY,legacy])
    page.reload()
    page.evaluate('GameFlow.showWorld()')
    for index,(region,prefix,stage,answers) in enumerate(order):
        if region=='council-town':
            page.locator('.regionCard[data-region-id="council-town"]').tap()
            assert page.get_by_role('button',name='장터에서 회의 소식 듣기').is_disabled()
            page.locator('#worldPlaceClose').tap()
            page.locator('.regionCard[data-region-id="market-town"]').tap()
            page.locator('#worldFirstLookEntry').tap()
            for _ in range(0 if legacy else 4): page.locator('#storyNext').tap()
            assert page.evaluate('GameFlow.progress().heardCouncilNotice')
            page.locator('#storyNext').tap()
        enter(page,region)
        beats=(15 if region=='council-town' else 2)+index
        assert page.locator('#storyCount').inner_text() == f'1 / {beats}'
        if region=='council-town': assert '여관' in page.locator('#storyPlace').inner_text()
        for i in range(beats):
            if region=='council-town' and i==3: assert '회의소' in page.locator('#storyPlace').inner_text()
            page.locator('#storyNext').tap()
        view = page.locator('#fieldView')
        assert view.is_visible()
        page.locator('#fieldHelp').tap()
        assert page.locator('.fieldReading').inner_text().strip()
        for i,answer in enumerate(answers):
            if i == 0:
                page.locator(f'[data-link]:not([data-link="{answer}"])').first.tap()
            else:
                page.locator(f'[data-link="{answer}"]').tap()
            if i == 1:
                assert page.evaluate('''() => {
                    const backup=SaveData.createBackup(localStorage);
                    if (!SaveData.validateBackup(backup).ok) return false;
                    localStorage.clear(); SaveData.restoreBackup(localStorage,backup); return true;
                }''')
                page.reload()
                page.locator('#landingPrimary').tap()
                assert view.is_visible()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert all(btn.bounding_box()['height'] >= 44 for btn in view.locator('button:visible').all())
            page.locator('#fieldNext').tap()
        assert '다시 확인' in view.locator('[role=status]').inner_text()
        page.locator(f'[data-link="{answers[0]}"]').tap()
        page.locator('#fieldNext').tap()
        assert page.locator('#storyView').is_visible()
        page.locator('#storyNext').tap()
        page.locator('#storyNext').tap()
        assert page.locator('#worldView').is_visible()
        outcome = page.evaluate('id => GameFlow.progress().stageOutcomes[id]', stage)
        assert outcome['prior'] == bool(index)
        assert len(outcome['links']) == len(answers)
        page.evaluate('WorldInn.openLobby()')
        keeper=page.locator('#innLobbyTargets [data-interaction="keeper"]')
        keeper.tap()
        choice=page.get_by_role('button',name='회의 이야기 전하기')
        if region=='council-town':
            choice.tap()
            page.locator('#storyNext').tap()
            page.reload()
            page.locator('#landingPrimary').tap()
            assert page.locator('#storyCount').inner_text()=='2 / 3'
            page.locator('#storyNext').tap()
            page.get_by_role('button',name='로비로',exact=True).tap()
            assert page.locator('#innLobbyView').is_visible()
            assert page.evaluate("GameFlow.progress().seenStories.includes('chapter2-council-inn-report')")
            keeper.tap()
        assert choice.count()==0
        page.evaluate('TacticalGame.closeSheet(); GameFlow.showWorld()')
    assert page.evaluate("['該','本','目前','暫時','限制'].every(w=>LexiconRuntime.snapshot().discovered.includes(w))")
    before = page.evaluate("Object.fromEntries(SaveData.KEY_LIST.map(k=>[k,localStorage.getItem(k)]))")
    region,prefix,stage,answers = order[0]
    enter(page,region)
    page.locator(f'.journeyNode[data-node-id="stage:{stage}"]').tap()
    for answer in answers:
        page.locator(f'[data-link="{answer}"]').tap()
        page.locator('#fieldNext').tap()
    assert page.locator('#journeyView').is_visible()
    assert before == page.evaluate("Object.fromEntries(SaveData.KEY_LIST.map(k=>[k,localStorage.getItem(k)]))")
    assert not errors, errors
    ctx.close()

if __name__ == '__main__':
    server = None
    url = os.environ.get('BASE_URL')
    if not url:
        server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(SimpleHTTPRequestHandler,directory=ROOT))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        url = f'http://127.0.0.1:{server.server_port}/'
    try:
        with sync_playwright() as pw:
            for name in os.environ.get('P2_ENGINES','chromium webkit').split():
                browser = getattr(pw,name).launch()
                exercise(browser,url,640,[COUNCIL,BORDER],False)
                exercise(browser,url,812,[BORDER,COUNCIL],True)
                browser.close()
                print(f'PASS {name}: both orders, legacy, resume, correction, replay, lexicon and backup')
    finally:
        if server: server.shutdown()
