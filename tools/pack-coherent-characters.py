"""Pack whole authored figures. Never assemble, shorten or repaint limb pieces.
Optional build tool: Pillow; no Python is needed to run the exported game.
"""
from pathlib import Path
from statistics import median
import json, argparse
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/characters/source'
FRAME, FEET, HEIGHT = 384, (192, 352), 224
cache = {}

def cell(name, rows, cols, row, col):
    key = (name, rows, cols, row, col)
    if key in cache:
        return cache[key]
    im = Image.open(SOURCE / (name+'.png')).convert('RGBA')
    w,h=im.size
    im=im.crop((round(col*w/cols),round(row*h/rows),round((col+1)*w/cols),round((row+1)*h/rows)))
    w,h=im.size; px=im.load(); pending={(x,y) for y in range(h) for x in range(w) if px[x,y][3]>=220}; groups=[]
    while pending:
        seed=pending.pop(); queue=[seed]
        for x,y in queue:
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if (nx,ny) in pending:
                    pending.remove((nx,ny));queue.append((nx,ny))
        groups.append(queue)
    body=max(groups,key=len)
    mask=Image.new('L',im.size); mp=mask.load()
    for x,y in body:mp[x,y]=255
    # Keep antialiasing only immediately around the connected full figure.
    mask=mask.filter(ImageFilter.MaxFilter(5))
    alpha=im.getchannel('A'); alpha=Image.composite(alpha,Image.new('L',im.size),mask);im.putalpha(alpha)
    box=alpha.point(lambda v:255 if v>=180 else 0).getbbox()
    if not box:raise ValueError(key)
    x0,y0,x1,y1=box
    boots=[y for x,y in body if y>=y0+(y1-y0)*.7 and .22*w<x<.78*w and px[x,y][0]>45 and px[x,y][0]>px[x,y][1]*1.1 and px[x,y][1]>px[x,y][2]*1.05]
    floor=max(boots)+2 if boots else y1
    if abs(floor-y1)<=10:floor=y1
    result={'im':im,'box':box,'floor':floor,'body':body}
    cache[key]=result;return result

def center(part, reference):
    # Position by the pelvis, never by a weapon tip or a moving foot.
    im=part['im'];px=im.load();x0,y0,x1,y1=part['box'];floor=part['floor'];h=reference['floor']-reference['box'][1]
    xs=[x for x,y in part['body'] if floor-h*.62<y<floor-h*.43 and im.width*.3<x<im.width*.7 and 25<px[x,y][0]<135 and px[x,y][1]<115 and px[x,y][2]<100]
    return median(xs) if xs else im.width/2

def frame(part, reference, mirror=False, dead=False, breath=1, flight=False):
    source=part['im'];floor=part['box'][3] if flight else part['floor']; scale=HEIGHT/(reference['floor']-reference['box'][1]);cx=center(part,reference)
    if dead:cx=(part['box'][0]+part['box'][2])/2
    # One uniform scale for the whole figure, fixed across all frames of a row.
    size=(round(source.width*scale),round(source.height*scale*breath))
    scaled=source.resize(size,Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(FRAME,FRAME));out.alpha_composite(scaled,(round(FEET[0]-cx*scale),round(FEET[1]-floor*scale*breath)))
    out.putalpha(out.getchannel("A").point(lambda v: v if v>=8 else 0))
    if mirror:out=out.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    bbox=out.getchannel('A').point(lambda v:255 if v>80 else 0).getbbox()
    if not bbox or min(bbox[:2])<1 or bbox[2]>=FRAME or bbox[3]>=FRAME:raise ValueError(('clipped export',bbox))
    return out, {'sourceScale':scale,'scale':scale,'source':part['box'],'sourceFloor':part['floor'],'center':cx,'mirrored':mirror,'bounds':bbox,'sourceBodyHeight':reference['floor']-reference['box'][1]}

def save_sheet(cl, name, rows):
    cols=len(rows[0]);sample=2 if name in ['walk','run1'] else 1
    hd=Image.new('RGBA',(cols*FRAME,4*FRAME));native=Image.new('RGBA',(cols//sample*64,256));poses=[]
    for row,frames in enumerate(rows):
        for col,(im,meta) in enumerate(frames):
            hd.alpha_composite(im,(col*FRAME,row*FRAME))
            # Invisible native proxy matches the same world-sized body and foot
            # anchor; all visible art and weapon headroom use the complete HD cell.
            proxy=im.crop((64,112,320,368)).resize((64,64),Image.Resampling.LANCZOS)
            # Guard transparent native gutters, including off-frame weapon tips.
            for x in range(64):proxy.putpixel((x,0),(0,0,0,0))
            for y in range(64):proxy.putpixel((0,y),(0,0,0,0));proxy.putpixel((63,y),(0,0,0,0))
            if col%sample==0:native.alpha_composite(proxy,(col//sample*64,row*64))
            poses.append(dict(row=row,col=col,**meta))
    folder=ROOT/'art'/cl;(folder/'hd').mkdir(exist_ok=True)
    hd.save(folder/'hd'/f'{name}.png');native.save(folder/f'{name}.png')
    return poses

parser=argparse.ArgumentParser();parser.add_argument('--class',dest='only',choices=['warrior','archer']);args=parser.parse_args()
manifests={}
for cl,modelrow in [('warrior',0),('archer',1)]:
    if args.only and cl!=args.only:continue
    manifest={'character':'Guerreiro Humano' if cl=='warrior' else 'Arqueira Elfa','version':24 if cl=='archer' else 23,'frame':[FRAME,FRAME],'nativeFrame':[64,64],'feet':FEET,'bodyHeight':HEIGHT,'method':'whole-authored-figures','sources':{}}
    idle=[];walk=[]
    for row in range(4):
        modelcol=2 if cl=='warrior' and row==1 else row
        ref=cell('model',2,4,modelrow,modelcol)
        idle.append([frame(ref,ref,cl=='warrior' and row==1,breath=b) for b in [1,1.006,1,.994]])
        axis='front' if row==0 else 'back' if row==3 else 'side'
        name=cl+'-walk-'+axis
        if row in [1,2]:
            wr=cell(name,1,8,0,0)
            walk.append([frame(cell(name,1,8,0,col),wr,row==1) for col in range(8)])
        else:
            # Preserve the existing vertical whole-figure art. Its four poses
            # already alternate support; the defect in the recording was most
            # visible in profile, where all previous poses held a wide stance.
            # Do not mix independently redrawn bodies within one gait cycle.
            name=cl+'-walk';wr=cell(name,4,4,row,0)
            walk.append([frame(cell(name,4,4,row,col//2),wr) for col in range(8)])
    manifest['sources']['idle']=save_sheet(cl,'idle',idle)
    manifest['sources']['walk']=save_sheet(cl,'walk',walk)
    manifest['sources']['run1']=save_sheet(cl,'run1',walk)
    weapon=[];special=[];slam=[];volley=[]
    for row in range(4):
        srcrow=0 if row==0 else 2 if row==3 else 1;mirror=row==1
        if cl=='warrior':
            name='warrior-front-sword' if row==0 and (SOURCE/'warrior-front-sword.png').exists() else 'warrior-sword';sr=0 if name.endswith('front-sword') else srcrow;nr=1 if name.endswith('front-sword') else 3
            ref=cell(name,nr,6,sr,0);weapon.append([frame(cell(name,nr,6,sr,col),ref,mirror) for col in range(6)])
            sr=2 if row==1 else row;ref=cell('warrior-reactions',4,6,sr,0)
            special.append([frame(cell('warrior-reactions',4,6,sr,col),ref,mirror,dead=col==5) for col in range(6)])
            ref=cell('warrior-slam',3,6,srcrow,0);slam.append([frame(cell('warrior-slam',3,6,srcrow,min(col,5)),ref,mirror,flight=col==3) for col in range(8)])
        else:
            vr=cell('archer-volley',3,6,srcrow,0)
            volley.append([frame(cell('archer-volley',3,6,srcrow,min(col,5)),vr,mirror) for col in range(8)])
            vertical=row in [0,3] and (SOURCE/'archer-vertical.png').exists();name='archer-vertical' if vertical else 'archer-shoot';sr=(0 if row==0 else 1) if vertical else srcrow;nr=2 if vertical else 3
            ref=cell(name,nr,6,sr,0);weapon.append([frame(cell(name,nr,6,sr,col),ref,mirror) for col in range(6)])
            ref=cell('archer-reactions',4,4,row,0);special.append([frame(cell('archer-reactions',4,4,row,col),ref,dead=col==3) for col in [0,0,1,0,2,3]])
    manifest['sources']['weapon']=save_sheet(cl,'weapon',weapon)
    manifest['sources']['special']=save_sheet(cl,'special',special)
    if cl=='archer':manifest['sources']['axeheavy']=save_sheet(cl,'axeheavy',volley)
    if cl=='warrior':manifest['sources']['axeheavy']=save_sheet(cl,'axeheavy',slam)
    (ROOT/'art'/cl/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');manifests[cl]=manifest
    idle[0][0][0].crop((64,112,320,368)).resize((128,128),Image.Resampling.LANCZOS).save(ROOT/'art'/cl/'portrait.png')
(ROOT/'art/classes').mkdir(exist_ok=True)
Image.open(ROOT/'art/warrior/portrait.png').save(ROOT/'art/classes/warrior.png')
(ROOT/'art/characters/manifest.json').write_text(json.dumps({'frame':FRAME,'feet':FEET,'bodyHeight':HEIGHT,'classes':['warrior','archer']},indent=2)+'\n')
print('Whole figures packed at a common 224px body height in 384px cells (112 units in the game), no limb assembly.')
