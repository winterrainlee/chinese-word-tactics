"""Public production UI in fresh ephemeral browser contexts; no user's browser storage."""
import os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 for engine in ['chromium','webkit']:
  b=getattr(p,engine).launch()
  for w,h in [(360,640),(375,812)]:
   c=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True)
   page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(os.environ['BASE_URL']);page.wait_for_function('!!window.WorldInn')
   assert page.locator('meta[name="cwt-build"]').get_attribute('content')=='2026-11-02-inn-interaction-c-v1'
   page.evaluate('WorldInn.openRoom()')
   for obj,zh in [('bed','床'),('desk','桌子'),('chair','椅子'),('chest','箱子')]:
    page.locator('#hotspot-'+obj).tap();assert page.locator('#innRoomView .innWord').inner_text()==zh
    assert not page.locator('#sheet').is_visible()
   page.locator('#hotspot-door').tap()
   page.locator('#innLobbyTargets [data-interaction="pot"]').tap()
   assert page.locator('#innLobbyView .innWord').inner_text()=='茶壺'
   page.locator('#innLobbyView .innHelp').tap()
   assert page.locator('#innLobbyScene .innHalo').count()>0
   page.locator('#innLobbyTargets [data-interaction="stairs"]').tap()
   assert page.locator('#innRoomView').is_visible()
   assert not errors,errors
   c.close()
  b.close()
print('PASS: public production inn interaction on Chromium/WebKit at both mobile sizes')
