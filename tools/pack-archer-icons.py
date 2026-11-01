"""Optional art rebuild (Pillow). The game uses the exported PNGs, not Python."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
for folder in ['art/archer/icons', 'art/archer/vfx', 'art/potions/icons']:
    (root / folder).mkdir(parents=True, exist_ok=True)

def grid(source, output, names, cols, rows, size):
    image = Image.open(root / source).convert('RGBA')
    for i, name in enumerate(names):
        col, row = i % cols, i // cols
        cell = image.crop((col * image.width // cols, row * image.height // rows,
                           (col + 1) * image.width // cols, (row + 1) * image.height // rows))
        cell.resize((size, size), Image.Resampling.LANCZOS).save(root / output / (name + '.png'))

grid('art/archer/source/skill-cards.png', 'art/archer/icons',
     ['tiro-perfurante', 'chuva-de-flechas', 'olhos-da-floresta', 'espirito-da-floresta'], 2, 2, 256)
grid('art/archer/source/forest-vfx.png', 'art/archer/vfx',
     ['ring', 'spirit', 'arrow', 'impact'], 2, 2, 256)
grid('art/potions/source/potions.png', 'art/potions/icons',
     ['hp-1', 'hp-2', 'hp-3', 'mana-1', 'mana-2', 'mana-3'], 3, 2, 128)
