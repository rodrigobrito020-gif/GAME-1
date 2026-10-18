extends RefCounted
## Estado de uma tentativa. O controlador decide quando o relógio pode avançar.
signal wave_requested(wave_number: int)
signal completed
signal failed(reason: String)

enum Phase { PREPARATION, COMBAT, VICTORY, FAILED }

const WAVE_COUNT := 6
const WAVE_SIZE := 5
const TOTAL_MONSTERS := WAVE_COUNT * WAVE_SIZE
const PREPARATION_TIME := 30.0
const TIME_LIMIT := 600.0

var phase := Phase.PREPARATION
var preparation_left := PREPARATION_TIME
var time_left := TIME_LIMIT
var wave := 0
var alive := 0
var kills := 0
var _started := false

func begin() -> void:
	phase = Phase.PREPARATION
	preparation_left = PREPARATION_TIME
	time_left = TIME_LIMIT
	wave = 0
	alive = 0
	kills = 0
	_started = true

func tick(delta: float) -> void:
	if not _started or not is_finite(delta) or delta <= 0.0:
		return
	var remaining := delta
	if phase == Phase.PREPARATION:
		var preparation_elapsed := minf(remaining, preparation_left)
		preparation_left = maxf(0.0, preparation_left - preparation_elapsed)
		remaining -= preparation_elapsed
		if preparation_left > 0.0:
			return
		phase = Phase.COMBAT
		_start_wave()
	# Signals can end the run synchronously; do not advance a finished attempt.
	if phase != Phase.COMBAT:
		return
	time_left = maxf(0.0, time_left - remaining)
	if time_left <= 0.0:
		fail("timeout")

func monster_defeated() -> void:
	if not _started or phase != Phase.COMBAT or alive <= 0 or kills >= TOTAL_MONSTERS:
		return
	alive -= 1
	kills += 1
	if alive > 0:
		return
	if wave < WAVE_COUNT:
		_start_wave()
	elif kills == TOTAL_MONSTERS:
		phase = Phase.VICTORY
		completed.emit()

func fail(reason: String = "death") -> void:
	if not _started or phase not in [Phase.PREPARATION, Phase.COMBAT]:
		return
	phase = Phase.FAILED
	failed.emit(reason)

func stop() -> void:
	# Leaving a map cancels its attempt without reporting a defeat.
	_started = false
	phase = Phase.FAILED
	alive = 0

func _start_wave() -> void:
	wave += 1
	alive = WAVE_SIZE
	wave_requested.emit(wave)
