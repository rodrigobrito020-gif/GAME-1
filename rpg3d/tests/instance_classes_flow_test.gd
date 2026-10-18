extends SceneTree
## Runs the real scene and controller, with an isolated save and manual clock.
const PlayerClasses := preload("res://scripts/player_classes.gd")
const InstanceRun := preload("res://scripts/instance_run.gd")
const Village := preload("res://scripts/village.gd")
const TravelGate := preload("res://scripts/travel_gate.gd")

class IsolatedProgress extends "res://scripts/player_progress.gd":
	var isolated_path := "/tmp/reload-class-flow-%d.cfg" % OS.get_process_id()
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary:
		return super.load_profile(isolated_path)
	func save_profile(state: Dictionary, _path: String = DEFAULT_PATH) -> Error:
		return super.save_profile(state, isolated_path)

var game: Node3D
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
	var profile := IsolatedProgress.new()
	DirAccess.remove_absolute(profile.isolated_path)
	game = load("res://main.tscn").instantiate()
	game.progress = profile
	root.add_child(game)
	# Do not invoke the scene's built-in smoke routine. Its ready path loads the
	# isolated profile above; subsequent actions use manual ticks and skip saves.
	game.smoke = true
	game.set_physics_process(false)
	await physics_frame
	await _test_class_selection(profile)
	await _test_ranged_attacks()
	await _test_ranged_weapon_requirement()
	await _test_mage_and_healer()
	await _test_boss_rewards_and_exit_buttons()
	game.queue_free()
	await process_frame
	DirAccess.remove_absolute(profile.isolated_path)
	print("INSTANCE CLASSES FLOW COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)

func _test_class_selection(profile: RefCounted) -> void:
	check(game.current_world == 0 and game.player_class == "tanque", "new profile starts as a tank in the village")
	check(game.active_zone.find_children("*", "Node3D", true, false).any(func(node: Node3D) -> bool: return node.is_in_group("class_trainer")), "village contains the real human class trainer")
	game.player.position = Vector3(30, 0.05, 20)
	check(not game._interact() and not game.class_menu.visible and not game._choose_class("mago"), "class choice requires interacting near the trainer")
	for id in ["arqueiro", "mago", "healer", "tanque"]:
		game.player.position = Village.CLASS_TRAINER_POSITION + Vector3(0, 0.05, 2)
		check(game._interact() and game.class_menu.visible and game.class_menu.class_buttons.size() == 4, "trainer opens four class choices: " + id)
		game.class_menu.class_buttons[id].pressed.emit()
		var definition := PlayerClasses.get_definition(id)
		check(game.player_class == id and not game.class_menu.visible and game.hp == definition.max_hp, "class choice applies its health and closes conversation: " + id)
		var skills_updated := true
		for slot in range(4):
			var button: Control = game.hud.slot_buttons[slot]
			skills_updated = skills_updated and button.class_id == id and button._class_key() == id and definition.skill_names[slot] in button.tooltip_text
		check(skills_updated and definition.name.to_upper() in game.hud.status.text, "HUD skill names and icon families match selected class: " + id)
		check(not game._attack() and not game._activate_skill(0), "village remains safe for every class: " + id)
	# Exercise the real save/load hooks through an isolated PlayerProgress subtype.
	_select_class("mago")
	game.smoke = false
	game._save_profile()
	game.smoke = true
	check(profile.load_profile().get("player_class") == "mago", "selected class persists with the player profile")
	game.player_class = "tanque"
	game._load_profile()
	check(game.player_class == "mago" and game.hud.slot_buttons[0].class_id == "mago", "loading a profile reapplies class definitions to the real HUD")

func _select_class(id: String) -> void:
	if game.current_world != 0:
		game._return_to_village()
	if game.player_class == id:
		return
	game.player.position = Village.CLASS_TRAINER_POSITION + Vector3(0, 0.05, 2)
	game._interact()
	game.class_menu.class_buttons[id].pressed.emit()

func _enter_combat(id: String, number := 1) -> void:
	if game.current_world != 0:
		game._return_to_village()
	_select_class(id)
	game.player.position = game.portal_position + Vector3(0, 0.05, 2.5)
	game._interact()
	check(game._enter_world(number), "rift admits an unlocked world for class: " + id)
	game.arena_run.tick(InstanceRun.PREPARATION_TIME)
	game.player.position = Vector3(0, 0.05, 0)
	game.yaw = 0
	game.automatic_skills.fill(false)
	game._refresh_hud()
	await physics_frame
	await physics_frame

func _ready_action() -> void:
	game.cooldown = 0
	game.attack_clock = 0
	game.skill_cooldown = 0
	game.spin_cooldown = 0
	game.guard_cooldown = 0
	game.dash_cooldown = 0
	game.attack_pending = false

func _position_target(distance: float) -> CharacterBody3D:
	for index in range(game.enemies.size()):
		game.enemies[index].position = Vector3(50 + index * 3, 0.05, -30)
	var target: CharacterBody3D = game.enemies[0]
	target.position = game.player.position + Vector3(0, 0, -distance)
	return target

func _wall_ahead(distance: float) -> StaticBody3D:
	var wall := StaticBody3D.new()
	var collider := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(4, 3, 0.5)
	collider.shape = shape
	wall.add_child(collider)
	game.active_zone.add_child(wall)
	wall.global_position = game.player.global_position + Vector3(0, 1, -distance)
	return wall

func _test_ranged_attacks() -> void:
	await _enter_combat("arqueiro")
	var target := _position_target(20)
	await physics_frame
	await physics_frame
	var health := float(target.get_meta("hp"))
	check(game._attack() and game.class_combat._projectiles.size() == 1 and float(target.get_meta("hp")) == health, "ranged basic attack launches a projectile before applying damage")
	game.class_combat.tick(game, 1.0)
	check(float(target.get_meta("hp")) < health, "real projectile damages a target twenty metres ahead")
	_ready_action()
	var wall := _wall_ahead(10)
	await physics_frame
	await physics_frame
	health = float(target.get_meta("hp"))
	check(game._attack(), "ranged attack can fire toward a wall")
	game.class_combat.tick(game, 1.0)
	check(float(target.get_meta("hp")) == health, "wall intercepts the projectile and protects the target behind it")
	wall.queue_free()
	await physics_frame
	await physics_frame
	_ready_action()
	check(game._attack() and not game.class_combat._projectiles.is_empty(), "another projectile is active before leaving the world")
	health = float(target.get_meta("hp"))
	game._return_to_village()
	game.class_combat.tick(game, 2.0)
	check(game.class_combat._projectiles.is_empty() and float(target.get_meta("hp")) == health, "zone transition cancels pending projectiles without late damage")
	await process_frame

func _test_mage_and_healer() -> void:
	await _enter_combat("mago")
	check(game._activate_skill(2) and game.guard_clock == 4.0, "mage barrier starts four seconds of protection")
	var health: float = game.hp
	game._receive_damage(20)
	check(is_equal_approx(game.hp, health - 7), "mage barrier actually reduces received damage")
	for index in range(game.enemies.size()):
		game.enemies[index].position = Vector3(35 + index * 3, 0.05, -30)
	await physics_frame
	await physics_frame
	_ready_action()
	var before: Vector3 = game.player.position
	check(game._activate_skill(3) and game.player.position.distance_to(before) >= 7.5, "mage teleports forward using character collision")
	await _enter_combat("healer")
	check(not game._activate_skill(1) and game.spin_cooldown == 0, "healer does not spend healing cooldown at full life")
	game.hp = 40
	check(game._activate_skill(1) and game.hp == 80 and game.spin_cooldown > 0, "healer restores forty health with its own skill")
	_ready_action()
	game.hp = 20
	check(game._activate_skill(2), "healer creates a sanctuary field")
	game.class_combat.tick(game, 0.5)
	check(game.hp == 20, "sanctuary heals over time rather than instantly")
	game.class_combat.tick(game, 0.5)
	game.class_combat.tick(game, 3.0)
	check(game.hp == 60, "sanctuary restores ten health per second for four seconds")
	_ready_action()
	game.hp = 10
	check(game._activate_skill(2), "a new healing field is active before defeat")
	game._receive_damage(100000)
	game.class_combat.tick(game, 2.0)
	check(game.dead and game.hp == 0 and game.class_combat._fields.is_empty() and not game._activate_skill(1), "healing fields and skills cannot revive a defeated player")
	game.hud.return_button.pressed.emit()
	check(game.current_world == 0 and not game.dead and game.hp == game._maximum_hp(), "defeat return button restores the player safely in the village")

func _test_ranged_weapon_requirement() -> void:
	var offensive_slots := {"arqueiro": [0, 1, 3], "mago": [0, 1], "healer": [0, 3]}
	var support_slots := {"arqueiro": [2], "mago": [2, 3], "healer": [1, 2]}
	for id in ["arqueiro", "mago", "healer"]:
		await _enter_combat(id)
		_position_target(16 if id == "healer" else 20)
		await physics_frame
		await physics_frame
		_ready_action()
		check(game._use_item("sword") and not game.ranged_attachment.visible, "storing the equipped weapon hides the ranged model: " + id)
		check(not game._attack() and game.class_combat._projectiles.is_empty(), "ranged basic attack requires an equipped weapon: " + id)
		for slot in offensive_slots[id]:
			_ready_action()
			var accepted: bool = game._activate_skill(slot)
			var remaining := [game.skill_cooldown, game.spin_cooldown, game.guard_cooldown, game.dash_cooldown]
			check(not accepted and remaining[slot] == 0 and game.class_combat._projectiles.is_empty(), "offensive skill requires a weapon without spending cooldown: %s/%d" % [id, slot + 1])
		for slot in support_slots[id]:
			_ready_action()
			if id == "healer":
				game.hp = 20
			check(game._activate_skill(slot), "support or defensive skill remains available without a weapon: %s/%d" % [id, slot + 1])
		_ready_action()
		check(game._use_item("sword") and game.ranged_attachment.visible and game._attack(), "equipping the weapon restores its model and ranged basic attack: " + id)
		game.class_combat.cancel(game)
	game._return_to_village()

func _test_boss_rewards_and_exit_buttons() -> void:
	await _enter_combat("tanque")
	var gate_found := false
	for node in game.active_zone.find_children("*", "Node3D", true, false):
		gate_found = gate_found or node.get_script() == TravelGate
	check(not gate_found, "combat arena does not contain a return rift")
	while game.arena_run.phase == InstanceRun.Phase.COMBAT:
		for foe in game.enemies.duplicate():
			game._damage_enemy(foe, 100000)
	check(game.instance_kills == 30 and game.arena_run.phase == InstanceRun.Phase.BOSS and game.enemies.size() == 1, "thirty common kills across six waves summon exactly one boss")
	check(not is_instance_valid(game.reward_chest) and game.progress.unlocked_world() == 1 and not game._open_chest(), "boss blocks both the chest and the next world unlock")
	var boss: CharacterBody3D = game.enemies[0]
	check(bool(boss.get_meta("is_boss", false)) and float(boss.get_meta("maximum_hp")) > 60, "final opponent is a stronger named boss")
	game._damage_enemy(boss, 100000)
	check(game.arena_run.phase == InstanceRun.Phase.VICTORY and is_instance_valid(game.reward_chest) and game.progress.unlocked_world() == 2, "boss defeat creates the chest and unlocks exactly the next world")
	check(not game._next_world(), "next-world transition requires collecting the chest")
	var before_rewards: int = game.inventory.get("loot_items", []).size()
	game.hud.collect_button.pressed.emit()
	check(game.reward_chest.opened and game.hud.chest_rewards_panel.visible and game.inventory.loot_items.size() == before_rewards + 1, "collect button opens the actual chest and displays its single reward")
	check(not game._open_chest() and not game._next_world() and game.inventory.loot_items.size() == before_rewards + 1, "reward modal prevents duplicate collection and premature travel")
	game.hud.chest_rewards_panel.continue_button.pressed.emit()
	check(game.hud.run_result_panel.visible and game.hud.next_world_button.visible, "closing reward presentation exposes the next-world action")
	game.hud.next_world_button.pressed.emit()
	check(game.current_world == 2 and game.arena_run.phase == InstanceRun.Phase.PREPARATION and game.arena_run.preparation_left == 30 and game.enemies.is_empty(), "next-world button starts a fresh thirty-second preparation")
	check(not game._next_world(), "fresh preparation cannot skip onward to another world")
	game.arena_run.tick(InstanceRun.PREPARATION_TIME + InstanceRun.TIME_LIMIT)
	check(game.arena_run.phase == InstanceRun.Phase.FAILED and game.hud.run_result_panel.visible and not game.hud.next_world_button.visible and not is_instance_valid(game.reward_chest), "timeout exposes only the village return action and awards no chest")
	game.hud.return_button.pressed.emit()
	check(game.current_world == 0 and game.hp == game._maximum_hp(), "timeout return button restores village state")
	await _enter_combat("tanque", 2)
	check(game.arena_run.phase == InstanceRun.Phase.COMBAT and game.arena_run.time_left == 600 and game.arena_run.wave == 1, "retry after timeout begins a new attempt instead of resuming expired state")
