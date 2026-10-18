extends SceneTree
const Loot := preload("res://scripts/loot_items.gd")
const Storage := preload("res://scripts/storage_items.gd")
const Stock := preload("res://scripts/merchant_stock.gd")
const Balance := preload("res://scripts/combat_balance.gd")
const Jewelry := preload("res://scripts/jewelry_catalog.gd")
class IsolatedProgress extends "res://scripts/player_progress.gd":
	var path := "/tmp/storage-jewelry-%d.cfg" % OS.get_process_id()
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary: return super.load_profile(path)
	func save_profile(state: Dictionary, _path: String = DEFAULT_PATH) -> Error: return super.save_profile(state, path)
var game
var failures := 0
func _initialize() -> void: _run.call_deferred()
func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)
	else: print("PASS: " + message)
func jewel(kind: String, tier: int, id: String) -> Dictionary:
	var entry: Dictionary = Jewelry.ITEMS[kind + "_" + str(tier)]
	return {"id":id, "slot":{"ring":"ring1", "earring":"earring1", "necklace":"necklace"}[kind], "name":entry.name, "jewelry_key":kind + "_" + str(tier), "rarity":Loot.RARITIES[tier], "attack_bonus":0, "defense_bonus":0, "magic_defense_bonus":entry.magic_defense_bonus, "hp_bonus":entry.hp_bonus}
func _run() -> void:
	var progress := IsolatedProgress.new()
	DirAccess.remove_absolute(progress.path)
	game = load("res://main.tscn").instantiate()
	game.progress = progress
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	check(game.get_tree().get_nodes_in_group("personal_storage").size() == 1, "village contains one interactive personal chest")
	var ring := jewel("ring", 2, "bank-ring")
	game.inventory.loot_items.append(ring)
	game.inventory.potions = 12
	check(not game._storage_transfer("deposit", ring.id, 1), "storage requires a nearby open chest")
	game.player.position = game.Village.STORAGE_POSITION + Vector3(0, 0.05, 1.8)
	check(game._interact() and game.storage_menu.visible and game._modal_open(), "E opens the real chest interface and pauses gameplay")
	game.smoke = false
	game.storage_menu.select_entry("deposit", ring.id)
	game.storage_menu.transfer_button.pressed.emit()
	check(game.inventory.storage_items == [ring] and not Loot._contains_id(game.inventory.loot_items, ring.id), "deposit moves the exact original item out of the bag")
	game.storage_menu.select_entry("deposit", "potion")
	game.storage_menu.quantity.value = 8
	game.storage_menu.transfer_button.pressed.emit()
	check(game.inventory.potions == 4 and game.inventory.storage_potions == 8, "chest supports a chosen quantity of consumables")
	check(progress.load_profile().inventory.storage_items == [ring], "real profile file persists storage immediately")
	check(not Stock.trade(game.inventory, "sell", ring.id, 1).ok, "merchant cannot sell an item stored in the chest")
	var snapshot: Dictionary = game.inventory.duplicate(true)
	check(not Storage.transfer(game.inventory, "withdraw", "potion", 9).ok and game.inventory == snapshot, "insufficient stored quantity rejects without partial changes")
	game.inventory.storage_potions = Storage.LIMIT
	snapshot = game.inventory.duplicate(true)
	check(not Storage.transfer(game.inventory, "deposit", "potion", 1).ok and game.inventory == snapshot, "storage stack limit cannot lose or create items")
	game.inventory.storage_potions = 8
	game.storage_menu.select_entry("withdraw", ring.id)
	game.storage_menu.transfer_button.pressed.emit()
	check(game.inventory.storage_items.is_empty() and game.inventory.loot_items.back() == ring, "withdraw returns the same identity, rarity and attributes")
	game._close_storage()
	check(not game.storage_backdrop.visible and not game._modal_open(), "closing storage removes the backdrop and gameplay pause")
	check(game._use_item("loot_equip:" + ring.id), "jewel equips into its dedicated slot")
	check(not Storage.transfer(game.inventory, "deposit", ring.id, 1).ok, "equipped gear cannot be stored without removing it first")
	for pair: Array in [["ring", "ring2"], ["earring", "earring1"], ["earring", "earring2"], ["necklace", "necklace"]]:
		var piece := jewel(pair[0], 2, "jewel-" + pair[1])
		game.inventory.loot_items.append(piece)
		if pair[1] == "ring2":
			game.hud.inventory_panel.sync_items(game.inventory, false, 1, game.hp, game._maximum_hp())
			game.hud.inventory_panel.select_loot(piece.id)
			check(game.hud.inventory_panel.current_name.text == "Nenhum equipamento" and game.hud.inventory_panel.selected_description.text.contains("Vida +10"), "jewel comparison uses the empty destination slot rather than the already occupied ring")
		check(game._use_item("loot_equip:" + piece.id) and game.inventory.equipped_loot[pair[1]].id == piece.id, "matching jewelry fills the next empty slot: " + pair[1])
	var bonuses := Loot.jewelry_bonuses(game.inventory)
	check(bonuses.hp > 0 and bonuses.magic_defense > 0 and game._maximum_hp() == 100 + bonuses.hp, "five jewelry slots contribute real HP and magical defense")
	game.hp = game._maximum_hp()
	game._receive_damage(50, true)
	var magical_loss: float = game._maximum_hp() - game.hp
	game.hp = game._maximum_hp()
	game._receive_damage(50, false)
	check(magical_loss < game._maximum_hp() - game.hp, "jewelry mitigates magical hits rather than physical hits")
	game.hp = game._maximum_hp()
	game._use_item("loot_remove:ring1")
	check(game.hp <= game._maximum_hp(), "removing an HP jewel clamps current life to the new maximum")
	game.player.position = game.Village.MERCHANT_POSITION + Vector3(0, 0.05, 1.8)
	check(game._interact(), "merchant still opens independently of storage")
	game.inventory.gold = 100
	game.inventory.fangs = 14
	game.merchant_menu.sync_inventory(game.inventory, game.player_class)
	game.merchant_menu.sale_checks[ring.id].button_pressed = true
	game.merchant_menu.sale_checks["fang"].button_pressed = true
	var expected_gold := 100 + Stock.sale_price(ring) + 28
	check(game.merchant_menu.sale_selection.size() == 2 and not game.merchant_menu.sell_selected_button.disabled, "checkboxes select multiple items and enable the bulk button")
	game.merchant_menu.sell_selected_button.pressed.emit()
	check(game.inventory.gold == expected_gold and game.inventory.fangs == 0 and game.inventory.potions == 4 and not Loot._contains_id(game.inventory.loot_items, ring.id), "bulk button sells only selected items, including whole selected stacks")
	check(game.merchant_menu.sale_selection.is_empty() and progress.load_profile().inventory.gold == expected_gold, "bulk sale clears selection and persists once completed")
	snapshot = game.inventory.duplicate(true)
	check(not Stock.sell_selected(game.inventory, {"potion":1, "missing":1}).ok and game.inventory == snapshot, "invalid bulk selection rolls back the entire transaction")
	check(not Stock.sell_selected(game.inventory, {"potion":1, "jewel-ring2":1}).ok and game.inventory == snapshot, "bulk selection cannot sell worn jewels or partially sell valid entries")
	game.inventory.gold = Stock.LIMIT - 1
	snapshot = game.inventory.duplicate(true)
	check(not Stock.sell_selected(game.inventory, {"potion":1}).ok and game.inventory == snapshot, "bulk sale rejects gold overflow before removing selected items")
	game.inventory.gold = expected_gold
	game._close_merchant()
	# Actual reload, including old high-level progression, must retain all ownership.
	game.level = 115
	game.xp = 2
	progress.completed_worlds.assign([1,2,3,4,5,6,7,8,9,10])
	game._save_profile()
	var saved: Dictionary = progress.load_profile()
	game.inventory.storage_items = [jewel("necklace", 4, "stale-bank")]
	game._load_profile()
	check(game.level == 115 and progress.unlocked_world() == 10 and game.inventory == saved.inventory, "real reload preserves level, unlocks, equipped jewels, bag and bank")
	var dup: Dictionary = saved.inventory.duplicate(true)
	dup.storage_items = [dup.equipped_loot.ring2, jewel("ring", 4, "unique-bank")]
	Loot.restore_items(dup, dup)
	check(dup.storage_items.size() == 1 and dup.storage_items[0].id == "unique-bank", "reload rejects duplicate identities across equipment, bag and storage")
	var without_storage: Dictionary = saved.inventory.duplicate(true)
	for key: String in ["storage_items", "storage_potions", "storage_fangs"]: without_storage.erase(key)
	Loot.restore_items(dup, without_storage)
	check(not dup.has("storage_items") and not dup.has("storage_potions"), "loading an older profile cannot keep stale storage from another profile")
	game.player.position = game.Village.CLASS_TRAINER_POSITION + Vector3(0, 0.05, 2)
	game._interact()
	check(game._choose_class("mago") and game.inventory.equipped_loot.ring2.id == "jewel-ring2", "jewelry remains the same owned item across class changes")
	var rng := RandomNumberGenerator.new()
	rng.seed = 812
	var kinds := {}
	for index in 1000:
		var reward := Loot.create_world_drop(rng, 1 + index % 10)
		if reward.has("jewelry_key"): kinds[Jewelry.kind_for_slot(reward.slot)] = true
	check(kinds.size() == 3, "normal monster and chest reward pool includes rings, earrings and necklaces")
	for kind: String in ["ring", "earring", "necklace"]:
		for tier in 5:
			var piece := jewel(kind, tier, kind + str(tier))
			check(not Loot._validated_item(piece).is_empty() and game.hud.inventory_panel.ItemIcons.for_display(piece) != null, "native jewelry icon and valid equipment data: " + kind + str(tier))
	# Level numbers persist, but attributes and XP no longer permit three-kill levels.
	check(Balance.xp_needed(1) == 85 and Balance.experience(1, false) == 6, "first level requires fifteen normal kills instead of three")
	check(Balance.health_growth(115) < 280 and Balance.attack_growth(115) < 55, "old high levels have bounded attribute growth without deleting levels")
	for world in range(2, 11):
		check(Balance.enemy(world, 10).hp > Balance.enemy(world - 1, 10).hp and Balance.enemy(world, 10, 6).damage > Balance.enemy(world, 10).damage, "world and wave difficulty increase: " + str(world))
	game.level = 1
	game.xp = 80
	game._change_zone(1)
	game.arena_run.tick(30)
	game.hp = 20
	game._damage_enemy(game.enemies[0], 100000)
	check(game.level == 2 and game.xp == 1 and is_equal_approx(game.hp, 28), "real kill carries XP remainder and grants only new maximum HP, without a full heal")
	game._change_zone(10)
	game.arena_run.tick(30)
	var normal_hp: float = game.enemies[0].get_meta("hp")
	for wave in 6:
		for enemy in game.enemies.duplicate(): game._damage_enemy(enemy, 100000)
	var boss = game.enemies[0]
	check(boss.get_meta("hp") > normal_hp * 8 and boss.get_meta("is_boss"), "six waves are followed by a substantially stronger boss")
	game.hp = game._maximum_hp()
	game.player.position = boss.position + Vector3(0, 0, 15)
	boss.set_meta("attack", 0.0)
	game._boss_step(boss, 0.01)
	check(boss.get_meta("windup") > 0, "boss telegraphs an attack against a ranged player fifteen meters away")
	await physics_frame
	game._boss_step(boss, 1.3)
	check(game.dead or game.hp < game._maximum_hp(), "staying still at range no longer avoids every boss attack")
	game.smoke = true
	game.queue_free()
	await process_frame
	DirAccess.remove_absolute(progress.path)
	print("STORAGE JEWELRY BALANCE COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
