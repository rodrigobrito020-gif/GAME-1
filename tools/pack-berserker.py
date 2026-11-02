"""Whole-figure Orc export. One calibration per authored row; no limb assembly,
per-pose resizing, or rewriting the three approved classes. Pillow is build-only.
"""
from pathlib import Path
from statistics import median
from PIL import Image, ImageFilter
import json
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'art/berserker';SOURCE=FOLDER/'source'
FRAME=384;FEET=(192,352);HEIGHT=224;cache={}
def part(name,rows,cols,row,col):
    if name not in cache:
        im=Image.open(SOURCE/(name+'.png')).convert('RGBA');w,h=im.size;ap=im.getchannel('A').load()
        pending={y*w+x for y in range(h)for x in range(w)if ap[x,y]>=220};groups=[]
        while pending:
            q=[pending.pop()]
            for n in q:
                x,y=n%w,n//w
                for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                    v=ny*w+nx
                    if 0<=nx<w and 0<=ny<h and v in pending:pending.remove(v);q.append(v)
            if len(q)>250:groups.append(q)
        cache[name]=(im,groups)
    im,groups=cache[name];w,h=im.size
    candidates=[g for g in groups if int(sum(n%w for n in g)/len(g)*cols/w)==col and int(sum(n//w for n in g)/len(g)*rows/h)==row]
    if not candidates:raise ValueError(('missing whole figure',name,row,col))
    g=max(candidates,key=len);box=(min(n%w for n in g),min(n//w for n in g),max(n%w for n in g)+1,max(n//w for n in g)+1)
    if min(box[:2])<2 or box[2]>=w-1 or box[3]>=h-1:raise ValueError(('source edge clips body',name,row,col,box))
    x,y,r,b=box;pad=10;cell=im.crop((x-pad,y-pad,r+pad,b+pad));mask=Image.new('L',cell.size);mp=mask.load();body=[(n%w-x+pad,n//w-y+pad)for n in g]
    for xx,yy in body:mp[xx,yy]=255
    mask=mask.filter(ImageFilter.MaxFilter(5));cell.putalpha(Image.composite(cell.getchannel('A'),Image.new('L',cell.size),mask))
    bb=cell.getchannel('A').point(lambda a:255 if a>=180 else 0).getbbox()
    return {'im':cell,'body':body,'box':bb,'floor':bb[3],'source':name,'globalBox':box}
def frame(p,ref,mirror=False,dead=False):
    im=p['im'];h=ref['floor']-ref['box'][1];scale=HEIGHT/h;floor=p['floor'];px=im.load()
    xs=[x for x,y in p['body'] if floor-h*.60<y<floor-h*.43 and 25<px[x,y][0]<140 and px[x,y][1]<110 and px[x,y][2]<100]
    cx=median(xs)if xs and not dead else (p['box'][0]+p['box'][2])/2
    scaled=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);out=Image.new('RGBA',(FRAME,FRAME));out.alpha_composite(scaled,(round(FEET[0]-cx*scale),round(FEET[1]-floor*scale)))
    out.putalpha(out.getchannel('A').point(lambda a:a if a>=8 else 0))
    if mirror:out=out.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    bb=out.getchannel('A').point(lambda a:255 if a>80 else 0).getbbox()
    if not bb or min(bb[:2])<2 or bb[2]>=FRAME-1 or bb[3]>=FRAME-1:raise ValueError(('clipped export',p['source'],bb))
    return out,{'source':p['source'],'sourceScale':scale,'sourceBodyHeight':h,'sourceGlobalBox':p['globalBox'],'bounds':bb,'mirrored':mirror,'center':cx}
def save(name,rows):
    cols=len(rows[0]);hd=Image.new('RGBA',(cols*FRAME,4*FRAME));sample=2 if name in ('walk','run1')else 1;native=Image.new('RGBA',(cols//sample*64,256));meta=[]
    for row,poses in enumerate(rows):
        for col,(im,m)in enumerate(poses):
            hd.alpha_composite(im,(col*FRAME,row*FRAME))
            if col%sample==0:
                proxy=im.crop((64,112,320,368)).resize((64,64),Image.Resampling.LANCZOS)
                for x in range(64):proxy.putpixel((x,0),(0,0,0,0))
                for y in range(64):proxy.putpixel((0,y),(0,0,0,0));proxy.putpixel((63,y),(0,0,0,0))
                native.alpha_composite(proxy,(col//sample*64,row*64))
            meta.append({'row':row,'col':col,**m})
    hd.save(FOLDER/'hd'/f'{name}.png');native.save(FOLDER/f'{name}.png');return meta
sets={name:[]for name in ('idle','walk','run1','weapon','axeheavy','special')}
for row in range(4):
    sr=0 if row==0 else 2 if row==3 else 1;mirror=row==1
    ref=part('attack',3,6,sr,0);neutral=frame(ref,ref,mirror)
    sets['idle'].append([neutral]*4)
    if row in (1,2):
        ref=part('walk-side',1,8,0,2);walk=[frame(part('walk-side',1,8,0,c),ref,mirror)for c in range(8)]
    else:
        wr=0 if row==0 else 1;ref=part('walk-vertical',2,8,wr,2);walk=[frame(part('walk-vertical',2,8,wr,c),ref)for c in range(8)]
    sets['walk'].append(walk);sets['run1'].append(walk)
    ref=part('attack',3,6,sr,0);sets['weapon'].append([neutral if c in (0,5)else frame(part('attack',3,6,sr,c),ref,mirror)for c in range(6)])
    ref=part('slam',3,4,sr,0);sets['axeheavy'].append([neutral if c in (0,5,6,7)else frame(part('slam',3,4,sr,p),ref,mirror)for c,p in enumerate([0,1,1,2,3,0,0,0])])
    ref=part('reactions',3,4,sr,0);sets['special'].append([neutral if c in (0,1,3)else frame(part('reactions',3,4,sr,p),ref,mirror,dead=c==5)for c,p in enumerate([0,0,1,0,2,3])])
manifest={'character':'Berserker Orc','version':38,'base':'approved-warrior-v37','frame':[384,384],'feet':FEET,'bodyHeight':HEIGHT,'worldBodyHeight':145.6,'fixedDisplayScale':.65,'sizeRelativeToWarrior':1.3,'sources':{name:save(name,rows)for name,rows in sets.items()}}
(FOLDER/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
sets['idle'][0][0][0].crop((64,112,320,368)).resize((128,128),Image.Resampling.LANCZOS).save(FOLDER/'portrait.png')
for col,name in enumerate(['corte-selvagem','ruptura-da-terra','grito-de-guerra','furia-ancestral','dash']):
    source=Image.open(SOURCE/'icons.png').convert('RGBA');w,h=source.size
    cell=source.crop((round(col*w/5),0,round((col+1)*w/5),h));px=cell.load();mask=Image.new('L',cell.size);mp=mask.load()
    for y in range(cell.height):
        for x in range(cell.width):
            rr,gg,bb,aa=px[x,y]
            if aa>180 and min(rr,gg,bb)<130:mp[x,y]=255
    box=mask.getbbox()
    if not box:raise ValueError(('missing skill panel',name))
    cell.crop(box).resize((128,128),Image.Resampling.LANCZOS).save(FOLDER/'icons'/f'{name}.png')
print('Berserker: six whole-figure atlases, fixed 1.3 Orc stature, portrait and five icons exported.')
