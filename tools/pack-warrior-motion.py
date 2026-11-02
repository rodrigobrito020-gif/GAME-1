"""Whole authored warrior poses in eight directions. Cardinal combat is copied
byte for byte from the approved frames; no limb assembly or per-pose size fitting.
Pillow and Node are build-only. Runtime retains the native authoritative rig.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from statistics import median
from PIL import Image,ImageFilter,ImageChops
import json,os,subprocess
R=Path(__file__).resolve().parents[1];ROOT=R/'art/warrior';SRC=ROOT/'source/motion43';OUT=ROOT/'motion43';F=384;FEET=(192,352);HEIGHT=224
SHEETS=['idle','walk','run1','weapon','axeheavy','special'];cache={}
def part(name,rows,cols,row,col):
 if name not in cache:
  im=Image.open(SRC/(name+'.png')).convert('RGBA');w,h=im.size;ap=im.getchannel('A').load();pending={y*w+x for y in range(h)for x in range(w)if ap[x,y]>=220};groups=[]
  while pending:
   q=[pending.pop()]
   for n in q:
    x,y=n%w,n//w
    for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
     k=ny*w+nx
     if 0<=nx<w and 0<=ny<h and k in pending:pending.remove(k);q.append(k)
   if len(q)>500:groups.append(q)
  cache[name]=(im,groups)
 im,groups=cache[name];w,h=im.size
 candidates=[g for g in groups if int(sum(n%w for n in g)/len(g)*cols/w)==col and int(sum(n//w for n in g)/len(g)*rows/h)==row]
 if not candidates:raise ValueError(('missing complete figure',name,row,col))
 g=max(candidates,key=len);box=(min(n%w for n in g),min(n//w for n in g),max(n%w for n in g)+1,max(n//w for n in g)+1)
 if min(box[:2])<2 or box[2]>=w-1 or box[3]>=h-1:raise ValueError(('source clipping',name,row,col,box))
 x,y,r,b=box;pad=10;cell=im.crop((x-pad,y-pad,r+pad,b+pad));mask=Image.new('L',cell.size);mp=mask.load();body=[(n%w-x+pad,n//w-y+pad)for n in g]
 for xx,yy in body:mp[xx,yy]=255
 mask=mask.filter(ImageFilter.MaxFilter(5));cell.putalpha(Image.composite(cell.getchannel('A'),Image.new('L',cell.size),mask));bb=cell.getchannel('A').point(lambda a:255 if a>=180 else 0).getbbox()
 return {'im':cell,'body':body,'box':bb,'floor':bb[3],'source':name,'globalBox':box}
def frame(p,ref,mirror=False,dead=False):
 h=ref['floor']-ref['box'][1];scale=HEIGHT/h;im=p['im'];px=im.load();floor=p['floor'];xs=[x for x,y in p['body']if floor-h*.61<y<floor-h*.43 and 25<px[x,y][0]<140 and px[x,y][1]<115 and px[x,y][2]<100]
 cx=median(xs)if xs and not dead else (p['box'][0]+p['box'][2])/2
 scaled=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);out=Image.new('RGBA',(F,F));out.alpha_composite(scaled,(round(FEET[0]-cx*scale),round(FEET[1]-floor*scale)));out.putalpha(out.getchannel('A').point(lambda a:a if a>=8 else 0))
 if mirror:out=out.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
 bb=out.getchannel('A').point(lambda a:255 if a>80 else 0).getbbox()
 if min(bb[:2])<2 or bb[2]>=F-1 or bb[3]>=F-1:raise ValueError(('export clipping',p['source'],bb))
 return out,{'source':p['source'],'sourceScale':scale,'sourceBodyHeight':h,'sourceBox':p['globalBox'],'bounds':bb,'mirrored':mirror}
def proxy(cell):return cell.crop((64,112,320,368)).resize((64,64),Image.Resampling.LANCZOS)
def mask_equipment(cell):
 im=proxy(cell);p=im.load();m=Image.new('L',(64,64));mp=m.load();selected=set()
 for y in range(2,61):
  for x in range(2,62):
   r,g,b,a=p[x,y]
   if a>100 and ((b>r+3 and b>=g and 60<r<220)or((x<22 or x>42)and 18<y<49 and 45<r<160 and r>g*1.22 and g>b*1.15)):selected.add((x,y))
 for x,y in list(selected):
  for dx,dy in [(0,1),(0,-1),(1,0),(-1,0)]:
   xx,yy=x+dx,y+dy
   if 1<=xx<63 and 1<=yy<62 and p[xx,yy][3]>100 and max(p[xx,yy][:3])<75:selected.add((xx,yy))
 for x,y in selected:mp[x,y]=p[x,y][3]
 hd=m.transform((384,384),Image.Transform.AFFINE,(.25,0,-16,0,.25,-28),resample=Image.Resampling.NEAREST)
 rgba=Image.new('RGBA',(384,384),(255,255,255,0));rgba.putalpha(ImageChops.darker(hd,cell.getchannel('A')));return rgba,m
sets={};meta={}
for sheet in SHEETS:
 old=Image.open(ROOT/'hd'/(sheet+'.png')).convert('RGBA');cols=old.width//F;rows=[];entries=[]
 for row in range(4):
  if sheet in ['walk','run1']:
   sr=[0,1,1,2][row];ref=part('walk-cardinal',3,9,sr,0);poses=[frame(part('walk-cardinal',3,9,sr,c),ref,row==1)for c in range(1,9)]
  else:poses=[(old.crop((c*F,row*F,(c+1)*F,(row+1)*F)),{'approvedCardinal':True})for c in range(cols)]
  rows.append(poses)
 for row in range(4,8):
  sr=0 if row<6 else 1;mirror=row in [5,7];sp=part('special-diagonal',2,8,sr,0);neutral=frame(sp,sp,mirror)
  if sheet in ['walk','run1']:
   rr=sr*2;ref=part('walk-diagonal',4,5,rr,0);poses=[frame(part('walk-diagonal',4,5,rr+c//4,1+c%4),ref,mirror)for c in range(8)]
  elif sheet=='idle':poses=[frame(part('special-diagonal',2,8,sr,c),sp,mirror)for c in [0,1,2,0]]
  elif sheet=='weapon':
   ref=part('sword-diagonal',2,6,sr,0);poses=[neutral if c in [0,5]else frame(part('sword-diagonal',2,6,sr,c),ref,mirror)for c in range(6)]
  elif sheet=='special':poses=[neutral if c in [0,1,3]else frame(part('special-diagonal',2,8,sr,p),sp,mirror,dead=c==5)for c,p in enumerate([0,0,3,0,4,7])]
  else:poses=[neutral if c in [0,5,6,7]else frame(part('special-diagonal',2,8,sr,5 if c<4 else 6),sp,mirror)for c in range(8)]
  rows.append(poses)
 hd=Image.new('RGBA',(cols*F,8*F));hm=hd.copy()
 for row,poses in enumerate(rows):
  for col,(cell,m)in enumerate(poses):
   hd.alpha_composite(cell,(col*F,row*F));mask,_=mask_equipment(cell);hm.alpha_composite(mask,(col*F,row*F));entries.append({'row':row,'col':col,**m})
 for folder in [OUT/'base',OUT/'masks']:folder.mkdir(parents=True,exist_ok=True)
 hd.save(OUT/'base'/(sheet+'.png'));hm.save(OUT/'masks'/(sheet+'.png'));sets[sheet]=hd;meta[sheet]=entries
print('Whole figures exported: eight directions and eight unique walking phases.',flush=True)
with TemporaryDirectory(prefix='warrior-motion43-')as tmp:
 work=Path(tmp)
 for d in ['weapon-reference','weapon-masks']:(work/d).mkdir()
 for sheet,hd in sets.items():
  cols=hd.width//F;px=Image.new('RGBA',(cols*64,8*64));pm=px.copy();hm=Image.open(OUT/'masks'/(sheet+'.png'))
  for row in range(8):
   for col in range(cols):
    cell=hd.crop((col*F,row*F,(col+1)*F,(row+1)*F));px.alpha_composite(proxy(cell),(col*64,row*64));_,mask=mask_equipment(cell);rgba=Image.new('RGBA',(64,64),(255,255,255,0));rgba.putalpha(mask);pm.alpha_composite(rgba,(col*64,row*64))
  px.save(work/(sheet+'.png'));px.save(work/'weapon-reference'/(sheet+'.png'));pm.save(work/'weapon-masks'/(sheet+'.png'))
 subprocess.run(['node',str(R/'tools/pack-training-armor.mjs')],check=True,env={**os.environ,'TRAINING_WORK_DIR':tmp})
 (OUT/'training').mkdir(exist_ok=True)
 for sheet,hd in sets.items():
  orig=Image.open(work/(sheet+'.png')).convert('RGBA');arm=Image.open(work/'training'/(sheet+'.png')).convert('RGBA');out=hd.copy();hm=Image.open(OUT/'masks'/(sheet+'.png'))
  for row in range(8):
   for col in range(hd.width//F):
    if row<4 and sheet not in ['walk','run1']:
     old=Image.open(ROOT/'hd/training'/(sheet+'.png')).convert('RGBA');out.paste(old.crop((col*F,row*F,(col+1)*F,(row+1)*F)),(col*F,row*F));continue
    diff=ImageChops.difference(orig.crop((col*64,row*64,(col+1)*64,(row+1)*64)).convert('RGB'),arm.crop((col*64,row*64,(col+1)*64,(row+1)*64)).convert('RGB'));box=diff.getbbox()
    if not box:continue
    for y in range(max(0,box[1]*4+110),min(F,box[3]*4+116)):
     for x in range(max(0,box[0]*4+62),min(F,box[2]*4+68)):
      nx=round((x-192)/4+32);ny=round((y-352)/4+60)
      if not(0<=nx<64 and 0<=ny<64):continue
      p=(col*64+nx,row*64+ny);q=(col*F+x,row*F+y)
      rr,gg,bb,aa=hd.getpixel(q);skin=rr>135 and 22<rr-gg<110 and 5<gg-bb<70
      if not skin and not hm.getpixel(q)[3]and orig.getpixel(p)[:3]!=arm.getpixel(p)[:3]:out.putpixel(q,(*arm.getpixel(p)[:3],aa))
  out.save(OUT/'training'/(sheet+'.png'))
print('Training appearance aligned to all eight views.',flush=True)
for look in ['warrior','warrior-training']:
 folder=OUT/'energy'/look;folder.mkdir(parents=True,exist_ok=True);emitters={}
 for sheet in SHEETS:
  src=Image.open(OUT/('training'if look.endswith('training')else'base')/(sheet+'.png')).convert('RGBA');surface=Image.new('RGBA',src.size);contour=surface.copy();cols=src.width//F
  for row in range(8):
   for col in range(cols):
    a=src.crop((col*F,row*F,(col+1)*F,(row+1)*F)).getchannel('A');solid=a.point(lambda v:255 if v>80 else 0);outer=ImageChops.subtract(solid.filter(ImageFilter.GaussianBlur(6)),solid);inner=ImageChops.subtract(a,a.filter(ImageFilter.MinFilter(7))).filter(ImageFilter.GaussianBlur(.7));edge=ImageChops.lighter(outer,inner.point(lambda v:round(v*.6)));light=Image.new('RGBA',(F,F),(255,255,255,0));light.putalpha(edge)
    ma=a.point(lambda v:round(v*.68));face=a.point(lambda v:round(v*.12));ma.paste(face.crop((164,0,221,183)),(164,0));mask=Image.new('RGBA',(F,F),(255,255,255,0));mask.putalpha(ma)
    box=solid.getbbox();ap=a.load();points=[]
    for y in [round(box[1]+(box[3]-box[1])*(.06+i*.125))for i in range(8)]:
     xs=[x for x in range(F)if ap[x,y]>128]
     if xs:points.extend([[min(xs),y],[max(xs),y]])
    emitters[f'{sheet}:{row}:{col}']=points;surface.alpha_composite(mask,(col*F,row*F));contour.alpha_composite(light,(col*F,row*F))
  surface.save(folder/(sheet+'-surface.png'));contour.save(folder/(sheet+'-contour.png'))
 (folder/'emitters.json').write_text(json.dumps(emitters,separators=(',',':'))+'\n')
(OUT/'manifest.json').write_text(json.dumps({'version':43,'directions':['down','left','right','up','down-right','down-left','up-right','up-left'],'frame':F,'feet':FEET,'bodyHeight':HEIGHT,'method':'whole authored figures; one scale per authored calibration','poses':meta},indent=2)+'\n')
print('Motion 43: body, training, equipment masks and pose-bound Ki ready.')
