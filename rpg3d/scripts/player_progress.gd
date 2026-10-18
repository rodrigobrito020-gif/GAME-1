extends RefCounted
## Sequential world unlocks and the player's resumable profile.

const WORLD_COUNT := 10
const DEFAULT_PATH := "user://adventure_save.cfg"

var completed_worlds: Array[int] = []

func unlocked_world() -> int:
	return mini(completed_worlds.size() + 1, WORLD_COUNT)

func can_enter(number: int) -> bool:
	return number >= 1 and number <= WORLD_COUNT and number <= unlocked_world()

func complete_world(number: int) -> bool:
	# Replaying an earlier world never advances the next unlock.
	if number < 1 or number > WORLD_COUNT or number != completed_worlds.size() + 1:
		return false
	completed_worlds.append(number)
	return true

func load_profile(path: String = DEFAULT_PATH) -> Dictionary:
	completed_worlds.clear()
	var config := ConfigFile.new()
	# A missing save is the normal first-run path; malformed saves also reset safely.
	if config.load(path) != OK:
		return {}
	completed_worlds = _validated_prefix(config.get_value("progress", "completed_worlds", []))
	var player_state: Variant = config.get_value("player", "state", {})
	return player_state.duplicate(true) if player_state is Dictionary else {}

func save_profile(player_state: Dictionary, path: String = DEFAULT_PATH) -> Error:
	var config := ConfigFile.new()
	config.set_value("progress", "completed_worlds", _validated_prefix(completed_worlds))
	config.set_value("player", "state", player_state.duplicate(true))
	return config.save(path)

func _validated_prefix(value: Variant) -> Array[int]:
	var prefix: Array[int] = []
	if not (value is Array or value is PackedInt32Array or value is PackedInt64Array):
		return prefix
	for entry in value:
		if prefix.size() == WORLD_COUNT:
			break
		# Do not accept strings, fractions, duplicates or gaps as completed worlds.
		if not entry is int or entry != prefix.size() + 1:
			break
		prefix.append(entry)
	return prefix
