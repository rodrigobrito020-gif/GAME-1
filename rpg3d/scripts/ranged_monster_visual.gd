extends "res://scripts/grelim_visual.gd"
## Original prototype creatures with different silhouettes and moving limbs.
var kind := "archer"
var charging := false
var _charge := 0.0
var _focus: Node3D

func _ready() -> void:
	if kind == "archer": _skeleton()
	else: _shaman()

func _skeleton() -> void:
	var bone := Color("d4c8a5")
	var dark := Color("34302c")
	_segment(self, Vector3(0, 0.77, 0), Vector3(0, 1.43, 0), 0.065, 0.07, bone)
	for rib in 4:
		var y := 1.05 + rib * 0.09
		for side in [-1.0, 1.0]:
			_segment(self, Vector3(0, y, 0), Vector3(side * 0.23, y - 0.02, -0.1), 0.034, 0.035, bone)
			_segment(self, Vector3(side * 0.23, y - 0.02, -0.1), Vector3(side * 0.08, y - 0.06, -0.2), 0.035, 0.025, bone)
	_ball(self, Vector3(0, 0.8, 0), Vector3(0.27, 0.13, 0.16), bone)
	var skull := Node3D.new()
	skull.name = "Skull"
	add_child(skull)
	_ball(skull, Vector3(0, 1.63, 0), Vector3(0.22, 0.26, 0.2), bone)
	_ball(skull, Vector3(0, 1.47, -0.08), Vector3(0.16, 0.07, 0.13), bone)
	for side in [-1.0, 1.0]:
		_ball(skull, Vector3(side * 0.09, 1.65, -0.175), Vector3(0.075, 0.085, 0.035), dark)
		_ball(skull, Vector3(side * 0.09, 1.65, -0.203), Vector3(0.025, 0.035, 0.015), Color("a4e6d0"))
	_ball(skull, Vector3(0, 1.56, -0.19), Vector3(0.025, 0.04, 0.03), dark)
	for tooth in 5:
		_segment(skull, Vector3((tooth - 2) * 0.05, 1.51, -0.18), Vector3((tooth - 2) * 0.05, 1.46, -0.18), 0.013, 0.013, dark)
	_make_limbs(bone, false)
	var bow := Node3D.new()
	bow.name = "BoneBow"
	limbs[0].add_child(bow)
	bow.position = Vector3(-0.1, -0.54, -0.19)
	var points := [Vector3(0, -0.53, 0.08), Vector3(0, -0.32, -0.15), Vector3(0, 0, -0.24), Vector3(0, 0.32, -0.15), Vector3(0, 0.53, 0.08)]
	for index in 4: _segment(bow, points[index], points[index + 1], 0.032, 0.028, Color("785230"))
	_segment(bow, points[0], points[4], 0.006, 0.006, Color("dfd8c6"))
	_focus = bow
	# Leather quiver and arrows rise over the shoulder.
	_segment(self, Vector3(0.15, 1, 0.21), Vector3(0.23, 1.51, 0.23), 0.11, 0.11, Color("564531"))
	for index in 4:
		_segment(self, Vector3(0.13 + index * 0.045, 1.4, 0.23), Vector3(0.2 + index * 0.045, 1.83, 0.23), 0.012, 0.012, bone)
		_ball(self, Vector3(0.2 + index * 0.045, 1.78, 0.23), Vector3(0.025, 0.08, 0.04), Color("5e7d68"))

func _shaman() -> void:
	var skin := Color("688b67")
	var robe := Color("57325b")
	_segment(self, Vector3(0, 0.16, 0), Vector3(0, 1.32, 0), 0.43, 0.26, robe)
	_segment(self, Vector3(0, 0.13, 0), Vector3(0, 0.24, 0), 0.45, 0.42, Color("b18a48"))
	_ball(self, Vector3(0, 1.58, 0), Vector3(0.3, 0.34, 0.24), skin)
	_ball(self, Vector3(0, 1.48, -0.22), Vector3(0.21, 0.14, 0.12), Color("4b6850"))
	for side in [-1.0, 1.0]:
		_segment(self, Vector3(side * 0.24, 1.65, 0), Vector3(side * 0.58, 1.74, 0.08), 0.14, 0, skin)
		_ball(self, Vector3(side * 0.12, 1.65, -0.21), Vector3(0.08, 0.05, 0.04), Color("e7abfa"))
		_segment(self, Vector3(side * 0.12, 1.4, -0.3), Vector3(side * 0.15, 1.55, -0.33), 0.045, 0, Color("e8ddbc"))
		_ball(self, Vector3(side * 0.32, 1.28, 0), Vector3(0.2, 0.16, 0.23), robe)
		_segment(self, Vector3(side * 0.17, 1.83, 0), Vector3(side * 0.35, 2.06, 0.05), 0.09, 0, Color("c6b98f"))
	_make_limbs(skin, true)
	var staff := Node3D.new()
	staff.name = "ShamanStaff"
	limbs[2].add_child(staff)
	staff.position = Vector3(0.1, -0.53, -0.2)
	_segment(staff, Vector3(0, -0.6, 0), Vector3(0, 1.1, 0), 0.035, 0.05, Color("60452e"))
	for side in [-1.0, 1.0]:
		_segment(staff, Vector3(0, 0.95, 0), Vector3(side * 0.15, 1.15, 0), 0.04, 0.02, Color("bf9452"))
	_ball(staff, Vector3(0, 1.16, 0), Vector3(0.13, 0.17, 0.13), Color("c471e6"))
	_focus = staff
	var mask := Node3D.new()
	mask.name = "RitualMask"
	add_child(mask)
	for tooth in 3:
		_segment(mask, Vector3((tooth - 1) * 0.12, 1.24, -0.3), Vector3((tooth - 1) * 0.12, 1.07, -0.3), 0.04, 0, Color("ded1af"))

func _make_limbs(color: Color, clothed: bool) -> void:
	for side in [-1.0, 1.0]:
		var arm := Node3D.new()
		arm.position = Vector3(side * 0.31, 1.3, 0)
		add_child(arm)
		_segment(arm, Vector3.ZERO, Vector3(side * 0.13, -0.28, 0), 0.075 if clothed else 0.045, 0.07 if clothed else 0.04, color)
		_segment(arm, Vector3(side * 0.13, -0.28, 0), Vector3(side * 0.1, -0.54, -0.15), 0.06 if clothed else 0.035, 0.05 if clothed else 0.035, color)
		_ball(arm, Vector3(side * 0.1, -0.54, -0.15), Vector3(0.08, 0.08, 0.07), color)
		limbs.append(arm)
		var leg := Node3D.new()
		leg.position = Vector3(side * 0.16, 0.78, 0)
		add_child(leg)
		_segment(leg, Vector3.ZERO, Vector3(0, -0.34, 0.06), 0.065, 0.045, color)
		_segment(leg, Vector3(0, -0.34, 0.06), Vector3(0, -0.69, 0), 0.045, 0.035, color)
		_ball(leg, Vector3(0, -0.72, -0.09), Vector3(0.09, 0.06, 0.19), color)
		limbs.append(leg)

func sync(delta: float, moving: bool, _attacking: bool) -> void:
	if fallen: return
	super.sync(delta, moving, false)
	_charge = lerpf(_charge, 1.0 if charging else 0.0, 1.0 - exp(-12 * delta))
	for index in [0, 2]:
		limbs[index].rotation.x = lerpf(limbs[index].rotation.x, 1.15 if kind == "archer" else 0.75, _charge)
	if _focus != null:
		_focus.rotation.x = -limbs[0 if kind == "archer" else 2].rotation.x
		_focus.rotation.z = sin(time * 3) * 0.025 * _charge

func projectile_origin() -> Vector3:
	return _focus.to_global(Vector3(0, 1.16, 0) if kind == "caster" else Vector3(0, 0, -0.2))
