extends Node3D
## Campo de um quilômetro de lado, com clareira ampla e vegetação em instâncias.
const SIZE := 1000.0

func _ready() -> void:
	var ground := MeshInstance3D.new()
	ground.name = "OpenGround"
	var plane := PlaneMesh.new()
	plane.size = Vector2(SIZE, SIZE)
	ground.mesh = plane
	var noise := FastNoiseLite.new()
	noise.seed = 2741
	noise.frequency = 0.025
	var texture := NoiseTexture2D.new()
	texture.width = 512
	texture.height = 512
	texture.seamless = true
	texture.noise = noise
	var shader := Shader.new()
	shader.code = """shader_type spatial;
	uniform sampler2D grass_noise : repeat_enable;
	varying vec3 world_pos;
	void vertex() { world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
	void fragment() {
		float broad = texture(grass_noise, world_pos.xz * 0.002).r;
		float detail = texture(grass_noise, world_pos.xz * 0.05).r;
		ALBEDO = mix(vec3(0.19, 0.28, 0.10), vec3(0.42, 0.48, 0.22), broad) * (0.8 + detail * 0.35);
		ROUGHNESS = 1.0;
	}"""
	var material := ShaderMaterial.new()
	material.shader = shader
	material.set_shader_parameter("grass_noise", texture)
	ground.material_override = material
	add_child(ground)
	var floor_body := StaticBody3D.new()
	floor_body.name = "FieldCollision"
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(SIZE, 1.0, SIZE)
	collision.shape = shape
	collision.position.y = -0.5
	floor_body.add_child(collision)
	add_child(floor_body)
	_vegetation()
	_hills()

func _material(color: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 1
	return mat

func _instances(mesh: Mesh, transforms: Array[Transform3D], material: Material) -> void:
	var batch := MultiMeshInstance3D.new()
	batch.multimesh = MultiMesh.new()
	batch.multimesh.transform_format = MultiMesh.TRANSFORM_3D
	batch.multimesh.mesh = mesh
	batch.multimesh.instance_count = transforms.size()
	for i in range(transforms.size()):
		batch.multimesh.set_instance_transform(i, transforms[i])
	batch.material_override = material
	add_child(batch)

func _vegetation() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 3456
	var trunks: Array[Transform3D] = []
	var crowns: Array[Transform3D] = []
	for i in range(190):
		var angle := rng.randf_range(0, TAU)
		var radius := rng.randf_range(85, 475)
		var at := Vector3(cos(angle) * radius, 0, sin(angle) * radius)
		var scale := rng.randf_range(0.8, 1.8)
		trunks.append(Transform3D(Basis.IDENTITY.scaled(Vector3.ONE * scale), at + Vector3.UP * 1.5 * scale))
		crowns.append(Transform3D(Basis.IDENTITY.scaled(Vector3.ONE * scale), at + Vector3.UP * 4.2 * scale))
		var body := StaticBody3D.new()
		body.position = at + Vector3.UP * 1.5 * scale
		var collision := CollisionShape3D.new()
		var shape := CylinderShape3D.new()
		shape.radius = 0.3 * scale
		shape.height = 3.0 * scale
		collision.shape = shape
		body.add_child(collision)
		add_child(body)
	var trunk := CylinderMesh.new()
	trunk.top_radius = 0.2
	trunk.bottom_radius = 0.3
	trunk.height = 3
	trunk.radial_segments = 7
	_instances(trunk, trunks, _material(Color("64503b")))
	var crown := CylinderMesh.new()
	crown.top_radius = 0
	crown.bottom_radius = 2.5
	crown.height = 6
	crown.radial_segments = 9
	_instances(crown, crowns, _material(Color("3c6240")))

func _hills() -> void:
	for i in range(18):
		var angle := TAU * i / 18.0
		var hill := MeshInstance3D.new()
		var mesh := SphereMesh.new()
		mesh.radius = 110
		mesh.height = 150 + (i % 4) * 35
		mesh.radial_segments = 24
		mesh.rings = 12
		hill.mesh = mesh
		hill.position = Vector3(cos(angle) * 660, -25, sin(angle) * 660)
		hill.material_override = _material(Color("607a68"))
		add_child(hill)
