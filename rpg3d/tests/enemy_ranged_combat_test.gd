extends SceneTree
class IsolatedProgress extends "res://scripts/player_progress.gd":
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary: return {}
	func save_profile(_state: Dictionary, _path: String = DEFAULT_PATH) -> Error: return OK
var game
var combat
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
func charge(foe) -> void:
	foe.set_meta("attack", 0.0)
	foe.set_meta("charge", 0.0)
	combat.step(game, foe, 0.01)
func release(foe) -> void:
	combat.step(game, foe, 1.1)
func flight() -> void:
	for frame in 25:
		combat.tick(game, 0.05)
		await physics_frame
func _run() -> void:
	game = load("res://main.tscn").instantiate()
	game.progress = IsolatedProgress.new()
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	combat = game.enemy_ranged_combat
	game._change_zone(1)
	game.arena_run.tick(30)
	check(game.enemies.size() == 5 and game.enemies.all(func(foe) -> bool: return foe.get_meta("role") == "melee"), "first wave introduces melee before ranged attackers")
	for foe in game.enemies.duplicate(): game._damage_enemy(foe, 100000)
	check(game.arena_run.wave == 2 and game.enemies.any(func(foe) -> bool: return foe.get_meta("role") == "archer"), "archer appears in world one wave two")
	for foe in game.enemies.duplicate(): game._damage_enemy(foe, 100000)
	check(game.arena_run.wave == 3 and game.enemies.any(func(foe) -> bool: return foe.get_meta("role") == "caster"), "caster joins world one wave three")
	game._change_zone(2)
	game.arena_run.tick(30)
	var archer
	var caster
	for foe in game.enemies:
		foe.position = Vector3(20, 0.05, -24)
		if foe.get_meta("role") == "archer": archer = foe
		if foe.get_meta("role") == "caster": caster = foe
	check(archer != null and caster != null and game.enemies.size() == 5, "later worlds mix all three roles within the existing five-monster wave")
	check(archer.get_node("GrelimVisual").find_child("Skull", true, false) != null and archer.get_node("GrelimVisual").find_child("BoneBow", true, false) != null and caster.get_node("GrelimVisual").find_child("ShamanStaff", true, false) != null, "skeleton archer and shaman have different bodies and equipped weapons")
	game.player.position = Vector3(0, 0.05, 0)
	archer.position = Vector3(0, 0.05, -10)
	await settle()
	var before: float = game.hp
	charge(archer)
	check(archer.get_meta("charge") > 0 and archer.get_node("GrelimVisual").charging and game.hp == before and combat.shots.is_empty(), "drawing the bow visibly prepares the attack without instant damage")
	release(archer)
	check(combat.shots.size() == 1 and not combat.shots[0].magical, "archer launches a physical arrow from ten meters away")
	await flight()
	check(game.hp < before and combat.shots.is_empty(), "arrow travels through space and damages the player on collision")
	game.hp = game._maximum_hp()
	charge(archer)
	release(archer)
	game.player.position.x = 4
	await settle()
	await flight()
	check(game.hp == game._maximum_hp(), "moving out of the arrow path avoids damage; arrows do not home")
	game.player.position.x = 0
	var wall := StaticBody3D.new()
	var collider := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(4, 3, 0.5)
	collider.shape = box
	wall.add_child(collider)
	game.active_zone.add_child(wall)
	wall.position = Vector3(0, 1, -5)
	await settle()
	charge(archer)
	check(archer.get_meta("charge") == 0, "walls block the archer's line of sight before starting a shot")
	combat._launch(game, archer, "archer")
	await flight()
	check(game.hp == game._maximum_hp() and combat.shots.is_empty(), "a wall intercepts an arrow already in flight")
	wall.queue_free()
	await settle()
	archer.position.z = -3
	archer.set_meta("attack", 3.0)
	combat.step(game, archer, 0.1)
	check(archer.velocity.z < 0, "archer retreats to preserve distance when approached")
	archer.position = Vector3(20, 0.05, -24)
	caster.position = Vector3(0, 0.05, -10)
	await settle()
	charge(caster)
	release(caster)
	check(combat.shots.size() == 1 and combat.shots[0].magical, "shaman casts a visible magical projectile with magical damage")
	before = game.hp
	await flight()
	check(game.hp < before, "shaman's ranged spell causes actual damage")
	game.hp = game._maximum_hp()
	caster.set_meta("casts", 2)
	charge(caster)
	release(caster)
	check(combat.areas.size() == 1 and game.hp == game._maximum_hp(), "third shaman cast marks the ground before the spell impacts")
	game.player.position.x = 4
	await settle()
	combat.tick(game, 1.2)
	check(combat.areas.is_empty() and game.hp == game._maximum_hp(), "leaving the marked area avoids the ground spell")
	game.player.position.x = 0
	await settle()
	caster.set_meta("casts", 2)
	charge(caster)
	release(caster)
	combat.tick(game, 1.2)
	check(game.hp < game._maximum_hp(), "remaining in the marked area receives the spell damage")
	game.hp = game._maximum_hp()
	charge(caster)
	release(caster)
	var at: Vector3 = combat.shots[0].visual.global_position
	game._toggle_inventory()
	game._physics_process(0.5)
	check(combat.shots[0].visual.global_position == at and game.hp == game._maximum_hp(), "inventory pause freezes hostile projectiles and prevents damage")
	game._toggle_inventory()
	combat.cancel()
	caster.set_meta("casts", 2)
	charge(caster)
	release(caster)
	game._damage_enemy(caster, 100000)
	combat.tick(game, 1.2)
	check(combat.areas.is_empty() and game.hp == game._maximum_hp(), "defeating the caster interrupts its pending area spell")
	archer.position = Vector3(0, 0.05, -10)
	await settle()
	combat._launch(game, archer, "archer")
	game.arena_run.fail("timeout")
	check(combat.shots.is_empty() and combat.areas.is_empty(), "failed instance immediately cancels hostile attacks")
	game._change_zone(0)
	await settle()
	check(combat.shots.is_empty() and game.current_world == 0 and game.hp == game._maximum_hp(), "return to village cannot retain delayed hostile damage")
	game.queue_free()
	await process_frame
	print("ENEMY RANGED COMBAT COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
