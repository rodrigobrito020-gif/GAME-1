"""Pack complete authored level-up motifs; Pillow is optional, game uses PNGs."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1];folder=root/'art/level-up'
im=Image.open(folder/'source-v36.png').convert('RGBA')
# Authored gutters: column at x=800, row at y=700 (not equal-sized motifs).
for name,box,side in [('ring',(0,0,800,700),512),('helix',(800,0,1374,700),512),('arrow',(0,700,800,1145),256),('spark',(800,700,1374,1145),128)]:
    part=im.crop(box);part=part.crop(part.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox());part.thumbnail((side-32,side-32),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(side,side));out.alpha_composite(part,((side-part.width)//2,(side-part.height)//2));out.save(folder/(name+'.png'))
