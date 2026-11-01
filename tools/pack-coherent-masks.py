"""Export equipment energy masks from the new whole-figure artwork, without
repainting the body. Starter wood/iron are already painted into the source."""
from pathlib import Path
import json, shutil
from PIL import Image
root=Path(__file__).resolve().parents[1]/'art/warrior'
cols={'idle':4,'walk':4,'run1':4,'weapon':6,'special':6,'axeheavy':8}
(root/'weapon-masks').mkdir(exist_ok=True)
(root/'weapon-reference').mkdir(exist_ok=True)
poses=[]
for sheet,count in cols.items():
    im=Image.open(root/f'{sheet}.png').convert('RGBA');px=im.load();mask=Image.new('RGBA',im.size)
    for row in range(4):
        for col in range(count):
            candidates=set()
            for y in range(2,61):
                for x in range(2,62):
                    r,g,b,a=px[col*64+x,row*64+y]
                    if a<100:continue
                    steel=b>r+3 and b>=g and 60<r<220
                    # The wooden shield stays outside the central cloth/face.
                    wood=(x<22 or x>42) and 18<y<49 and 45<r<160 and r>g*1.22 and g>b*1.15
                    if steel or wood:candidates.add((x,y))
            # Keep ink/iron outlines immediately beside equipment pixels.
            for x,y in list(candidates):
                for dx,dy in [(0,1),(0,-1),(1,0),(-1,0)]:
                    nx,ny=x+dx,y+dy
                    if not(1<=nx<63 and 1<=ny<62):continue
                    r,g,b,a=px[col*64+nx,row*64+ny]
                    if a>100 and max(r,g,b)<75:candidates.add((nx,ny))
            for x,y in candidates:mask.putpixel((col*64+x,row*64+y),(255,255,255,px[col*64+x,row*64+y][3]))
            poses.append({'sheet':sheet,'row':row,'col':col,'weaponPixels':len(candidates)})
    mask.save(root/'weapon-masks'/f'{sheet}.png')
    shutil.copy2(root/f'{sheet}.png',root/'weapon-reference'/f'{sheet}.png')
    hd=Image.open(root/'hd'/f'{sheet}.png').convert('RGBA');hm=Image.new('RGBA',hd.size)
    for row in range(4):
        for col in range(count):
            for y in range(384):
                for x in range(384):
                    nx=round((x-192)/4+32);ny=round((y-352)/4+60)
                    if 0<=nx<64 and 0<=ny<64 and mask.getpixel((col*64+nx,row*64+ny))[3]:
                        a=hd.getpixel((col*384+x,row*384+y))[3];hm.putpixel((col*384+x,row*384+y),(255,255,255,a))
    hm.save(root/'hd'/f'{sheet}-mask.png')
(root/'weapon-masks/manifest.json').write_text(json.dumps({'method':'painted-source-equipment','poses':poses},indent=2)+'\n')
