"""Preserve generated originals and produce deterministic, alpha-preserving mobile WebP derivatives."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[1]/'assets/inn-room-c'
spec={'background':(800,1000),'bed':(492,585),'desk':(384,360),'chair':(240,330),'chest':(348,300)}
manifest=[]
for name,size in spec.items():
 p=root/'source'/f'{name}.png';im=Image.open(p).convert('RGBA')
 assert name=='background' or im.getextrema()[3][0]==0,name
 original=im.size
 # Fixed source canvas and padding are preserved; no silhouette edits.
 im.thumbnail(size,Image.Resampling.LANCZOS)
 dst=root/'mobile'/f'{name}.webp';im.save(dst,'WEBP',quality=86 if name!='background' else 82,method=6)
 manifest.append({'id':'inn.room.'+name,'source':str(p.relative_to(root)),'sourceSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'sourceSize':original,'src':str(dst.relative_to(root)),'size':im.size,'bytes':dst.stat().st_size,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'alpha':name!='background'})
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Room mobile image bytes:',sum(x['bytes'] for x in manifest))
