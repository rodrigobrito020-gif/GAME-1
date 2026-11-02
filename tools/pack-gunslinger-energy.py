"""Export aligned metal-light masks from the authored poses, without repainting
or resizing any body parts. Optional Pillow build step; no runtime dependency.
"""
from pathlib import Path
from PIL import Image, ImageFilter
root=Path(__file__).resolve().parents[1]/'art/gunslinger'
out=root/'eclipse-weapons';out.mkdir(exist_ok=True)
for sheet in ['idle','walk','run1','weapon','special','axeheavy']:
    im=Image.open(root/'hd'/f'{sheet}.png').convert('RGBA');mask=Image.new('RGBA',im.size);cols=im.width//384
    for row in range(4):
        for col in range(cols):
            cell=im.crop((col*384,row*384,(col+1)*384,(row+1)*384));px=cell.load();alpha=Image.new('L',(384,384));a=alpha.load()
            for y in range(45,330):
                for x in range(60,325):
                    # Metal glints on the two pistols. Face/torso/legs are outside
                    # these material regions; the frame itself supplies geometry.
                    low=225<y<306 and ((x<165 or x>225) if row in [0,3] else (x<174 or x>210))
                    shoot=(sheet=='weapon' or sheet=='axeheavy') and ((row==0 and 145<y<197 and ((col<3 and 143<x<181)or(col>=3 and 215<x<253)))or(row==1 and 137<y<185 and x<154)or(row==2 and 137<y<185 and x>231)or(row==3 and 45<y<169 and (x<166 or x>218)))
                    sky=sheet=='axeheavy' and col<6 and y<122 and (x<172 or x>217)
                    buff=sheet=='special' and col==4 and 146<y<245 and (x<143 or x>244)
                    r,g,b,aa=px[x,y]
                    steel=35<r<180 and abs(r-g)<12 and abs(g-b)<12
                    if aa>80 and steel and (low or shoot or sky or buff):a[x,y]=255
            pending={(x,y)for y in range(384)for x in range(384)if a[x,y]};groups=[]
            while pending:
                q=[pending.pop()]
                for x,y in q:
                    for n in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                        if n in pending:pending.remove(n);q.append(n)
                groups.append(q)
            alpha=Image.new('L',(384,384));a=alpha.load()
            for group in sorted(groups,key=len,reverse=True)[:2]:
                if len(group)>8:
                    for x,y in group:a[x,y]=255
            alpha=alpha.filter(ImageFilter.MaxFilter(5));ap=alpha.load()
            painted=Image.new('RGBA',(384,384));pp=painted.load()
            for y in range(384):
                for x in range(384):
                    if ap[x,y] and px[x,y][3]:pp[x,y]=(238,212,255,px[x,y][3])
            mask.alpha_composite(painted,(col*384,row*384))
    mask.save(out/f'{sheet}.png')
print('Eclipse: six aligned HD pistol energy masks, including all eight walk phases.')
