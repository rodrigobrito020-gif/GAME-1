extends SceneTree
class IsolatedProgress extends "res://scripts/player_progress.gd":
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary:
		return {}
	func save_profile(_state: Dictionary, _path: String = DEFAULT_PATH) -> Error:
		return OK
var failures := 0
func _initialize() -> void:
	_run.call_deferred()
func check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: " + message)
	else:
		failures += 1
		push_error(message)
func _run() -> void:
	var game = load("res://main.tscn").instantiate()
	game.progress = IsolatedProgress.new()
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	game.player_class = "arqueiro"
	game._sync_class()
	for slot in range(4):
		game._change_zone(1)
		var origin: Vector3 = game.player.position
		check(game._activate_skill(slot), "archer skill activates: " + str(slot + 1))
		var reuse: float = game.get(game.class_combat.REUSE_KEYS[slot])
		check(reuse >= 6.0 and game.attack_clock <= 0.65 and game.cooldown <= 0.65, "skill reuse is independent of short recovery: " + str(slot + 1))
		check(game.animation.current_animation == "attack" and game.animation.get_animation("attack").length / game.animation.speed_scale <= 0.65 + 0.001, "native shot fits the recovery without a four-second flourish")
		check(not game._attack(), "shot cannot interrupt the active skill recovery")
		game._physics_process(0.66)
		game._physics_process(0.01)
		check(game.attack_clock == 0 and game.animation.current_animation == "idle" and game.animation.speed_scale == 1.0, "class returns to normal idle at normal playback speed")
		check(game.get(game.class_combat.REUSE_KEYS[slot]) > 5.0 and game._attack(), "normal shot is accepted while the skill is still recharging")
		check(game.player.position.distance_to(origin) <= 5.5, "short recovery does not cause an uncontrolled movement burst")
	game._change_zone(0)
	check(not game._attack() and game.animation.speed_scale == 1.0, "village still disables attacks and restores normal animation speed")
	game.queue_free()
	await process_frame
	print("ARCHER RECOVERY COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
