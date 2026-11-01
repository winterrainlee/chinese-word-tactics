"""Package the feature checkout as a self-contained Pages subtree. Never edits the public game."""
from pathlib import Path
import shutil, subprocess, json, hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'inn-integration-test'
for asset in json.loads((ROOT/'assets/inn-room-c/manifest.json').read_text()):
 for field,hash_field in [('source','sourceSHA256'),('src','sha256')]:
  source=ROOT/'assets/inn-room-c'/asset[field]
  assert hashlib.sha256(source.read_bytes()).hexdigest()==asset[hash_field],f'Asset hash mismatch: {source}'
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir()
for folder in ['src','images','icons','data']:
 shutil.copytree(ROOT/folder,OUT/folder)
(OUT/'assets/inn-room-c').mkdir(parents=True)
shutil.copytree(ROOT/'assets/inn-room-c/mobile',OUT/'assets/inn-room-c/mobile')
(OUT/'inn-layer-test/assets').mkdir(parents=True)
shutil.copytree(ROOT/'inn-layer-test/assets/mobile',OUT/'inn-layer-test/assets/mobile')
shutil.copy2(ROOT/'inn-layer-test/scene.json',OUT/'inn-layer-test/scene.json')
for name in ['bootstrap.js','controls.js','controls.css']:
 shutil.copy2(ROOT/'tools/inn-test-harness'/name,OUT/name)
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
version={'version':'inn-c-integration-v1','sourceCommit':sha,'baseCommit':'5009fde101095fafe7d6f8aea064d134641db3d0','storagePrefix':'cwt-inn-integration-v1:'}
(OUT/'version.json').write_text(json.dumps(version,indent=2)+'\n')
html=(ROOT/'index.html').read_text().replace('<head>','<head>\n<script src="./bootstrap.js"></script>\n<link rel="stylesheet" href="./controls.css">')
html=html.replace('</body>','<script src="./controls.js"></script>\n</body>').replace('content="2026-10-31-tower-unlocks1"',f'content="inn-c-v1-{sha[:12]}"')
# Explicit version label independent of existing build naming.
import re
html=re.sub(r'(<meta name="cwt-build" content=")[^"]*',r'\g<1>inn-c-v1-'+sha[:12],html)
(OUT/'index.html').write_text(html)
files={str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.rglob('*') if p.is_file()}
(OUT/'manifest.json').write_text(json.dumps({'sourceCommit':sha,'files':files},indent=2)+'\n')
print(f'{len(files)} files packaged from {sha}')
