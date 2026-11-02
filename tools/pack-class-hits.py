"""Extract the two complete class-specific authored hit effects."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1];folder=root/'art/combat';folder.mkdir(exist_ok=True)
im=Image.open(root/'art/characters/source/class-hits-v34.png').convert('RGBA');w,h=im.size
for col,name in enumerate(['warrior','archer']):
    part=im.crop((round(col*w/2),0,round((col+1)*w/2),h));part=part.crop(part.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox());part.thumbnail((256,256),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(256,256));out.alpha_composite(part,((256-part.width)//2,(256-part.height)//2));out.save(folder/f'{name}-hit.png')
