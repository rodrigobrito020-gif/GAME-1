"""Pack the authored class icons and body aura; no generated gameplay imagery."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'art/archer'
im=Image.open(root/'source/icons-v25.png').convert('RGBA');w,h=im.size
for col,name in [(0,'dash'),(1,'tiro-perfurante')]:
    side=min(h,w//2);x=col*w//2+(w//2-side)//2;y=(h-side)//2
    im.crop((x,y,x+side,y+side)).resize((256,256),Image.Resampling.LANCZOS).save(root/'icons'/f'{name}.png')
im=Image.open(root/'source/aura-v27.png').convert('RGBA');im.thumbnail((256,256),Image.Resampling.LANCZOS)
out=Image.new('RGBA',(256,256));out.alpha_composite(im,((256-im.width)//2,256-im.height));out.save(root/'vfx/aura.png')
