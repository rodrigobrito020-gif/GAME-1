extends Node3D
## Forearm-mounted shield, with short hidden grip and continuous leather bands.
const SHELL := preload("res://assets/small_shield.glb")
const GRIP_CENTER := Vector3(-0.010, -0.105, 0.117)
const GRIP_LENGTH := 0.065
const FOREARM_ROLL := PI / 12
const PANEL_TURN := -PI / 2
const PANEL_CENTER_BELOW_WRIST := 0.025
const PANEL_OUTSIDE_ARM := 0.098
const PANEL_GEOMETRY_CENTER := 0.10310
var _skeleton: Skeleton3D
var _shell: Node3D
var _shell_mesh: MeshInstance3D
var _grip: MeshInstance3D
var _grip_band: MeshInstance3D
var _strap: MeshInstance3D
var _triangles: Array[PackedVector3Array] = []

func _ready() -> void:
	_skeleton = get_parent().get_parent() as Skeleton3D
	if not _skeleton.skeleton_updated.is_connected(_update_strap):
		_skeleton.skeleton_updated.connect(_update_strap)
	# Inventory duplicates reconnect only to their own skeleton.
	if not has_node("OriginalSmallShield"):
		var shell := SHELL.instantiate() as Node3D
		shell.name = "OriginalSmallShield"
		add_child(shell)
		var leather := StandardMaterial3D.new()
		leather.albedo_color = Color("39281f")
		leather.roughness = 1.0
		leather.cull_mode = BaseMaterial3D.CULL_DISABLED
		var handle := Node3D.new()
		handle.name = "HandGrip"
		add_child(handle)
		var grip := MeshInstance3D.new()
		grip.name = "LeatherGrip"
		var cylinder := CylinderMesh.new()
		cylinder.top_radius = 0.011
		cylinder.bottom_radius = 0.011
		cylinder.height = GRIP_LENGTH
		cylinder.radial_segments = 10
		grip.mesh = cylinder
		grip.material_override = leather
		grip.position = GRIP_CENTER
		grip.rotation.z = PI / 2
		handle.add_child(grip)
		var grip_band := MeshInstance3D.new()
		grip_band.name = "LeatherLoop"
		grip_band.material_override = leather
		handle.add_child(grip_band)
		var strap := MeshInstance3D.new()
		strap.name = "ForearmStrap"
		strap.material_override = leather
		add_child(strap)
	_shell = get_node("OriginalSmallShield")
	_shell_mesh = _shell.find_children("*", "MeshInstance3D", true, false)[0]
	_grip = get_node("HandGrip/LeatherGrip")
	_grip_band = get_node("HandGrip/LeatherLoop")
	_strap = get_node("ForearmStrap")
	_cache_back_surface()
	_update_strap()

func _cache_back_surface() -> void:
	_triangles.clear()
	for surface in _shell_mesh.mesh.get_surface_count():
		var arrays := _shell_mesh.mesh.surface_get_arrays(surface)
		var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
		var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
		for index in range(0, indices.size(), 3):
			_triangles.append(PackedVector3Array([vertices[indices[index]], vertices[indices[index + 1]], vertices[indices[index + 2]]]))

func _back_anchor(world_point: Vector3) -> Vector3:
	var point := _shell_mesh.to_local(world_point)
	var back := -INF
	for triangle in _triangles:
		var a := triangle[0]
		var b := triangle[1]
		var c := triangle[2]
		var denominator := (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
		if absf(denominator) < 0.00000001:
			continue
		var u := ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denominator
		var v := ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denominator
		if u >= 0 and v >= 0 and u + v <= 1:
			back = maxf(back, u * a.z + v * b.z + (1 - u - v) * c.z)
	if back != -INF:
		# Stitch the band just into the rear wood, avoiding a visible gap.
		point.z = back - 0.001 / _shell_mesh.global_basis.z.length()
	return _shell_mesh.to_global(point)

func _band(node: MeshInstance3D, path: PackedVector3Array, across: Vector3, width: float, center: Vector3) -> void:
	var vertices := PackedVector3Array()
	var normals := PackedVector3Array()
	var indices := PackedInt32Array()
	for index in path.size():
		var tangent := path[mini(index + 1, path.size() - 1)] - path[maxi(index - 1, 0)]
		var normal := tangent.cross(across).normalized()
		for sign_value in [-1, 1]:
			vertices.append(path[index] - center + across * width * 0.5 * sign_value)
			normals.append(normal)
	for index in range(path.size() - 1):
		var a := index * 2
		indices.append_array(PackedInt32Array([a, a + 1, a + 2, a + 1, a + 3, a + 2]))
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_NORMAL] = normals
	arrays[Mesh.ARRAY_INDEX] = indices
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	node.mesh = mesh
	node.global_transform = Transform3D(Basis.IDENTITY, center)

func _update_strap() -> void:
	if not is_inside_tree() or not is_instance_valid(_skeleton) or not _skeleton.is_inside_tree() or not is_instance_valid(_strap) or not _strap.is_inside_tree():
		return
	var forearm := _skeleton.global_transform * _skeleton.get_bone_global_pose(_skeleton.find_bone("Bip01_L_Forearm"))
	var elbow := forearm.origin
	var wrist := _skeleton.global_transform * _skeleton.get_bone_global_pose(_skeleton.find_bone("Bip01_L_Hand")).origin
	var down := (wrist - elbow).normalized()
	var forearm_basis := forearm.basis.orthonormalized()
	var desired_front := forearm_basis.z * cos(FOREARM_ROLL) + forearm_basis.y * sin(FOREARM_ROLL)
	var front := (desired_front - down * desired_front.dot(down)).normalized()
	var side := down.cross(front).normalized()
	var long_axis := down * cos(PANEL_TURN) + side * sin(PANEL_TURN)
	var panel_basis := Basis(long_axis, long_axis.cross(front).normalized(), -front)
	# Lay the panel across the forearm, keeping its center behind the grip.
	_shell.global_transform = Transform3D(panel_basis, wrist + down * PANEL_CENTER_BELOW_WRIST - long_axis * PANEL_GEOMETRY_CENTER + front * PANEL_OUTSIDE_ARM)
	var half_grip := Vector3.RIGHT * GRIP_LENGTH / 2
	var left := to_global(GRIP_CENTER - half_grip)
	var right := to_global(GRIP_CENTER + half_grip)
	_band(_grip_band, PackedVector3Array([_back_anchor(left), left, right, _back_anchor(right)]), down, 0.014, _grip.global_position)
	var center := wrist - down * 0.07
	var path := PackedVector3Array()
	path.append(_back_anchor(center + side * 0.052))
	for index in range(17):
		var angle := PI * index / 16
		path.append(center + side * (cos(angle) * 0.052) - front * (sin(angle) * 0.047))
	path.append(_back_anchor(center - side * 0.052))
	_band(_strap, path, down, 0.024, center)

func _exit_tree() -> void:
	if is_instance_valid(_skeleton) and _skeleton.skeleton_updated.is_connected(_update_strap):
		_skeleton.skeleton_updated.disconnect(_update_strap)
