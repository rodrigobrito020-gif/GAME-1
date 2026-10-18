extends RefCounted
## Rendered from the actual equipment meshes; replace with client icons when supplied.
const Catalog := preload("res://scripts/equipment_catalog.gd")
const Thumbnails := preload("res://scripts/item_thumbnails.gd")
const FALLBACK := {
	"potion": preload("res://assets/icons/potion.svg"),
	"fang": preload("res://assets/icons/fang.svg"),
}
static func for_item(item: Dictionary, class_id: String = "tanque") -> Texture2D:
	var slot := str(item.get("slot", "armor"))
	if slot in Catalog.CLOTHING_SLOTS:
		var grade: String = {"Incomum":"D","Raro":"C","Épico":"B","Lendário":"A"}.get(str(item.get("rarity", "Comum")), "No Grade")
		var key: String = item.get("lineage_key", Catalog.key_for(class_id, grade, slot))
		return Thumbnails.ICONS.get(key, Thumbnails.ICONS[Catalog.key_for(class_id, "No Grade", slot)])
	if slot == "sword":
		slot = "bow" if class_id == "arqueiro" else "rod" if class_id in ["mago", "healer"] else "sword"
	return Thumbnails.ICONS.get(slot, FALLBACK.get(slot, FALLBACK.potion))
