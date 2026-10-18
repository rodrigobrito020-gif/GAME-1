extends RefCounted
## Level numbers and saves remain intact. Attribute growth has diminishing returns.
static func xp_needed(level: int) -> int:
	return 60 + maxi(1, level) * 25

static func experience(world: int, boss: bool) -> int:
	return (4 + clampi(world, 1, 10) * 2) * (5 if boss else 1)

static func effective_level(level: int) -> float:
	return minf(maxi(1, level), 30) + sqrt(maxf(0, level - 30)) * 0.6

static func health_growth(level: int) -> float:
	return (effective_level(level) - 1.0) * 8.0

static func attack_growth(level: int) -> float:
	return (effective_level(level) - 1.0) * 1.5

static func incoming_damage(amount: float, defense: float) -> float:
	return maxf(1.0, amount * 100.0 / (100.0 + maxf(0.0, defense)))

static func enemy(world: int, level: int, wave: int = 1) -> Dictionary:
	var index := clampi(world, 1, 10) - 1
	var recommended := 1 + index * 2
	var overlevel := maxf(0.0, effective_level(level) - maxf(30.0, recommended))
	var wave_index := clampi(wave, 1, 6) - 1
	return {
		"hp": (60.0 + index * 24 + index * index * 2) * (1.0 + wave_index * 0.06) * (1.0 + overlevel * 0.12),
		"damage": (12.0 + index * 4 + floorf(index * index * 0.35)) * (1.0 + wave_index * 0.04) * (1.0 + overlevel * 0.04),
		"speed": 2.5 + index * 0.12 + wave_index * 0.03,
		"recommended_level": recommended,
	}
