extends SceneTree
const Loot := preload("res://scripts/loot_items.gd")
const Storage := preload("res://scripts/storage_items.gd")
const Order := preload("res://scripts/inventory_order.gd")
class IsolatedProgress extends "res://scripts/player_progress.gd":
	var path := "/tmp/inventory-order-%d.cfg" % OS.get_process_id()
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
func piece(id: String, rarity: String) -> Dictionary:
	return {"id":id,"slot":"shield","name":"Escudo " + id,"rarity":rarity,"attack_bonus":0,"defense_bonus":5}
func visible_ranks(grid: GridContainer) -> Array[int]:
	var ranks: Array[int] = []
	for button: Button in grid.get_children():
		if button.visible and not button.disabled:
			ranks.append(Order.RARITIES.find(str(button.get_meta("rarity", "Comum"))))
	return ranks
func sorted_grid(grid: GridContainer, descending: bool) -> bool:
	var ranks := visible_ranks(grid)
	var expected := ranks.duplicate()
	expected.sort()
	if descending: expected.reverse()
	return ranks == expected
func move_mouse(point: Vector2, held := false) -> void:
	var motion := InputEventMouseMotion.new()
	motion.position = point
	motion.global_position = point
	motion.button_mask = MOUSE_BUTTON_MASK_LEFT if held else 0
	motion.relative = Vector2(24, 2)
	root.push_input(motion, true)
func mouse(point: Vector2, index: MouseButton, pressed: bool, double := false) -> void:
	var event := InputEventMouseButton.new()
	event.position = point
	event.global_position = point
	event.button_index = index
	event.pressed = pressed
	event.double_click = double
	event.button_mask = (MOUSE_BUTTON_MASK_RIGHT if index == MOUSE_BUTTON_RIGHT else MOUSE_BUTTON_MASK_LEFT) if pressed else 0
	root.push_input(event, true)
func click(button: Button, index := MOUSE_BUTTON_LEFT, double := false) -> void:
	var point := button.get_global_rect().get_center()
	move_mouse(point)
	await frames()
	mouse(point, index, true, double)
	mouse(point, index, false)
	await frames()
func drag(button: Button, destination: Control, label: String, should_accept := true) -> void:
	var start := button.get_global_rect().get_center()
	var target := destination.get_global_rect().get_center()
	move_mouse(start)
	await frames()
	mouse(start, MOUSE_BUTTON_LEFT, true)
	move_mouse(start + Vector2(28, 0), true)
	await frames()
	check(root.gui_is_dragging(), label + ": real mouse motion starts a drag")
	move_mouse(target, true)
	await frames()
	if OS.get_cmdline_user_args().has("--capture") and should_accept:
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("/workspace/artifacts/storage-drag-preview.png")
	mouse(target, MOUSE_BUTTON_LEFT, false)
	await frames()
	check(root.gui_is_drag_successful() == should_accept, label + ": expected drop acceptance")
func _run() -> void:
	root.size = Vector2i(1280, 720)
	var progress := IsolatedProgress.new()
	DirAccess.remove_absolute(progress.path)
	game = load("res://main.tscn").instantiate()
	game.progress = progress
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	game.inventory.loot_items = [piece("rare-first", "Raro"),piece("common", "Comum"),piece("legend", "Lendário"),piece("rare-second", "Raro"),piece("epic", "Épico"),piece("green", "Incomum")]
	game.inventory.storage_items = [piece("stored-rare", "Raro"),piece("stored-common", "Comum"),piece("stored-legend", "Lendário")]
	game.inventory.potions = 12
	game.inventory.fangs = 7
	game.inventory.storage_potions = 3
	game._refresh_hud()
	game._toggle_inventory()
	await frames()
	var panel = game.hud.inventory_panel
	var before: Dictionary = game.inventory.duplicate(true)
	await click(panel.sort_button)
	check(panel.sort_direction == -1 and sorted_grid(panel.bag_grid, true), "backpack first click orders Legendary to Common including consumables")
	check(visible_ranks(panel.bag_grid) == [4, 3, 2, 2, 1, 0, 0, 0], "backpack shows all five rarity tiers in their actual visual order")
	check(panel.loot_buttons["rare-first"].get_index() < panel.loot_buttons["rare-second"].get_index(), "equal rarity keeps the original item order")
	panel.select_loot("rare-first")
	await click(panel.sort_button)
	check(panel.sort_direction == 1 and sorted_grid(panel.bag_grid, false) and panel.selected_loot_id == "rare-first", "second click reverses rarity without changing inspected item")
	panel.set_category("Armas")
	check(sorted_grid(panel.bag_grid, false) and not panel.item_buttons[1].visible, "rarity order remains correct when a category filter hides consumables")
	panel.set_category("Todos")
	check(game.inventory == before, "sorting changes no item identities, counts, equipment or stats")
	game._toggle_inventory()
	game.player.position = game.Village.STORAGE_POSITION + Vector3(0, 0.05, 1.8)
	check(game._interact(), "real personal chest opens")
	game.smoke = false
	await frames()
	var menu = game.storage_menu
	for mode: String in ["deposit", "withdraw"]:
		var grid: GridContainer = menu.bag_grid if mode == "deposit" else menu.chest_grid
		await click(menu.sort_buttons[mode])
		check(sorted_grid(grid, true), "chest sort first click descends: " + mode)
		await click(menu.sort_buttons[mode])
		check(sorted_grid(grid, false), "chest sort second click ascends: " + mode)
	check(game.inventory == before, "sorting either side of the chest preserves the complete save data")
	await click(menu.bag_grid.buttons["rare-first"])
	check(menu.selected_id == "rare-first" and game.inventory == before, "single left click only inspects an item")
	await click(menu.bag_grid.buttons["rare-first"], MOUSE_BUTTON_LEFT, true)
	check(Loot._contains_id(game.inventory.storage_items, "rare-first") and not Loot._contains_id(game.inventory.loot_items, "rare-first"), "double left click deposits the exact equipment")
	await click(menu.chest_grid.buttons["rare-first"], MOUSE_BUTTON_LEFT, true)
	check(Loot._contains_id(game.inventory.loot_items, "rare-first") and not Loot._contains_id(game.inventory.storage_items, "rare-first"), "double left click withdraws equipment")
	await click(menu.bag_grid.buttons["potion"], MOUSE_BUTTON_RIGHT)
	check(game.inventory.potions == 0 and game.inventory.storage_potions == 15, "one right click deposits the entire potion stack and merges it")
	await click(menu.chest_grid.buttons["potion"], MOUSE_BUTTON_RIGHT)
	check(game.inventory.potions == 15 and game.inventory.storage_potions == 0, "one right click withdraws the entire stack")
	await drag(menu.bag_grid.buttons["green"], menu.chest_grid.empty_buttons[0], "deposit onto an empty cell")
	check(Loot._contains_id(game.inventory.storage_items, "green") and not Loot._contains_id(game.inventory.loot_items, "green"), "drag deposits one exact item without a copy")
	await drag(menu.chest_grid.buttons["green"], menu.bag_grid.buttons["rare-first"], "withdraw onto an occupied cell")
	check(Loot._contains_id(game.inventory.loot_items, "green") and not Loot._contains_id(game.inventory.storage_items, "green"), "drag onto an occupied cell transfers without swapping or destroying it")
	await drag(menu.bag_grid.buttons["fang"], menu.chest_grid.empty_buttons[0], "deposit a stack")
	check(game.inventory.fangs == 0 and game.inventory.storage_fangs == 7, "drag transfers the entire material stack")
	var snapshot: Dictionary = game.inventory.duplicate(true)
	await drag(menu.bag_grid.buttons["green"], menu.bag_grid.empty_buttons[0], "same-side drag", false)
	check(game.inventory == snapshot, "same-side drop is rejected without removing an item")
	await drag(menu.bag_grid.buttons["green"], menu.get_parent(), "drop outside both inventories", false)
	check(game.inventory == snapshot, "cancelled drag preserves every item")
	# Old payloads cannot be replayed after a transfer or a grid refresh.
	var stale := {"storage_source":menu.bag_grid, "item_id":"green", "token":menu.bag_grid._drag_token}
	menu.sync_inventory(game.inventory, game.player_class)
	check(not menu.chest_grid._can_receive_drag(Vector2.ZERO, stale), "stale drag payload is rejected")
	check(not menu.chest_grid._can_receive_drag(Vector2.ZERO, {"item_id":"green"}), "non-storage drag payload is rejected")
	menu.select_entry("deposit", "potion")
	menu.quantity.value = 2
	await click(menu.transfer_button)
	check(game.inventory.potions == 13 and game.inventory.storage_potions == 2, "manual quantity still transfers part of a stack")
	check(sorted_grid(menu.bag_grid, false) and sorted_grid(menu.chest_grid, false), "both rarity orders survive transfers and refreshes")
	check(progress.load_profile().inventory == game.inventory, "quick transfers and dragging save the resulting ownership immediately")
	game._close_storage()
	game.player.position = game.Village.MERCHANT_POSITION + Vector3(0, 0.05, 1.8)
	check(game._interact(), "merchant opens with updated backpack")
	var shop = game.merchant_menu
	await frames()
	shop.sale_checks["green"].button_pressed = true
	before = game.inventory.duplicate(true)
	await click(shop.sort_button)
	check(sorted_grid(shop.sell_grid, true) and shop.sale_checks["green"].button_pressed and shop.sale_selection.has("green"), "merchant descending sort preserves bulk sale selection")
	await click(shop.sort_button)
	check(sorted_grid(shop.sell_grid, false) and game.inventory == before, "merchant ascending sort never sells or changes an item")
	check(shop.sell_grid.transfer_peer == null and shop.buy_grid.transfer_peer == null, "merchant cells do not enable storage shortcuts")
	game.smoke = true
	game.queue_free()
	await frames()
	DirAccess.remove_absolute(progress.path)
	print("INVENTORY ORDER AND TRANSFER COMPLETE: %d checks, %d failures" % [checks, failures])
	quit(0 if failures == 0 else 1)
