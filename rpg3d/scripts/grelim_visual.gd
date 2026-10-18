extends Node3D
## Criatura 3D provisória inspirada no Grelim enviado como referência visual.
var limbs: Array[Node3D] = []
var time := 0.0

func _ready() -> void:
	_ball(self, Vector3(0, 0.65, 0), Vector3(0.4, 0.48, 0.3), Color("a87936"))
	_ball(self, Vector3(0, 1.16, -0.08), Vector3(0.53, 0.44, 0.4), Color("bc914b"))
	_ball(self, Vector3(0, 0.98, -0.36), Vector3(0.32, 0.17, 0.16), Color("936c35"))
	# Olhos, pupilas e sobrancelhas voltados para -Z.
	for side in [-1.0, 1.0]:
		_ball(self, Vector3(side * 0.23, 1.16, -0.42), Vector3(0.15, 0.10, 0.07), Color("ffd255"))
		_ball(self, Vector3(side * 0.23, 1.16, -0.479), Vector3(0.035, 0.075, 0.018), Color("261b11"))
		_segment(self, Vector3(side * 0.08, 1.29, -0.43), Vector3(side * 0.40, 1.32, -0.35), 0.06, 0.09, Color("775c32"))
		_segment(self, Vector3(side * 0.4, 1.4, -0.08), Vector3(side * 0.54, 1.82, -0.15), 0.14, 0.0, Color("ead4a6"))
		_segment(self, Vector3(side * 0.43, 1.22, 0), Vector3(side * 0.85, 1.38, 0.05), 0.17, 0.0, Color("ab7f3d"))
		_segment(self, Vector3(side * 0.16, 0.99, -0.49), Vector3(side * 0.17, 1.11, -0.49), 0.05, 0.0, Color("ead4a6"))
		var arm := Node3D.new()
		arm.position = Vector3(side * 0.38, 0.9, 0)
		add_child(arm)
		_segment(arm, Vector3.ZERO, Vector3(side * 0.33, -0.3, -0.12), 0.15, 0.12, Color("ae8240"))
		_segment(arm, Vector3(side * 0.33, -0.3, -0.12), Vector3(side * 0.42, -0.58, -0.28), 0.12, 0.15, Color("b58b44"))
		_ball(arm, Vector3(side * 0.42, -0.58, -0.28), Vector3(0.19, 0.13, 0.16), Color("b58b44"))
		for finger in range(3):
			var start := Vector3(side * 0.42 + (finger - 1) * 0.12, -0.61, -0.38)
			_segment(arm, start, start + Vector3(0, -0.2, -0.19), 0.045, 0.0, Color("e3ce99"))
		limbs.append(arm)
		var leg := Node3D.new()
		leg.position = Vector3(side * 0.22, 0.4, 0.03)
		add_child(leg)
		_segment(leg, Vector3.ZERO, Vector3(side * 0.07, -0.27, 0), 0.14, 0.10, Color("94713a"))
		_ball(leg, Vector3(side * 0.07, -0.3, -0.12), Vector3(0.16, 0.1, 0.24), Color("ac8242"))
		for toe in range(2):
			var start := Vector3(side * 0.07 + (toe - 0.5) * 0.14, -0.31, -0.28)
			_segment(leg, start, start + Vector3(0, -0.035, -0.15), 0.055, 0, Color("e3ce99"))
		limbs.append(leg)

func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.9
	return material

func _ball(parent: Node3D, at: Vector3, size: Vector3, color: Color) -> void:
	var visual := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = 1
	mesh.height = 2
	mesh.radial_segments = 10
	mesh.rings = 5
	visual.mesh = mesh
	visual.position = at
	visual.scale = size
	visual.material_override = _material(color)
	parent.add_child(visual)

func _segment(parent: Node3D, start: Vector3, end: Vector3, bottom: float, top: float, color: Color) -> void:
	var visual := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.bottom_radius = bottom
	mesh.top_radius = top
	mesh.height = start.distance_to(end)
	mesh.radial_segments = 7
	visual.mesh = mesh
	visual.position = (start + end) * 0.5
	visual.quaternion = Quaternion(Vector3.UP, (end - start).normalized())
	visual.material_override = _material(color)
	parent.add_child(visual)

func sync(delta: float, moving: bool, attacking: bool) -> void:
	time += delta * (8 if moving else 2)
	position.y = sin(time * 2) * (0.035 if moving else 0.012)
	for i in range(limbs.size()):
		limbs[i].rotation.x = sin(time + (PI if i >= 2 else 0)) * (0.3 if moving else 0.03)
		if attacking and i % 2 == 0:
			limbs[i].rotation.x = -0.9
