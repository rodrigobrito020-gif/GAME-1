extends Node3D
## Pequena aldeia rural fechada: quatro casas e trilhas de terra numa clareira.
const SPAWN := Vector3(0, 0.05, 10)
const PORTAL_POSITION := Vector3(0, 0, -15)
const CLASS_TRAINER_POSITION := Vector3(-3.0, 0.035, 7.7)
const MERCHANT_POSITION := Vector3(5.2, 0.035, 3.0)
const ARMOR_MERCHANT_POSITION := Vector3(-4.3, 0.035, -6.5)
const WEAPON_MERCHANT_POSITION := Vector3(4.4, 0.035, -7.5)
const STORAGE_POSITION := Vector3(-4.5, 0.035, 0.6)
const BOUNDARY := 27.0
const TravelGate := preload("res://scripts/travel_gate.gd")
const ClassTrainer := preload("res://scripts/class_trainer.gd")
var _materials: Dictionary = {}
var _batches: Dictionary = {}
var _rng := RandomNumberGenerator.new()

func _ready() -> void:
	_rng.seed = 472910
	_materials_setup()
	_ground()
	_houses()
	_well(Vector3(-4.9, 0, -2.5))
	_rural_props()
	_gardens()
	_enclosure()
	_flush_meshes()
	var gate := TravelGate.new()
	gate.name = "DimensionalRift"
	gate.position = PORTAL_POSITION
	gate.scale = Vector3.ONE * 0.78
	add_child(gate)
	var trainer := ClassTrainer.new()
	trainer.name = "HumanClassTrainer"
	trainer.position = CLASS_TRAINER_POSITION
	# The native human model faces +Z; turn him toward the arrival point.
	trainer.rotation.y = atan2(SPAWN.x - CLASS_TRAINER_POSITION.x, SPAWN.z - CLASS_TRAINER_POSITION.z)
	add_child(trainer)
	var merchant := ClassTrainer.new()
	merchant.name = "VillageMerchant"
	merchant.display_title = "Bento · Mercador"
	merchant.interaction_text = "E · Comprar / Vender"
	merchant.npc_group = "village_merchant"
	merchant.position = MERCHANT_POSITION
	merchant.rotation.y = -0.65
	add_child(merchant)
	for entry: Array in [["ArmorJewelryMerchant", "Dara · Armaduras e Joias", ARMOR_MERCHANT_POSITION, "armor_merchant"], ["WeaponMerchant", "Orin · Armas e Escudos", WEAPON_MERCHANT_POSITION, "weapon_merchant"]]:
		var specialist := ClassTrainer.new()
		specialist.name = entry[0]
		specialist.display_title = entry[1]
		specialist.position = entry[2]
		specialist.interaction_text = "E · Catálogo / Comprar"
		specialist.npc_group = entry[3]
		specialist.rotation.y = atan2(SPAWN.x - specialist.position.x, SPAWN.z - specialist.position.z)
		add_child(specialist)
	var storage := StaticBody3D.new()
	storage.name = "PersonalStorage"
	storage.position = STORAGE_POSITION
	add_child(storage)
	storage.add_to_group("personal_storage")
	var chest := preload("res://scripts/reward_chest.gd").new()
	storage.add_child(chest)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(1.1, 0.8, 0.8)
	collision.shape = shape
	collision.position.y = 0.4
	storage.add_child(collision)
	var label := Label3D.new()
	label.text = "Baú pessoal\nE · Guardar / Retirar"
	label.position.y = 1.35
	label.font_size = 25
	label.pixel_size = 0.006
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.outline_size = 5
	storage.add_child(label)

func _materials_setup() -> void:
	_materials["stone"] = _textured_material("888d7d", "535c54", 0)
	_materials["plaster"] = _textured_material("b5ae94", "949580", 1)
	_materials["wood"] = _textured_material("62513a", "3e382b", 2)
	_materials["door"] = _textured_material("82704f", "574b36", 2)
	_materials["roof"] = _textured_material("96834f", "64583b", 3)
	_materials["roof"].cull_mode = BaseMaterial3D.CULL_DISABLED
	_materials["plaster"].cull_mode = BaseMaterial3D.CULL_DISABLED
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
	_materials["soil"] = _textured_material("968568", "756b55", 1)
	_materials["leaf"] = _plain(Color("34583b"))
	_materials["leaf_light"] = _plain(Color("537347"))
	_materials["iron"] = _plain(Color("3b413b"))
	_materials["window"] = _plain(Color("46544a"))
	_materials["water"] = _plain(Color("31575e"))
	_materials["water"].roughness = 0.2
	_materials["flower"] = _plain(Color("b4a36d"))
	_materials["potion"] = _plain(Color("a32e3a"))

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
			var shade := _rng.randf_range(0.22, 0.72)
			if kind == 0:
				var row := y / 32
				if y % 32 < 2 or (x + (16 if row % 2 == 0 else 0)) % 48 < 2:
					shade = 0.92
			elif kind == 2:
				shade += sin(float(y) * 0.41 + sin(float(x) * 0.09)) * 0.16
				if y % 32 < 2:
					shade = 0.94
			elif kind == 3:
				# Long irregular straw fibres instead of bright roof tiles.
				shade += sin(float(x) * 1.37 + sin(float(y) * 0.13) * 0.4) * 0.23
				if x % 11 == 0 or y % 51 < 2:
					shade = 0.86
			texture_image.set_pixel(x, y, light.lerp(dark, clampf(shade, 0, 1)))
	texture_image.generate_mipmaps()
	var material := _plain(Color.WHITE)
	material.albedo_texture = ImageTexture.create_from_image(texture_image)
	material.uv1_triplanar = true
	material.uv1_scale = Vector3.ONE * (0.75 if kind != 3 else 1.25)
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	return material

func _ground() -> void:
	_box(Vector3(0, -0.23, 0), Vector3(72, 0.45, 72), "grass")
	_collision(Vector3(0, -0.5, 0), Vector3(72, 1, 72))
	_patch(Vector3(0.6, 0.009, 1.3), Vector2(4.1, 4.8), "soil", 19)
	_trail([Vector3(0, 0, 13), Vector3(-1.0, 0, 8), Vector3(1.2, 0, 3), Vector3(0.8, 0, -3), Vector3(-0.8, 0, -9), Vector3(0, 0, -15.8)], 1.85)
	_trail([Vector3(-0.7, 0, 5), Vector3(-3.2, 0, 6.2), Vector3(-6.1, 0, 6.8)], 1.25)
	_trail([Vector3(0.6, 0, -3), Vector3(-3.8, 0, -6), Vector3(-7.0, 0, -6.1)], 1.2)
	_trail([Vector3(0.6, 0, -3), Vector3(3.6, 0, -3.0), Vector3(5.9, 0, -2.3)], 1.2)
	_trail([Vector3(-0.7, 0, 8), Vector3(3.3, 0, 9.6), Vector3(7.0, 0, 9.9)], 1.2)
	_patch(PORTAL_POSITION + Vector3(0, 0.018, 0.3), Vector2(2.35, 2.3), "soil", 15)

func _patch(at: Vector3, radii: Vector2, material: String, corners: int) -> void:
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	var rim: Array[Vector3] = []
	for i in range(corners):
		var angle := TAU * i / corners
		var uneven := _rng.randf_range(0.87, 1.10)
		rim.append(at + Vector3(cos(angle) * radii.x, 0, sin(angle) * radii.y) * uneven)
	for i in range(corners):
		for vertex in [at, rim[(i + 1) % corners], rim[i]]:
			surface.set_normal(Vector3.UP)
			surface.add_vertex(vertex)
	_append(surface.commit(), Transform3D.IDENTITY, material)

func _trail(points: Array, width: float) -> void:
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	var previous_left := Vector3.ZERO
	var previous_right := Vector3.ZERO
	for part in range(points.size() - 1):
		var a: Vector3 = points[maxi(0, part - 1)]
		var b: Vector3 = points[part]
		var c: Vector3 = points[part + 1]
		var d: Vector3 = points[mini(points.size() - 1, part + 2)]
		for step in range(13):
			var t := float(step) / 12.0
			var point := (b * 2 + (c - a) * t + (a * 2 - b * 5 + c * 4 - d) * t * t + (-a + b * 3 - c * 3 + d) * t * t * t) * 0.5
			var tangent := ((c - a) + (a * 2 - b * 5 + c * 4 - d) * 2 * t + (-a + b * 3 - c * 3 + d) * 3 * t * t).normalized()
			var side := Vector3(tangent.z, 0, -tangent.x) * width * 0.5 * (0.96 + sin((part * 12 + step) * 1.83) * 0.06)
			point.y = 0.024
			var left := point - side
			var right := point + side
			if part > 0 or step > 0:
				for vertex in [previous_left, left, previous_right, previous_right, left, right]:
					surface.set_normal(Vector3.UP)
					surface.add_vertex(vertex)
			previous_left = left
			previous_right = right
	_materials["soil"].cull_mode = BaseMaterial3D.CULL_DISABLED
	_append(surface.commit(), Transform3D.IDENTITY, "soil")

func _houses() -> void:
	_house(Vector3(-8.7, 0, 3.4), 0.30, Vector3(5.4, 2.55, 5.9), false)
	_house(Vector3(-10.3, 0, -7.5), 1.12, Vector3(5.2, 2.7, 5.4), true)
	_house(Vector3(9.0, 0, -4.5), -0.93, Vector3(5.6, 2.6, 5.8), false)
	_house(Vector3(10.8, 0, 9.5), -1.35, Vector3(5.0, 2.5, 5.6), true)

func _house(at: Vector3, yaw: float, size: Vector3, porch: bool) -> void:
	var basis := Basis(Vector3.UP, yaw)
	var width := size.x
	var height := size.y
	var depth := size.z
	_hbox(at, basis, Vector3(0, 0.11, 0), Vector3(width + 0.18, 0.24, depth + 0.18), "stone")
	_hbox(at, basis, Vector3(0, height * 0.5 + 0.18, 0), Vector3(width, height, depth), "plaster")
	for x in [-width * 0.5, width * 0.5]:
		for z in [-depth * 0.5, depth * 0.5]:
			_hbox(at, basis, Vector3(x, height * 0.5 + 0.18, z), Vector3(0.17, height + 0.1, 0.17), "wood")
	for y in [0.38, height + 0.18]:
		for z in [-depth * 0.5 - 0.035, depth * 0.5 + 0.035]:
			_hbox(at, basis, Vector3(0, y, z), Vector3(width + 0.1, 0.16, 0.14), "wood")
		for x in [-width * 0.5 - 0.035, width * 0.5 + 0.035]:
			_hbox(at, basis, Vector3(x, y, 0), Vector3(0.14, 0.16, depth), "wood")
	var roof_base := height + 0.25
	var roof_height := 1.45 + (0.12 if porch else 0.0)
	_roof(at, basis, width + 0.9, depth + 1.05, roof_base, roof_height)
	for z in [-depth * 0.5 - 0.35, depth * 0.5 + 0.35]:
		_hbeam(at, basis, Vector3(-width * 0.58, roof_base, z), Vector3(0, roof_base + roof_height, z), 0.16, "wood")
		_hbeam(at, basis, Vector3(width * 0.58, roof_base, z), Vector3(0, roof_base + roof_height, z), 0.16, "wood")
	_hbox(at, basis, Vector3(0, roof_base + roof_height, 0), Vector3(0.16, 0.15, depth + 1.12), "wood")
	# Irregular straw edge, thin battens and a modest stone chimney.
	for side in [-1.0, 1.0]:
		for z in range(9):
			_hbeam(at, basis, Vector3(side * width * 0.58, roof_base - _rng.randf_range(0.04, 0.16), -depth * 0.48 + z * depth / 8), Vector3(side * width * 0.46, roof_base + 0.34, -depth * 0.48 + z * depth / 8), 0.075, "roof")
	_hbox(at, basis, Vector3(-width * 0.27, roof_base + 0.95, -depth * 0.16), Vector3(0.56, 1.85, 0.60), "stone")
	_hbox(at, basis, Vector3(-width * 0.27, roof_base + 1.90, -depth * 0.16), Vector3(0.68, 0.12, 0.73), "stone")
	var front := depth * 0.5 + 0.07
	_hbox(at, basis, Vector3(0.25, 1.08, front), Vector3(0.90, 1.87, 0.13), "door")
	for x in [-0.27, 0.77]:
		_hbox(at, basis, Vector3(x, 1.12, front + 0.05), Vector3(0.12, 2.07, 0.18), "wood")
	_hbox(at, basis, Vector3(0.25, 2.16, front + 0.05), Vector3(1.18, 0.14, 0.18), "wood")
	_hbox(at, basis, Vector3(0.25, 0.10, front + 0.25), Vector3(1.28, 0.18, 0.70), "stone")
	_hbox(at, basis, Vector3(0.53, 1.04, front + 0.10), Vector3(0.065, 0.12, 0.05), "iron")
	_window(at, basis, Vector3(-width * 0.30, 1.55, front + 0.05))
	_window(at, basis, Vector3(width * 0.33, 1.58, front + 0.05))
	var side_basis := basis * Basis(Vector3.UP, PI / 2)
	_window(at + basis * Vector3(width * 0.5 + 0.07, 0, -0.65), side_basis, Vector3(0, 1.55, 0))
	if porch:
		_hbox(at, basis, Vector3(0.25, 2.17, front + 0.64), Vector3(2.0, 0.12, 1.5), "roof")
		for x in [-0.63, 1.10]:
			_hbox(at, basis, Vector3(x, 1.05, front + 1.26), Vector3(0.1, 2.1, 0.1), "wood")
	else:
		_hbox(at, basis, Vector3(-width * 0.3, 1.04, front + 0.18), Vector3(1.03, 0.17, 0.32), "door")
		for i in range(5):
			_sphere(at + basis * Vector3(-width * 0.3 - 0.36 + i * 0.18, 1.19, front + 0.18), Vector3(0.13, 0.14, 0.13), "leaf_light" if i % 2 == 0 else "flower")
	var body := StaticBody3D.new()
	body.position = at + Vector3(0, height * 0.5, 0)
	body.rotation.y = yaw
	body.name = "RuralCottage"
	body.add_to_group("village_cottage")
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(width + 0.1, height + 1, depth + 0.1)
	collision.shape = shape
	body.add_child(collision)
	add_child(body)
	var pile := at + basis * Vector3(width * 0.5 + 0.65, 0, -1.4)
	for row in range(3):
		for log_index in range(3 - row):
			_log(pile + basis * Vector3(0, 0.16 + row * 0.25, (log_index + row * 0.5) * 0.29), basis, 1.15)

func _window(at: Vector3, basis: Basis, local: Vector3) -> void:
	_hbox(at, basis, local, Vector3(0.64, 0.73, 0.08), "window")
	for x in [-0.36, 0, 0.36]:
		_hbox(at, basis, local + Vector3(x, 0, 0.045), Vector3(0.065, 0.86, 0.10), "wood")
	for y in [-0.40, 0.40]:
		_hbox(at, basis, local + Vector3(0, y, 0.045), Vector3(0.80, 0.07, 0.10), "wood")
	_hbox(at, basis, local + Vector3(-0.52, 0, 0.03), Vector3(0.24, 0.78, 0.06), "door")

func _roof(at: Vector3, basis: Basis, width: float, depth: float, base: float, rise: float) -> void:
	var vertices := [Vector3(-width * 0.5, base, -depth * 0.5), Vector3(-width * 0.5, base, depth * 0.5), Vector3(0, base + rise, -depth * 0.5), Vector3(0, base + rise, depth * 0.5), Vector3(width * 0.5, base, -depth * 0.5), Vector3(width * 0.5, base, depth * 0.5)]
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for vertex in [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]:
		surface.add_vertex(vertices[vertex])
	surface.generate_normals(true)
	_append(surface.commit(), Transform3D(basis, at), "roof")
	var triangle := SurfaceTool.new()
	triangle.begin(Mesh.PRIMITIVE_TRIANGLES)
	for z in [-depth * 0.5 + 0.18, depth * 0.5 - 0.18]:
		for point in [Vector3(-width * 0.5, base, z), Vector3(width * 0.5, base, z), Vector3(0, base + rise, z)]:
			triangle.add_vertex(point)
	triangle.generate_normals()
	_append(triangle.commit(), Transform3D(basis, at), "plaster")

func _well(at: Vector3) -> void:
	_patch(at + Vector3.UP * 0.014, Vector2(1.6, 1.5), "soil", 13)
	_cylinder(at + Vector3.UP * 0.22, 0.92, 0.43, "stone", 16)
	_cylinder(at + Vector3.UP * 0.45, 0.71, 0.02, "water", 16)
	for i in range(14):
		var a := TAU * i / 14.0
		_box(at + Vector3(sin(a) * 0.81, 0.67, cos(a) * 0.81), Vector3(0.36, 0.45, 0.24), "stone", Basis(Vector3.UP, a))
	for side in [-1.0, 1.0]:
		_box(at + Vector3(side * 1.02, 1.22, 0), Vector3(0.12, 2.44, 0.14), "wood")
	_beam(at + Vector3(-1.10, 1.74, 0), at + Vector3(1.10, 1.74, 0), 0.13, "wood")
	_roof(at, Basis.IDENTITY, 2.5, 1.6, 2.3, 0.62)
	_beam(at + Vector3(0, 1.74, 0), at + Vector3(0, 0.67, 0), 0.025, "door")
	_collision(at + Vector3.UP * 0.7, Vector3(2.1, 1.4, 2.0))
	_barrel(at + Vector3(1.55, 0, -0.4))

func _rural_props() -> void:
	_bench(Vector3(-3.3, 0, 3.2), 0.40)
	_crate(Vector3(6.0, 0.33, 5.8), 0.65)
	_crate(Vector3(6.1, 0.30, 6.5), 0.58)
	_barrel(Vector3(-6.5, 0, 9.5))
	# Bento's small supply table, within the same rural village.
	var at := Vector3(6.1, 0, 4.2)
	_box(at + Vector3.UP * 0.82, Vector3(1.5, 0.12, 0.75), "door")
	for x in [-0.58, 0.58]:
		for z in [-0.24, 0.24]:
			_box(at + Vector3(x, 0.4, z), Vector3(0.10, 0.8, 0.10), "wood")
	for i in range(4):
		var bottle := at + Vector3(-0.45 + i * 0.28, 0.98, 0.02)
		_cylinder(bottle, 0.065, 0.20, "potion", 10)
		_cylinder(bottle + Vector3.UP * 0.13, 0.027, 0.08, "door", 8)
	for at_rock in [Vector3(3.0, 0, 13.5), Vector3(-3.2, 0, -10.7), Vector3(4.8, 0, -13.0), Vector3(15, 0, 1.5)]:
		for i in range(4):
			_sphere(at_rock + Vector3(_rng.randf_range(-0.8, 0.8), 0.14, _rng.randf_range(-0.6, 0.6)), Vector3(_rng.randf_range(0.15, 0.4), _rng.randf_range(0.15, 0.35), _rng.randf_range(0.15, 0.35)), "stone")

func _gardens() -> void:
	_box(Vector3(-16, 0.025, -12.5), Vector3(5.0, 0.04, 3.7), "soil")
	for z in range(3):
		for x in range(5):
			_sphere(Vector3(-17.8 + x * 0.85, 0.20, -13.7 + z * 1.05), Vector3(0.27, 0.21, 0.27), "leaf_light")
	_fence(Vector3(-18.8, 0, -14.8), Vector3(-13.2, 0, -14.8))
	_fence(Vector3(-18.8, 0, -14.8), Vector3(-18.8, 0, -10.2))
	var trees := [Vector3(-16,0,9), Vector3(17,0,1), Vector3(-6,0,16.5), Vector3(17,0,16), Vector3(-19,0,-4), Vector3(-13,0,-19), Vector3(9,0,-19), Vector3(20,0,-14), Vector3(0,0,21), Vector3(-20,0,18), Vector3(19,0,22), Vector3(-5.5,0,-12.7)]
	for i in range(trees.size()):
		_tree(trees[i], 0.86 + (i % 4) * 0.10)
	for i in range(25):
		var a := TAU * i / 25.0
		var radius := _rng.randf_range(31, 41)
		_tree(Vector3(sin(a) * radius, 0, cos(a) * radius), _rng.randf_range(0.95, 1.4))
	for i in range(23):
		var a := _rng.randf_range(0, TAU)
		var radius := _rng.randf_range(17, 24)
		var at := Vector3(cos(a) * radius, 0.3, sin(a) * radius)
		_sphere(at, Vector3(1.2, 0.6, 0.95), "leaf" if i % 2 == 0 else "leaf_light")

func _enclosure() -> void:
	# Close-set pointed logs form an unbroken rural palisade, with no road exit.
	var corners := [Vector3(-27,0,-17), Vector3(-19,0,-27), Vector3(16,0,-27), Vector3(27,0,-15), Vector3(27,0,18), Vector3(16,0,27), Vector3(-18,0,27), Vector3(-27,0,15)]
	for i in range(corners.size()):
		var from: Vector3 = corners[i]
		var to: Vector3 = corners[(i + 1) % corners.size()]
		var distance := from.distance_to(to)
		var count := ceili(distance / 0.25)
		for log_index in range(count + 1):
			var at := from.lerp(to, float(log_index) / count)
			var height := _rng.randf_range(2.60, 2.93)
			_cylinder(at + Vector3.UP * height * 0.5, 0.147, height, "wood", 6)
			var tip := CylinderMesh.new()
			tip.top_radius = 0.0
			tip.bottom_radius = 0.147
			tip.height = 0.28
			tip.radial_segments = 6
			tip.rings = 1
			_append(tip, Transform3D(Basis.IDENTITY, at + Vector3.UP * (height + 0.14)), "door")
		var direction := (to - from).normalized()
		var basis := Basis.looking_at(direction, Vector3.UP)
		var body := StaticBody3D.new()
		body.name = "ClosedPalisade"
		body.add_to_group("village_boundary")
		body.position = (from + to) * 0.5 + Vector3.UP * 1.9
		body.basis = basis
		var collision := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = Vector3(0.42, 4.0, distance + 0.4)
		collision.shape = shape
		body.add_child(collision)
		add_child(body)
		var inside := Vector3(-direction.z, 0, direction.x) * 0.15
		for y in [0.68, 1.94]:
			_beam(from + inside + Vector3.UP * y, to + inside + Vector3.UP * y, 0.11, "wood")

func _tree(at: Vector3, scale_factor: float) -> void:
	_cylinder(at + Vector3.UP * 1.7 * scale_factor, 0.22 * scale_factor, 3.4 * scale_factor, "wood", 8)
	for i in range(5):
		var a := TAU * i / 5.0
		var crown := at + Vector3(sin(a) * 1.15, 3.8 + (i % 2) * 0.9, cos(a) * 1.15) * scale_factor
		_sphere(crown, Vector3(1.75, 1.65, 1.6) * scale_factor, "leaf_light" if i % 3 == 0 else "leaf")
	_collision(at + Vector3.UP * 1.4 * scale_factor, Vector3(0.56, 2.8, 0.56) * scale_factor)

func _bench(at: Vector3, yaw: float) -> void:
	var basis := Basis(Vector3.UP, yaw)
	_hbox(at, basis, Vector3(0, 0.45, 0), Vector3(1.8, 0.12, 0.56), "door")
	for x in [-0.65, 0.65]:
		_hbox(at, basis, Vector3(x, 0.21, 0), Vector3(0.17, 0.42, 0.48), "wood")
	_collision(at + Vector3.UP * 0.4, Vector3(1.9, 0.8, 0.75))

func _fence(from: Vector3, to: Vector3) -> void:
	var distance := from.distance_to(to)
	var count := ceili(distance / 1.25)
	for i in range(count + 1):
		var at := from.lerp(to, float(i) / count)
		_box(at + Vector3.UP * 0.44, Vector3(0.09, 0.88, 0.09), "wood")
	for y in [0.28, 0.64]:
		_beam(from + Vector3.UP * y, to + Vector3.UP * y, 0.07, "door")

func _crate(at: Vector3, size: float) -> void:
	_box(at, Vector3.ONE * size, "door")
	for side in [-1.0, 1.0]:
		for y in [-0.36, 0.36]:
			_box(at + Vector3(0, y * size, side * size * 0.5), Vector3(size + 0.02, size * 0.09, 0.04), "wood")

func _barrel(at: Vector3) -> void:
	_cylinder(at + Vector3.UP * 0.45, 0.33, 0.9, "door", 12)
	for y in [0.12, 0.74]:
		_cylinder(at + Vector3.UP * y, 0.344, 0.07, "iron", 12)
	_cylinder(at + Vector3.UP * 0.92, 0.28, 0.03, "wood", 12)

func _log(at: Vector3, basis: Basis, length: float) -> void:
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.13
	mesh.bottom_radius = 0.14
	mesh.height = length
	mesh.radial_segments = 7
	mesh.rings = 1
	_append(mesh, Transform3D(basis * Basis(Vector3.FORWARD, PI/2), at), "wood")

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
	# Native primitives are indexed, while roofs/trails are triangle lists.
	# Emit one consistent, non-indexed format so neither kind disappears.
	var arrays := mesh.surface_get_arrays(0)
	var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	var normals: PackedVector3Array = arrays[Mesh.ARRAY_NORMAL]
	var uvs: PackedVector2Array = arrays[Mesh.ARRAY_TEX_UV] if arrays[Mesh.ARRAY_TEX_UV] != null else PackedVector2Array()
	var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX] if arrays[Mesh.ARRAY_INDEX] != null else PackedInt32Array()
	var normal_basis := transform.basis.inverse().transposed()
	for i in range(indices.size() if not indices.is_empty() else vertices.size()):
		var index := indices[i] if not indices.is_empty() else i
		surface.set_normal((normal_basis * normals[index]).normalized())
		surface.set_uv(uvs[index] if not uvs.is_empty() else Vector2.ZERO)
		surface.add_vertex(transform * vertices[index])

func _flush_meshes() -> void:
	# Consolidate every static detail by material, avoiding hundreds of draw calls.
	for key in _batches:
		var visual := MeshInstance3D.new()
		visual.name = "Village_" + key
		visual.mesh = _batches[key].commit()
		visual.material_override = _materials[key]
		add_child(visual)
	_batches.clear()
