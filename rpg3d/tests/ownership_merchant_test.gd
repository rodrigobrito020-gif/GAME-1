extends SceneTree
const Loot := preload("res://scripts/loot_items.gd")
const Stock := preload("res://scripts/merchant_stock.gd")
const Icons := preload("res://scripts/item_icons.gd")
class IsolatedProgress extends "res://scripts/player_progress.gd":
	var path := "/tmp/ownership-merchant-%d.cfg" % OS.get_process_id()
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary:
		return super.load_profile(path)
	func save_profile(state: Dictionary, _path: String = DEFAULT_PATH) -> Error:
		return super.save_profile(state, path)
var game
var failures := 0
func _initialize() -> void:
	_run.call_deferred()
func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error(message)
	else: print("PASS: " + message)
func owned() -> Dictionary:
	var records := {}
	for item: Dictionary in game.inventory.loot_items + game.inventory.equipped_loot.values():
		records[item.id] = item.duplicate(true)
	return records
func choose(id: String) -> void:
	game.player.position = game.Village.CLASS_TRAINER_POSITION + Vector3(0, 0.05, 2)
	check(game._interact() and game._choose_class(id), "class trainer changes only the class: " + id)
func _run() -> void:
	var progress := IsolatedProgress.new()
	DirAccess.remove_absolute(progress.path)
	game = load("res://main.tscn").instantiate()
	game.progress = progress
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	var initial := owned()
	check(initial.size() == 6 and game.inventory.identity_version == 1, "initial tank equipment is represented by six owned unique items")
	for id: String in ["mago", "arqueiro", "healer", "tanque", "mago"]:
		choose(id)
		check(owned() == initial, "changing class preserves every item ID, name, appearance and stats without granting items: " + id)
		if id != "tanque":
			check(not Loot.is_equipped(game.inventory, "sword") and not game._use_item("sword"), "other classes cannot obtain a free converted weapon: " + id)
	var rng := RandomNumberGenerator.new()
	rng.seed = 71059
	var weapon_types := {}
	var profiles := {}
	var rod := {}
	var bow := {}
	for index in 900:
		var drop := Loot.create_world_drop(rng, 1)
		if drop.slot == "sword":
			weapon_types[drop.weapon_type] = true
			if drop.weapon_type == "rod": rod = drop
			if drop.weapon_type == "bow": bow = drop
		elif drop.slot in Loot.Catalog.CLOTHING_SLOTS and drop.has("lineage_key"):
			profiles[Loot.Catalog.get_entry(drop.lineage_key).profile] = true
	check(weapon_types.size() == 3 and profiles.size() == 3, "world drop pool includes swords, bows, rods and all three clothing families")
	game.inventory.loot_items.append(rod)
	game.inventory.loot_items.append(bow)
	check(not game._use_item("loot_equip:" + bow.id) and game._use_item("loot_equip:" + rod.id), "mage must obtain and equip a compatible rod; bow stays in bag")
	check(Icons.for_item(bow, "tanque") == Icons.for_item(bow, "healer"), "stored bow icon never becomes another weapon when class changes")
	check(game._use_item("shield") and game.shield_attachment.visible, "mage can equip and display the already owned shield")
	game._toggle_inventory()
	game.hud.inventory_panel.select_loot(bow.id)
	var cell: Button = game.hud.inventory_panel.loot_buttons[bow.id]
	var tile := cell.get_theme_stylebox("normal") as StyleBoxFlat
	check(cell.expand_icon and cell.get_theme_constant("icon_max_width") == 64 and tile.content_margin_top == 4 and tile.bg_color == Icons.background_color(bow.rarity), "inventory uses large icons and a rarity background across the entire slot")
	game._toggle_inventory()
	choose("healer")
	check(Loot.equipped_item(game.inventory, "sword").id == rod.id and game.shield_attachment.visible, "healer shares the existing rod and shield without changing their identities")
	choose("arqueiro")
	check(not game.shield_attachment.visible and game.inventory.loot_items.any(func(value: Dictionary) -> bool: return value.id == rod.id), "archer stores shield and rod without converting them")
	check(game._use_item("loot_equip:" + bow.id), "archer equips a bow previously obtained from the drop pool")
	game.smoke = false
	game._save_profile()
	var saved: Dictionary = progress.load_profile()
	var restored: Dictionary = game.inventory.duplicate(true)
	Loot.restore_items(restored, saved.inventory, saved.player_class)
	var snapshot: Dictionary = restored.duplicate(true)
	Loot.ensure_identity(restored, "arqueiro")
	check(restored == snapshot and restored.equipped_loot.sword.weapon_type == "bow", "save reload preserves ownership and never repeats starter migration")
	game.smoke = true
	# Exercise the real NPC, menu signals, transaction handlers and disk saves.
	game.player.position = Vector3(20, 0.05, 20)
	check(not game._trade("buy", "potion", 1), "remote purchases are rejected without an open nearby merchant")
	game.player.position = game.Village.MERCHANT_POSITION + Vector3(0, 0.05, 1.8)
	game.inventory.gold = 120
	check(game._interact() and game.merchant_menu.visible and game._modal_open(), "merchant NPC opens the real buy/sell screen and pauses gameplay")
	var count: int = game.inventory.potions
	game.smoke = false
	game.merchant_menu.buy_grid.buttons["potion_bundle"].pressed.emit()
	game.merchant_menu.quantity.value = 2
	game.merchant_menu.action_button.pressed.emit()
	check(game.inventory.gold == 20 and game.inventory.potions == count + 10, "buy button charges 100 gold for two five-potion bundles")
	check(progress.load_profile().inventory.potions == count + 10, "purchase is persisted through the real profile saver")
	var before: Dictionary = game.inventory.duplicate(true)
	check(not game._trade("buy", "potion_bundle", 1) and game.inventory == before, "insufficient gold rejects purchase without changing money or stock")
	game.merchant_menu.select_entry("sell", "fang")
	game.inventory.fangs = 12
	game.merchant_menu.sync_inventory(game.inventory, game.player_class)
	game.merchant_menu.quantity.value = 3
	game.merchant_menu.action_button.pressed.emit()
	check(game.inventory.fangs == 9 and game.inventory.gold == 26, "sell button removes the requested material quantity and pays its price")
	var price := Stock.sale_price(rod)
	check(game._trade("sell", rod.id, 1) and not game.inventory.loot_items.any(func(value: Dictionary) -> bool: return value.id == rod.id) and game.inventory.gold == 26 + price, "selling a stored equipment item removes exactly that unique item and credits gold")
	before = game.inventory.duplicate(true)
	check(not game._trade("sell", rod.id, 1) and not game._trade("sell", bow.id, 1) and game.inventory == before, "sold items cannot be sold twice and equipped gear cannot be sold")
	check(not game._trade("buy", "potion", -1) and not game._trade("buy", "potion", 100) and game.inventory == before, "invalid quantities cannot create gold or items")
	check(not game._use_item("potion") and not game._interact(), "merchant modal blocks combat inventory use and overlapping interactions")
	var escape := InputEventKey.new()
	escape.keycode = KEY_TAB
	escape.pressed = true
	game._input(escape)
	check(not game.merchant_menu.visible and not game.merchant_backdrop.visible and not game._modal_open(), "TAB closes merchant, backdrop and pause together")
	game._change_zone(1)
	game.arena_run.tick(game.InstanceRun.PREPARATION_TIME)
	var drop_seed := 0
	while true:
		rng.seed = drop_seed
		if rng.randf() < 0.18: break
		drop_seed += 1
	game.loot_rng.seed = drop_seed
	var previous_count: int = game.inventory.loot_items.size()
	var previous_gold: int = game.inventory.gold
	game._damage_enemy(game.enemies.front(), 100000)
	check(game.inventory.loot_items.size() == previous_count + 1 and game.inventory.gold == previous_gold + 5, "a real monster death rolls and grants equipment alongside normal gold")
	check(not Loot._validated_item(game.inventory.loot_items.back()).is_empty() and progress.load_profile().inventory.loot_items.size() == previous_count + 1, "monster equipment has a valid persistent identity and is saved immediately")
	game.smoke = true
	game.queue_free()
	await process_frame
	DirAccess.remove_absolute(progress.path)
	print("OWNERSHIP AND MERCHANT COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
