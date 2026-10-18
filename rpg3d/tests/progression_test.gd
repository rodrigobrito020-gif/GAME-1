extends SceneTree

const PlayerProgress := preload("res://scripts/player_progress.gd")
var failures := 0
var path := "user://progression-test-%d.cfg" % OS.get_process_id()

func _initialize() -> void:
	call_deferred("run")

func check(condition: bool, description: String) -> void:
	if condition:
		print("PASS: " + description)
	else:
		failures += 1
		push_error(description)

func run() -> void:
	DirAccess.remove_absolute(path)
	var progress := PlayerProgress.new()
	check(progress.load_profile(path).is_empty(), "first run has no saved player state")
	check(progress.completed_worlds.is_empty() and progress.unlocked_world() == 1, "first run unlocks only world 1")
	check(progress.can_enter(1) and not progress.can_enter(2), "next world starts locked")
	check(not progress.can_enter(0) and not progress.can_enter(-1) and not progress.can_enter(11), "world numbers outside 1 through 10 are rejected")
	check(not progress.complete_world(2) and progress.unlocked_world() == 1, "skipping a world cannot unlock progression")
	check(progress.complete_world(1) and progress.unlocked_world() == 2, "completing world 1 unlocks world 2")
	check(not progress.complete_world(1) and progress.completed_worlds == [1], "replaying a completed world does not grant another unlock")
	check(not progress.complete_world(3) and not progress.can_enter(3), "skipping remains blocked after the first completion")
	var player_state := {"level": 4, "hp": 72.0, "inventory": {"potions": 5, "gold": 35}, "auto_potion": true}
	check(progress.save_profile(player_state, path) == OK, "profile saves player state and completed worlds")
	var restored := PlayerProgress.new()
	var state := restored.load_profile(path)
	check(restored.completed_worlds == [1] and restored.unlocked_world() == 2, "fresh instance restores the next unlocked world")
	check(state == player_state, "fresh instance restores the player dictionary")
	for number in range(2, 11):
		check(restored.can_enter(number) and restored.complete_world(number), "sequential completion accepted: %d" % number)
	check(restored.completed_worlds.size() == 10 and restored.unlocked_world() == 10, "completing all worlds caps the unlock at world 10")
	check(not restored.complete_world(10) and not restored.complete_world(11) and not restored.can_enter(11), "replay and nonexistent world cannot pass the cap")
	check(restored.save_profile(player_state, path) == OK, "completed campaign can be saved")
	progress.load_profile(path)
	check(progress.completed_worlds == restored.completed_worlds and progress.unlocked_world() == 10, "completed campaign remains capped after loading")
	_test_invalid_profiles(progress)
	DirAccess.remove_absolute(path)
	check(progress.load_profile(path).is_empty() and progress.completed_worlds.is_empty() and progress.unlocked_world() == 1, "missing save clears stale progression without warnings")
	print("PROGRESSION COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)

func _test_invalid_profiles(progress: RefCounted) -> void:
	var cases := [
		{"value": [2, 3, 4], "expected": []},
		{"value": [1, 3, 2, 4], "expected": [1]},
		{"value": [1, 2, 2, 3], "expected": [1, 2]},
		{"value": [1, "2", 3], "expected": [1]},
		{"value": [1.0, 2, 3], "expected": []},
		{"value": [true, 2], "expected": []},
		{"value": "all worlds", "expected": []},
		{"value": {1: true, 10: true}, "expected": []},
		{"value": PackedInt32Array([1, 2, 4]), "expected": [1, 2]},
		{"value": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "expected": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
	]
	for entry in cases:
		var config := ConfigFile.new()
		config.set_value("progress", "completed_worlds", entry.value)
		config.set_value("player", "state", "invalid player dictionary")
		check(config.save(path) == OK, "invalid-profile fixture saved")
		var player_state: Dictionary = progress.load_profile(path)
		check(progress.completed_worlds == entry.expected, "loaded progression keeps only the valid sequential prefix: %s" % str(entry.value))
		check(progress.unlocked_world() == mini(entry.expected.size() + 1, 10), "invalid progression cannot bypass sequential unlocks")
		check(player_state.is_empty(), "invalid player state falls back to an empty dictionary")
