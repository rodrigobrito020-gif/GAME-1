from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'art/warrior'
for sheet,cols in {'idle':4,'walk':4,'run1':4,'weapon':6,'special':6,'axeheavy':8}.items():
    base=Image.open(root/f'{sheet}.png').convert('RGBA');trained=Image.open(root/'training'/f'{sheet}.png').convert('RGBA');hd=Image.open(root/'hd'/f'{sheet}.png').convert('RGBA');out=hd.copy();mask=Image.open(root/'weapon-masks'/f'{sheet}.png')
    for row in range(4):
        for col in range(cols):
            for y in range(384):
                for x in range(384):
                    nx=round((x-192)/4+32);ny=round((y-352)/4+60)
                    if not (0<=nx<64 and 0<=ny<64):continue
                    p=(col*64+nx,row*64+ny);q=(col*384+x,row*384+y)
                    if not mask.getpixel(p)[3] and base.getpixel(p)[:3]!=trained.getpixel(p)[:3]:out.putpixel(q,(*trained.getpixel(p)[:3],hd.getpixel(q)[3]))
    (root/'hd/training').mkdir(exist_ok=True);out.save(root/'hd/training'/f'{sheet}.png')
