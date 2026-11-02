"""Export technical alpha masks and surface emitters from the approved HD
frames. No body artwork is repainted, resized or replaced by this build step.
"""
from pathlib import Path
from PIL import Image,ImageFilter,ImageChops
import json,math
root=Path(__file__).resolve().parents[1]/'art'
for look in ['archer','gunslinger']:
    folder=root/'energy'/look;folder.mkdir(parents=True,exist_ok=True)
    emitters={}
    for sheet in ['idle','walk','run1','weapon','axeheavy','special']:
        src=Image.open(root/look/'hd'/f'{sheet}.png').convert('RGBA')
        surface=Image.new('RGBA',src.size);contour=Image.new('RGBA',src.size);cols=src.width//384
        for row in range(4):
            for col in range(cols):
                a=src.crop((col*384,row*384,(col+1)*384,(row+1)*384)).getchannel('A')
                # Smooth inner edge and a narrow outer halo follow THIS pose.
                solid=a.point(lambda v:255 if v>80 else 0)
                outer=ImageChops.subtract(solid.filter(ImageFilter.GaussianBlur(6)),solid)
                inner=ImageChops.subtract(a,a.filter(ImageFilter.MinFilter(7))).filter(ImageFilter.GaussianBlur(.7))
                edge=ImageChops.lighter(outer,inner.point(lambda v:round(v*.6)))
                light=Image.new('RGBA',(384,384),(255,255,255,0));light.putalpha(edge)
                mask=Image.new('RGBA',(384,384),(255,255,255,0));mp=mask.load();ap=a.load()
                for y in range(384):
                    for x in range(384):
                        # Face remains readable; cloth, boots, hair and weapons
                        # receive energy with the original source transparency.
                        weight=.12 if y<183 and abs(x-192)<29 else .68
                        mp[x,y]=(255,255,255,round(ap[x,y]*weight))
                points=[]
                bbox=solid.getbbox()
                ys=[round(bbox[1]+(bbox[3]-bbox[1])*(.06+i*.125))for i in range(8)]
                for y in ys:
                    xs=[x for x in range(384)if ap[x,y]>128]
                    if xs:
                        points.extend([[min(xs),y],[max(xs),y]])
                emitters[f'{sheet}:{row}:{col}']=points
                contour.alpha_composite(light,(col*384,row*384));surface.alpha_composite(mask,(col*384,row*384))
        contour.save(folder/f'{sheet}-contour.png');surface.save(folder/f'{sheet}-surface.png')
    (folder/'emitters.json').write_text(json.dumps(emitters,separators=(',',':'))+'\n')
print('Attached energy: pose-specific alpha masks and body-edge emitters for archer and gunslinger.')
