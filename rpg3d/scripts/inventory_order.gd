extends RefCounted
## Presentation order only: item identities, ownership and stack counts stay intact.
const RARITIES := ["Comum", "Incomum", "Raro", "Épico", "Lendário"]

static func ordered(items: Array[Dictionary], direction: int) -> Array[Dictionary]:
	if direction == 0: return items.duplicate()
	var result: Array[Dictionary] = []
	var ranks := [4, 3, 2, 1, 0] if direction < 0 else [0, 1, 2, 3, 4]
	for rank: int in ranks:
		for item: Dictionary in items:
			if maxi(0, RARITIES.find(str(item.get("rarity", "Comum")))) == rank:
				result.append(item)
	return result

static func update_button(button: Button, direction: int) -> void:
	button.custom_minimum_size = Vector2(100, 40)
	button.text = "Organizar" if direction == 0 else "Raridade ↓" if direction < 0 else "Raridade ↑"
	button.tooltip_text = "Organizar por raridade: Lendário → Comum" if direction >= 0 else "Organizar por raridade: Comum → Lendário"
