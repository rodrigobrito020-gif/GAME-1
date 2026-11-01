"""Optional art rebuild: python -m pip install Pillow; python tools/pack-skill-icons.py.
The packaged game only needs Node.js; this tool is for rebuilding illustration crops.
"""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1] / 'art' / 'warrior'
image = Image.open(root / 'source' / 'skill-cards.png')
(root / 'icons').mkdir(exist_ok=True)
for index, name in enumerate(['avanco-de-luz', 'impacto-de-luz', 'egide-de-luz', 'avatar-da-luz']):
    col, row = index % 2, index // 2
    box = (col * image.width // 2, row * image.height // 2,
           (col + 1) * image.width // 2, (row + 1) * image.height // 2)
    image.crop(box).resize((256, 256), Image.Resampling.LANCZOS).save(root / 'icons' / (name + '.png'))
