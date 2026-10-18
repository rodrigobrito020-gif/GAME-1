extends RefCounted
## Combat definitions. Appearance stays independent of the selected class.

const DEFAULT := "tanque"
const IDS: Array[String] = ["tanque", "arqueiro", "mago", "healer"]
const DEFINITIONS := {
	"tanque": {
		"id": "tanque", "name": "Tanque humano", "role": "Proteção e combate próximo",
		"description": "Resiste na linha de frente e controla os inimigos com espada e escudo.",
		"max_hp": 100, "attack_scale": 1.0, "range": 2.8, "color": Color("75b7cf"),
		"skill_names": ["Golpe potente", "Corte giratório", "Defesa", "Investida"],
		"skill_hints": ["Um golpe frontal mais forte.", "Atinge os inimigos ao redor.", "Reduz o dano recebido por 4 segundos.", "Avança rapidamente na direção da câmera."],
		"cooldowns": [6.0, 8.0, 12.0, 7.0]
	},
	"arqueiro": {
		"id": "arqueiro", "name": "Arqueiro humano", "role": "Dano à distância e mobilidade",
		"description": "Mantém distância com disparos precisos e sai de perto dos inimigos.",
		"max_hp": 85, "attack_scale": 1.0, "range": 22.0, "color": Color("9bc779"),
		"skill_names": ["Disparo potente", "Rajada de flechas", "Passo evasivo", "Chuva de flechas"],
		"skill_hints": ["Um disparo reforçado contra o alvo.", "Dispara várias flechas contra o alvo.", "Recua para abrir distância dos inimigos.", "Atinge uma área com uma chuva de flechas."],
		"cooldowns": [6.0, 8.0, 9.0, 12.0]
	},
	"mago": {
		"id": "mago", "name": "Mago humano", "role": "Magia ofensiva e dano em área",
		"description": "Concentra poder mágico à distância e protege a si mesmo com uma barreira.",
		"max_hp": 75, "attack_scale": 1.1, "range": 22.0, "color": Color("bc99e1"),
		"skill_names": ["Bola de fogo", "Explosão arcana", "Barreira arcana", "Teleporte"],
		"skill_hints": ["Lança fogo contra o alvo.", "Causa dano mágico em uma área.", "Reduz o dano recebido por 4 segundos.", "Teleporta na direção da câmera."],
		"cooldowns": [6.0, 8.0, 12.0, 7.0]
	},
	"healer": {
		"id": "healer", "name": "Curandeiro humano", "role": "Cura e sustentação em combate",
		"description": "Combina magia sagrada ofensiva com curas para sobreviver aos confrontos.",
		"max_hp": 90, "attack_scale": 0.75, "range": 18.0, "color": Color("91d8bc"),
		"skill_names": ["Luz sagrada", "Cura", "Santuário", "Onda sagrada"],
		"skill_hints": ["Atinge o alvo com energia sagrada.", "Recupera 40 pontos de vida.", "Recupera vida ao longo de 4 segundos.", "Atinge inimigos em uma área com luz sagrada."],
		"cooldowns": [6.0, 8.0, 14.0, 10.0]
	}
}

static func normalize(id: String) -> String:
	var normalized := id.strip_edges().to_lower()
	return normalized if normalized in IDS else DEFAULT

static func get_definition(id: String) -> Dictionary:
	return DEFINITIONS[normalize(id)].duplicate(true)
