"""One whole-figure export contract for both ranged classes. No part assembly,
per-frame fitting or separate head/limb deformation. Pillow is build-only.
"""
from pathlib import Path
from statistics import median
import argparse,json
from PIL import Image,ImageFilter
ROOT=Path(__file__).resolve().parents[1];FRAME=384;FEET=(192,352);HEIGHT=224
parser=argparse.ArgumentParser();parser.add_argument('--class',dest='cl',choices=['archer','gunslinger'],required=True);args=parser.parse_args();cl=args.cl
SOURCE=ROOT/'art'/cl/'source/coherent-v36';cache={}
def part(name,rows,cols,row,col):
    if name not in cache:
        im=Image.open(SOURCE/(name+'.png')).convert('RGBA');w,h=im.size;a=im.getchannel('A');ap=a.load()
        pending={y*w+x for y in range(h)for x in range(w)if ap[x,y]>=220};groups=[]
        while pending:
            q=[pending.pop()]
            for n in q:
                x,y=n%w,n//w
                for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                    nn=ny*w+nx
                    if 0<=nx<w and 0<=ny<h and nn in pending:pending.remove(nn);q.append(nn)
            if len(q)>400:groups.append(q)
        cache[name]=(im,groups)
    im,groups=cache[name];w,h=im.size
    candidates=[g for g in groups if int(sum(n%w for n in g)/len(g)*cols/w)==col and int(sum(n//w for n in g)/len(g)*rows/h)==row]
    if not candidates:raise ValueError(('missing complete figure',name,row,col))
    g=max(candidates,key=len);box=(min(n%w for n in g),min(n//w for n in g),max(n%w for n in g)+1,max(n//w for n in g)+1)
    if min(box[:2])<1 or box[2]>=w or box[3]>=h:raise ValueError(('source edge clips figure',name,row,col,box))
    x,y,r,b=box;pad=10;im=im.crop((x-pad,y-pad,r+pad,b+pad));mask=Image.new('L',im.size);mp=mask.load();body=[(n%w-x+pad,n//w-y+pad)for n in g]
    for xx,yy in body:mp[xx,yy]=255
    mask=mask.filter(ImageFilter.MaxFilter(5));im.putalpha(Image.composite(im.getchannel('A'),Image.new('L',im.size),mask));bb=im.getchannel('A').point(lambda a:255 if a>=180 else 0).getbbox()
    return {'im':im,'body':body,'box':bb,'globalBox':box,'sourceSize':(w,h),'floor':bb[3],'name':name}
def frame(p,reference,mirror=False,dead=False):
    im=p['im'];h=reference['floor']-reference['box'][1];scale=HEIGHT/h;floor=p['floor'];px=im.load()
    xs=[x for x,y in p['body']if floor-h*.62<y<floor-h*.43 and 25<px[x,y][0]<135 and px[x,y][1]<115 and px[x,y][2]<100]
    cx=median(xs)if xs else (p['box'][0]+p['box'][2])/2
    if dead:cx=(p['box'][0]+p['box'][2])/2
    size=(round(im.width*scale),round(im.height*scale));scaled=im.resize(size,Image.Resampling.LANCZOS);out=Image.new('RGBA',(FRAME,FRAME));out.alpha_composite(scaled,(round(FEET[0]-cx*scale),round(FEET[1]-floor*scale)))
    out.putalpha(out.getchannel('A').point(lambda a:a if a>=8 else 0))
    if mirror:out=out.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    bounds=out.getchannel('A').point(lambda a:255 if a>80 else 0).getbbox()
    if not bounds or min(bounds[:2])<2 or bounds[2]>=FRAME-1 or bounds[3]>=FRAME-1:raise ValueError(('export clips complete figure',bounds))
    return out,{'sourceScale':scale,'scale':scale,'source':p['box'],'sourceFloor':floor,'center':cx,'mirrored':mirror,'bounds':bounds,'sourceBodyHeight':h,'sourceGlobalBox':p['globalBox'],'sourceImageSize':p['sourceSize'],'sourceAtlas':p.get('name',''),'fixedBodyModel':cl+'-v36'}
def sheet(name,rows):
    cols=len(rows[0]);hd=Image.new('RGBA',(cols*FRAME,4*FRAME));sample=2 if name in ['walk','run1']else 1;native=Image.new('RGBA',(cols//sample*64,256));meta=[]
    for row,poses in enumerate(rows):
        for col,(im,m)in enumerate(poses):
            hd.alpha_composite(im,(col*FRAME,row*FRAME))
            if col%sample==0:
                proxy=im.crop((64,112,320,368)).resize((64,64),Image.Resampling.LANCZOS)
                for x in range(64):proxy.putpixel((x,0),(0,0,0,0))
                for y in range(64):proxy.putpixel((0,y),(0,0,0,0));proxy.putpixel((63,y),(0,0,0,0))
                native.alpha_composite(proxy,(col//sample*64,row*64))
            meta.append({'row':row,'col':col,**m})
    folder=ROOT/'art'/cl;hd.save(folder/'hd'/f'{name}.png');native.save(folder/f'{name}.png');return meta
manifest={'character':'Arqueira Elfa'if cl=='archer'else'Pistoleira Dark Elf','version':36,'frame':[FRAME,FRAME],'nativeFrame':[64,64],'feet':FEET,'bodyHeight':HEIGHT,'method':'whole-authored-figures','bodyModel':cl+'-v36','sources':{}}
sets={k:[]for k in ['idle','walk','run1','weapon','axeheavy','special']}
for row in range(4):
    sr=0 if row==0 else 2 if row==3 else 1;mirror=row==1
    ref=part('shoot',3,6,sr,0);neutral=frame(ref,ref,mirror);sets['idle'].append([neutral for _ in range(4)])
    if row in [1,2]:
        ref=part('walk-side',1,8,0,0);walk=[frame(part('walk-side',1,8,0,c),ref,mirror)for c in range(8)]
    elif row==0:
        # Two source rows share the same model and supply distinct swing phases.
        # Select four real support poses: L contact, L swing, R contact, R swing.
        ref=part('walk-front',1,4,0,0);passing=part('walk-vertical',2,4,0,0)
        poses=[frame(part('walk-front',1,4,0,c),ref)for c in [0,1,2]]
        poses.append(frame(part('walk-vertical',2,4,0,2),passing))
        walk=[poses[c//2]for c in range(8)]
    else:
        ref=part('walk-back',1,4,0,0);poses=[frame(part('walk-back',1,4,0,c),ref)for c in range(4)]
        if cl=='archer':
            passing=part('walk-vertical',2,4,1,0);poses[3]=frame(part('walk-vertical',2,4,1,2),passing)
        walk=[poses[c//2]for c in range(8)]
    sets['walk'].append(walk);sets['run1'].append(walk)
    if cl=='archer' and row in [0,3]:
        rr=0 if row==0 else 1;ref=part('shoot-vertical',2,6,rr,0)
        sets['weapon'].append([neutral if c in [0,5]else frame(part('shoot-vertical',2,6,rr,c),ref)for c in range(6)])
    elif cl=='gunslinger' and row==3:
        ref=part('shoot-north',1,3,0,0)
        sets['weapon'].append([neutral if c in [0,5]else frame(part('shoot-north',1,3,0,1 if c in [1,3]else 2),ref,c in [3,4])for c in range(6)])
    else:
        ref=part('shoot',3,6,sr,0);sets['weapon'].append([neutral if c in [0,5]else frame(part('shoot',3,6,sr,c),ref,mirror)for c in range(6)])
    ref=part('rain',3,4,sr,0);mapping=[0,0,1,1,2,2,3,3]if cl=='gunslinger'else[0,1,1,2,2,3,3,3];sets['axeheavy'].append([neutral if c in [0,3]else frame(part('rain',3,4,sr,c),ref,mirror)for c in mapping])
    ref=part('reactions',3,4,sr,0);sets['special'].append([neutral if c==0 else frame(part('reactions',3,4,sr,c),ref,mirror,dead=c==3)for c in [0,0,1,0,2,3]])
for name,rows in sets.items():manifest['sources'][name]=sheet(name,rows)
folder=ROOT/'art'/cl;(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');sets['idle'][0][0][0].crop((64,112,320,368)).resize((128,128),Image.Resampling.LANCZOS).save(folder/'portrait.png')
print(cl+': one body model, four directions, all six whole-figure atlases exported.')
