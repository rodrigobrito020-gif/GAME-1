extends StaticBody3D
## Humano da vila. O controlador do jogo resolve a interação por proximidade.
const FIGHTER := preload("res://assets/human_fighter.glb")
const DISPLAY_TITLE := "Instrutor de classes"
const INTERACTION_TEXT := "E · Escolher classe"
var character_model: Node3D
var animation: AnimationPlayer
@export var display_title := DISPLAY_TITLE
@export var interaction_text := INTERACTION_TEXT
@export var npc_group := "class_trainer"

func _ready() -> void:
	add_to_group(npc_group)
	var collision := CollisionShape3D.new()
	collision.name = "TrainerCollision"
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.34
	capsule.height = 1.8
	collision.shape = capsule
	collision.position.y = 0.9
	add_child(collision)
	character_model = FIGHTER.instantiate()
	character_model.name = "HumanInstructor"
	add_child(character_model)
	# Use the complete leather outfit rather than overlapping both clothing sets.
	# Keep skin/face/hair textures untouched; material resources are shared with the player.
	for visual in character_model.find_children("*", "MeshInstance3D", true, false):
		var part := str(visual.name).to_lower()
		if part.begins_with("mfighter_m000_") and part.substr(14, 1) in ["u", "l", "g", "b"]:
			visual.hide()
		if part.begins_with("mfighter_m001_"):
			visual.show()
	animation = character_model.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if animation != null:
		# Localize the library before enabling looping on its idle animation.
		for library_name in animation.get_animation_library_list():
			var library := animation.get_animation_library(library_name).duplicate() as AnimationLibrary
			animation.remove_animation_library(library_name)
			animation.add_animation_library(library_name, library)
		for animation_name in animation.get_animation_list():
			if str(animation_name).ends_with("idle"):
				var clip := animation.get_animation(animation_name).duplicate() as Animation
				clip.loop_mode = Animation.LOOP_LINEAR
				var library_name := str(animation_name).get_slice("/", 0) if "/" in str(animation_name) else ""
				var clip_name := str(animation_name).get_slice("/", 1) if "/" in str(animation_name) else str(animation_name)
				var library := animation.get_animation_library(library_name)
				library.remove_animation(clip_name)
				library.add_animation(clip_name, clip)
				animation.play(animation_name)
				animation.advance(0.35)
				break
	_label(display_title, Vector3(0, 2.22, 0), 30, Color("e1d3a4"))
	_label(interaction_text, Vector3(0, 1.99, 0), 24, Color("b9d8cc"))

func _label(text: String, at: Vector3, size: int, color: Color) -> void:
	var label := Label3D.new()
	label.text = text
	label.position = at
	label.font_size = size
	label.pixel_size = 0.007
	label.modulate = color
	label.outline_modulate = Color("1b2927")
	label.outline_size = 6
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(label)
