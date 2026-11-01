"""Apply the existing chest-only painter to every HD pose independently.
Temporary 64px authoring proxies include all eight walking phases; runtime
compatibility sheets remain four frames. No nearest-phase armor substitution.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import os, subprocess
from PIL import Image
root=Path(__file__).resolve().parents[1]/'art/warrior'
sheets=['idle','walk','run1','weapon','special','axeheavy']
with TemporaryDirectory(prefix='royal-training-') as tmp:
    work=Path(tmp)
    for d in ['weapon-reference','weapon-masks']:(work/d).mkdir()
    for sheet in sheets:
        hd=Image.open(root/'hd'/f'{sheet}.png').convert('RGBA')
        mask=Image.open(root/'hd'/f'{sheet}-mask.png').convert('RGBA')
        cols=hd.width//384
        proxy=Image.new('RGBA',(cols*64,256));pm=proxy.copy()
        for row in range(4):
            for col in range(cols):
                box=(col*384+64,row*384+112,col*384+320,row*384+368)
                cell=hd.crop(box).resize((64,64),Image.Resampling.LANCZOS)
                for x in range(64):cell.putpixel((x,0),(0,0,0,0))
                for y in range(64):cell.putpixel((0,y),(0,0,0,0));cell.putpixel((63,y),(0,0,0,0))
                proxy.alpha_composite(cell,(col*64,row*64))
                pm.alpha_composite(mask.crop(box).resize((64,64),Image.Resampling.NEAREST),(col*64,row*64))
        proxy.save(work/f'{sheet}.png');proxy.save(work/'weapon-reference'/f'{sheet}.png');pm.save(work/'weapon-masks'/f'{sheet}.png')
    subprocess.run(['node',str(root.parents[1]/'tools/pack-training-armor.mjs')],check=True,env={**os.environ,'TRAINING_WORK_DIR':tmp})
    for sheet in sheets:
        base=Image.open(work/f'{sheet}.png').convert('RGBA');trained=Image.open(work/'training'/f'{sheet}.png').convert('RGBA')
        hd=Image.open(root/'hd'/f'{sheet}.png').convert('RGBA');out=hd.copy();mask=Image.open(root/'hd'/f'{sheet}-mask.png')
        for row in range(4):
            for col in range(hd.width//384):
                for y in range(384):
                    for x in range(384):
                        nx=round((x-192)/4+32);ny=round((y-352)/4+60)
                        if not (0<=nx<64 and 0<=ny<64):continue
                        p=(col*64+nx,row*64+ny);q=(col*384+x,row*384+y)
                        if not mask.getpixel(q)[3] and base.getpixel(p)[:3]!=trained.getpixel(p)[:3]:out.putpixel(q,(*trained.getpixel(p)[:3],hd.getpixel(q)[3]))
        (root/'hd/training').mkdir(exist_ok=True);out.save(root/'hd/training'/f'{sheet}.png')
