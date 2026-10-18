extends RefCounted
## Selected original client items, resolved through the user's matching DAT files.
const GRADES := ["No Grade", "D", "C", "B", "A"]
const CLOTHING_SLOTS := ["armor", "gloves", "boots"]
static var entries: Dictionary = preload("res://scripts/equipment_catalog_data.gd").ITEMS

static func profile_for_class(class_id: String) -> String:
	return "robe" if class_id in ["mago", "healer"] else ("light" if class_id == "arqueiro" else "heavy")

static func key_for(class_id: String, grade: String, slot: String) -> String:
	return "%s_%d_%s" % [profile_for_class(class_id), maxi(0, GRADES.find(grade)), slot]

static func get_entry(key: String) -> Dictionary:
	return entries.get(key, {})

static func compatible(item: Dictionary, class_id: String) -> bool:
	var entry := get_entry(str(item.get("lineage_key", "")))
	return entry.is_empty() or entry.profile == profile_for_class(class_id)

static func class_text(item: Dictionary) -> String:
	var entry := get_entry(str(item.get("lineage_key", "")))
	if entry.is_empty():
		return ""
	return {"heavy": "Tanque · Roupa pesada", "light": "Arqueiro · Roupa leve", "robe": "Mago / Healer · Túnica"}[entry.profile]
