extends RefCounted
## Definições estáveis das dez instâncias acessíveis pela Fenda Dimensional.
const COUNT := 10
const NAMES := [
	"Pradaria dos Grelins", "Vale das Pedras", "Ruínas da Aurora",
	"Bosque Esmeralda", "Campos de Âmbar", "Pedreiras Antigas",
	"Bosque da Névoa", "Ruínas do Crepúsculo", "Vale Cinzento",
	"Fronteira Dimensional",
]
const TINTS := [
	Color(1.0, 1.0, 1.0), Color(1.03, 0.96, 0.82), Color(0.90, 1.03, 0.95),
	Color(0.73, 1.02, 0.82), Color(1.24, 1.00, 0.61), Color(0.95, 0.91, 0.83),
	Color(0.76, 0.97, 1.12), Color(1.05, 0.85, 1.10), Color(0.78, 0.88, 0.98),
	Color(0.89, 0.79, 1.20),
]

static func get_world(number: int) -> Dictionary:
	var index := clampi(number, 1, COUNT) - 1
	var stats := preload("res://scripts/combat_balance.gd").enemy(index + 1, 1)
	var spawns: Array[Vector3] = [
		Vector3(-9, 0, -8), Vector3(-4, 0, -13), Vector3(4, 0, -13),
		Vector3(9, 0, -8), Vector3(0, 0, -4),
	]
	return {
		"number": index + 1,
		"title": "Mundo %d" % (index + 1),
		"subtitle": NAMES[index],
		"enemy_hp": stats.hp,
		"enemy_damage": stats.damage,
		"recommended_level": stats.recommended_level,
		"enemy_count": 5,
		"seed": 2741 + index * 7919,
		"tint": TINTS[index],
		"enemy_spawns": spawns,
		"rock_count": 0 if index == 0 else 4 + index,
		"ruin_count": 0 if index < 2 else 1 + int(index / 4.0),
	}
