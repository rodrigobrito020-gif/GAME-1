extends RefCounted
## Original client equipment icons shared by inventory, paper doll and rewards.
const Catalog := preload("res://scripts/equipment_catalog.gd")
const Client := preload("res://scripts/client_item_icons.gd")
const FALLBACK := {
	"potion": preload("res://assets/icons/potion.svg"),
	"fang": preload("res://assets/icons/fang.svg"),
}
static func for_item(item: Dictionary, class_id: String = "tanque") -> Texture2D:
	var slot := str(item.get("slot", "armor"))
	if slot in Catalog.CLOTHING_SLOTS:
		var grade: String = {"Incomum":"D","Raro":"C","Épico":"B","Lendário":"A"}.get(str(item.get("rarity", "Comum")), "No Grade")
		var key: String = item.get("lineage_key", Catalog.key_for(class_id, grade, slot))
		var entry: Dictionary = Catalog.get_entry(key)
		if entry.is_empty():
			entry = Catalog.get_entry(Catalog.key_for(class_id, "No Grade", slot))
		return Client.ICONS[entry.icon_ref]
	if slot == "sword":
		slot = "bow" if class_id == "arqueiro" else "rod" if class_id in ["mago", "healer"] else "sword"
	if Client.WEAPONS.has(slot):
		return Client.ICONS[Client.WEAPONS[slot]]
	return FALLBACK.get(slot, FALLBACK.potion)
