extends RefCounted
## Original skinned garments share the character's existing animated skeleton.
const Catalog := preload("res://scripts/equipment_catalog.gd")
const LootItems := preload("res://scripts/loot_items.gd")
const SCENES := {
	"heavy": preload("res://assets/wardrobe_heavy.glb"),
	"light": preload("res://assets/wardrobe_light.glb"),
	"robe": preload("res://assets/wardrobe_robe.glb"),
}

static func install(model: Node3D, class_id: String) -> void:
	var profile := Catalog.profile_for_class(class_id)
	var rig: Skeleton3D = model.find_children("*", "Skeleton3D", true, false)[0]
	var library: Node3D = SCENES[profile].instantiate()
	model.add_child(library)
	var source: Skeleton3D = library.find_children("*", "Skeleton3D", true, false)[0]
	for mesh: MeshInstance3D in library.find_children("*", "MeshInstance3D", true, false):
		var original := mesh.skin
		var skin := Skin.new()
		skin.set_bind_count(original.get_bind_count())
		for bind in original.get_bind_count():
			var bone_name := original.get_bind_name(bind)
			if bone_name.is_empty():
				bone_name = source.get_bone_name(original.get_bind_bone(bind))
			assert(rig.find_bone(bone_name) >= 0, "Missing garment bone: " + bone_name)
			skin.set_bind_name(bind, bone_name)
			skin.set_bind_pose(bind, original.get_bind_pose(bind))
		# Mesh local transforms and bind poses use the same native PSK convention.
		# Reparenting to the original rig avoids an extra model scale or animation.
		mesh.reparent(rig, false)
		mesh.skin = skin
		mesh.skeleton = mesh.get_path_to(rig)
		mesh.visible = false
		for key: String in Catalog.entries:
			if str(mesh.name).begins_with("gear_" + key + "_"):
				mesh.set_meta("wardrobe_key", key)
				mesh.set_meta("wardrobe_slot", Catalog.entries[key].slot)
				break
	model.remove_child(library)
	library.queue_free()

static func apply(model: Node3D, inventory: Dictionary, class_id: String) -> void:
	var selected: Dictionary = {}
	for slot: String in Catalog.CLOTHING_SLOTS:
		if not LootItems.is_equipped(inventory, slot):
			continue
		var item: Dictionary = inventory.get("equipped_loot", {}).get(slot, {})
		if not Catalog.compatible(item, class_id):
			continue
		selected[slot] = item.get("lineage_key", Catalog.key_for(class_id, LootItems.grade_for_rarity(str(item.get("rarity", "Comum"))), slot))
	var prefix := "mmagic" if class_id in ["mago", "healer"] else "mfighter"
	for mesh: MeshInstance3D in model.find_children("*", "MeshInstance3D", true, false):
		if mesh.has_meta("wardrobe_key"):
			mesh.visible = selected.get(mesh.get_meta("wardrobe_slot"), "") == mesh.get_meta("wardrobe_key")
			continue
		var name := str(mesh.name).to_lower()
		for slot: String in Catalog.CLOTHING_SLOTS:
			for suffix: String in {"armor": ["u", "l"], "gloves": ["g"], "boots": ["b"]}[slot]:
				if name.begins_with(prefix + "_m000_" + suffix):
					mesh.visible = not selected.has(slot)
				elif name.begins_with(prefix + "_m001_" + suffix):
					mesh.visible = false
