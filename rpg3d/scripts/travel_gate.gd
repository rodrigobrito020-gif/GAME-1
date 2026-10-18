extends Node3D
## Visual da fenda; a interação e a escolha dos mundos pertencem ao controlador.
@export var title := "Fenda dimensional"
@export var tint := Color("8c71f1")
var _veil: MeshInstance3D
var _lights: Array[MeshInstance3D] = []
var _clock := 0.0

func _ready() -> void:
	var stone := _material(Color("58636d"))
	var trim := _material(Color("b6aa84"))
	var glow := _material(tint)
	glow.emission_enabled = true
	glow.emission = tint
	glow.emission_energy_multiplier = 2.2
	for side in [-1.0, 1.0]:
		_box(Vector3(side * 1.65, 0.25, 0), Vector3(1.1, 0.5, 1.3), stone)
		_box(Vector3(side * 1.65, 1.8, 0), Vector3(0.67, 2.8, 0.8), stone)
		for y in [0.6, 1.3, 2.0, 2.7]:
			_box(Vector3(side * 1.65, y, -0.01), Vector3(0.78, 0.13, 0.89), trim)
			var rune := _box(Vector3(side * 1.65, y + 0.28, 0.422), Vector3(0.10, 0.22, 0.035), glow)
			rune.rotation.z = PI / 4.0
			_lights.append(rune)
	for i in range(11):
		var angle := PI * (float(i) + 0.5) / 11.0
		var block := _box(Vector3(cos(angle) * 1.65, 3.06 + sin(angle) * 1.65, 0), Vector3(0.46, 0.57, 0.8), stone if i % 2 == 0 else trim)
		block.rotation.z = angle - PI / 2.0
	var veil := QuadMesh.new()
	veil.size = Vector2(2.86, 4.13)
	_veil = MeshInstance3D.new()
	_veil.name = "DimensionalRift"
	_veil.mesh = veil
	_veil.position = Vector3(0, 2.22, 0.02)
	var shader := Shader.new()
	shader.code = """shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_never;
uniform vec4 rift_color : source_color;
void fragment() {
 vec2 p = (UV - vec2(0.5)) * vec2(2.0, 2.0);
 float edge = smoothstep(1.0, 0.72, length(p));
 float angle = atan(p.y, p.x);
 float swirl = sin(length(p) * 19.0 - TIME * 2.3 + angle * 3.0);
 float veins = pow(abs(sin(angle * 3.0 + length(p) * 13.0 - TIME * 1.8)), 18.0);
 vec3 deep = vec3(0.055, 0.08, 0.23);
 vec3 cyan = vec3(0.18, 0.77, 0.95);
 ALBEDO = mix(deep, rift_color.rgb, 0.34 + swirl * 0.23) + cyan * veins * 0.6;
 EMISSION = ALBEDO * 1.7;
 ALPHA = edge * 0.9;
}"""
	var magic := ShaderMaterial.new()
	magic.shader = shader
	magic.set_shader_parameter("rift_color", tint)
	_veil.material_override = magic
	add_child(_veil)
	var label := Label3D.new()
	label.text = title
	label.font_size = 36
	label.pixel_size = 0.012
	label.position = Vector3(0, 5.38, 0)
	label.modulate = Color("d8d1ff")
	label.outline_modulate = Color("182032")
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.no_depth_test = false
	add_child(label)
	var light := OmniLight3D.new()
	light.position = Vector3(0, 2.2, 0.8)
	light.light_color = tint
	light.light_energy = 1.0
	light.omni_range = 7.0
	add_child(light)
	for side in [-1.0, 1.0]:
		var body := StaticBody3D.new()
		body.position = Vector3(side * 1.65, 1.8, 0)
		var collision := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = Vector3(0.8, 3.5, 0.9)
		collision.shape = shape
		body.add_child(collision)
		add_child(body)

func _process(delta: float) -> void:
	_clock += delta
	for i in range(_lights.size()):
		_lights[i].scale = Vector3.ONE * (0.93 + sin(_clock * 1.8 + i) * 0.07)

func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.85
	return material

func _box(at: Vector3, size: Vector3, material: Material) -> MeshInstance3D:
	var visual := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	visual.mesh = mesh
	visual.position = at
	visual.material_override = material
	add_child(visual)
	return visual
