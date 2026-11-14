"""Reader integration on mobile Chromium/WebKit and Pages subpath; no network NLP."""
import json
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

import http.server

class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
 def translate_path(self,path):
  root=Path(__file__).resolve().parents[1]
  relative=path.split('?',1)[0].removeprefix('/chinese-word-tactics/')
  target=(root/relative).resolve()
  return str(target if target.is_relative_to(root) else root/'__missing__')

KEY='chinese-word-tactics-reader-draft-v1'
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=os.environ.get('BASE_URL',f'http://127.0.0.1:{server.server_port}/chinese-word-tactics/')
text='😀𠮷此外，若明天下雨，將取消。\n\n<img src=x onerror="window.readerInjected=true">\n廢除非核政策，立即使用。說得很清楚。\n茶：清香；水、杯。「好嗎？」（好！）,;:'
with sync_playwright() as p:
 for name in os.environ.get('BROWSERS','chromium,webkit').split(','):
  browser=getattr(p,name).launch(**({'executable_path':os.environ['CHROMIUM_PATH']} if name=='chromium' and os.environ.get('CHROMIUM_PATH') else {}))
  page=browser.new_page(viewport={'width':375,'height':667})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url);page.wait_for_function('!!window.ReaderRuntime && !!window.GameFlow')
  before=page.evaluate('JSON.stringify(GameFlow.progress())')
  page.evaluate('GameFlow.showMenu()');page.click('#flowReader')
  assert page.locator('#readerView').is_visible()
  # Check before clicking reader controls: Playwright auto-scroll can mask a blank viewport.
  for width,height in [(375,667),(390,844),(1024,768)]:
   page.set_viewport_size({'width':width,'height':height})
   layout=page.evaluate("""() => {
    const view=document.querySelector('#readerView');
    const top=document.querySelector('.readerTop').getBoundingClientRect();
    return {parent:view.parentElement.id, y:view.getBoundingClientRect().top+scrollY,
      headerTop:top.top, headerBottom:top.bottom, scroll:scrollY,
      overflow:document.documentElement.scrollWidth>innerWidth};
   }""")
   assert layout['parent']=='app' and layout['y']<=1,layout
   assert 0<=layout['headerTop']<60 and layout['headerBottom']<height,layout
   assert layout['scroll']==0 and not layout['overflow'],layout
  page.set_viewport_size({'width':375,'height':667})
  assert page.locator('#readerRead').is_disabled()
  page.fill('#readerText',text);page.fill('#readerTitle','시험 글');page.click('#readerRead')
  assert page.locator('#readerBody').text_content()==text
  assert not page.locator('#readerToggle').is_checked()
  assert not page.locator('#readerPunctuationToggle').is_checked()
  assert page.locator('#readerBody img').count()==0
  assert page.evaluate('!window.readerInjected')
  page.evaluate('window.readerNode=document.querySelector("#readerBody").firstChild')
  # Playwright may scroll a control into view; compare document coordinates.
  geometry='el => { const r=el.getBoundingClientRect(); return [r.x+scrollX,r.y+scrollY,r.width,r.height]; }'
  box=page.locator('#readerBody').evaluate(geometry)
  punctuation=page.locator('#readerBody .readerPunctuation')
  assert punctuation.all_text_contents()==['，','，','，','：','；']
  color='el => getComputedStyle(el).backgroundColor'
  # Both options are independent; excluded punctuation and source text stay untouched.
  assert punctuation.first.evaluate(color)=='rgba(0, 0, 0, 0)'
  page.check('#readerPunctuationToggle')
  assert punctuation.first.evaluate(color)=='rgb(229, 242, 228)'
  assert page.locator('#readerBody mark').first.evaluate(color)=='rgba(0, 0, 0, 0)'
  page.check('#readerToggle')
  assert page.locator('#readerBody mark').first.evaluate(color)=='rgb(229, 242, 228)'
  page.uncheck('#readerPunctuationToggle')
  assert punctuation.first.evaluate(color)=='rgba(0, 0, 0, 0)'
  assert page.locator('#readerBody mark').first.evaluate(color)=='rgb(229, 242, 228)'
  page.check('#readerPunctuationToggle')
  assert page.evaluate('readerNode===document.querySelector("#readerBody").firstChild')
  after=page.locator('#readerBody').evaluate(geometry)
  assert after==box,(box,after)
  assert page.locator('#readerBody').text_content()==text
  assert page.locator('#readerBody mark').all_text_contents()==['此外','若'] # 將 is context only
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.evaluate('GameFlow.showMenu()');page.click('#flowMenuClose')
  assert page.locator('#readerToggle').is_checked()
  assert page.locator('#readerPunctuationToggle').is_checked()
  page.click('#readerBack');assert page.locator('#landingView').is_visible()
  assert page.locator('#readerView').evaluate('el => el.getBoundingClientRect().height')==0
  assert page.locator('#landingView').evaluate('el => el.getBoundingClientRect().top+scrollY')<30
  assert page.evaluate('JSON.stringify(GameFlow.progress())')==before
  page.reload();page.evaluate('GameFlow.showMenu()');page.click('#flowReader')
  assert page.locator('#readerBody').text_content()==text
  assert page.locator('#readerToggle').is_checked()
  assert page.locator('#readerPunctuationToggle').is_checked()
  page.click('#readerEdit');page.click('#readerRead')
  assert page.locator('#readerPunctuationToggle').is_checked()
  page.click('#readerEdit');page.fill('#readerText','字'*5001)
  assert page.locator('#readerRead').is_disabled()
  page.wait_for_timeout(400)
  assert page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).text',KEY)==text
  page.click('#readerDelete');page.click('#readerDeleteCancel')
  assert page.locator('#readerText').input_value()=='字'*5001
  page.click('#readerDelete');page.click('#readerDeleteYes')
  assert page.evaluate('(k)=>localStorage.getItem(k)',KEY) is None
  assert not page.locator('#readerToggle').is_checked() or not page.locator('#readerOutput').is_visible()
  page.fill('#readerText','白茶，清香；好喝。');page.click('#readerRead');page.check('#readerToggle')
  assert not page.locator('#readerPunctuationToggle').is_checked()
  page.check('#readerPunctuationToggle')
  assert page.locator('#readerEmpty').is_visible()
  # Return to still-live story and tactical state, without changing progress.
  page.click('#readerBack');page.evaluate('GameFlow.playStory("prologue-departure")')
  for view in ['story','tutorial','field','academicTower','words','journey','settings','innRoom','innLobby']:
   # Existing view DOM is deliberately retained: return must not reinitialize it.
   if view=='innRoom': page.evaluate('WorldInn.openRoom()')
   elif view=='innLobby': page.evaluate('InnLobby.open()')
   else: page.evaluate('(v)=>TacticalGame.showView(v)',view)
   assert page.locator(f'#{view}View').is_visible(),view
   snapshot=page.evaluate('JSON.stringify(GameFlow.progress())')
   page.evaluate('GameFlow.showMenu()');page.click('#flowReader');page.click('#readerBack')
   assert page.locator(f'#{view}View').is_visible(),view
   assert page.evaluate('JSON.stringify(GameFlow.progress())')==snapshot,view
  # Invalid storage and denied writes are recoverable.
  # Seed corruption after pagehide has flushed the previous valid draft.
  page.add_init_script(f'localStorage.setItem({json.dumps(KEY)}, "broken")')
  page.reload()
  page.evaluate('GameFlow.showMenu()');page.click('#flowReader')
  assert '불러오지' in page.locator('#readerStorageStatus').text_content()
  page.evaluate('() => { Storage.prototype.setItem=function(){throw Error("denied")}; }')
  page.fill('#readerText','此外，讀茶。');page.click('#readerRead')
  assert '하지 못' in page.locator('#readerStorageStatus').text_content()
  page.screenshot(path=f'/tmp/reader-{name}.png',full_page=True)
  assert not errors,errors
  # Existing drafts without the new optional preference remain readable and default off.
  legacy=browser.new_page(viewport={'width':375,'height':667})
  old={'schemaVersion':1,'title':'기존 글','text':'茶：清香。','showMarkers':True,'updatedAt':1}
  legacy.add_init_script(f'localStorage.setItem({json.dumps(KEY)}, {json.dumps(json.dumps(old))})')
  legacy.goto(url);legacy.wait_for_function('!!window.ReaderRuntime && !!window.GameFlow')
  legacy.evaluate('GameFlow.showMenu()');legacy.click('#flowReader')
  assert legacy.locator('#readerBody').text_content()==old['text']
  assert legacy.locator('#readerToggle').is_checked()
  assert not legacy.locator('#readerPunctuationToggle').is_checked()
  assert legacy.locator('#readerStorageStatus').text_content()==''
  legacy.close()
  browser.close()
  print(f'PASS {name}: reader input/render/toggle/storage/return/subpath')
server.shutdown()
