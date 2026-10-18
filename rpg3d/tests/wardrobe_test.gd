extends SceneTree
## Real game integration: original clothing, animated skinning, saves and transfers.
const Catalog := preload("res://scripts/equipment_catalog.gd")
const LootItems := preload("res://scripts/loot_items.gd")
const Fit := preload("res://tests/shield_fit.gd")
class IsolatedProgress extends "res://scripts/player_progress.gd":
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary:
		return {}
	func save_profile(_state: Dictionary, _path: String = DEFAULT_PATH) -> Error:
		return OK
var failures := 0
var game: Node3D

func _initialize() -> void:
	_run.call_deferred()

func check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: " + message)
	else:
		failures += 1
		push_error(message)

func make_item(class_id: String, tier: int, slot: String) -> Dictionary:
	var key := Catalog.key_for(class_id, Catalog.GRADES[tier], slot)
	return {"id": class_id + str(tier) + slot, "slot": slot, "name": Catalog.get_entry(key).name, "rarity": LootItems.RARITIES[tier], "grade": Catalog.GRADES[tier], "lineage_key": key, "attack_bonus": 0, "defense_bonus": tier + 1}

func change_class(class_id: String) -> void:
	game.player.position = game.Village.CLASS_TRAINER_POSITION + Vector3(0, 0.05, 2)
	game._interact()
	check(game._choose_class(class_id), "class trainer selects " + class_id)

func capture_pose(class_id: String, sample: Dictionary) -> void:
	if sample.done:
		return
	sample.done = true
	sample.valid = true
	for slot: String in Catalog.CLOTHING_SLOTS:
		for mesh: MeshInstance3D in game._gear_nodes(slot, true):
			sample.valid = sample.valid and mesh.get_node(mesh.skeleton) == game.character_model.find_children("*", "Skeleton3D", true, false)[0]
			for surface: PackedVector3Array in Fit.posed_world_vertices(mesh):
				for point in surface:
					var local: Vector3 = point - game.player.global_position
					sample.valid = sample.valid and local.is_finite() and local.length() < 3.0 and local.y > -0.4
	if class_id == "tanque":
		var rig: Skeleton3D = game.character_model.find_children("*", "Skeleton3D", true, false)[0]
		var wrist: Vector3 = (rig.global_transform * rig.get_bone_global_pose(rig.find_bone("Bip01_L_Hand"))).origin
		var shell: MeshInstance3D = game.shield_attachment.find_child("OriginalSmallShield", true, false).find_children("*", "MeshInstance3D", true, false)[0]
		sample.clearance = Fit.minimum_clearance(game._gear_nodes("gloves", true), wrist, shell)

func _run() -> void:
	game = load("res://main.tscn").instantiate()
	game.progress = IsolatedProgress.new()
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	check(Catalog.entries.size() == 45, "five authentic clothing tiers for heavy, light and robe profiles")
	var brigandine_ids: Array = Catalog.get_entry("heavy_1_armor").client_item_ids
	check(brigandine_ids.size() == 2 and int(brigandine_ids[0]) == 352 and int(brigandine_ids[1]) == 2378, "Brigandine chest includes the actual client gaiters")
	var robe_ids: Array = Catalog.get_entry("robe_4_armor").client_item_ids
	check(robe_ids.size() == 1 and int(robe_ids[0]) == 2407 and Catalog.get_entry("robe_4_armor").parts.size() == 1, "full Dark Crystal robe is one native mesh, without a duplicated lower body")
	for class_id: String in ["tanque", "arqueiro", "mago", "healer"]:
		change_class(class_id)
		for tier in 5:
			for slot: String in Catalog.CLOTHING_SLOTS:
				var item := make_item(class_id, tier, slot)
				game.inventory.loot_items.append(item)
				check(game._use_item("loot_equip:" + item.id), "equip original item: " + item.name + " / " + class_id)
				check(game.inventory.equipped_loot[slot].lineage_key == item.lineage_key and not game.inventory.loot_items.any(func(bag: Dictionary) -> bool: return bag.id == item.id), "equipped item leaves bag and retains its original appearance key")
				var original := Catalog.get_entry(item.lineage_key)
				var visible: Array[MeshInstance3D] = game._gear_nodes(slot, true)
				check(visible.size() == original.parts.size() and visible.all(func(mesh: MeshInstance3D) -> bool: return mesh.visible and mesh.get_active_material(0).albedo_texture != null), "all native parts and diffuse textures are active: " + item.lineage_key)
				check(game._gear_nodes(slot, false).all(func(mesh: MeshInstance3D) -> bool: return not mesh.visible), "starter body is hidden under the equipped garment")
			for action: String in ["idle", "walk", "run", "attack", "skill", "death"]:
				# Inspect the final animated/modifier pose before Godot restores its input.
				var rig: Skeleton3D = game.character_model.find_children("*", "Skeleton3D", true, false)[0]
				var sample := {"done": false, "valid": false, "clearance": Vector2(INF, 0)}
				var capture := capture_pose.bind(class_id, sample)
				rig.skeleton_updated.connect(capture)
				game.animation.play(action, 0)
				game.animation.advance(game.animation.get_animation(action).length if action == "death" else 0.7)
				game.animation.pause()
				await process_frame
				await process_frame
				rig.skeleton_updated.disconnect(capture)
				check(sample.done and sample.valid, "native clothes remain bound and within character bounds: %s / %d / %s" % [class_id, tier, action])
				if class_id == "tanque":
					check(sample.clearance.y > 0 and sample.clearance.x >= 0.002, "gauntlet clears original shield: tier %d / %s / %.1f mm" % [tier, action, sample.clearance.x * 1000])
		game._toggle_inventory()
		game.hud.inventory_panel.select_loot(class_id + "4armor")
		var preview: Node3D = game.hud.inventory_panel.preview
		check(preview.find_children("*", "MeshInstance3D", true, false).any(func(mesh: MeshInstance3D) -> bool: return mesh.visible and mesh.get_meta("wardrobe_key", "") == Catalog.key_for(class_id, "A", "armor")), "inventory preview wears the same original grade A armor: " + class_id)
		check(game.hud.inventory_panel.selected_name.text == make_item(class_id, 4, "armor").name, "inventory shows actual client item name")
		game._toggle_inventory()
		check(game._use_item("loot_remove:armor"), "unequip native clothing")
		check(game._gear_nodes("armor", false).all(func(mesh: MeshInstance3D) -> bool: return mesh.visible), "unequip restores uncovered original body")
		check(game._use_item("loot_equip:" + class_id + "4armor"), "native clothing can be re-equipped without duplication")
	# The healer and mage share robe compatibility. Switching to tank stores it.
	change_class("tanque")
	check(game.inventory.equipped_loot.is_empty() and game.inventory.armor and game.inventory.gloves and game.inventory.boots, "switching clothing profile stores incompatible pieces and restores starter clothes")
	check(not game._use_item("loot_equip:healer4armor"), "server-side equipment request cannot equip a robe as heavy armor")
	game._toggle_inventory()
	game.hud.inventory_panel.select_loot("healer4armor")
	check(game.hud.inventory_panel.action_button.disabled, "inventory identifies clothing for another class")
	game._toggle_inventory()
	var saved: Dictionary = game.inventory.duplicate(true)
	var reloaded := {}
	LootItems.restore_items(reloaded, saved)
	check(reloaded == saved or (reloaded.loot_items == saved.loot_items and reloaded.equipped_loot == saved.equipped_loot), "save restore preserves original set identity and all bag transfers")
	var rng := RandomNumberGenerator.new()
	rng.seed = 841
	var rewards_valid := true
	for class_id: String in ["tanque", "arqueiro", "mago", "healer"]:
		for index in 80:
			var reward := LootItems.create_reward(rng, 3, class_id)
			if reward.slot in Catalog.CLOTHING_SLOTS:
				var entry := Catalog.get_entry(reward.lineage_key)
				rewards_valid = rewards_valid and entry.name == reward.name and entry.grade == reward.grade and Catalog.compatible(reward, class_id)
	check(rewards_valid, "chest clothing rewards have real client names, correct grades and matching class")
	game.queue_free()
	await process_frame
	print("WARDROBE COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
