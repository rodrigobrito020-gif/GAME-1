extends SceneTree
const Gear := preload("res://scripts/gear_catalog.gd")
const Loot := preload("res://scripts/loot_items.gd")
const Icons := preload("res://scripts/item_icons.gd")
class IsolatedProgress extends "res://scripts/player_progress.gd":
	var path := "/tmp/client-equipment-%d.cfg" % OS.get_process_id()
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary: return super.load_profile(path)
	func save_profile(state: Dictionary, _path: String = DEFAULT_PATH) -> Error: return super.save_profile(state, path)
var game
var failures := 0
var checks := 0
func _initialize() -> void: _run.call_deferred()
func check(ok: bool, message: String) -> void:
	checks += 1
	if not ok:
		failures += 1
		push_error(message)
	else: print("PASS: " + message)
func frames() -> void:
	await process_frame
	await process_frame
func _run() -> void:
	var ids := {}
	var all_valid := true
	var all_icons := true
	var safe_prices := true
	var grades := {}
	var counts := {}
	for vendor: String in ["armor", "weapons"]:
		counts[vendor] = Gear.offers(vendor).size()
		for offer: Dictionary in Gear.offers(vendor):
			var item := Gear.create_item(offer)
			all_valid = all_valid and not Loot._validated_item(item).is_empty() and not ids.has(item.id)
			ids[item.id] = true
			var icon := Icons.for_display(item)
			all_icons = all_icons and icon != null and icon.get_width() == 32 and icon.get_height() == 32
			safe_prices = safe_prices and int(offer.price) > preload("res://scripts/merchant_stock.gd").sale_price(item)
			grades[offer.grade] = true
	check(all_valid and counts.armor > 1000 and counts.weapons > 300, "every catalog offer creates valid uniquely owned equipment: " + str(counts))
	check(all_icons and grades.size() == 5, "all catalog offers have native icons and cover No Grade, D, C, B and A")
	check(safe_prices, "equipment cannot be bought and resold for profit")
	check(Gear.Data.WEAPONS.weapon_99.weapon_type == "rod" and Gear.Data.WEAPONS.weapon_151.weapon_type == "rod", "spellbooks and magic swords use the DAT magic flag rather than becoming tank weapons")
	var all_sets := true
	for key: String in Gear.Data.COLLECTIONS:
		var collection: Dictionary = Gear.Data.COLLECTIONS[key]
		var inv := {"equipment_version":2, "loot_items":[], "equipped_loot":{}}
		for slot: String in collection.required:
			var offer := Gear.find_offer("armor", "clothing:" + str(collection.required[slot][0]))
			var item := Gear.create_item(offer)
			inv.loot_items.append(item)
			all_sets = Loot.equip_item(inv, item.id) and all_sets
		var role: String = {"heavy":"tanque", "light":"arqueiro", "robe":"mago"}[Gear.Catalog.get_entry(str(collection.required.armor[0])).profile]
		all_sets = all_sets and Loot.set_progress(inv, role).get(key, []).size() == Loot.collection_size(key)
		for stat: String in collection.bonus: all_sets = all_sets and Loot.set_bonuses(inv, role)[stat] >= collection.bonus[stat]
		Loot.unequip_slot(inv, "armor")
		all_sets = all_sets and Loot.set_progress(inv, role).get(key, []).size() < Loot.collection_size(key)
	check(all_sets and Gear.Data.COLLECTIONS.size() == 24, "all 24 new set families activate on their required pieces and break when the chest is removed")
	var pools_valid := true
	for grade: String in Gear.Catalog.GRADES:
		for kind: String in ["sword", "bow", "rod", "shield", "helmet", "ring1", "earring1", "necklace"]:
			pools_valid = pools_valid and not Gear.pool(kind, grade, "tanque").is_empty()
		for role: String in ["tanque", "arqueiro", "mago", "healer"]:
			for slot: String in Gear.Catalog.CLOTHING_SLOTS: pools_valid = pools_valid and not Gear.pool(slot, grade, role).is_empty()
	check(pools_valid, "all five grades have complete drop pools for every current class and item category")
	var rng := RandomNumberGenerator.new()
	rng.seed = 91413
	var helmet_count := 0
	var weapons := {}
	for i in 3000:
		var item := Loot.create_world_drop(rng, 1 + i % 10)
		if item.slot == "helmet": helmet_count += 1
		if item.has("weapon_key"): weapons[item.weapon_key] = true
	check(helmet_count > 100 and weapons.size() > 30, "real random monster/chest generator now produces helmets and many different original weapons")
	var manifest: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/client_equipment/source.json"))
	var scenes_valid := true
	var meshes := 0
	for record: Dictionary in manifest.scenes.values():
		var scene := load(record.path) as PackedScene
		if scene == null:
			scenes_valid = false
			continue
		var model := scene.instantiate()
		var visuals := model.find_children("*", "MeshInstance3D", true, false)
		scenes_valid = scenes_valid and not visuals.is_empty() and FileAccess.get_sha256(record.path) == record.sha256
		for mesh: MeshInstance3D in visuals:
			meshes += 1
			for surface in mesh.mesh.get_surface_count():
				var material := mesh.mesh.surface_get_material(surface) as StandardMaterial3D
				scenes_valid = scenes_valid and material != null and material.albedo_texture != null
		model.free()
	check(scenes_valid and meshes >= 471, "all 471 converted models import with textured meshes and match their recorded hashes")
	var progress := IsolatedProgress.new()
	DirAccess.remove_absolute(progress.path)
	game = load("res://main.tscn").instantiate()
	game.progress = progress
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	game.inventory.gold = 999999
	check(game.get_tree().get_nodes_in_group("armor_merchant").size() == 1 and game.get_tree().get_nodes_in_group("weapon_merchant").size() == 1, "village has two real specialist NPCs with separate interaction groups")
	var before: Dictionary = game.inventory.duplicate(true)
	check(not game._buy_equipment("armor", "clothing:helmet_43"), "equipment purchase requires the nearby open matching shop")
	game.player.position = game.Village.ARMOR_MERCHANT_POSITION + Vector3(0, 0.05, 1.8)
	check(game._interact() and game.equipment_shop.visible and game._modal_open() and game.equipment_shop.vendor == "armor", "E at Dara opens armor/jewelry shop and pauses combat")
	game.smoke = false
	var shop = game.equipment_shop
	await frames()
	check(shop.filtered.size() == counts.armor and shop.grid.buttons.size() == 30 and not shop.next.disabled, "catalog pagination exposes all stock without shrinking inventory slots")
	shop.next.pressed.emit()
	check(shop.page == 1 and shop.grid.buttons.size() == 30, "next page exposes the next thirty offers")
	shop.grade_filter.select(5)
	shop.grade_filter.item_selected.emit(5)
	var all_legendary := true
	for offer: Dictionary in shop.filtered: all_legendary = all_legendary and offer.grade == "A"
	check(all_legendary and not shop.filtered.is_empty() and shop.page == 0, "grade filtering shows only grade A and resets pagination")
	shop.type_filter.select(5)
	shop.type_filter.item_selected.emit(5)
	var all_helmets := true
	for offer: Dictionary in shop.filtered: all_helmets = all_helmets and offer.slot == "helmet"
	check(all_helmets and not shop.filtered.is_empty(), "helmet category can be inspected independently")
	shop.select_offer("clothing:heavy_4_armor")
	shop.set_button.pressed.emit()
	check(game.inventory == before and shop.preview.preview_class == "tanque" and Loot.set_bonuses(shop.preview.preview_inventory, "tanque").defense > 0, "free full-set preview shows its actual completed bonus without granting or changing owned items")
	shop.grade_filter.select(0)
	shop.grade_filter.item_selected.emit(0)
	shop.select_offer("clothing:helmet_43")
	check(shop.description.text.contains("malha visível") and game.inventory == before, "helmets explain native hidden appearance; selecting does not purchase")
	shop.buy_button.pressed.emit()
	var first: Dictionary = game.inventory.loot_items.back()
	check(first.slot == "helmet" and first.lineage_key == "helmet_43" and game.inventory.gold == int(before.gold) - 80, "buy button grants exactly the selected original helmet and deducts its price")
	shop.buy_button.pressed.emit()
	var second: Dictionary = game.inventory.loot_items.back()
	check(first.id != second.id and first.name == second.name, "two purchases retain separate persistent item identities")
	shop.search.text = "__no_such_equipment__"
	shop.search.text_changed.emit(shop.search.text)
	check(shop.filtered.is_empty() and shop.buy_button.disabled and shop.selected_id.is_empty(), "empty search results cannot purchase a stale hidden selection")
	shop.search.text = ""
	shop.search.text_changed.emit("")
	check(progress.load_profile().inventory.loot_items.back().id == second.id, "equipment purchases save immediately")
	var snapshot: Dictionary = game.inventory.duplicate(true)
	check(not game._buy_equipment("weapons", "weapon:weapon_129") and game.inventory == snapshot, "armor NPC rejects another vendor's offer without mutating inventory")
	game._close_equipment_shop()
	check(not game.equipment_shop_backdrop.visible and not game._modal_open(), "closing specialist shop restores gameplay and removes its backdrop")
	check(game._use_item("loot_equip:" + first.id) and Loot.equipped_item(game.inventory, "helmet").id == first.id, "purchased helmet equips to the working head slot")
	check(game.hud.inventory_panel.equipped_buttons[13].icon != null and not game.hud.inventory_panel.loot_buttons.has(first.id), "head slot shows the original helmet icon after removing it from the bag")
	game.player.position = game.Village.WEAPON_MERCHANT_POSITION + Vector3(0, 0.05, 1.8)
	check(game._interact() and game.equipment_shop.vendor == "weapons" and shop.filtered.size() == counts.weapons, "Orin opens a separate complete weapons/shields catalog")
	shop.select_offer("weapon:weapon_129")
	shop.buy_button.pressed.emit()
	var sword: Dictionary = game.inventory.loot_items.back()
	game._close_equipment_shop()
	check(game._use_item("loot_equip:" + sword.id), "new original sword can actually be equipped")
	var visual = game.sword_attachment.get_node("Sword/ClientWeapon")
	check(visual.weapon_key == "weapon_129" and visual.has_node("OriginalClientWeapon") and not game.sword_attachment.get_node("Sword/OriginalLongSword").visible, "world replaces the starter sword mesh rather than only its name or stats")
	game.player.position = game.Village.WEAPON_MERCHANT_POSITION + Vector3(0, 0.05, 1.8)
	game._interact()
	shop.select_offer("weapon:weapon_110")
	shop.buy_button.pressed.emit()
	var shield: Dictionary = game.inventory.loot_items.back()
	game._close_equipment_shop()
	check(game._use_item("loot_equip:" + shield.id) and game.shield_attachment.get_node("ShieldMount").weapon_key == "weapon_110", "new shield uses its actual original model with the approved forearm mount")
	game._toggle_inventory()
	check(game.hud.inventory_panel.preview != null, "inventory mannequin duplicates the equipped new weapon and shield")
	game._toggle_inventory()
	game._save_profile()
	var saved: Dictionary = progress.load_profile().inventory
	game._load_profile()
	check(game.inventory == saved and Loot.equipped_item(game.inventory, "helmet").id == first.id and Loot.equipped_item(game.inventory, "sword").weapon_key == "weapon_129", "reload preserves purchased models, exact identities, equipment and head slot")
	game.inventory.gold = 0
	snapshot = game.inventory.duplicate(true)
	check(not Gear.purchase(game.inventory, "weapons", "weapon:weapon_80").ok and game.inventory == snapshot, "insufficient gold rejects the full purchase before assigning ownership")
	game.smoke = true
	game.queue_free()
	await frames()
	DirAccess.remove_absolute(progress.path)
	print("CLIENT EQUIPMENT SHOP COMPLETE: %d checks, %d failures" % [checks, failures])
	quit(0 if failures == 0 else 1)
