extends Node2D
## Uma pose por personagem com movimento procedural provisório.
## Pode receber AnimatedSprite2D quando as animações quadro a quadro estiverem prontas.

var attack_direction := 1.0
var artwork: Texture2D
var character_height := 100.0
var phase := 0.0
@onready var body: Sprite2D = $Body

func _ready() -> void:
	body.texture = artwork
	if artwork != null:
		var ratio := character_height / artwork.get_height()
		body.scale = Vector2(ratio, ratio)
	body.position = Vector2(0, -character_height / 2)

func sync_visual(unit: Dictionary, delta: float, frozen: bool) -> void:
	if artwork == null:
		return
	if not frozen:
		phase += delta
	var alive: bool = unit.hp > 0
	var length := maxf(0.01, float(unit.get("action_length", 0.3)))
	var clock := float(unit.get("action_clock", unit.pulse))
	var action := sin(clampf(clock / length, 0, 1) * PI)
	var bob := sin(phase * 2.6) * 0.9 if alive else 0.0
	var ratio := character_height / artwork.get_height()
	body.position = Vector2(action * 7 * attack_direction, -character_height / 2 + bob) if alive else Vector2(0, -character_height * 0.16)
	body.scale = Vector2(ratio, ratio * (1.0 + sin(phase * 2.6) * 0.008 if alive else 0.32))
	var tilt := 0.2 if unit.get("action_style", "") in ["axe", "cleave", "hammer", "claw"] else 0.07
	body.rotation = action * tilt * attack_direction if alive else 0.0
	body.modulate = Color.WHITE if alive else Color(0.42, 0.46, 0.48, 0.65)
	if alive and float(unit.get("hurt", 0)) > 0:
		body.modulate = Color(1, 0.5, 0.5)
