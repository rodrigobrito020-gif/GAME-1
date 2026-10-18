extends RefCounted

# Tests the posed glove against the shield's actual rear surface. The imported
# shield faces local -Z, so positive clearance means the hand stays behind it.
# X/Y bounds alone are insufficient because the shield has a curved back.
# Returns (INF, 0) if no sampled glove vertex projects onto the shield.
static func minimum_clearance(gloves: Array[MeshInstance3D], wrist: Vector3, shell_mesh: MeshInstance3D) -> Vector2:
	var triangles: Array[PackedVector3Array] = []
	for surface in shell_mesh.mesh.get_surface_count():
		var arrays := shell_mesh.mesh.surface_get_arrays(surface)
		var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
		var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
		var vertex_count := indices.size() if not indices.is_empty() else vertices.size()
		for index in range(0, vertex_count - 2, 3):
			var triangle := PackedVector3Array()
			for corner in 3:
				triangle.append(vertices[indices[index + corner] if not indices.is_empty() else index + corner])
			triangles.append(triangle)
	var minimum := INF
	var samples := 0
	var inverse_shell := shell_mesh.global_transform.affine_inverse()
	var depth_scale := shell_mesh.global_basis.z.length()
	for glove in gloves:
		for vertices in posed_world_vertices(glove):
			for world_vertex in vertices:
				if world_vertex.distance_squared_to(wrist) > 0.35 * 0.35:
					continue
				var point := inverse_shell * world_vertex
				var back := -INF
				for triangle in triangles:
					var a := triangle[0]
					var b := triangle[1]
					var c := triangle[2]
					var denominator := (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
					if absf(denominator) < 0.00000001:
						continue
					var u := ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denominator
					var v := ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denominator
					var w := 1.0 - u - v
					if u >= -0.00001 and v >= -0.00001 and w >= -0.00001:
						back = maxf(back, u * a.z + v * b.z + w * c.z)
				if back != -INF:
					minimum = minf(minimum, (point.z - back) * depth_scale)
					samples += 1
	return Vector2(minimum, samples)

# Linear skinning on the CPU also works with Godot's headless renderer, which
# does not register the rendering skeleton required by MeshInstance3D.bake_*.
# Skin bind indices can differ from skeleton bone indices; resolve bind names.
static func posed_world_vertices(mesh_instance: MeshInstance3D) -> Array[PackedVector3Array]:
	var surfaces: Array[PackedVector3Array] = []
	var skin := mesh_instance.skin
	var rig := mesh_instance.get_node_or_null(mesh_instance.skeleton) as Skeleton3D
	var transforms: Array[Transform3D] = []
	if skin != null and rig != null:
		for bind_index in skin.get_bind_count():
			var bone_name := skin.get_bind_name(bind_index)
			var bone := rig.find_bone(bone_name) if not bone_name.is_empty() else skin.get_bind_bone(bind_index)
			transforms.append(rig.global_transform * rig.get_bone_global_pose(bone) * skin.get_bind_pose(bind_index))
	for surface in mesh_instance.mesh.get_surface_count():
		var arrays := mesh_instance.mesh.surface_get_arrays(surface)
		var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
		var posed := PackedVector3Array()
		posed.resize(vertices.size())
		if transforms.is_empty() or arrays[Mesh.ARRAY_BONES] == null:
			for index in vertices.size():
				posed[index] = mesh_instance.global_transform * vertices[index]
		else:
			var bones: PackedInt32Array = arrays[Mesh.ARRAY_BONES]
			var weights: PackedFloat32Array = arrays[Mesh.ARRAY_WEIGHTS]
			var influences := bones.size() / vertices.size()
			for index in vertices.size():
				var world := Vector3.ZERO
				for influence in int(influences):
					var offset := index * int(influences) + influence
					if weights[offset] > 0:
						world += (transforms[bones[offset]] * vertices[index]) * weights[offset]
				posed[index] = world
		surfaces.append(posed)
	return surfaces
