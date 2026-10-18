extends Node3D
## Shield shell pivots around the fist; the grip and forearm strap stay on the arm.
const SHELL := preload("res://assets/small_shield.glb")
const GRIP_CENTER := Vector3(-0.005, -0.095, 0.105)
const PRESENTATION_ANGLE := PI / 4
const PANEL_CLEARANCE := 0.020
const SHELL_FRAME := Basis(Vector3.UP, -PI / 2) * Basis(Vector3.RIGHT, PI / 2)

var _skeleton: Skeleton3D
var _strap: MeshInstance3D

func _ready() -> void:
	_skeleton = get_parent().get_parent() as Skeleton3D
	if not _skeleton.skeleton_updated.is_connected(_update_strap):
		_skeleton.skeleton_updated.connect(_update_strap)
	# Inventory previews duplicate the assembled rig, including these children.
	if has_node("OriginalSmallShield"):
		_strap = get_node("ForearmStrap")
		_update_strap()
		return
	var turn := Basis(Vector3.BACK, PRESENTATION_ANGLE)
	var shell := SHELL.instantiate() as Node3D
	shell.name = "OriginalSmallShield"
	shell.basis = turn * SHELL_FRAME
	shell.position = GRIP_CENTER - turn * GRIP_CENTER + turn.y * PANEL_CLEARANCE
	add_child(shell)
	var leather := StandardMaterial3D.new()
	leather.albedo_color = Color("493023")
	leather.roughness = 0.95
	var iron := StandardMaterial3D.new()
	iron.albedo_color = Color("43484a")
	iron.metallic = 0.65
	iron.roughness = 0.7
	var handle := Node3D.new()
	handle.name = "HandGrip"
	add_child(handle)
	var ends: Array[Vector3] = [GRIP_CENTER - Vector3(0.06, 0, 0), GRIP_CENTER + Vector3(0.06, 0, 0)]
	_bar(handle, "LeatherGrip", ends[0], ends[1], 0.013, leather)
	for index in range(2):
		# Backplate of the curved wood lies behind its convex front, in native units.
		var back := turn * Vector3(ends[index].x, -0.025, GRIP_CENTER.z) + shell.position
		_bar(handle, "GripBracket" + str(index), ends[index], back, 0.009, iron)
		var bolt := MeshInstance3D.new()
		bolt.name = "GripBolt" + str(index)
		var sphere := SphereMesh.new()
		sphere.radius = 0.014
		sphere.height = 0.028
		sphere.radial_segments = 8
		sphere.rings = 4
		bolt.mesh = sphere
		bolt.material_override = iron
		bolt.position = back
		handle.add_child(bolt)
	_forearm_strap(leather)
	_update_strap()

func _bar(parent: Node3D, part_name: String, from: Vector3, to: Vector3, radius: float, material: Material) -> void:
	var node := MeshInstance3D.new()
	node.name = part_name
	var cylinder := CylinderMesh.new()
	cylinder.top_radius = radius
	cylinder.bottom_radius = radius
	cylinder.height = from.distance_to(to)
	cylinder.radial_segments = 10
	node.mesh = cylinder
	node.material_override = material
	node.position = (from + to) / 2
	var direction := (to - from).normalized()
	node.quaternion = Quaternion(Vector3.UP, direction)
	parent.add_child(node)

func _forearm_strap(material: Material) -> void:
	var strap := MeshInstance3D.new()
	_strap = strap
	strap.name = "ForearmStrap"
	var vertices := PackedVector3Array()
	var normals := PackedVector3Array()
	var indices := PackedInt32Array()
	var center := Vector3.ZERO
	for index in range(25):
		var angle := TAU * index / 24
		var radial := Vector3(cos(angle), sin(angle), 0)
		for edge in [-0.014, 0.014]:
			vertices.append(center + Vector3(radial.x * 0.055, radial.y * 0.045, edge))
			normals.append(radial)
	for index in range(24):
		var a := index * 2
		indices.append_array(PackedInt32Array([a, a + 1, a + 2, a + 1, a + 3, a + 2]))
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_NORMAL] = normals
	arrays[Mesh.ARRAY_INDEX] = indices
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	strap.mesh = mesh
	strap.material_override = material
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	add_child(strap)

func _update_strap() -> void:
	if not is_inside_tree() or not is_instance_valid(_skeleton) or not _skeleton.is_inside_tree() or not is_instance_valid(_strap) or not _strap.is_inside_tree():
		return
	var elbow := _skeleton.global_transform * _skeleton.get_bone_global_pose(_skeleton.find_bone("Bip01_L_Forearm")).origin
	var wrist := _skeleton.global_transform * _skeleton.get_bone_global_pose(_skeleton.find_bone("Bip01_L_Hand")).origin
	var axis := (wrist - elbow).normalized()
	# Keep the leather cuff on the forearm when the hand twists in a swing.
	_strap.global_transform = Transform3D(Basis(Quaternion(Vector3.BACK, axis)), wrist - axis * 0.07)

func _exit_tree() -> void:
	if is_instance_valid(_skeleton) and _skeleton.skeleton_updated.is_connected(_update_strap):
		_skeleton.skeleton_updated.disconnect(_update_strap)
