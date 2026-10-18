extends RefCounted
## Selected original client items, resolved through the user's matching DAT files.
const GRADES := ["No Grade", "D", "C", "B", "A"]
const CLOTHING_SLOTS := ["armor", "pants", "gloves", "boots"]
static var entries: Dictionary = preload("res://scripts/equipment_catalog_data.gd").ITEMS
static var collections: Dictionary = preload("res://scripts/equipment_catalog_data.gd").COLLECTIONS

static func profile_for_class(class_id: String) -> String:
	return "robe" if class_id in ["mago", "healer"] else ("light" if class_id == "arqueiro" else "heavy")

static func key_for(class_id: String, grade: String, slot: String) -> String:
	return "%s_%d_%s" % [profile_for_class(class_id), maxi(0, GRADES.find(grade)), slot]

static func get_entry(key: String) -> Dictionary:
	return entries.get(key, {})

static func normalize_legacy_key(key: String, item_name: String) -> String:
	# Two former default sets were native full-body items. Preserve their identity.
	for prefix: String in ["light_3_", "robe_4_"]:
		for slot: String in ["armor", "gloves", "boots"]:
			var replacement := prefix + ("fullbody" if slot == "armor" else "full" + slot)
			if key == prefix + slot and item_name == str(get_entry(replacement).get("name", "")):
				return replacement
	return key

static func compatible(item: Dictionary, class_id: String) -> bool:
	if item.get("slot", "") == "sword" and item.has("weapon_type"):
		return item.weapon_type == ("bow" if class_id == "arqueiro" else "rod" if class_id in ["mago", "healer"] else "sword")
	if item.get("slot", "") == "shield":
		return class_id != "arqueiro"
	var entry := get_entry(str(item.get("lineage_key", "")))
	return entry.is_empty() or entry.profile == profile_for_class(class_id)

static func class_text(item: Dictionary) -> String:
	if item.get("slot", "") == "shield":
		return "Tanque / Mago / Healer · Escudo"
	if item.get("slot", "") == "sword" and item.has("weapon_type"):
		return {"sword":"Tanque · Espada", "bow":"Arqueiro · Arco", "rod":"Mago / Healer · Cajado"}.get(item.weapon_type, "")
	var entry := get_entry(str(item.get("lineage_key", "")))
	if entry.is_empty():
		return ""
	return {"heavy": "Tanque · Roupa pesada", "light": "Arqueiro · Roupa leve", "robe": "Mago / Healer · Túnica"}[entry.profile]
