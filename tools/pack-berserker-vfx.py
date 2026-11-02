"""Pack separate original VFX frames, maintaining one center/scale throughout."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'art/berserker'
for name in ['cleave','quake']:
    src=Image.open(root/'source'/f'{name}.png').convert('RGBA');out=Image.new('RGBA',(640,640))
    cell=min(src.width/4,src.height/4)*.75
    for row in range(4):
        for col in range(4):
            x=(col+.5)*src.width/4;y=(row+.5)*src.height/4
            im=src.crop((round(x-cell/2),round(y-cell/2),round(x+cell/2),round(y+cell/2))).resize((128,128),Image.Resampling.LANCZOS)
            out.paste(im,(col*160+16,row*160+16))
    out.save(root/'vfx'/f'{name}.png',optimize=True)
    print(name,out.size)
