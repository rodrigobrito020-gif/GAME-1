extends Node3D
## Vila segura e inteiramente murada. As casas são cenografia, com colisão.
const SPAWN := Vector3(0, 0.05, 11)
const PORTAL_POSITION := Vector3(0, 0, -24)
const BOUNDARY := 52.0
const TravelGate := preload("res://scripts/travel_gate.gd")
var _materials: Dictionary = {}
var _batches: Dictionary = {}
var _rng := RandomNumberGenerator.new()

func _ready() -> void:
	_rng.seed = 472910
	_materials_setup()
	_ground()
	_plaza()
	_houses()
	_market()
	_gardens()
	_enclosure()
	_flush_meshes()
	var gate := TravelGate.new()
	gate.name = "DimensionalRift"
	gate.position = PORTAL_POSITION
	add_child(gate)

func _materials_setup() -> void:
	_materials["stone"] = _textured_material("a7a092", "777d79", 0)
	_materials["paving"] = _textured_material("b7aa90", "8b887c", 0)
	_materials["plaster"] = _textured_material("e2cfaa", "c8b68f", 1)
	_materials["wood"] = _textured_material("63452b", "382c22", 2)
	_materials["door"] = _textured_material("94663d", "62442c", 2)
	_materials["roof"] = _textured_material("b8763c", "825337", 3)
	var grass := ShaderMaterial.new()
	grass.shader = preload("res://shaders/meadow_ground.gdshader")
	grass.set_shader_parameter("grass_albedo", preload("res://assets/environment/meadow_grass_albedo.png"))
	var grass_noise := FastNoiseLite.new()
	grass_noise.seed = 2741
	grass_noise.frequency = 0.025
	var grass_texture := NoiseTexture2D.new()
	grass_texture.width = 256
	grass_texture.height = 256
	grass_texture.seamless = true
	grass_texture.noise = grass_noise
	grass.set_shader_parameter("meadow_noise", grass_texture)
	_materials["grass"] = grass
	_materials["soil"] = _textured_material("80694d", "65533e", 1)
	_materials["leaf"] = _plain(Color("527448"))
	_materials["leaf_light"] = _plain(Color("78924f"))
	_materials["iron"] = _plain(Color("343d3c"))
	_materials["gold"] = _plain(Color("b6a36b"))
	_materials["awning"] = _plain(Color("a04a37"))
	_materials["awning_light"] = _plain(Color("e0c7a0"))
	_materials["blue"] = _plain(Color("3f6979"))
	_materials["window"] = _plain(Color("bdc8b0"))
	_materials["window"].emission_enabled = true
	_materials["window"].emission = Color("967344")
	_materials["window"].emission_energy_multiplier = 0.35
	_materials["water"] = _plain(Color("477d86"))
	_materials["water"].metallic = 0.35
	_materials["water"].roughness = 0.18
	_materials["flower"] = _plain(Color("c7aa61"))

func _plain(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.95
	return material

func _textured_material(light_hex: String, dark_hex: String, kind: int) -> StandardMaterial3D:
	var texture_image := Image.create(128, 128, false, Image.FORMAT_RGB8)
	var light := Color(light_hex)
	var dark := Color(dark_hex)
	for y in range(128):
		for x in range(128):
			var shade := _rng.randf_range(0.2, 0.68)
			if kind == 0:
				var row := y / 32
				var offset := 16 if row % 2 == 0 else 0
				if y % 32 < 2 or (x + offset) % 48 < 2:
					shade = 0.95
			elif kind == 2:
				shade += sin(float(y) * 0.41 + sin(float(x) * 0.09)) * 0.16
				if y % 32 < 2:
					shade = 0.95
			elif kind == 3:
				var row := y / 24
				if y % 24 < 3 or (x + (16 if row % 2 == 0 else 0)) % 32 < 2:
					shade = 0.92
			texture_image.set_pixel(x, y, light.lerp(dark, clampf(shade, 0, 1)))
	texture_image.generate_mipmaps()
	var material := _plain(Color.WHITE)
	material.albedo_texture = ImageTexture.create_from_image(texture_image)
	material.uv1_triplanar = true
	material.uv1_scale = Vector3.ONE * (0.7 if kind != 2 else 0.9)
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	return material

func _ground() -> void:
	_box(Vector3(0, -0.23, 0), Vector3(112, 0.45, 112), "grass")
	_collision(Vector3(0, -0.5, 0), Vector3(112, 1, 112))
	# A continuous lane leads from the arrival square to the rift.
	_box(Vector3(0, 0.007, -6), Vector3(7, 0.025, 65), "paving")
	_box(Vector3(0, 0.01, -2), Vector3(36, 0.03, 12), "paving")
	_box(Vector3(0, 0.01, 15), Vector3(37, 0.03, 5), "soil")
	for side in [-1.0, 1.0]:
		for z in range(-35, 27, 3):
			_box(Vector3(side * 3.7, 0.065, z), Vector3(0.36, 0.15, 2.92), "stone")
		for x in range(-17, 18, 3):
			_box(Vector3(x, 0.065, -2 + side * 6.15), Vector3(2.92, 0.15, 0.3), "stone")
	# Inlaid border makes the small travel court distinct from a road exit.
	_cylinder(Vector3(0, 0.035, -24), 5.1, 0.05, "stone", 40)
	_cylinder(Vector3(0, 0.07, -24), 4.7, 0.06, "paving", 40)

func _plaza() -> void:
	_cylinder(Vector3(0, 0.013, -1), 8.4, 0.025, "stone", 48)
	_cylinder(Vector3(0, 0.024, -1), 7.85, 0.025, "paving", 48)
	# Raised fountain with a continuous physical basin wall.
	_cylinder(Vector3(0, 0.18, -1), 2.3, 0.25, "stone", 24)
	_cylinder(Vector3(0, 0.35, -1), 2.0, 0.35, "stone", 24)
	_cylinder(Vector3(0, 0.54, -1), 1.80, 0.03, "water", 32)
	for i in range(24):
		var angle := TAU * i / 24.0
		var at := Vector3(sin(angle) * 1.98, 0.65, -1 + cos(angle) * 1.98)
		_box(at, Vector3(0.54, 0.32, 0.34), "stone", Basis(Vector3.UP, angle))
	_cylinder(Vector3(0, 0.95, -1), 0.30, 1.5, "stone", 12)
	_cylinder(Vector3(0, 1.58, -1), 0.95, 0.20, "stone", 20)
	_cylinder(Vector3(0, 1.70, -1), 0.84, 0.035, "water", 24)
	_cylinder(Vector3(0, 1.93, -1), 0.18, 0.6, "stone", 10)
	_sphere(Vector3(0, 2.26, -1), Vector3.ONE * 0.26, "gold")
	# Water streams are slender transparent-free meshes, inexpensive in Compatibility.
	for i in range(8):
		var a := TAU * i / 8.0
		_beam(Vector3(sin(a) * 0.75, 1.65, -1 + cos(a) * 0.75), Vector3(sin(a) * 1.20, 0.57, -1 + cos(a) * 1.20), 0.025, "water")
	_collision(Vector3(0, 0.6, -1), Vector3(4.2, 1.2, 4.2))
	for side in [-1.0, 1.0]:
		_bench(Vector3(side * 6.7, 0, -1), side * PI / 2)
		_bench(Vector3(side * 5.5, 0, 5.5), 0)
		_lantern(Vector3(side * 4.8, 0, 10))
		_lantern(Vector3(side * 4.8, 0, -16))
		_banner(Vector3(side * 4.3, 0, -23), side)

func _houses() -> void:
	_house(Vector3(-12.5, 0, 3.0), PI / 2, Vector3(6.0, 3.8, 7.6), false)
	_house(Vector3(12.5, 0, 3.0), -PI / 2, Vector3(6.2, 3.7, 7.2), true)
	_house(Vector3(-13.5, 0, -11.5), PI / 2, Vector3(6.5, 4.0, 7.0), true)
	_house(Vector3(13.5, 0, -11.0), -PI / 2, Vector3(6.0, 3.8, 7.5), false)
	_house(Vector3(-10.5, 0, -27), 0, Vector3(7.4, 4.7, 8.4), false)
	_house(Vector3(11.7, 0, -28), 0, Vector3(6.0, 3.8, 7.0), true)
	_house(Vector3(-21.5, 0, 19), PI / 2, Vector3(6.7, 4.0, 8.3), false)
	_house(Vector3(20.8, 0, 20), -PI / 2, Vector3(7.0, 4.3, 8.0), false)

func _house(at: Vector3, yaw: float, size: Vector3, blue: bool) -> void:
	var basis := Basis(Vector3.UP, yaw)
	var width := size.x
	var height := size.y
	var depth := size.z
	_hbox(at, basis, Vector3(0, 0.22, 0), Vector3(width + 0.3, 0.45, depth + 0.3), "stone")
	_hbox(at, basis, Vector3(0, height * 0.5 + 0.3, 0), Vector3(width, height, depth), "plaster")
	# Dark timber frame on every facade, not a box with a roof texture.
	for x in [-width * 0.5 - 0.035, 0.0, width * 0.5 + 0.035]:
		for z in [-depth * 0.5, depth * 0.5]:
			_hbox(at, basis, Vector3(x, height * 0.5 + 0.3, z), Vector3(0.18, height + 0.12, 0.18), "wood")
	for y in [0.55, height * 0.57, height + 0.30]:
		for z in [-depth * 0.5 - 0.035, depth * 0.5 + 0.035]:
			_hbox(at, basis, Vector3(0, y, z), Vector3(width + 0.16, 0.18, 0.17), "wood")
		for x in [-width * 0.5 - 0.035, width * 0.5 + 0.035]:
			_hbox(at, basis, Vector3(x, y, 0), Vector3(0.17, 0.18, depth), "wood")
	for side in [-1.0, 1.0]:
		_hbeam(at, basis, Vector3(side * width * 0.49, 0.65, depth * 0.5 + 0.07), Vector3(side * 0.90, height * 0.57, depth * 0.5 + 0.07), 0.12, "wood")
	var roof_base := height + 0.4
	var roof_height := width * 0.46
	_roof(at, basis, width + 0.85, depth + 1.0, roof_base, roof_height)
	for z in [-depth * 0.5 - 0.30, depth * 0.5 + 0.30]:
		_hbeam(at, basis, Vector3(-width * 0.55, roof_base, z), Vector3(0, roof_base + roof_height, z), 0.20, "wood")
		_hbeam(at, basis, Vector3(width * 0.55, roof_base, z), Vector3(0, roof_base + roof_height, z), 0.20, "wood")
		_hbeam(at, basis, Vector3(0, roof_base, z), Vector3(0, roof_base + roof_height, z), 0.14, "wood")
	_hbox(at, basis, Vector3(0, roof_base + roof_height + 0.08, 0), Vector3(0.22, 0.18, depth + 1.05), "wood")
	# Chimney and cap.
	_hbox(at, basis, Vector3(-width * 0.25, roof_base + roof_height * 0.8, -depth * 0.22), Vector3(0.85, 2.2, 0.85), "stone")
	_hbox(at, basis, Vector3(-width * 0.25, roof_base + roof_height * 0.8 + 1.14, -depth * 0.22), Vector3(1.02, 0.18, 1.02), "stone")
	# Door, timber surround, doorstep and handle.
	var front := depth * 0.5 + 0.09
	_hbox(at, basis, Vector3(0, 1.40, front), Vector3(1.18, 2.10, 0.14), "door")
	for x in [-0.68, 0.68]:
		_hbox(at, basis, Vector3(x, 1.41, front + 0.06), Vector3(0.15, 2.35, 0.22), "wood")
	_hbox(at, basis, Vector3(0, 2.58, front + 0.06), Vector3(1.52, 0.18, 0.22), "wood")
	_hbox(at, basis, Vector3(0, 0.17, front + 0.35), Vector3(1.65, 0.30, 0.9), "stone")
	_hbox(at, basis, Vector3(0.37, 1.38, front + 0.105), Vector3(0.09, 0.14, 0.06), "iron")
	for x in [-width * 0.32, width * 0.32]:
		_window(at, basis, Vector3(x, 2.08, front + 0.04), blue)
		_hbox(at, basis, Vector3(x, 1.31, front + 0.22), Vector3(1.30, 0.22, 0.40), "door")
		for flower in range(5):
			var local := Vector3(x - 0.45 + flower * 0.22, 1.54, front + 0.22)
			_sphere(at + basis * local, Vector3(0.13, 0.15, 0.13), "leaf_light" if flower % 2 == 0 else "flower")
	# Side windows for readable streets from either approach.
	for side in [-1.0, 1.0]:
		var side_basis := basis * Basis(Vector3.UP, side * PI / 2.0)
		for z in [-depth * 0.23, depth * 0.23]:
			_window(at + basis * Vector3(side * (width * 0.5 + 0.08), 0, z), side_basis, Vector3(0, 2.05, 0), blue)
	var body := StaticBody3D.new()
	body.position = at + Vector3(0, height * 0.5, 0)
	body.rotation.y = yaw
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(width + 0.1, height + 1, depth + 0.1)
	collision.shape = shape
	body.add_child(collision)
	add_child(body)
	# A short connecting walk makes every closed building feel part of the village.
	_hbox(at, basis, Vector3(0, 0.04, depth * 0.5 + 2), Vector3(2.0, 0.04, 3.2), "soil")

func _window(at: Vector3, basis: Basis, local: Vector3, blue: bool) -> void:
	_hbox(at, basis, local, Vector3(0.90, 1.18, 0.09), "window")
	for x in [-0.49, 0.0, 0.49]:
		_hbox(at, basis, local + Vector3(x, 0, 0.07), Vector3(0.085, 1.36, 0.12), "wood")
	for y in [-0.63, 0.0, 0.63]:
		_hbox(at, basis, local + Vector3(0, y, 0.07), Vector3(1.10, 0.08, 0.12), "wood")
	for x in [-0.76, 0.76]:
		_hbox(at, basis, local + Vector3(x, 0, 0.03), Vector3(0.36, 1.25, 0.10), "blue" if blue else "door")

func _roof(at: Vector3, basis: Basis, width: float, depth: float, base: float, rise: float) -> void:
	var roof_vertices := [Vector3(-width * 0.5, base, -depth * 0.5), Vector3(-width * 0.5, base, depth * 0.5), Vector3(0, base + rise, -depth * 0.5), Vector3(0, base + rise, depth * 0.5), Vector3(width * 0.5, base, -depth * 0.5), Vector3(width * 0.5, base, depth * 0.5)]
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for vertex in [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]:
		surface.add_vertex(roof_vertices[vertex])
	surface.generate_normals()
	var roof_material: StandardMaterial3D = _materials["roof"]
	roof_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	_append(surface.commit(), Transform3D(basis, at), "roof")
	var triangle := SurfaceTool.new()
	triangle.begin(Mesh.PRIMITIVE_TRIANGLES)
	for z in [-depth * 0.5 + 0.18, depth * 0.5 - 0.18]:
		for point in [Vector3(-width * 0.5, base, z), Vector3(width * 0.5, base, z), Vector3(0, base + rise, z)]:
			triangle.add_vertex(point)
	triangle.generate_normals()
	_materials["plaster"].cull_mode = BaseMaterial3D.CULL_DISABLED
	_append(triangle.commit(), Transform3D(basis, at), "plaster")

func _market() -> void:
	for side in [-1.0, 1.0]:
		var at := Vector3(side * 8, 0, 17)
		for x in [-1.8, 1.8]:
			for z in [-1.1, 1.1]:
				_box(at + Vector3(x, 1.38, z), Vector3(0.14, 2.76, 0.14), "wood")
		_box(at + Vector3(0, 0.88, 0.55), Vector3(3.7, 0.18, 1.5), "door")
		_box(at + Vector3(0, 0.45, 1.15), Vector3(3.7, 0.8, 0.1), "wood")
		for stripe in range(8):
			_box(at + Vector3(-1.77 + stripe * 0.505, 2.7, 0), Vector3(0.51, 0.075, 3.0), "awning" if stripe % 2 == 0 else "awning_light", Basis(Vector3.RIGHT, -0.12))
			_box(at + Vector3(-1.77 + stripe * 0.505, 2.35, 1.48), Vector3(0.51, 0.48, 0.05), "awning" if stripe % 2 == 0 else "awning_light")
		for i in range(15):
			_sphere(at + Vector3(_rng.randf_range(-1.5, 1.5), 1.10, _rng.randf_range(0.1, 0.9)), Vector3.ONE * 0.13, "flower" if i % 3 == 0 else "leaf_light")
		_crate(at + Vector3(side * 2.5, 0.4, 0.3), 0.8)
		_barrel(at + Vector3(-side * 2.5, 0, -0.4))
		_collision(at + Vector3(0, 0.6, 0.5), Vector3(3.8, 1.2, 1.5))

func _gardens() -> void:
	for side in [-1.0, 1.0]:
		# Kitchen gardens and orchard occupy the space behind the houses.
		_box(Vector3(side * 29, 0.025, -13), Vector3(9, 0.05, 18), "soil")
		for z in range(-20, -4, 2):
			for x in range(4):
				_sphere(Vector3(side * 29 - 3 + x * 2, 0.3, z), Vector3(0.48, 0.32, 0.48), "leaf_light")
		_fence(Vector3(side * 29 - 5, 0, -23), Vector3(side * 29 + 5, 0, -23))
		_fence(Vector3(side * 29 - 5, 0, -3), Vector3(side * 29 + 5, 0, -3))
		_fence(Vector3(side * 29 + side * 5, 0, -23), Vector3(side * 29 + side * 5, 0, -3))
		for z in [-37.0, 0.0, 30.0, 40.0]:
			_tree(Vector3(side * _rng.randf_range(27, 40), 0, z), _rng.randf_range(0.85, 1.25))
		for i in range(6):
			_tree(Vector3(side * _rng.randf_range(9, 40), 0, _rng.randf_range(34, 45)), _rng.randf_range(0.7, 1.1))
		_crate(Vector3(side * 18.4, 0.4, 10.0), 0.8)
		_barrel(Vector3(side * 18.4, 0, 11.0))
		for i in range(9):
			var a := TAU * i / 9.0
			_sphere(Vector3(side * 20 + sin(a) * 2.7, 0.28, -36 + cos(a) * 2.0), Vector3(0.8, 0.42, 0.7), "leaf")
	# Low hills outside are a backdrop; the wall has no exit or opening.
	for i in range(15):
		var a := TAU * i / 15.0
		_sphere(Vector3(sin(a) * 91, -5.5, cos(a) * 91), Vector3(22, 16 + i % 4 * 3, 22), "leaf")

func _enclosure() -> void:
	var edge := BOUNDARY
	for side in [-1.0, 1.0]:
		_box(Vector3(side * edge, 2.3, 0), Vector3(1.4, 4.6, edge * 2 + 1.4), "stone")
		_box(Vector3(0, 2.3, side * edge), Vector3(edge * 2 + 1.4, 4.6, 1.4), "stone")
		_collision(Vector3(side * edge, 3.2, 0), Vector3(1.6, 8.0, edge * 2 + 2))
		_collision(Vector3(0, 3.2, side * edge), Vector3(edge * 2 + 2, 8.0, 1.6))
		for step in range(-50, 51, 4):
			_box(Vector3(side * edge, 5.0, step), Vector3(1.65, 0.85, 1.65), "stone")
			_box(Vector3(step, 5.0, side * edge), Vector3(1.65, 0.85, 1.65), "stone")
	for x in [-edge, edge]:
		for z in [-edge, edge]:
			_cylinder(Vector3(x, 3.4, z), 2.75, 6.8, "stone", 14)
			_cylinder(Vector3(x, 6.9, z), 3.0, 0.45, "stone", 14)
			for i in range(10):
				var a := TAU * i / 10.0
				_box(Vector3(x + cos(a) * 2.6, 7.45, z + sin(a) * 2.6), Vector3(0.8, 0.8, 0.8), "stone")

func _tree(at: Vector3, scale_factor: float) -> void:
	_cylinder(at + Vector3.UP * 1.8 * scale_factor, 0.24 * scale_factor, 3.6 * scale_factor, "wood", 7)
	for i in range(5):
		var a := TAU * i / 5.0
		var crown := at + Vector3(sin(a) * 1.4, 4.0 + (i % 2) * 1.3, cos(a) * 1.4) * scale_factor
		_sphere(crown, Vector3(1.9, 1.8, 1.9) * scale_factor, "leaf_light" if i % 2 == 0 else "leaf")
	_collision(at + Vector3.UP * 1.4 * scale_factor, Vector3(0.6, 2.8, 0.6) * scale_factor)

func _bench(at: Vector3, yaw: float) -> void:
	var basis := Basis(Vector3.UP, yaw)
	_hbox(at, basis, Vector3(0, 0.50, 0), Vector3(2.2, 0.15, 0.65), "door")
	_hbox(at, basis, Vector3(0, 0.95, -0.30), Vector3(2.2, 0.65, 0.12), "wood")
	for x in [-0.8, 0.8]:
		_hbox(at, basis, Vector3(x, 0.24, 0), Vector3(0.15, 0.5, 0.55), "wood")
	_collision(at + Vector3.UP * 0.55, Vector3(1.0, 1.1, 2.2) if absf(yaw) > 0.1 else Vector3(2.2, 1.1, 0.8))

func _lantern(at: Vector3) -> void:
	_cylinder(at + Vector3.UP * 1.4, 0.09, 2.8, "iron", 8)
	_box(at + Vector3.UP * 2.9, Vector3(0.42, 0.55, 0.42), "window")
	_box(at + Vector3.UP * 3.22, Vector3(0.58, 0.12, 0.58), "iron")
	_box(at + Vector3.UP * 2.60, Vector3(0.48, 0.10, 0.48), "iron")
	for x in [-0.19, 0.19]:
		for z in [-0.19, 0.19]:
			_box(at + Vector3(x, 2.9, z), Vector3(0.035, 0.6, 0.035), "iron")

func _banner(at: Vector3, side: float) -> void:
	_cylinder(at + Vector3.UP * 2.05, 0.075, 4.1, "wood", 8)
	_sphere(at + Vector3.UP * 4.20, Vector3.ONE * 0.15, "gold")
	_box(at + Vector3(side * 0.6, 3.1, 0), Vector3(1.1, 1.7, 0.035), "blue")
	_box(at + Vector3(side * 0.6, 3.1, 0.025), Vector3(0.08, 1.4, 0.025), "gold")
	_box(at + Vector3(side * 0.6, 3.1, 0.025), Vector3(0.72, 0.08, 0.025), "gold")

func _fence(from: Vector3, to: Vector3) -> void:
	var length := from.distance_to(to)
	var count := ceili(length / 1.4)
	for i in range(count + 1):
		var at := from.lerp(to, float(i) / count)
		_box(at + Vector3.UP * 0.65, Vector3(0.12, 1.3, 0.12), "wood")
	for y in [0.45, 0.95]:
		_beam(from + Vector3.UP * y, to + Vector3.UP * y, 0.10, "door")

func _crate(at: Vector3, size: float) -> void:
	_box(at, Vector3.ONE * size, "door")
	for side in [-1.0, 1.0]:
		for y in [-0.36, 0.36]:
			_box(at + Vector3(0, y * size, side * size * 0.5), Vector3(size + 0.02, size * 0.09, 0.04), "wood")

func _barrel(at: Vector3) -> void:
	_cylinder(at + Vector3.UP * 0.55, 0.40, 1.1, "door", 12)
	for y in [0.15, 0.89]:
		_cylinder(at + Vector3.UP * y, 0.415, 0.08, "iron", 12)
	_cylinder(at + Vector3.UP * 1.115, 0.34, 0.03, "wood", 12)

func _hbox(at: Vector3, basis: Basis, local: Vector3, size: Vector3, material: String) -> void:
	_box(at + basis * local, size, material, basis)

func _hbeam(at: Vector3, basis: Basis, from: Vector3, to: Vector3, thickness: float, material: String) -> void:
	_beam(at + basis * from, at + basis * to, thickness, material)

func _box(at: Vector3, size: Vector3, material: String, basis := Basis.IDENTITY) -> void:
	var mesh := BoxMesh.new()
	mesh.size = size
	_append(mesh, Transform3D(basis, at), material)

func _cylinder(at: Vector3, radius: float, height: float, material: String, segments := 12) -> void:
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = segments
	mesh.rings = 1
	_append(mesh, Transform3D(Basis.IDENTITY, at), material)

func _sphere(at: Vector3, size: Vector3, material: String) -> void:
	var mesh := SphereMesh.new()
	mesh.radius = 1
	mesh.height = 2
	mesh.radial_segments = 10
	mesh.rings = 5
	_append(mesh, Transform3D(Basis.IDENTITY.scaled(size), at), material)

func _beam(from: Vector3, to: Vector3, thickness: float, material: String) -> void:
	var direction := (to - from).normalized()
	var up := Vector3.UP if absf(direction.dot(Vector3.UP)) < 0.95 else Vector3.RIGHT
	var basis := Basis.looking_at(direction, up)
	_box((from + to) * 0.5, Vector3(thickness, thickness, from.distance_to(to)), material, basis)

func _collision(at: Vector3, size: Vector3) -> void:
	var body := StaticBody3D.new()
	body.position = at
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)
	add_child(body)

func _append(mesh: Mesh, transform: Transform3D, material: String) -> void:
	if not _batches.has(material):
		var batch := SurfaceTool.new()
		batch.begin(Mesh.PRIMITIVE_TRIANGLES)
		_batches[material] = batch
	var surface: SurfaceTool = _batches[material]
	surface.append_from(mesh, 0, transform)

func _flush_meshes() -> void:
	# Consolidate every static detail by material, avoiding hundreds of draw calls.
	for key in _batches:
		var visual := MeshInstance3D.new()
		visual.name = "Village_" + key
		visual.mesh = _batches[key].commit()
		visual.material_override = _materials[key]
		add_child(visual)
	_batches.clear()
