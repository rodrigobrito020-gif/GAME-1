extends SceneTree

const InstanceRun := preload("res://scripts/instance_run.gd")
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(condition: bool, description: String) -> void:
	if condition:
		print("PASS: " + description)
	else:
		failures += 1
		push_error(description)

func _events(run: RefCounted) -> Dictionary:
	var events := {"waves": [], "completed": 0, "failed": []}
	run.wave_requested.connect(func(number: int) -> void: events.waves.append(number))
	run.completed.connect(func() -> void: events.completed += 1)
	run.failed.connect(func(reason: String) -> void: events.failed.append(reason))
	return events

func _run() -> void:
	_test_preparation_and_waves()
	_test_time_limit()
	_test_invalid_updates_and_terminal_states()
	_test_restart_and_stop()
	print("INSTANCE RUN COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)

func _test_preparation_and_waves() -> void:
	var run := InstanceRun.new()
	var events := _events(run)
	run.begin()
	check(run.phase == InstanceRun.Phase.PREPARATION and run.preparation_left == 30.0 and run.time_left == 600.0, "attempt starts with 30 seconds to prepare and a separate ten-minute combat clock")
	run.monster_defeated()
	run.tick(29.5)
	check(events.waves.is_empty() and run.alive == 0 and run.kills == 0 and run.wave == 0, "preparation spawns no enemies and ignores defeated notifications")
	check(run.preparation_left == 0.5 and run.time_left == 600.0, "preparation does not consume combat time")
	run.tick(0.5)
	check(run.phase == InstanceRun.Phase.COMBAT and events.waves == [1] and run.alive == 5 and run.time_left == 600.0, "first five monsters spawn exactly when preparation ends")
	for number in range(1, 7):
		check(run.wave == number and run.alive == 5, "wave %d starts with exactly five living monsters" % number)
		for defeated in range(4):
			run.monster_defeated()
			check(run.wave == number and run.alive == 4 - defeated, "wave %d waits until all five monsters are defeated" % number)
		run.monster_defeated()
	check(events.waves == [1, 2, 3, 4, 5, 6], "only the six requested waves are spawned, in order")
	check(run.kills == 30 and run.alive == 0 and run.phase == InstanceRun.Phase.VICTORY and events.completed == 1, "the thirtieth defeat completes the attempt once")
	for index in range(10):
		run.monster_defeated()
	run.tick(900.0)
	run.fail()
	check(run.kills == 30 and events.completed == 1 and events.failed.is_empty() and events.waves.size() == 6, "extra defeats, elapsed time and failure calls cannot alter a victory")

func _test_time_limit() -> void:
	var run := InstanceRun.new()
	var events := _events(run)
	run.begin()
	run.tick(32.25)
	check(run.preparation_left == 0.0 and run.time_left == 597.75 and events.waves == [1], "a frame spanning preparation uses its leftover seconds for combat")
	run.tick(597.5)
	check(run.phase == InstanceRun.Phase.COMBAT and run.time_left == 0.25 and events.failed.is_empty(), "combat remains active until the full 600 seconds expire")
	run.tick(0.25)
	check(run.phase == InstanceRun.Phase.FAILED and run.time_left == 0.0 and events.failed == ["timeout"], "combat fails exactly at the ten-minute deadline")
	run.tick(1.0)
	run.fail("death")
	run.monster_defeated()
	check(events.failed == ["timeout"] and run.kills == 0 and events.completed == 0, "timeout is terminal and is emitted only once")
	run.begin()
	run.tick(10000.0)
	check(run.phase == InstanceRun.Phase.FAILED and run.preparation_left == 0.0 and run.time_left == 0.0 and run.wave == 1, "an oversized frame clamps both clocks and creates no extra waves")

func _test_invalid_updates_and_terminal_states() -> void:
	var run := InstanceRun.new()
	var events := _events(run)
	run.begin()
	for invalid in [-10.0, 0.0, INF, -INF, NAN]:
		run.tick(invalid)
	check(run.preparation_left == 30.0 and run.time_left == 600.0 and events.waves.is_empty(), "negative, zero and non-finite deltas leave preparation unchanged")
	run.tick(30.0)
	for invalid in [-10.0, 0.0, INF, -INF, NAN]:
		run.tick(invalid)
	check(run.time_left == 600.0 and run.alive == 5, "invalid deltas cannot extend or destroy combat time")
	run.monster_defeated()
	run.fail()
	var remaining := run.time_left
	for index in range(10):
		run.monster_defeated()
		run.fail("timeout")
		run.tick(30.0)
	check(run.phase == InstanceRun.Phase.FAILED and run.kills == 1 and run.time_left == remaining and events.failed == ["death"] and events.completed == 0, "death freezes the attempt and ignores further kill and failure notifications")
	var preparing := InstanceRun.new()
	var preparing_events := _events(preparing)
	preparing.begin()
	preparing.fail()
	preparing.tick(1000.0)
	check(preparing.phase == InstanceRun.Phase.FAILED and preparing_events.failed == ["death"] and preparing_events.waves.is_empty(), "a failed preparation never spawns a wave later")

func _test_restart_and_stop() -> void:
	var run := InstanceRun.new()
	var events := _events(run)
	run.begin()
	run.tick(30.0)
	run.monster_defeated()
	run.stop()
	run.tick(1000.0)
	run.monster_defeated()
	check(run.phase == InstanceRun.Phase.FAILED and run.alive == 0 and run.kills == 1 and events.failed.is_empty(), "leaving cancels the attempt without emitting a death or timeout")
	run.begin()
	check(run.phase == InstanceRun.Phase.PREPARATION and run.wave == 0 and run.kills == 0 and run.alive == 0 and run.preparation_left == 30.0 and run.time_left == 600.0, "begin resets every counter for a fresh attempt")
	run.tick(30.0)
	check(events.waves == [1, 1] and run.alive == 5, "a new attempt starts at the first wave again")
