extends SceneTree
const Loot := preload("res://scripts/loot_items.gd")
const Catalog := preload("res://scripts/equipment_catalog.gd")
const Icons := preload("res://scripts/item_icons.gd")
const Progress := preload("res://scripts/player_progress.gd")
class IsolatedProgress extends "res://scripts/player_progress.gd":
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary:
		return {}
	func save_profile(_state: Dictionary, _path: String = DEFAULT_PATH) -> Error:
		return OK
var failures := 0
var game: Node3D

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if ok:
		print("PASS: " + message)
	else:
		failures += 1
		push_error(message)

func item(class_id: String, tier: int, slot: String, id: String = "") -> Dictionary:
	var key := Catalog.key_for(class_id, Catalog.GRADES[tier], slot)
	return {"id": class_id + str(tier) + slot if id.is_empty() else id, "slot": slot, "name": Catalog.get_entry(key).name, "rarity": Loot.RARITIES[tier], "grade": Catalog.GRADES[tier], "lineage_key": key, "attack_bonus": 0, "defense_bonus": 5}

func empty_inventory() -> Dictionary:
	return {"equipment_version": 2, "equipped": true, "shield": true, "armor": false, "pants": false, "gloves": false, "boots": false, "loot_items": [], "equipped_loot": {}, "gold": 0, "potions": 0, "fangs": 0}

func equip(piece: Dictionary) -> void:
	game.inventory.loot_items.append(piece)
	check(game._use_item("loot_equip:" + piece.id), "equip " + piece.name)

func _migration() -> void:
	var chest := item("mago", 2, "armor", "old-combined")
	chest.attack_bonus = 5
	chest.defense_bonus = 9
	var legacy := {"armor": false, "gloves": false, "boots": false, "equipped_loot": {"armor": chest}, "loot_items": [item("tanque", 1, "armor", "stored-combined")]}
	var restored := {}
	Loot.restore_items(restored, legacy, "mago")
	check(restored.equipped_loot.has("pants") and restored.equipped_loot.armor.id == chest.id and restored.equipped_loot.pants.id != chest.id, "old combined armor migrates to distinct equipped chest and pants")
	check(Loot.bonuses(restored, "mago") == {"attack": 5, "defense": 9}, "splitting legacy armor preserves the sum of its original attributes")
	check(restored.loot_items.size() == 2 and restored.loot_items[0].slot == "armor" and restored.loot_items[1].slot == "pants", "stored combined armor splits into two stored pieces")
	var copy := restored.duplicate(true)
	Loot.restore_items(restored, copy, "mago")
	check(restored == copy and restored.equipment_version == 2, "migration is idempotent and never duplicates pants on reload")
	var path := "user://split-equipment-test-%d.cfg" % OS.get_process_id()
	check(Progress.new().save_profile({"inventory": restored}, path) == OK, "split equipment is written through the real profile saver")
	var loaded := Progress.new().load_profile(path)
	var from_disk := {}
	Loot.restore_items(from_disk, loaded.inventory, "mago")
	check(from_disk == restored, "real save/load preserves both slots, appearance keys and exact stats")
	DirAccess.remove_absolute(path)
	var full := item("mago", 4, "armor", "old-fullbody")
	full.name = "Dark Crystal Robe"
	Loot.restore_items(restored, {"equipped_loot": {"armor": full}, "loot_items": []}, "mago")
	check(restored.equipped_loot.armor.lineage_key == "robe_4_fullbody" and not restored.equipped_loot.has("pants") and Loot.is_equipped(restored, "pants"), "original full-body robe survives migration as one item occupying both slots")
	var pants := item("mago", 4, "pants", "replacement-pants")
	restored.loot_items.append(pants)
	check(Loot.equip_item(restored, pants.id, "mago") and not restored.equipped_loot.has("armor") and restored.loot_items.any(func(value: Dictionary) -> bool: return value.id == "old-fullbody"), "equipping pants returns a full-body robe to bag once instead of layering it")

func _run() -> void:
	_migration()
	game = load("res://main.tscn").instantiate()
	game.progress = IsolatedProgress.new()
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	for class_id: String in ["tanque", "arqueiro", "mago", "healer"]:
		game.player.position = game.Village.CLASS_TRAINER_POSITION + Vector3(0, 0.05, 2)
		game._interact()
		check(game._choose_class(class_id), "trainer switches class: " + class_id)
		game.inventory = empty_inventory()
		game._apply_equipment()
		for slot: String in ["armor", "pants", "gloves"]:
			equip(item(class_id, 4, slot))
		check(Loot.set_bonuses(game.inventory, class_id) == {"hp": 0, "attack": 0, "defense": 0, "speed_percent": 0.0}, "three of four pieces never activate a set bonus: " + class_id)
		equip(item(class_id, 4, "boots"))
		var expected_hp: float = {"tanque": 260.0, "arqueiro": 85.0, "mago": 155.0, "healer": 170.0}[class_id]
		check(game._maximum_hp() == expected_hp, "complete grade A set changes the actual HP cap: " + class_id)
		check(Loot.bonuses(game.inventory, class_id).defense == (32 if class_id == "tanque" else 20), "set defense adds to real equipped defense without counting pants twice")
		var expected_attack: int = {"tanque": 0, "arqueiro": 16, "mago": 18, "healer": 18}[class_id]
		check(Loot.bonuses(game.inventory, class_id).attack == expected_attack, "offensive set stat is included in actual combat attributes")
		var expected_hit: float = 25.0 * float(game.PlayerClasses.get_definition(class_id).attack_scale) + expected_attack
		check(is_equal_approx(game.class_combat._damage(game, 25), expected_hit), "ranged damage calculation receives the active set attack bonus")
		game.hp = game._maximum_hp()
		game._receive_damage(50)
		check(game.hp == expected_hp - (18 if class_id == "tanque" else 30), "incoming damage uses the active set defense bonus")
		if class_id == "arqueiro":
			check(is_equal_approx(game._movement_speed(false), 4.28), "complete light set increases actual WASD movement speed by seven percent")
		game._toggle_inventory()
		game.hud.inventory_panel.select_loot(class_id + "4armor")
		check(game.hud.inventory_panel.set_label.text.contains("4/4") and game.hud.inventory_panel.selected_description.text.contains("Bônus ativo"), "inventory shows complete set and its active bonuses")
		var chest_meshes: Array[MeshInstance3D] = game._gear_nodes("armor", true)
		check(game.hud.inventory_panel.equipped_buttons.has(7), "paper doll has a dedicated pants slot")
		check(game._use_item("loot_remove:pants"), "pants can be removed independently")
		check(chest_meshes.all(func(mesh: MeshInstance3D) -> bool: return mesh.visible) and game._gear_nodes("pants", false).all(func(mesh: MeshInstance3D) -> bool: return mesh.visible), "removing pants preserves the equipped chest and exposes only the lower base mesh")
		check(game.hud.inventory_panel.set_label.text.contains("incompleto") and not game.hud.inventory_panel.selected_description.text.contains("Bônus ativo"), "removing one piece immediately disables the set bonus and updates the UI")
		check(game._maximum_hp() == float(game.PlayerClasses.get_definition(class_id).max_hp), "missing piece immediately removes maximum HP bonus")
		check(game._use_item("loot_equip:" + class_id + "4pants"), "pants re-equip into their own slot")
		game.hp = game._maximum_hp()
		check(game._use_item("loot_remove:gloves") and game.hp <= game._maximum_hp(), "losing a health set clamps HP without healing or retaining excess life")
		equip(item(class_id, 3, "gloves", "mixed-" + class_id))
		check(Loot.set_bonuses(game.inventory, class_id).attack == 0 and Loot.set_bonuses(game.inventory, class_id).hp == 0, "mixed grade pieces do not activate a complete set")
		game._toggle_inventory()
	# Full-body legacy items remain genuine single items, rather than invented pants.
	game.inventory = empty_inventory()
	game._apply_equipment()
	for key: String in ["robe_4_fullbody", "robe_4_fullgloves", "robe_4_fullboots"]:
		var definition: Dictionary = Catalog.get_entry(key)
		equip({"id": key, "slot": definition.slot, "name": definition.name, "rarity": "Lendário", "grade": "A", "lineage_key": key, "attack_bonus": 0, "defense_bonus": 0})
	check(game.inventory.equipped_loot.size() == 3 and Loot.set_progress(game.inventory, "healer").robe_4_full.size() == 4, "one native full-body item covers two of the four set slots without duplicating the item")
	check(game._maximum_hp() == 130 and Loot.bonuses(game.inventory, "healer").attack == 22, "retained Dark Crystal full set has its own distinct active bonus")
	game._toggle_inventory()
	game.hud.inventory_panel._select_equipment(7)
	check(game.hud.inventory_panel.selected_loot_id == "robe_4_fullbody" and game.hud.inventory_panel.selected_type.text.contains("Traje completo"), "selecting the reserved pants slot shows the full-body item and explains both occupied slots")
	check(game.hud.inventory_panel.equipped_buttons[3].icon == game.hud.inventory_panel.equipped_buttons[7].icon, "full-body thumbnail appears consistently in both reserved slots")
	game._toggle_inventory()
	check(game._use_item("pants") and not game.inventory.equipped_loot.has("armor") and game.inventory.pants, "equipping initial pants removes the full-body item from both slots")
	var checked_icons := true
	for key: String in Catalog.entries:
		var entry: Dictionary = Catalog.entries[key]
		var icon := Icons.for_item({"slot": entry.slot, "rarity": Loot.RARITIES[Catalog.GRADES.find(entry.grade)], "lineage_key": key})
		checked_icons = checked_icons and icon != null and icon.resource_path == "res://assets/client_icons/" + str(entry.icon_ref).get_slice(".", 1).to_lower() + ".png" and icon.get_size() == Vector2(32, 32) and icon.get_image().get_used_rect().has_area()
	check(checked_icons, "every equipment entry uses its referenced nonempty original client icon at native resolution")
	check(Icons.for_item(item("mago", 1, "boots"), "mago") != Icons.for_item(item("mago", 4, "boots"), "mago"), "different equipment grades have distinct item icons")
	game.queue_free()
	await process_frame
	print("EQUIPMENT SLOTS AND SETS COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
