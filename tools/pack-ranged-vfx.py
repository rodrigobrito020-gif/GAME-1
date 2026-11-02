"""Pack authored 4x4 effects with a fixed origin/scale and transparent gutters.
Never fit individual frames: their expansion/dissipation is part of the art.
"""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
for cls in ('arqueira', 'pistoleira'):
    source = Image.open(ROOT / 'art/ranged/source' / f'{cls}-v37.png').convert('RGBA')
    atlas = Image.new('RGBA', (640, 640))
    # One square crop size and one scale shared by all sixteen frames.
    cell = min(source.width / 4, source.height / 4) * .75
    for row in range(4):
        for col in range(4):
            cx, cy = (col + .5) * source.width / 4, (row + .5) * source.height / 4
            frame = source.crop((round(cx-cell/2), round(cy-cell/2), round(cx+cell/2), round(cy+cell/2)))
            frame = frame.resize((128, 128), Image.Resampling.LANCZOS)
            atlas.paste(frame, (col*160+16, row*160+16))
    atlas.save(ROOT / 'art/ranged' / f'{cls}-impact.png', optimize=True)
    print(cls, atlas.size)
