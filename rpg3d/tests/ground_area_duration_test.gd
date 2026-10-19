extends SceneTree
class IsolatedProgress extends "res://scripts/player_progress.gd":
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary: return {}
	func save_profile(_state: Dictionary, _path: String = DEFAULT_PATH) -> Error: return OK
var game
var failures := 0
func _initialize() -> void: _run.call_deferred()
func check(ok: bool, message: String) -> void:
	if ok: print("PASS: " + message)
	else:
		failures += 1
		push_error(message)
func settle() -> void:
	await physics_frame
	await physics_frame
func setup(class_id: String) -> void:
	game._change_zone(0)
	game.player_class = class_id
	game._sync_class()
	preload("res://tests/owned_gear_fixture.gd").equip_weapon(game, class_id)
	game._change_zone(1)
	game.arena_run.tick(30)
	game.player.position = Vector3(0, 0.05, 0)
	game.automatic_skills.fill(false)
	for index in game.enemies.size(): game.enemies[index].position = Vector3(20 + index, 0.05, 20)
func target(at: Vector3):
	var foe = game.enemies[0]
	foe.position = at
	foe.set_meta("hp", 10000.0)
	foe.set_meta("maximum_hp", 10000.0)
	return foe
func _run() -> void:
	game = load("res://main.tscn").instantiate()
	game.progress = IsolatedProgress.new()
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	setup("arqueiro")
	var point := Vector3(5, 0, -7)
	var foe = target(point + Vector3(0, 0.05, 0))
	await settle()
	var key := InputEventKey.new()
	key.pressed = true
	key.keycode = KEY_4
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	var mode_before := Input.mouse_mode
	game._unhandled_input(key)
	check(game.ground_targeting.active() and game.dash_cooldown == 0 and game.class_combat._fields.is_empty(), "pressing an area skill opens the ground reticle without casting or consuming reuse")
	check(Input.mouse_mode == Input.MOUSE_MODE_VISIBLE, "ground targeting releases the cursor for choosing a point")
	var time_before: float = game.arena_run.time_left
	game.automatic_skills.fill(true)
	game._physics_process(0.05)
	check(game.arena_run.time_left < time_before and game.class_combat._fields.is_empty() and game.dash_cooldown == 0, "aiming keeps combat running while automatic skills cannot steal the pending cast")
	game.automatic_skills.fill(false)
	game.ground_targeting.point = point
	game.ground_targeting.valid = true
	var hp: float = foe.get_meta("hp")
	check(game.ground_targeting.confirm(game), "confirmation casts at the chosen off-center point")
	check(not game.ground_targeting.active() and Input.mouse_mode == mode_before and game.dash_cooldown == 12, "confirmation restores the previous mouse mode and starts the unchanged skill reuse")
	check(game.class_combat._fields.size() == 1 and game.class_combat._fields[0].remaining == 6 and game.class_combat._fields[0].visual.position.distance_to(point) < 0.1, "rain stays six seconds at the chosen location rather than at the player or nearest foe")
	game.class_combat.tick(game, 0.5)
	check(foe.get_meta("hp") == hp, "rain does not apply all of its damage instantly")
	game.class_combat.tick(game, 0.5)
	check(foe.get_meta("hp") < hp and not game.class_combat._projectiles.is_empty(), "rain has real damage pulses and falling arrows")
	var after_first: float = foe.get_meta("hp")
	game._toggle_inventory()
	game._physics_process(1.0)
	check(foe.get_meta("hp") == after_first and game.class_combat._fields[0].remaining == 5, "inventory pause freezes area duration and damage pulses")
	game._toggle_inventory()
	foe.position.x += 8
	await settle()
	game.class_combat.tick(game, 1.0)
	check(foe.get_meta("hp") == after_first, "leaving the area stops subsequent damage")
	foe.position = point + Vector3(0, 0.05, 0)
	await settle()
	game.class_combat.tick(game, 3.0)
	check(foe.get_meta("hp") < after_first and game.class_combat._fields[0].remaining == 1, "rain continues damaging after the old brief visual would have ended")
	game.class_combat.tick(game, 1.0)
	check(game.class_combat._fields.is_empty(), "rain ends at exactly six seconds")
	after_first = foe.get_meta("hp")
	game.class_combat.tick(game, 2.0)
	check(foe.get_meta("hp") == after_first, "falling cosmetic arrows cannot duplicate the pulses or deal late damage")
	game.attack_clock = 0
	game.cooldown = 0
	game.dash_cooldown = 0
	game._request_skill(3)
	key.keycode = KEY_ESCAPE
	game._unhandled_input(key)
	check(not game.ground_targeting.active() and game.dash_cooldown == 0, "Escape cancels without consuming the skill")
	game._request_skill(3)
	var right := InputEventMouseButton.new()
	right.button_index = MOUSE_BUTTON_RIGHT
	right.pressed = true
	game._unhandled_input(right)
	check(not game.ground_targeting.active() and game.dash_cooldown == 0, "right click cancels the ground selection")
	game._request_skill(3)
	game.ground_targeting.point = Vector3(25, 0, 0)
	game.ground_targeting.valid = true
	check(not game.ground_targeting.confirm(game) and game.ground_targeting.active() and game.dash_cooldown == 0, "points beyond the skill range are rejected without consuming reuse")
	game._toggle_inventory()
	check(not game.ground_targeting.active() and game.hud.inventory_panel.visible and Input.mouse_mode == Input.MOUSE_MODE_VISIBLE, "inventory opening cancels the reticle and keeps the cursor available")
	game._toggle_inventory()
	var wall := StaticBody3D.new()
	var collider := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(4, 3, 0.4)
	collider.shape = box
	wall.add_child(collider)
	game.active_zone.add_child(wall)
	wall.position = Vector3(0, 1, -4)
	await settle()
	check(not game.class_combat.valid_ground_target(game, 3, Vector3(0, 0, -8)), "a wall blocks casting behind it")
	check(not game.class_combat.valid_ground_target(game, 3, Vector3(2, 4, -2)), "a point in the air cannot be selected as ground")
	game._request_skill(3)
	game._receive_damage(100000)
	check(not game.ground_targeting.active() and game.dead and game.dash_cooldown == 0, "death cancels the pending selection without consuming the skill")
	setup("mago")
	point = Vector3(5, 0, -6)
	foe = target(point)
	await settle()
	hp = foe.get_meta("hp")
	check(game._activate_skill(1, point) and game.spin_cooldown == 8 and foe.get_meta("hp") < hp, "arcane explosion starts at the chosen remote point with unchanged reuse")
	after_first = foe.get_meta("hp")
	game.class_combat.tick(game, 3)
	check(foe.get_meta("hp") < after_first and game.class_combat._fields[0].remaining == 3, "arcane explosion continues with damage pulses")
	game.attack_clock = 0
	game._request_skill(0)
	game._change_zone(0)
	check(not game.ground_targeting.active() and game.class_combat._fields.is_empty(), "zone changes cancel the reticle and all area damage")
	setup("mago")
	foe = target(Vector3(0, 0.05, -8))
	await settle()
	check(game._activate_skill(0, Vector3(0, 0, -8)) and game.skill_cooldown == 6, "fireball accepts a manually chosen ground impact without changing reuse")
	game.class_combat.tick(game, 1)
	check(game.class_combat._fields.size() == 1 and game.class_combat._fields[0].remaining == 4, "fireball impact creates a full four-second burn after flight")
	hp = foe.get_meta("hp")
	game.class_combat.tick(game, 3)
	check(foe.get_meta("hp") < hp and game.class_combat._fields[0].remaining == 1, "fireball burn damages repeatedly rather than disappearing at impact")
	setup("healer")
	game.hp = 10
	point = Vector3(6, 0, -4)
	await settle()
	check(game._activate_skill(2, point) and game.guard_cooldown == 14, "sanctuary is placed remotely without changing its reuse")
	game.class_combat.tick(game, 2)
	check(game.hp == 10, "remote sanctuary heals only when the player enters it")
	game.player.position = point + Vector3.UP * 0.05
	game.class_combat.tick(game, 4)
	check(game.hp == 50 and game.class_combat._fields.is_empty(), "sanctuary remains active for six seconds and heals while inside")
	setup("healer")
	foe = target(Vector3(5, 0.05, -5))
	await settle()
	check(game._activate_skill(3, Vector3(5, 0, -5)) and game.dash_cooldown == 10, "holy wave is cast at the selected area without changing reuse")
	hp = foe.get_meta("hp")
	game.class_combat.tick(game, 2)
	check(foe.get_meta("hp") < hp and game.class_combat._fields[0].remaining == 4, "holy wave continues damaging for six seconds")
	setup("tanque")
	foe = target(Vector3(0, 0.05, -2))
	await settle()
	check(game._activate_skill(1), "tank spin still activates directly as a melee skill")
	game._melee_hit()
	hp = foe.get_meta("hp")
	game.class_combat.tick(game, 1)
	check(foe.get_meta("hp") < hp and game.class_combat._fields[0].remaining == 2 and game.spin_cooldown == 8, "tank spin leaves three seconds of follow-up cuts while preserving reuse")
	setup("arqueiro")
	foe = target(Vector3(0, 0.05, -7))
	await settle()
	game.automatic_skills[3] = true
	var auto_mouse := Input.mouse_mode
	game._automatic_skills_step()
	check(game.class_combat._fields.size() == 1 and not game.ground_targeting.active() and Input.mouse_mode == auto_mouse, "automatic area skills keep choosing a target without opening manual targeting or changing the camera")
	game.queue_free()
	await process_frame
	print("GROUND AREA DURATION COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
