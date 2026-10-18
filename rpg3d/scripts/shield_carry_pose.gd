extends SkeletonModifier3D
## Add the shield carry twist after animation, without altering the source clips.
## Skeleton3D restores the unmodified pose before each modifier pass.

@export_range(-90.0, 90.0, 1.0) var twist_degrees := 30.0
@export var shield_equipped := true:
	set(value):
		shield_equipped = value
		active = value

var _forearm_index := -1

func _process_modification() -> void:
	if not shield_equipped or is_zero_approx(twist_degrees):
		return
	var skeleton := get_skeleton()
	if skeleton == null:
		return
	if _forearm_index < 0:
		_forearm_index = skeleton.find_bone("Bip01_L_Forearm")
	if _forearm_index < 0:
		return
	# Postmultiply around the forearm's own long axis. The hand, glove and
	# shield sockets inherit the same rotation; the right arm stays untouched.
	var animated_rotation := skeleton.get_bone_pose_rotation(_forearm_index)
	var carry_twist := Quaternion(Vector3.RIGHT, deg_to_rad(twist_degrees))
	skeleton.set_bone_pose_rotation(_forearm_index, animated_rotation * carry_twist)
