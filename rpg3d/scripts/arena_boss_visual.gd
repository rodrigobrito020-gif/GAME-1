extends "res://scripts/grelim_visual.gd"
## Guardião da Fenda: silhueta maior, carapaça de rocha e golpe com preparação.
## Compatível com sync/hurt/fall do Grelim; aliases permitem controle por ação.
const BODY_SCALE := 1.75
const ATTACK_DURATION := 0.85
const PALETTE := {
	"a87936": "552d2a", "bc914b": "70403a", "936c35": "3c292b",
	"ffd255": "ff7239", "261b11": "1e1018", "775c32": "312528",
	"ead4a6": "d0c2a7", "ab7f3d": "643b36", "ae8240": "683930",
	"b58b44": "754236", "e3ce99": "c8b9a2", "94713a": "3f2c2c",
	"ac8242": "5b3934",
}
var _attack_elapsed := -1.0
var _was_attacking := false
var _manual_motion := false
var _motion := "idle"
var _core_material: StandardMaterial3D
var _aura: MeshInstance3D
var _aura_material: StandardMaterial3D

func _ready() -> void:
	super._ready()
	scale *= BODY_SCALE
	_apply_palette(self)
	_carapace()
	_ground_aura()

func _apply_palette(node: Node) -> void:
	if node is MeshInstance3D:
		var source := node.material_override as StandardMaterial3D
		if source != null:
			var material := source.duplicate() as StandardMaterial3D
			var key := source.albedo_color.to_html(false)
			material.albedo_color = Color(PALETTE.get(key, "573635"))
			material.roughness = 0.95
			if key == "ffd255":
				material.emission_enabled = true
				material.emission = Color("ff682e")
				material.emission_energy_multiplier = 0.65
			node.material_override = material
	for child in node.get_children():
		_apply_palette(child)

func _carapace() -> void:
	var rock := Color("29282d")
	var ridge := Color("454047")
	var bone := Color("cab99b")
	# Shoulder plates belong to the moving arms, rather than floating at the torso.
	for i in [0, 2]:
		var side := -1.0 if i == 0 else 1.0
		var arm := limbs[i]
		_ball(arm, Vector3(side * 0.06, 0.02, 0.07), Vector3(0.27, 0.22, 0.25), rock)
		for spike in range(3):
			var start := Vector3(side * (0.05 + spike * 0.07), 0.12, 0.11 - spike * 0.09)
			_segment(arm, start, start + Vector3(side * 0.15, 0.29 + spike * 0.04, 0.02), 0.08, 0, bone)
		_ball(arm, Vector3(side * 0.32, -0.31, -0.1), Vector3(0.18, 0.18, 0.19), ridge)
	# A crown of swept horns and dark plates makes the boss distinct at a distance.
	_segment(self, Vector3(0, 1.49, 0.08), Vector3(0, 2.02, 0.18), 0.19, 0, rock)
	for side in [-1.0, 1.0]:
		_segment(self, Vector3(side * 0.35, 1.48, 0.08), Vector3(side * 0.7, 1.99, 0.21), 0.17, 0, bone)
		_ball(self, Vector3(side * 0.23, 0.78, -0.25), Vector3(0.23, 0.28, 0.12), rock)
		_ball(self, Vector3(side * 0.23, 0.53, -0.21), Vector3(0.19, 0.14, 0.12), ridge)
		_segment(self, Vector3(side * 0.13, 0.94, 0.23), Vector3(side * 0.3, 1.18, 0.48), 0.1, 0, rock)
	_core_material = _material(Color("b84a2e"))
	_core_material.emission_enabled = true
	_core_material.emission = Color("e15d32")
	_core_material.emission_energy_multiplier = 0.65
	var core := MeshInstance3D.new()
	core.name = "RiftCore"
	var core_mesh := SphereMesh.new()
	core_mesh.radius = 0.1
	core_mesh.height = 0.29
	core_mesh.radial_segments = 6
	core_mesh.rings = 3
	core.mesh = core_mesh
	core.material_override = _core_material
	core.position = Vector3(0, 0.84, -0.315)
	add_child(core)

func _ground_aura() -> void:
	_aura_material = _material(Color(0.67, 0.15, 0.06, 0.20))
	_aura_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_aura_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_aura_material.emission_enabled = true
	_aura_material.emission = Color("a63b26")
	_aura_material.emission_energy_multiplier = 0.3
	_aura_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	_aura = MeshInstance3D.new()
	_aura.name = "RiftAura"
	var ring := TorusMesh.new()
	ring.inner_radius = 0.87
	ring.outer_radius = 0.91
	ring.rings = 48
	ring.ring_segments = 6
	_aura.mesh = ring
	_aura.material_override = _aura_material
	_aura.position.y = 0.025
	_aura.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_aura)

func sync(delta: float, moving: bool, attacking: bool) -> void:
	if fallen:
		return
	if attacking and not _was_attacking:
		_attack_elapsed = 0.0
	_was_attacking = attacking
	super.sync(delta, moving, false)
	var arm_angle := 0.0
	var body_angle := 0.0
	var posing := false
	if _manual_motion and _motion == "windup":
		arm_angle = -0.9
		body_angle = -0.12
		posing = true
	elif _attack_elapsed >= 0.0:
		_attack_elapsed += delta
		posing = _attack_elapsed < ATTACK_DURATION
		if _attack_elapsed < 0.28:
			var pull := sin(clampf(_attack_elapsed / 0.28, 0, 1) * PI * 0.5)
			arm_angle = -0.9 * pull
			body_angle = -0.12 * pull
		elif _attack_elapsed < 0.42:
			var strike := smoothstep(0.28, 0.42, _attack_elapsed)
			arm_angle = lerpf(-0.9, 0.8, strike)
			body_angle = lerpf(-0.12, 0.22, strike)
		else:
			var recover := 1.0 - smoothstep(0.42, ATTACK_DURATION, _attack_elapsed)
			arm_angle = 0.8 * recover
			body_angle = 0.22 * recover
		if not posing:
			_attack_elapsed = -1.0
	if posing:
		for i in [0, 2]:
			limbs[i].rotation.x = lerpf(limbs[i].rotation.x, arm_angle, 1.0 - exp(-26.0 * delta))
	rotation.x = lerpf(rotation.x, body_angle, 1.0 - exp(-14.0 * delta))
	_core_material.emission_energy_multiplier = 0.65 + sin(time * 2.4) * 0.15 + hurt_clock * 4.0
	_aura.position.y = 0.025 - position.y / BODY_SCALE
	_aura.global_rotation = Vector3.ZERO
	_aura_material.albedo_color.a = 0.17 + sin(time * 1.4) * 0.03

func set_motion(action: String) -> void:
	_manual_motion = true
	if action in ["death", "dead"]:
		fall()
		return
	if action == "attack" and _motion != action:
		# Explicit windup/attack callers already waited for the preparation.
		_attack_elapsed = 0.28 if _motion == "windup" else 0.0
	_motion = action

func _process(delta: float) -> void:
	if _manual_motion:
		sync(delta, _motion in ["walk", "run"], false)

func hit() -> void:
	hurt()

func die() -> void:
	fall()

func fall() -> void:
	if fallen:
		return
	if _aura != null:
		_aura.hide()
	super.fall()
