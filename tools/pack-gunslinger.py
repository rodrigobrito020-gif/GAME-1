"""Pack whole authored figures. Never assemble, shorten or repaint limb pieces.
Optional build tool: Pillow; no Python is needed to run the exported game.
"""
from pathlib import Path
from statistics import median
import json, argparse
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'art/gunslinger/source'
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

whole_cache={}
def whole_cell(name,rows,cols,row,col):
    # Discover complete authored figures BEFORE dividing the source into cells.
    # A head may cross a nominal row boundary; cropping first would lose it.
    if name not in whole_cache:
        im=Image.open(SOURCE/(name+'.png')).convert('RGBA');w,h=im.size;px=im.load()
        pending={y*w+x for y in range(h) for x in range(w) if px[x,y][3]>=220};groups=[]
        while pending:
            seed=pending.pop();q=[seed]
            for n in q:
                x,y=n%w,n//w
                for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                    nn=ny*w+nx
                    if 0<=nx<w and 0<=ny<h and nn in pending:pending.remove(nn);q.append(nn)
            if len(q)>500:groups.append(q)
        whole_cache[name]=(im,groups)
    im,groups=whole_cache[name];w,h=im.size
    candidates=[g for g in groups if int(sum(n%w for n in g)/len(g)*cols/w)==col and int(sum(n//w for n in g)/len(g)*rows/h)==row]
    if not candidates:raise ValueError(('missing whole figure',name,row,col))
    group=max(candidates,key=len);global_box=(min(n%w for n in group),min(n//w for n in group),max(n%w for n in group)+1,max(n//w for n in group)+1)
    if min(global_box[:2])<3 or global_box[2]>w-3 or global_box[3]>h-3:raise ValueError(('source figure touches outer canvas',name,row,col,global_box))
    x0,y0,x1,y1=global_box;pad=12;source=im.crop((x0-pad,y0-pad,x1+pad,y1+pad));body=[(n%w-x0+pad,n//w-y0+pad)for n in group]
    mask=Image.new('L',source.size);mp=mask.load()
    for x,y in body:mp[x,y]=255
    mask=mask.filter(ImageFilter.MaxFilter(5));source.putalpha(Image.composite(source.getchannel('A'),Image.new('L',source.size),mask))
    box=source.getchannel('A').point(lambda v:255 if v>=180 else 0).getbbox()
    return {'im':source,'body':body,'box':box,'floor':box[3],'globalBox':global_box,'sourceImageSize':im.size}

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
    return out, {'sourceScale':scale,'scale':scale,'source':part['box'],'sourceFloor':part['floor'],'center':cx,'mirrored':mirror,'bounds':bbox,'sourceBodyHeight':reference['floor']-reference['box'][1],**({'sourceGlobalBox':part['globalBox'],'sourceImageSize':part['sourceImageSize']} if 'globalBox' in part else {})}

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


# Whole-figure exports share the approved 384px frame, 224px body and foot plane.
manifest={'character':'Pistoleira Dark Elf','version':30,'frame':[FRAME,FRAME],'nativeFrame':[64,64],'feet':FEET,'bodyHeight':HEIGHT,'method':'whole-authored-figures','sources':{}}
idle=[];walk=[];weapon=[];special=[];burst=[]
for row in range(4):
    ref=whole_cell('idle-v30',1,4,0,row)
    idle.append([frame(ref,ref,breath=b) for b in [1,1.003,1,.997]])
    sr=0 if row==0 else 2 if row==3 else 1
    name='walk-front-v30' if row==0 else 'walk-back-v30' if row==3 else 'walk-side-v30'
    wr=whole_cell(name,2,4,0,0)
    walk.append([frame(whole_cell(name,2,4,c//4,c%4),wr,mirror=row==1) for c in range(8)])
    name='shoot-back-v30' if row==3 else 'shoot-v30';nr=1 if row==3 else 2;shootrow=0 if row in [0,3] else 1
    wr=whole_cell(name,nr,6,shootrow,0)
    # Match each aim/release pair to the same hand. Reflect a complete north
    # pose for the second hand; never cut or move individual body pieces.
    poses=[]
    for c in range(6):
        sc=([0,3,2,1,4,5][c] if row==0 else [0,1,2,1,2,5][c] if row==3 else c)
        poses.append(frame(whole_cell(name,nr,6,shootrow,sc),wr,mirror=row==1 or (row==3 and c in [3,4])))
    weapon.append(poses);burst.append(poses+[poses[5],poses[5]])
    rr=whole_cell('reactions-v30',3,4,sr,0)
    special.append([frame(whole_cell('reactions-v30',3,4,sr,c),rr,mirror=row==1,dead=c==2) for c in [0,0,1,0,3,2]])
for name,rows in [('idle',idle),('walk',walk),('run1',walk),('weapon',weapon),('axeheavy',burst),('special',special)]:
    manifest['sources'][name]=save_sheet('gunslinger',name,rows)
folder=ROOT/'art/gunslinger'
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
idle[0][0][0].crop((64,112,320,368)).resize((128,128),Image.Resampling.LANCZOS).save(folder/'portrait.png')
im=Image.open(SOURCE/'icons.png').convert('RGBA');w,h=im.size
for i,name in enumerate(['disparo-sombrio','rajada-do-crepusculo','instinto-noturno','eclipse','dash']):
    r,c=divmod(i,3);side=min(w//3,h//2);x=round(c*w/3+(w/3-side)/2);y=round(r*h/2+(h/2-side)/2)
    im.crop((x,y,x+side,y+side)).resize((256,256),Image.Resampling.LANCZOS).save(folder/'icons'/f'{name}.png')
def effect_parts(name):
    # Isolate complete painted effects before layout cuts, just as for bodies.
    # The bullet tip crosses the nominal midpoint of the source sheet.
    im=Image.open(SOURCE/(name+'.png')).convert('RGBA');w,h=im.size;a=im.getchannel('A');ap=a.load()
    pending={y*w+x for y in range(h)for x in range(w)if ap[x,y]>8};groups=[]
    while pending:
        seed=pending.pop();q=[seed]
        for n in q:
            x,y=n%w,n//w
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                nn=ny*w+nx
                if 0<=nx<w and 0<=ny<h and nn in pending:pending.remove(nn);q.append(nn)
        groups.append(q)
    mains=sorted(groups,key=len,reverse=True)[:4]
    centers=[(sum(n%w for n in g)/len(g),sum(n//w for n in g)/len(g))for g in mains]
    assigned=[[]for _ in mains]
    for g in groups:
        x=sum(n%w for n in g)/len(g);y=sum(n//w for n in g)/len(g)
        nearest=min(range(4),key=lambda i:(x-centers[i][0])**2+(y-centers[i][1])**2)
        assigned[nearest].extend(g)
    result={}
    for (cx,cy),g in zip(centers,assigned):
        mask=Image.new('L',im.size);mp=mask.load()
        for n in g:mp[n%w,n//w]=255
        mask=mask.filter(ImageFilter.MaxFilter(3));part=im.copy()
        part.putalpha(Image.composite(a,Image.new('L',im.size),mask))
        part=part.crop(part.getchannel('A').getbbox())
        result[(int(cy*2/h),int(cx*2/w))]=part
    return result

for source,names in [('vfx-v30',['bullet','muzzle','impact','aura']),('skills-v30',['power','volley','powerimpact','orbit'])]:
    parts=effect_parts(source)
    for i,name in enumerate(names):
        effect=parts[divmod(i,2)];effect.thumbnail((256,256),Image.Resampling.LANCZOS)
        out=Image.new('RGBA',(256,256));out.alpha_composite(effect,((256-effect.width)//2,(256-effect.height)//2));out.save(folder/'vfx'/f'{name}.png')
print('Pistoleira: six HD/native atlases, complete figures in four directions, five skill icons and eight isolated painted effects.')
