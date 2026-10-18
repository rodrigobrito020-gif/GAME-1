extends Node3D
## Armas provisórias feitas em geometria nativa; não são modelos do cliente L2.
## O eixo local X acompanha o eixo nativo de empunhadura usado pelos sockets.
@export var class_id := "arqueiro"

func _ready() -> void:
	# Inventory previews duplicate the already-built children along with this script.
	if get_child_count() == 0:
		_build()

func configure(next_class_id: String) -> void:
	class_id = next_class_id
	if not is_inside_tree():
		return
	for child in get_children():
		remove_child(child)
		child.queue_free()
	_build()

func _build() -> void:
	if class_id == "arqueiro":
		_bow()
	elif class_id == "mago" or class_id == "healer":
		_staff()

func _bow() -> void:
	var wood := _material(Color("715134"))
	var leather := _material(Color("352d25"))
	var string := _material(Color("c3b494"))
	var horn := _material(Color("b4a587"))
	# Narrow recurved limbs meet a grip centered exactly on the hand socket.
	var points: Array[Vector3] = [
		Vector3(-0.54, 0, 0.16), Vector3(-0.49, 0, 0.18),
		Vector3(-0.41, 0, 0.12), Vector3(-0.29, 0, 0.045),
		Vector3(-0.15, 0, -0.008), Vector3(0, 0, 0),
		Vector3(0.15, 0, -0.008), Vector3(0.29, 0, 0.045),
		Vector3(0.41, 0, 0.12), Vector3(0.49, 0, 0.18),
		Vector3(0.54, 0, 0.16)]
	for i in range(points.size() - 1):
		var center_x := absf((points[i].x + points[i + 1].x) * 0.5)
		var radius := lerpf(0.025, 0.009, center_x / 0.54)
		_segment(points[i], points[i + 1], radius, wood, "BowLimb")
	_segment(Vector3(-0.075, 0, 0), Vector3(0.075, 0, 0), 0.030, leather, "BowGrip")
	for side in [-1.0, 1.0]:
		_segment(Vector3(side * 0.51, 0, 0.17), Vector3(side * 0.54, 0, 0.16), 0.012, horn, "BowTip")
	_segment(points.front(), points.back(), 0.0018, string, "BowString")

func _staff() -> void:
	var wood := _material(Color("655038"))
	var leather := _material(Color("352e29"))
	var healer := class_id == "healer"
	var metal := _material(Color("bd9c60") if healer else Color("81719b"))
	metal.metallic = 0.55
	metal.roughness = 0.4
	var orb_material := _material(Color("e9c270") if healer else Color("9563ca"))
	orb_material.emission_enabled = true
	orb_material.emission = Color("d9a848") if healer else Color("8242be")
	orb_material.emission_energy_multiplier = 1.3
	_segment(Vector3(-0.69, 0, 0), Vector3(0.70, 0, 0), 0.023, wood, "StaffShaft")
	_segment(Vector3(-0.10, 0, 0), Vector3(0.10, 0, 0), 0.028, leather, "StaffGrip")
	_segment(Vector3(-0.72, 0, 0), Vector3(-0.65, 0, 0), 0.028, metal, "StaffFoot")
	_segment(Vector3(0.65, 0, 0), Vector3(0.75, 0, 0), 0.035, metal, "StaffCollar")
	# The orb is above the hand in +X, and enclosed by a small metal circlet.
	var center := Vector3(0.83, 0, 0)
	var sphere := SphereMesh.new()
	sphere.radius = 0.078
	sphere.height = 0.156
	sphere.radial_segments = 16
	sphere.rings = 8
	_visual(sphere, center, orb_material, "StaffOrb")
	for i in range(16):
		var a := TAU * i / 16.0
		var b := TAU * (i + 1) / 16.0
		_segment(center + Vector3(0, cos(a), sin(a)) * 0.112, center + Vector3(0, cos(b), sin(b)) * 0.112, 0.009, metal, "OrbCirclet")
	for side in [-1.0, 1.0]:
		_segment(Vector3(0.71, 0, 0), center + Vector3(0, side * 0.11, 0), 0.011, metal, "OrbSupport")

func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.92
	return material

func _segment(from: Vector3, to: Vector3, radius: float, material: Material, part_name: String) -> void:
	var delta := to - from
	if delta.length_squared() < 0.0000001:
		return
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius * 0.95
	mesh.bottom_radius = radius
	mesh.height = delta.length()
	mesh.radial_segments = 8
	mesh.rings = 1
	var visual := _visual(mesh, (from + to) * 0.5, material, part_name)
	visual.basis = Basis(Quaternion(Vector3.UP, delta.normalized()))

func _visual(mesh: Mesh, at: Vector3, material: Material, part_name: String) -> MeshInstance3D:
	var visual := MeshInstance3D.new()
	visual.name = part_name
	visual.mesh = mesh
	visual.position = at
	visual.material_override = material
	add_child(visual)
	return visual
