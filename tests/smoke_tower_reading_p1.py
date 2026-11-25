"""Isolated reading-direction prototype. Run: python tests/smoke_tower_reading_p1.py"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
base=os.environ.get('BASE_URL')
url=(base.rstrip('/')+'/tower-reading-p1-test/') if base else (root/'tower-reading-p1-test'/'index.html').as_uri()
with sync_playwright() as p:
    for engine in (p.chromium,p.webkit):
        browser=engine.launch()
        for width,height in ((375,812),(320,568)):
            page=browser.new_page(viewport={'width':width,'height':height})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(url)
            page.locator('[data-study="03A"]').click()
            assert page.locator('.lesson').is_visible()
            assert '既然' in page.locator('#source').inner_text()
            page.locator('[data-action="explore"][data-id="conditional"]').click()
            assert '如果找到圖紙' in page.locator('#source').inner_text()
            assert page.locator('.feedback').count()==0
            page.locator('[data-action="next"]').click()
            assert '就先把位置記下來吧' not in page.locator('#source').inner_text()
            page.locator('[data-id="condition"]').click()
            assert page.locator('.feedback.wrong').is_visible()
            assert '就先把位置記下來吧' in page.locator('#source').inner_text()
            page.locator('[data-id="premise"]').click()
            page.locator('[data-action="next"]').click()
            page.locator('[data-action="home"]').click()
            for sid in ('03A','03B','03C'):
                page.locator('[data-study="'+sid+'"]').click()
                tasks=page.evaluate("(sid)=>TowerReadingModel.studies.find(x=>x.id===sid).tasks",sid)
                for task in tasks:
                    if task['kind']=='lesson':
                        assert page.locator('.lesson').is_visible()
                        for variant in task['variants']:
                            page.locator('[data-action="explore"][data-id="'+variant['id']+'"]').click()
                            assert page.locator('#source').inner_text()==variant['sentence']
                            assert page.locator('.feedback').count()==0
                            assert page.locator('[data-action="explore"][aria-pressed="true"]').get_attribute('data-id')==variant['id']
                            assert page.locator('.learn-flow, .learn-fork, .learn-timeline, .learn-scope').count()==1
                            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                        page.locator('[data-action="next"]').click()
                        continue
                    if task['kind']=='reading':
                        assert page.locator('#source mark').count()==0
                    if 'options' in task:
                        page.locator('[data-action="answer"][data-id="'+task['answer']+'"]').click()
                    else:
                        assert page.locator('[data-action="check"]').is_disabled()
                        for row in task['rows']:
                            page.locator('[data-row="'+row['id']+'"][data-id="'+row['answer']+'"]').click()
                        page.locator('[data-action="check"]').click()
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                    page.locator('[data-action="next"]').click()
                assert page.get_by_text('연구 기록을 마쳤어.').is_visible()
                page.locator('section.complete [data-action="home"]').click()
            if base:
                assert page.evaluate('localStorage.length')==0
            assert not errors,errors
            page.close()
        browser.close()
print('P1 Chromium/WebKit prototype smoke passed')
