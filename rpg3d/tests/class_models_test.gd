extends SceneTree
## Check real class meshes, animation poses and weapon contact in the game scene.
const Village := preload("res://scripts/village.gd")
class IsolatedProgress extends "res://scripts/player_progress.gd":
	func load_profile(_path: String = DEFAULT_PATH) -> Dictionary:
		return {}
	func save_profile(_state: Dictionary, _path: String = DEFAULT_PATH) -> Error:
		return OK
var game: Node3D
var failures := 0

func _initialize() -> void:
	_run.call_deferred()

func check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: " + message)
	else:
		failures += 1
		push_error(message)

func _pose(action: String, time: float) -> void:
	game.animation.play(action, 0)
	game.animation.advance(time)
	game.animation.pause()
	await process_frame
	await process_frame

func _run() -> void:
	game = load("res://main.tscn").instantiate()
	game.progress = IsolatedProgress.new()
	root.add_child(game)
	game.smoke = true
	game.set_physics_process(false)
	for id in ["arqueiro", "mago", "healer", "tanque"]:
		game.player.position = Village.CLASS_TRAINER_POSITION + Vector3(0, 0.05, 2)
		game._interact()
		check(game._choose_class(id), "trainer changes the class and model: " + id)
		var expected := "mage" if id in ["mago", "healer"] else ("archer" if id == "arqueiro" else "fighter")
		check(game.character_model_kind == expected, "class uses its intended native model: " + id)
		var meshes: Array[Node] = game.character_model.find_children("*", "MeshInstance3D", true, false)
		var has_mage_body: bool = meshes.any(func(node: Node) -> bool: return str(node.name).to_lower().begins_with("mmagic_m000_u"))
		var has_fighter_body: bool = meshes.any(func(node: Node) -> bool: return str(node.name).to_lower().begins_with("mfighter_m000_u"))
		check(has_mage_body and not has_fighter_body if expected == "mage" else has_fighter_body and not has_mage_body, "Mage body is not a renamed Fighter: " + id)
		if expected == "mage":
			var textured_parts := 0
			var hair_parts := 0
			for node in meshes:
				var part_name := str(node.name).to_lower()
				if not part_name.begins_with("mmagic_"):
					continue
				var material: StandardMaterial3D = node.get_active_material(0)
				check(material != null and material.albedo_texture != null, "Mage part uses an original texture: %s/%s" % [id, part_name])
				textured_parts += 1
				if "_m00_ah" in part_name or "_m00_bh" in part_name:
					hair_parts += 1
					check(material.transparency == BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR, "Mage hair uses alpha cutout instead of an opaque block: " + part_name)
				else:
					check(material.transparency == BaseMaterial3D.TRANSPARENCY_DISABLED, "Mage body alpha is not treated as transparency: " + part_name)
			check(textured_parts == 7 and hair_parts == 2, "Mage contains four body parts, face and both original hair parts: " + id)
		var rig: Skeleton3D = game.character_model.find_children("*", "Skeleton3D", true, false)[0]
		await _pose("idle", 0.4)
		var hand := rig.find_bone("Bip01_L_Hand" if id == "arqueiro" else "Bip01_R_Hand")
		var idle_hand := rig.get_bone_global_pose(hand).origin
		if id != "tanque":
			var resting_hand := (rig.global_transform * rig.get_bone_global_pose(hand)).origin
			check(resting_hand.y - game.player.global_position.y < 1.15, "normal idle keeps the weapon hand lowered instead of aiming: " + id)
			check(game.ranged_attachment.bone_name == ("Weapon_L_Bone" if id == "arqueiro" else "Weapon_R_Bone"), "weapon uses the hand socket instead of the shield socket: " + id)
			var weapon: Node3D = game.ranged_weapon.get_child(0)
			check(str(weapon.name) == ("OriginalShortBow" if id == "arqueiro" else "OriginalApprenticesRod"), "class uses the extracted client weapon: " + id)
			for action in ["idle", "walk", "run", "attack", "skill"]:
				await _pose(action, 0.4 if action != "attack" else 0.7)
				var hand_at := (rig.global_transform * rig.get_bone_global_pose(hand)).origin
				check(weapon.global_position.distance_to(hand_at) < 0.15, "weapon grip stays at the animated hand: %s/%s" % [id, action])
			await _pose("attack", 0.7)
			check(rig.get_bone_global_pose(hand).origin.distance_to(idle_hand) * 0.038 > 0.15, "native draw/cast animation changes the arm pose: " + id)
			game._toggle_inventory()
			check(game.hud.inventory_panel.source == game.character_model and game.hud.inventory_panel.preview.get_meta("class_model_kind") == expected, "inventory preview follows the selected model: " + id)
			game.hud.inventory_panel.select_item(0)
			check(game.hud.inventory_panel.selected_name.text == ("Short Bow" if id == "arqueiro" else "Apprentice's Rod"), "inventory identifies the actual starter weapon: " + id)
			game._toggle_inventory()
		game.animation.play("death", 0)
		game.animation.advance(game.animation.get_animation("death").length + 0.1)
		check(game.animation.get_animation("death").loop_mode == Animation.LOOP_NONE, "native death pose never loops: " + id)
		game.attack_clock = 0
		game._play("idle")
	check(game.shield_attachment.visible and game.character_model_kind == "fighter", "returning to tank restores the approved Fighter and shield")
	game.queue_free()
	await process_frame
	print("CLASS MODELS COMPLETE: %d failures" % failures)
	quit(0 if failures == 0 else 1)
