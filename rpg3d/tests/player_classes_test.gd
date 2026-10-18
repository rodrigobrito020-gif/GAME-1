extends SceneTree

const PlayerClasses := preload("res://scripts/player_classes.gd")
const ClassMenu := preload("res://scripts/class_menu.gd")
const EquipmentInventory := preload("res://scripts/equipment_inventory.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("run")

func check(condition: bool, description: String) -> void:
	if condition:
		print("PASS: " + description)
	else:
		failures += 1
		push_error(description)

func run() -> void:
	check(PlayerClasses.IDS == ["tanque", "arqueiro", "mago", "healer"], "four human classes have stable identifiers")
	check(PlayerClasses.normalize("invalid") == "tanque" and PlayerClasses.normalize("") == "tanque", "invalid saved class falls back to tank")
	check(PlayerClasses.normalize(" MAGO ") == "mago", "class identifiers normalize safely")
	var expected_life := {"tanque": 100, "arqueiro": 85, "mago": 75, "healer": 90}
	for id in PlayerClasses.IDS:
		var definition := PlayerClasses.get_definition(id)
		check(definition.id == id and definition.max_hp == expected_life[id], "class has its intended health: " + id)
		check(definition.skill_names.size() == 4 and definition.skill_hints.size() == 4 and definition.cooldowns.size() == 4, "class has exactly four complete skill definitions: " + id)
		check(definition.attack_scale > 0 and definition.range > 0 and definition.color is Color, "combat attributes are valid: " + id)
		definition.skill_names[0] = "modified"
		definition.max_hp = 999
		check(PlayerClasses.get_definition(id).max_hp == expected_life[id] and PlayerClasses.get_definition(id).skill_names[0] != "modified", "callers cannot mutate shared class definitions: " + id)
	var menu := ClassMenu.new()
	root.add_child(menu)
	var requests: Array[String] = []
	var close_events: Array[bool] = []
	menu.class_requested.connect(func(id: String) -> void: requests.append(id))
	menu.closed.connect(func() -> void: close_events.append(true))
	check(not menu.visible and menu.class_buttons.size() == 4, "NPC class menu starts hidden with four choices")
	for id in PlayerClasses.IDS:
		menu.show_classes("healer" if id == "tanque" else "tanque")
		menu.class_buttons[id].pressed.emit()
		check(requests.back() == id, "class button requests the corresponding class: " + id)
	menu.show_classes("mago")
	check(menu.visible and menu.class_buttons.mago.disabled and "Mago humano" in menu.current_label.text, "current class is identified and cannot be selected again")
	var request_count := requests.size()
	menu.class_buttons.mago.pressed.emit()
	check(requests.size() == request_count, "current class does not emit a redundant change")
	menu.close_button.pressed.emit()
	check(close_events.size() == 1, "return button emits the close request")
	var inventory := EquipmentInventory.new()
	root.add_child(inventory)
	inventory.set_player_class(PlayerClasses.get_definition("healer"))
	inventory.sync_items({"equipped": true, "armor": true, "pants": true, "equipment_version": 2, "gloves": true, "boots": true, "shield": true, "potions": 3, "fangs": 0, "gold": 0}, false, 7, 90, 90)
	check(inventory.class_title.text == "CURANDEIRO HUMANO" and inventory.level_label.text == "Curandeiro · Nv. 7", "inventory title and level keep the selected class after sync")
	menu.queue_free()
	inventory.queue_free()
	await process_frame
	print("PLAYER CLASSES COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
