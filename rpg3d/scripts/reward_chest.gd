extends Node3D
## Visual do baú de recompensa. A interação e o conteúdo pertencem ao mundo.
## A frente está em +Z; a origem assenta no chão e a tampa abre para -Z.

const OPEN_ANGLE := -105.0 * PI / 180.0
const HINGE := Vector3(0, 0.45, -0.31)

var opened := false
var _lid: Node3D
var _glow: OmniLight3D
var _opening_tween: Tween


func _ready() -> void:
	name = "RewardChest" if name.is_empty() else name
	var wood := _material(Color("81512d"), 0.0, 0.88)
	var pale_wood := _material(Color("996238"), 0.0, 0.86)
	var dark_wood := _material(Color("462c1d"), 0.0, 0.95)
	var grain := _material(Color("694025"), 0.0, 0.95)
	var gold := _material(Color("b4934e"), 0.7, 0.34)
	var bright_gold := _material(Color("d1b466"), 0.65, 0.28)
	var iron := _material(Color("302e29"), 0.7, 0.53)
	var inside := _material(Color("34251b"), 0.0, 1.0)
	var body := Node3D.new()
	body.name = "ChestBody"
	add_child(body)
	# Hollow walls leave an actual interior visible when the lid rises.
	_box(body, Vector3(0, 0.08, 0), Vector3(0.97, 0.10, 0.61), inside)
	for row in range(4):
		var y := 0.14 + row * 0.086
		var plank := wood if row % 2 == 0 else pale_wood
		for side in [-1.0, 1.0]:
			_box(body, Vector3(0, y, side * 0.294), Vector3(0.97, 0.081, 0.045), plank)
			_box(body, Vector3(side * 0.465, y, 0), Vector3(0.045, 0.081, 0.56), plank)
			_box(body, Vector3(0, y + 0.012, side * 0.318), Vector3(0.90, 0.003, 0.002), grain)
	for side in [-1.0, 1.0]:
		_box(body, Vector3(0, 0.429, side * 0.293), Vector3(1.01, 0.043, 0.057), dark_wood)
		_box(body, Vector3(side * 0.477, 0.429, 0), Vector3(0.057, 0.043, 0.61), dark_wood)
		for z in [-0.235, 0.235]:
			_box(body, Vector3(side * 0.405, 0.026, z), Vector3(0.14, 0.052, 0.13), iron)
	# The two bands continue around the curved lid instead of floating above it.
	for x in [-0.335, 0.335]:
		for side in [-1.0, 1.0]:
			_box(body, Vector3(x, 0.258, side * 0.323), Vector3(0.057, 0.382, 0.021), gold)
			for y in [0.112, 0.39]:
				_stud(body, Vector3(x, y, side * 0.338), bright_gold)
		_box(body, Vector3(x, 0.066, 0), Vector3(0.057, 0.018, 0.66), gold)
	_box(body, Vector3(0, 0.381, 0.337), Vector3(0.105, 0.115, 0.027), gold)
	_box(body, Vector3(0, 0.386, 0.354), Vector3(0.018, 0.034, 0.009), iron)
	_stud(body, Vector3(0, 0.357, 0.356), bright_gold)
	_lid = Node3D.new()
	_lid.name = "ChestLid"
	_lid.position = HINGE
	add_child(_lid)
	# An elliptical arch keeps the closed chest about 1 x 0.65 x 0.66 m.
	for segment in range(10):
		var a := _arch_point(PI * float(segment) / 10.0)
		var b := _arch_point(PI * float(segment + 1) / 10.0)
		var plank := _box(_lid, (a + b) * 0.5, Vector3(1.015, 0.035, a.distance_to(b) + 0.004), wood if segment % 2 == 0 else pale_wood)
		plank.rotation.x = atan2(-(b.y - a.y), b.z - a.z)
		for x in [-0.335, 0.335]:
			var band := _box(_lid, (a + b) * 0.5 + Vector3(x, 0.016, 0), Vector3(0.059, 0.018, a.distance_to(b) + 0.012), gold)
			band.rotation.x = plank.rotation.x
	for side in [-1.0, 1.0]:
		_lid_end(side * 0.486, wood)
		_box(_lid, Vector3(0, 0.004, 0.31 + side * 0.31), Vector3(1.02, 0.045, 0.033), gold)
		for x in [-0.335, 0.335]:
			_stud(_lid, Vector3(x, 0.01, 0.31 + side * 0.334), bright_gold)
	# The upper latch travels with the lid; the lock plate remains on the body.
	_box(_lid, Vector3(0, 0.015, 0.652), Vector3(0.078, 0.064, 0.025), bright_gold)
	for x in [-0.335, 0.335]:
		var hinge := MeshInstance3D.new()
		var barrel := CylinderMesh.new()
		barrel.top_radius = 0.028
		barrel.bottom_radius = 0.028
		barrel.height = 0.105
		barrel.radial_segments = 10
		hinge.mesh = barrel
		hinge.material_override = gold
		hinge.position = HINGE + Vector3(x, 0, -0.014)
		hinge.rotation.z = PI / 2.0
		body.add_child(hinge)
	_glow = OmniLight3D.new()
	_glow.name = "WarmRewardGlow"
	_glow.position = Vector3(0, 0.44, 0)
	_glow.light_color = Color("ffcb71")
	_glow.light_energy = 0.24
	_glow.omni_range = 2.2
	_glow.shadow_enabled = false
	add_child(_glow)
	# Calling open() before entering the tree still produces the open final pose.
	if opened:
		_lid.rotation.x = OPEN_ANGLE
		_glow.light_energy = 0.65


func open() -> bool:
	if opened:
		return false
	opened = true
	if is_instance_valid(_lid) and is_inside_tree():
		_opening_tween = create_tween().set_parallel(true)
		_opening_tween.tween_property(_lid, "rotation:x", OPEN_ANGLE, 0.68).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		_opening_tween.tween_property(_glow, "light_energy", 0.65, 0.48)
	return true


func _arch_point(angle: float) -> Vector3:
	return Vector3(0, sin(angle) * 0.17 + 0.012, 0.31 - cos(angle) * 0.31)


func _lid_end(x: float, material: Material) -> void:
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	var center := Vector3(x, 0.012, 0.31)
	var normal := Vector3(signf(x), 0, 0)
	for segment in range(10):
		var a := _arch_point(PI * float(segment) / 10.0) + Vector3(x, 0, 0)
		var b := _arch_point(PI * float(segment + 1) / 10.0) + Vector3(x, 0, 0)
		# Godot's front faces use clockwise winding when seen from outside.
		for point in [center, b if x > 0 else a, a if x > 0 else b]:
			surface.set_normal(normal)
			surface.add_vertex(point)
	var end := MeshInstance3D.new()
	end.mesh = surface.commit()
	end.material_override = material
	_lid.add_child(end)


func _material(color: Color, metallic: float, roughness: float) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.metallic = metallic
	material.roughness = roughness
	return material


func _box(parent: Node3D, at: Vector3, size: Vector3, material: Material) -> MeshInstance3D:
	var visual := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	visual.mesh = mesh
	visual.position = at
	visual.material_override = material
	parent.add_child(visual)
	return visual


func _stud(parent: Node3D, at: Vector3, material: Material) -> void:
	var stud := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = 0.014
	mesh.height = 0.028
	mesh.radial_segments = 8
	mesh.rings = 4
	stud.mesh = mesh
	stud.scale.z = 0.5
	stud.position = at
	stud.material_override = material
	parent.add_child(stud)
