extends Node3D
## Original client weapons. Their mesh conversion is cancelled at the native
## Weapon_L_Bone (bow) / Weapon_R_Bone (rod), never at the shield socket.
const SHORT_BOW := preload("res://assets/short_bow.glb")
const APPRENTICES_ROD := preload("res://assets/apprentices_rod.glb")
@export var class_id := "arqueiro"
@export var weapon_key := ""
const ClientVisual := preload("res://scripts/client_weapon_visual.gd")

func _ready() -> void:
	if get_child_count() == 0:
		_build()

func configure(next_class_id: String) -> void:
	if class_id == next_class_id:
		return
	class_id = next_class_id
	if not is_inside_tree():
		return
	for child in get_children():
		remove_child(child)
		child.queue_free()
	_build()

func _build() -> void:
	if class_id not in ["arqueiro", "mago", "healer"]:
		return
	if not weapon_key.is_empty():
		var client_weapon := ClientVisual.new()
		client_weapon.weapon_key = weapon_key
		add_child(client_weapon)
		return
	var weapon := (SHORT_BOW if class_id == "arqueiro" else APPRENTICES_ROD).instantiate() as Node3D
	weapon.name = "OriginalShortBow" if class_id == "arqueiro" else "OriginalApprenticesRod"
	# Same native axis conversion as the approved sword, without arbitrary turns.
	weapon.basis = Basis(Vector3.RIGHT, PI / 2)
	add_child(weapon)

func set_equipment(key: String) -> void:
	if weapon_key == key and get_child_count() > 0: return
	weapon_key = key
	for child in get_children():
		remove_child(child)
		child.queue_free()
	if key.is_empty():
		_build()
	else:
		var weapon := ClientVisual.new()
		weapon.weapon_key = key
		add_child(weapon)
