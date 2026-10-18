extends SceneTree

const LootItems := preload("res://scripts/loot_items.gd")
const PlayerProgress := preload("res://scripts/player_progress.gd")
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
	_test_rarity_rates()
	_test_generated_rewards()
	_test_transfers()
	_test_restore()
	_test_persistence()
	await _test_inventory_ui()
	print("LOOT ITEMS COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)

func item(id: String, slot: String, attack: int = 3, defense: int = 5) -> Dictionary:
	return {"id": id, "slot": slot, "name": "Equipamento de teste", "rarity": "Raro", "attack_bonus": attack, "defense_bonus": defense}

func inventory() -> Dictionary:
	return {"equipped": true, "shield": true, "armor": true, "gloves": true, "boots": true, "loot_items": [], "equipped_loot": {}}

func _test_rarity_rates() -> void:
	check(is_equal_approx(LootItems.WEIGHTS.reduce(func(total: float, weight: float) -> float: return total + weight, 0.0), 100.0), "rarity weights total 100 percent")
	var boundaries := [[0.0, "Comum"], [64.999999, "Comum"], [65.0, "Incomum"], [91.999999, "Incomum"], [92.0, "Raro"], [99.499999, "Raro"], [99.5, "Épico"], [99.949999, "Épico"], [99.95, "Lendário"], [99.999999, "Lendário"]]
	for entry: Array in boundaries:
		check(LootItems.rarity_for_roll(entry[0]) == entry[1], "rarity boundary: %s maps to %s" % [entry[0], entry[1]])
	# Sweep every 0.01 percentage point at its center: exact proportions without
	# a flaky statistical test, including the five legendary points in 10,000.
	var counts := {"Comum": 0, "Incomum": 0, "Raro": 0, "Épico": 0, "Lendário": 0}
	for index in 10000:
		counts[LootItems.rarity_for_roll((index + 0.5) / 100.0)] += 1
	check(counts == {"Comum": 6500, "Incomum": 2700, "Raro": 750, "Épico": 45, "Lendário": 5}, "rarity intervals produce 65 / 27 / 7.5 / 0.45 / 0.05 percent")

func _test_generated_rewards() -> void:
	var rng := RandomNumberGenerator.new()
	var replay := RandomNumberGenerator.new()
	rng.seed = 120301
	replay.seed = rng.seed
	var ids: Dictionary = {}
	var slots: Dictionary = {}
	var valid := true
	var deterministic := true
	for index in 400:
		var generated := LootItems.create_reward(rng, index % 10 + 1)
		var repeated := LootItems.create_reward(replay, index % 10 + 1)
		valid = valid and generated.id.length() == 32 and not ids.has(generated.id) and generated.slot in LootItems.SLOTS and generated.rarity in LootItems.RARITIES
		valid = valid and generated.attack_bonus is int and generated.defense_bonus is int and generated.attack_bonus >= 0 and generated.defense_bonus >= 0
		ids[generated.id] = true
		slots[generated.slot] = true
		deterministic = deterministic and generated.id != repeated.id
		generated.erase("id")
		repeated.erase("id")
		deterministic = deterministic and generated == repeated
	check(valid and ids.size() == 400 and slots.size() == 5, "generated rewards have unique persistent IDs, valid bonuses and all five equipment slots")
	check(deterministic, "seeded RNG reproduces reward attributes while IDs remain unique")

func _test_transfers() -> void:
	var inv := inventory()
	var first := item("first-sword", "sword", 12, 0)
	var replacement := item("replacement-sword", "sword", 19, 0)
	inv.loot_items = [first, replacement, item("shield", "shield", 0, 8)]
	check(LootItems.equip_item(inv, first.id), "bag item equips into its designated slot")
	check(inv.loot_items.size() == 2 and inv.equipped_loot.sword.id == first.id and not inv.equipped and LootItems.is_equipped(inv, "sword"), "equipping removes item from bag and replaces legacy equipment flag")
	check(not LootItems.equip_item(inv, first.id) and inv.loot_items.size() == 2, "repeating equip cannot duplicate an equipped item")
	check(LootItems.equip_item(inv, replacement.id) and inv.loot_items.size() == 2 and inv.equipped_loot.sword.id == replacement.id and inv.loot_items[1].id == first.id, "replacing equipment returns the previous item to bag exactly once")
	check(LootItems.equip_item(inv, "shield") and LootItems.bonuses(inv) == {"attack": 19, "defense": 8}, "only equipped items contribute attack and defense")
	check(LootItems.unequip_slot(inv, "sword") and not LootItems.is_equipped(inv, "sword") and inv.loot_items.size() == 2 and LootItems.bonuses(inv) == {"attack": 0, "defense": 8}, "unequipping returns item to bag and removes its stat bonus")
	check(not LootItems.unequip_slot(inv, "sword") and inv.loot_items.size() == 2, "repeating unequip cannot duplicate an item")
	check(LootItems.unequip_slot(inv, "boots") and not inv.boots, "legacy equipment can be cleared without inventing a loot item")
	check(not LootItems.is_equipped(inv, "invalid") and not LootItems.equip_item(inv, "missing") and not LootItems.unequip_slot(inv, "invalid"), "unknown IDs and slots do not alter inventory")
	var equipment_copy := first.duplicate(true)
	inv.loot_items.append(equipment_copy)
	check(LootItems.equip_item(inv, first.id), "duplicate bag ID is normalized during equip")
	var first_count := 0
	for entry: Dictionary in inv.loot_items:
		if entry.id == first.id:
			first_count += 1
	check(first_count == 0 and inv.equipped_loot.sword.id == first.id, "all bag copies of an equipped ID are removed")
	equipment_copy.attack_bonus = 999
	check(inv.equipped_loot.sword.attack_bonus == 12, "equipped data is copied independently of former bag references")

func _test_restore() -> void:
	var inv := inventory()
	var valid := item("valid-bag", "boots")
	var equipped := item("equipped", "sword", 14, 0)
	var bad_stat := item("bad-stat", "shield")
	bad_stat.attack_bonus = "17"
	var negative := item("negative", "armor", -1)
	var fractional := item("fractional", "gloves")
	fractional.defense_bonus = 3.2
	var bad_rarity := item("bad-rarity", "boots")
	bad_rarity.rarity = "Mítico"
	var bad_slot := item("bad-slot", "head")
	var bad_id := item("", "boots")
	var enormous := item("enormous", "shield", LootItems.MAX_STAT_BONUS + 1)
	var saved := {"equipped": true, "armor": false, "loot_items": [valid, valid.duplicate(true), equipped.duplicate(true), bad_stat, negative, fractional, bad_rarity, bad_slot, bad_id, enormous, 4, null], "equipped_loot": {"sword": equipped, "shield": item("mismatch", "boots"), "invalid": valid}}
	LootItems.restore_items(inv, saved)
	check(inv.loot_items.size() == 1 and inv.loot_items[0].id == valid.id and inv.equipped_loot.size() == 1 and inv.equipped_loot.sword.id == equipped.id, "restore removes malformed items, mismatched slots and duplicate IDs across bag and equipment")
	check(not inv.equipped and not inv.armor and inv.gloves, "restored loot suppresses base equipment while valid legacy flags remain intact")
	valid.defense_bonus = 999
	equipped.attack_bonus = 999
	check(inv.loot_items[0].defense_bonus == 5 and inv.equipped_loot.sword.attack_bonus == 14, "restored items do not alias mutable saved dictionaries")
	LootItems.restore_items(inv, {"loot_items": "invalid", "equipped_loot": [equipped]})
	check(inv.loot_items.is_empty() and inv.equipped_loot.is_empty(), "invalid container types restore an empty loot collection safely")
	check(not inv.armor and inv.gloves, "legacy flags survive saves without loot data")
	LootItems.restore_items(inv, {"loot_items": [item("roundtrip", "armor")], "equipped_loot": {}})
	LootItems.restore_items(inv, inv)
	check(inv.loot_items.size() == 1 and inv.loot_items[0].id == "roundtrip", "restore accepts its destination dictionary without discarding data")

func _test_persistence() -> void:
	var path := "user://loot-items-test-%d.cfg" % OS.get_process_id()
	var inv := inventory()
	var rng := RandomNumberGenerator.new()
	rng.seed = 40983
	var reward := LootItems.create_reward(rng, 4)
	inv.loot_items.append(reward)
	LootItems.equip_item(inv, reward.id)
	inv.loot_items.append(LootItems.create_reward(rng, 5))
	var progress := PlayerProgress.new()
	check(progress.save_profile({"inventory": inv}, path) == OK, "profile persists bag and equipped loot")
	var state := PlayerProgress.new().load_profile(path)
	var restored := inventory()
	LootItems.restore_items(restored, state.inventory)
	check(restored == inv and LootItems.bonuses(restored) == LootItems.bonuses(inv), "save/load preserves unique item IDs, locations and equipped bonuses")
	var new_reward := LootItems.create_reward(rng, 4)
	check(new_reward.id != reward.id and new_reward.id != restored.loot_items[0].id, "new rewards after load cannot reuse saved item IDs")
	DirAccess.remove_absolute(path)

func _test_inventory_ui() -> void:
	var panel := EquipmentInventory.new()
	root.add_child(panel)
	var inv := inventory()
	inv.merge({"potions": 3, "fangs": 0, "gold": 0})
	# Use the same request protocol as the game controller, so selection and
	# equip/remove buttons are tested together with the real transfer functions.
	panel.item_requested.connect(func(request: String) -> void:
		if request.begins_with("loot_equip:"):
			LootItems.equip_item(inv, request.trim_prefix("loot_equip:"))
		elif request.begins_with("loot_remove:"):
			LootItems.unequip_slot(inv, request.trim_prefix("loot_remove:"))
		panel.sync_items(inv, false, 1, 100, 100)
	)
	for index in LootItems.SLOTS.size():
		var reward := item("ui-" + LootItems.SLOTS[index], LootItems.SLOTS[index])
		reward.rarity = LootItems.RARITIES[index]
		inv.loot_items.append(reward)
	panel.sync_items(inv, false, 1, 100, 100)
	check(panel.capacity_label.text == "MOCHILA  6 / 20", "UI counts five stored rewards and one potion stack")
	for slot in LootItems.SLOTS:
		var id := "ui-" + slot
		var index := EquipmentInventory.IDS.find(slot)
		panel.loot_buttons[id].pressed.emit()
		check(panel.selected_loot_id == id and panel.action_button.text == "Equipar" and "Ataque" in panel.selected_description.text, "reward details show bonuses and Equipar: " + slot)
		panel.action_button.pressed.emit()
		check(inv.equipped_loot[slot].id == id and not panel.loot_buttons.has(id) and panel.item_buttons[index].visible, "UI equip moves reward to its slot and stores base gear: " + slot)
		var frame := panel.equipped_buttons[index].get_theme_stylebox("normal") as StyleBoxFlat
		check(frame.border_color == panel.rarity_color(inv.equipped_loot[slot].rarity), "equipment slot frame displays reward rarity: " + slot)
		panel.select_item(1)
		panel.equipped_buttons[index].pressed.emit()
		check(panel.selected_loot_id == id and panel.action_button.text == "Retirar", "character slot inspects equipped reward: " + slot)
		panel.action_button.pressed.emit()
		check(not inv.equipped_loot.has(slot) and panel.loot_buttons.has(id) and panel.equipped_buttons[index].icon == null, "UI remove returns reward without leaving a duplicate icon: " + slot)
	for index in range(23):
		inv.loot_items.append(item("extra-%d" % index, "boots"))
	panel.sync_items(inv, false, 1, 100, 100)
	var visible_cells := 0
	for child in panel.bag_grid.get_children():
		if child.visible:
			visible_cells += 1
	check(visible_cells > 20 and panel.loot_buttons.size() == inv.loot_items.size(), "UI retains every item above twenty bag spaces in its scrolling grid")
	for category in ["Armas", "Trajes", "Poções", "Materiais", "Todos"]:
		panel.set_category(category)
		var matches := true
		for reward in inv.loot_items:
			var expected: bool = category == "Todos" or (category == "Armas" and reward.slot in ["sword", "shield"]) or (category == "Trajes" and reward.slot in ["armor", "gloves", "boots"])
			matches = matches and panel.loot_buttons[reward.id].visible == expected
		check(matches, "UI filter applies to reward equipment: " + category)
	panel.queue_free()
	await process_frame
