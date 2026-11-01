"""Generate mobile derivatives; never overwrite authored source assets. Requires Pillow."""
import hashlib
import io
import json
import math
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
TEST = ROOT / 'inn-layer-test'
scene_path = TEST / 'scene.json'
scene = json.loads(scene_path.read_text())
original_manifest = json.loads((TEST / 'assets/manifest.json').read_text())
# Guard the authored inputs against accidental changes between builds.
for record in original_manifest:
    source = TEST / 'assets' / record['file']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == record['sha256'], source
out = TEST / 'assets/mobile'
out.mkdir(exist_ok=True)
records = []
for key, asset in scene['assets'].items():
    source = asset.get('source', asset['src'])
    asset['source'] = source
    if key == 'counter':
        # Same background pixels, clipped in the compositor; no second embedded bitmap.
        asset['src'] = scene['assets']['room']['src']
        asset['clipPath'] = 'polygon(4.9% 31.2%,43.1% 31.2%,43.1% 41.92%,7.5% 42.56%)'
        continue
    path = TEST / source
    im = Image.open(path)
    source_size = list(im.size)
    if key == 'room':
        im.thumbnail((800, 1000), Image.Resampling.LANCZOS)
        quality = 82
    else:
        placements = [scene['placements'][obj['placement']] for obj in scene['objects'] if obj.get('asset') == key]
        # Three source pixels per CSS pixel at the largest supported scene (400×500).
        width = max(64, math.ceil(max(p['w'] for p in placements) * 4 * 3))
        height = max(64, math.ceil(max(p['h'] for p in placements) * 5 * 3))
        im.thumbnail((width, height), Image.Resampling.LANCZOS)
        quality = 86
    dest = out / path.name
    buffer = io.BytesIO()
    im.save(buffer, format='WEBP', quality=quality, method=6)
    temporary = dest.with_suffix('.webp.tmp')
    temporary.write_bytes(buffer.getvalue())
    temporary.replace(dest)
    asset['src'] = dest.relative_to(TEST).as_posix()
    decoded = Image.open(dest)
    alpha = decoded.getchannel('A').getextrema() if 'A' in decoded.getbands() else None
    records.append({'asset': key, 'source': source, 'src': asset['src'], 'sourceSize': source_size,
                    'size': list(im.size), 'sourceBytes': path.stat().st_size, 'bytes': dest.stat().st_size,
                    'quality': quality, 'alphaExtrema': alpha,
                    'sha256': hashlib.sha256(dest.read_bytes()).hexdigest()})
scene_path.write_text(json.dumps(scene, ensure_ascii=False, indent=2) + '\n')
source_paths = {a['source'] for a in scene['assets'].values()}
old_bytes = sum((TEST / p).stat().st_size for p in source_paths)
original_c = (ROOT / 'inn-style-test/assets/lobby-c.webp').stat().st_size
report = {'sceneCssMaximum': [400, 500], 'originalsUntouched': True,
          'beforeLayerImageBytes': old_bytes, 'beforeIncludingEagerOriginalCBytes': old_bytes + original_c,
          'afterLayerImageBytes': sum(r['bytes'] for r in records),
          'originalCDeferredBytes': original_c, 'assets': records}
(out / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k:v for k,v in report.items() if k != 'assets'}, indent=2))
