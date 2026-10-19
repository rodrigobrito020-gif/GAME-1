extends Node3D
## Lazy original meshes retain native weapon socket axes and approved scale.
const Data := preload("res://scripts/client_equipment_data.gd")
@export var weapon_key := ""
var _loaded_key := ""

func _ready() -> void:
	if not weapon_key.is_empty() and get_child_count() == 0: configure(weapon_key)

func configure(key: String) -> void:
	weapon_key = key
	if _loaded_key == key and get_child_count() > 0: return
	for child in get_children():
		remove_child(child)
		child.queue_free()
	_loaded_key = key
	if not Data.WEAPONS.has(key): return
	var entry: Dictionary = Data.WEAPONS[key]
	var model := (load(entry.scene) as PackedScene).instantiate() as Node3D
	model.name = "OriginalClientWeapon"
	model.basis = Basis(Vector3.RIGHT, PI / 2)
	model.position.x = -float(entry.get("grip_center", 0.0)) * 0.038
	add_child(model)
