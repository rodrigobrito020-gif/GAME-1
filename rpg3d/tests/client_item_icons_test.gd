extends SceneTree
const Icons := preload("res://scripts/item_icons.gd")
const Catalog := preload("res://scripts/equipment_catalog.gd")
class IsolatedProgress extends "res://scripts/player_progress.gd":
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary:
		return {}
	func save_profile(_state: Dictionary, _path: String = DEFAULT_PATH) -> Error:
		return OK
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)
	else:
		print("PASS: " + message)

func textures(node: Node) -> Array[Texture2D]:
	var found: Array[Texture2D] = []
	if node is TextureRect and node.texture != null:
		found.append(node.texture)
	for child in node.get_children():
		found.append_array(textures(child))
	return found

func _run() -> void:
	var source: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/client_icons/source.json"))
	for ref: String in source.icons:
		var record: Dictionary = source.icons[ref]
		check(FileAccess.get_sha256(record.path) == record.sha256, "original export checksum: " + ref)
	check(Icons.for_item({"slot":"armor", "lineage_key":"unknown-key"}) == Icons.for_item({"slot":"armor"}), "unknown legacy keys fall back to the original base item icon")
	check(Icons.for_item({"slot":"gloves"}, "tanque") == Icons.for_item({"slot":"gloves"}, "arqueiro"), "identical client item references share their texture")
	check(Icons.for_item({"slot":"armor", "lineage_key":"robe_4_fullbody"}).resource_path.ends_with("armor_t76_ul_i00.png"), "retained full-body robe keeps its actual client icon")
	var game = load("res://main.tscn").instantiate()
	game.progress = IsolatedProgress.new()
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	for class_id: String in ["tanque", "arqueiro", "mago", "healer"]:
		game.player.position = game.Village.CLASS_TRAINER_POSITION + Vector3(0, 0.05, 2)
		game._interact()
		check(game._choose_class(class_id), "switch class for icon validation: " + class_id)
		var weapon: String = "bow" if class_id == "arqueiro" else "rod" if class_id in ["mago", "healer"] else "sword"
		var weapon_ref: String = source.weapons[weapon].icon_ref
		check(Icons.for_item({"slot":"sword"}, class_id).resource_path == source.icons[weapon_ref].path, "weapon icon matches the actual class weapon: " + class_id)
		var key := Catalog.key_for(class_id, "A", "pants")
		var piece := {"id":"original-icons-" + class_id, "slot":"pants", "name":Catalog.get_entry(key).name, "rarity":"Lendário", "lineage_key":key, "attack_bonus":0, "defense_bonus":5}
		game.inventory.loot_items.append(piece)
		game._toggle_inventory()
		var panel = game.hud.inventory_panel
		panel.select_loot(piece.id)
		var expected := Icons.for_display(piece, class_id)
		check(panel.loot_buttons[piece.id].icon == expected and panel.selected_icon.texture == expected, "bag and selected details use original item texture: " + class_id)
		check(game._use_item("loot_equip:" + piece.id), "equip original-icon pants: " + class_id)
		check(not panel.loot_buttons.has(piece.id) and panel.equipped_buttons[7].icon == expected, "original icon transfers from bag into the pants slot: " + class_id)
		panel._select_equipment(7)
		check(panel.selected_icon.texture == expected, "equipped details keep the same original texture: " + class_id)
		game._toggle_inventory()
		game.hud.show_chest_rewards([piece, {"slot":"sword", "name":"Arma", "rarity":"Comum"}])
		var cards: Array = game.hud.chest_rewards_panel.item_cards
		check(textures(cards[0]).has(expected) and textures(cards[1]).has(Icons.for_display({"slot":"sword"}, class_id)), "chest reveal uses the clothing and class weapon original icons: " + class_id)
		game.hud.chest_rewards_panel.closed.emit()
		game.hud.show_reward(piece)
		check(game.hud.reward_icon.texture == expected, "loot notification preserves the same rarity background: " + class_id)
	check(Icons.for_item({"slot":"shield"}).resource_path.ends_with("shield_small_shield_i00.png"), "shield icon matches the original Small Shield")
	game.queue_free()
	await process_frame
	print("CLIENT ITEM ICONS COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
