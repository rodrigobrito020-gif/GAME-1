extends Node3D
## Campo de um quilômetro, com solo texturizado e relva 3D em blocos reciclados.
const SIZE := 1000.0
const GRASS_TEXTURE := preload("res://assets/environment/meadow_grass_albedo.png")
const GROUND_SHADER := preload("res://shaders/meadow_ground.gdshader")
const BLADE_SHADER := preload("res://shaders/meadow_blades.gdshader")
const GRASS_CHUNK_SIZE := 12.0
const GRASS_CHUNK_RADIUS := 4
const GRASS_TUFTS_PER_CHUNK := 520
var grass_chunks: Dictionary = {}
var grass_mesh: ArrayMesh
var grass_material: ShaderMaterial
var grass_density := FastNoiseLite.new()
var grass_center := Vector2i(99999, 99999)
var grass_update_clock := 0.0
var world_number := 1
var world_seed := 2741
var biome_tint := Color.WHITE
var rock_count := 0
var ruin_count := 0

func configure(definition: Dictionary) -> void:
	# A instância recebe sua definição antes de entrar na árvore e gerar o terreno.
	assert(not is_inside_tree(), "Configure o mundo antes de add_child().")
	world_number = clampi(int(definition.get("number", 1)), 1, 10)
	world_seed = int(definition.get("seed", 2741))
	biome_tint = definition.get("tint", Color.WHITE)
	rock_count = maxi(0, int(definition.get("rock_count", 0)))
	ruin_count = maxi(0, int(definition.get("ruin_count", 0)))

func _ready() -> void:
	var ground := MeshInstance3D.new()
	ground.name = "OpenGround"
	var plane := PlaneMesh.new()
	plane.size = Vector2(SIZE, SIZE)
	ground.mesh = plane
	var noise := FastNoiseLite.new()
	noise.seed = world_seed
	noise.frequency = 0.025
	var texture := NoiseTexture2D.new()
	texture.width = 512
	texture.height = 512
	texture.seamless = true
	texture.noise = noise
	var material := ShaderMaterial.new()
	material.shader = GROUND_SHADER
	material.set_shader_parameter("grass_albedo", GRASS_TEXTURE)
	material.set_shader_parameter("meadow_noise", texture)
	material.set_shader_parameter("biome_tint", Vector3(biome_tint.r, biome_tint.g, biome_tint.b))
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
	_grass()
	_vegetation()
	_hills()
	_landmarks()

func _process(delta: float) -> void:
	grass_update_clock += delta
	if grass_update_clock < 0.2:
		return
	grass_update_clock = 0.0
	var player := get_tree().get_first_node_in_group("rpg_player") as Node3D
	if player == null and get_parent() != null:
		player = get_parent().get_node_or_null("Player") as Node3D
	if player != null:
		_update_grass(player.global_position)

func _grass() -> void:
	grass_density.seed = world_seed + 5886
	grass_density.frequency = 0.075
	grass_mesh = _grass_tuft_mesh()
	grass_material = ShaderMaterial.new()
	grass_material.shader = BLADE_SHADER
	grass_material.set_shader_parameter("grass_albedo", GRASS_TEXTURE)
	grass_material.set_shader_parameter("biome_tint", Vector3(biome_tint.r, biome_tint.g, biome_tint.b))
	_update_grass(Vector3.ZERO)

func _grass_tuft_mesh() -> ArrayMesh:
	# Five curved, tapering blades: 15 triangles/tuft, opaque and double sided.
	# Real geometry avoids transparent grass cards, heavy overdraw and sorting.
	var mesh := SurfaceTool.new()
	mesh.begin(Mesh.PRIMITIVE_TRIANGLES)
	var rng := RandomNumberGenerator.new()
	rng.seed = 1638 + world_seed - 2741
	for blade in range(5):
		var angle := TAU * blade / 5.0 + rng.randf_range(-0.35, 0.35)
		var outward := Vector3(cos(angle), 0.0, sin(angle))
		var side := Vector3(-sin(angle), 0.0, cos(angle))
		var base := outward * rng.randf_range(0.015, 0.09)
		var height := rng.randf_range(0.10, 0.20)
		var width := rng.randf_range(0.004, 0.009)
		var middle := base + outward * height * 0.19 + Vector3.UP * height * 0.55
		var tip := base + outward * height * 0.65 + Vector3.UP * height
		var points := [base - side * width, base + side * width, middle - side * width * 0.62, middle + side * width * 0.62, tip]
		var uvs := [Vector2(0, 0), Vector2(1, 0), Vector2(0, 0.55), Vector2(1, 0.55), Vector2(0.5, 1)]
		var shade := rng.randf_range(0.88, 1.12)
		for point in [0, 2, 1, 1, 2, 3, 2, 4, 3]:
			mesh.set_normal(Vector3.UP)
			mesh.set_uv(uvs[point])
			mesh.set_color(Color(shade, shade, shade, 1.0))
			mesh.add_vertex(points[point])
	return mesh.commit()

func _update_grass(at: Vector3) -> void:
	var center := Vector2i(floori(at.x / GRASS_CHUNK_SIZE), floori(at.z / GRASS_CHUNK_SIZE))
	if center == grass_center:
		return
	grass_center = center
	var active: Dictionary = {}
	var recycled: Array[MultiMeshInstance3D] = []
	for x in range(-GRASS_CHUNK_RADIUS, GRASS_CHUNK_RADIUS + 1):
		for z in range(-GRASS_CHUNK_RADIUS, GRASS_CHUNK_RADIUS + 1):
			# Omit corner chunks entirely outside the 43m grass draw distance.
			if Vector2(x, z).length() <= 4.5:
				active[center + Vector2i(x, z)] = true
	for key in grass_chunks.keys():
		if not active.has(key):
			recycled.append(grass_chunks[key])
			grass_chunks.erase(key)
	for key in active:
		if grass_chunks.has(key):
			continue
		var batch: MultiMeshInstance3D
		if recycled.is_empty():
			batch = MultiMeshInstance3D.new()
			batch.name = "MeadowGrass"
			batch.multimesh = MultiMesh.new()
			batch.multimesh.transform_format = MultiMesh.TRANSFORM_3D
			batch.multimesh.mesh = grass_mesh
			batch.multimesh.instance_count = GRASS_TUFTS_PER_CHUNK
			batch.material_override = grass_material
			batch.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			batch.visibility_range_end = 62.0
			batch.extra_cull_margin = 0.3
			add_child(batch)
		else:
			batch = recycled.pop_back()
		_fill_grass_chunk(batch, key)
		grass_chunks[key] = batch
	for batch in recycled:
		batch.queue_free()

func _fill_grass_chunk(batch: MultiMeshInstance3D, key: Vector2i) -> void:
	var origin := Vector3(key.x * GRASS_CHUNK_SIZE, 0.003, key.y * GRASS_CHUNK_SIZE)
	batch.position = origin
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(key) ^ (world_seed + 50050)
	var count := 0
	for i in range(GRASS_TUFTS_PER_CHUNK):
		var position := Vector3(rng.randf() * GRASS_CHUNK_SIZE, 0.0, rng.randf() * GRASS_CHUNK_SIZE)
		var world_position := origin + position
		if absf(world_position.x) >= SIZE * 0.5 or absf(world_position.z) >= SIZE * 0.5:
			continue
		# Irregular patches keep the floor readable and the meadow from resembling carpet.
		var density := grass_density.get_noise_2d(world_position.x, world_position.z)
		if density < -0.13 and rng.randf() < 0.74:
			continue
		var scale := rng.randf_range(0.7, 1.3)
		var basis := Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(scale, rng.randf_range(0.75, 1.2), scale))
		batch.multimesh.set_instance_transform(count, Transform3D(basis, position))
		count += 1
	batch.multimesh.visible_instance_count = count

func _material(color: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color * biome_tint
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
	rng.seed = world_seed + 715
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

func _landmarks() -> void:
	if rock_count == 0 and ruin_count == 0:
		return
	var landmarks := Node3D.new()
	landmarks.name = "Landmarks"
	add_child(landmarks)
	var rng := RandomNumberGenerator.new()
	rng.seed = world_seed + 20947
	var stone := _material(Color("76786c"))
	for i in range(rock_count):
		var angle := rng.randf_range(0, TAU)
		var radius := rng.randf_range(23.0, 100.0)
		var at := Vector3(cos(angle) * radius, 0, sin(angle) * radius)
		# Deixa livre o percurso inicial e as posições reservadas aos monstros.
		if absf(at.x) < 14.0 and at.z < 12.0:
			at.x += 22.0 if at.x >= 0 else -22.0
		var size := Vector3(rng.randf_range(1.2, 3.2), rng.randf_range(0.8, 2.5), rng.randf_range(1.0, 2.8))
		var rock := StaticBody3D.new()
		rock.name = "Boulder%d" % i
		rock.position = at + Vector3.UP * size.y * 0.32
		rock.rotation.y = rng.randf_range(0, TAU)
		landmarks.add_child(rock)
		var mesh := SphereMesh.new()
		mesh.radius = 0.5
		mesh.height = 1.0
		mesh.radial_segments = 7
		mesh.rings = 3
		var visual := MeshInstance3D.new()
		visual.mesh = mesh
		visual.scale = size
		visual.material_override = stone
		rock.add_child(visual)
		var collision := CollisionShape3D.new()
		var shape := SphereShape3D.new()
		shape.radius = maxf(size.x, size.z) * 0.44
		collision.shape = shape
		rock.add_child(collision)
	for i in range(ruin_count):
		var side := -1.0 if i % 2 == 0 else 1.0
		var ruin := Node3D.new()
		ruin.name = "AncientArch%d" % i
		ruin.position = Vector3(side * (20.0 + i * 9.0), 0, -22.0 - i * 16.0)
		ruin.rotation.y = side * 0.35
		landmarks.add_child(ruin)
		_stone_block(ruin, Vector3(-2.2, 2.4, 0), Vector3(1.0, 4.8, 1.1), stone)
		_stone_block(ruin, Vector3(2.2, 2.0, 0), Vector3(1.0, 4.0, 1.1), stone)
		_stone_block(ruin, Vector3(-0.25, 4.65, 0), Vector3(4.9, 0.7, 1.2), stone)
		_stone_block(ruin, Vector3(4.0, 0.4, -1.5), Vector3(1.5, 0.8, 1.0), stone)

func _stone_block(parent: Node3D, at: Vector3, size: Vector3, material: Material) -> void:
	var block := StaticBody3D.new()
	block.position = at
	parent.add_child(block)
	var visual := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	visual.mesh = mesh
	visual.material_override = material
	block.add_child(visual)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	block.add_child(collision)
