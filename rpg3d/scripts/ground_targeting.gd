extends RefCounted
## Manual ground targeting leaves combat running and spends nothing until confirmed.
var slot := -1
var point := Vector3.INF
var valid := false
var marker: Node3D
var hint: PanelContainer
var text: Label
var material: StandardMaterial3D
var previous_mouse_mode := Input.MOUSE_MODE_CAPTURED

func active() -> bool: return slot >= 0

func begin(game, selected_slot: int) -> void:
	cancel()
	slot = selected_slot
	previous_mouse_mode = Input.mouse_mode
	var area: Dictionary = game.class_combat.ground_area(game.player_class, slot)
	marker = Node3D.new()
	marker.name = "PlayerAreaTarget"
	game.active_zone.add_child(marker)
	material = StandardMaterial3D.new()
	material.albedo_color = Color("89e6bb")
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	var ring := TorusMesh.new()
	ring.inner_radius = float(area.radius) - 0.06
	ring.outer_radius = float(area.radius)
	ring.rings = 64
	ring.ring_segments = 6
	var mesh := MeshInstance3D.new()
	mesh.mesh = ring
	mesh.material_override = material
	mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	marker.add_child(mesh)
	for angle in [0.0, PI / 2]:
		var line := MeshInstance3D.new()
		var shape := BoxMesh.new()
		shape.size = Vector3(0.6, 0.015, 0.035)
		line.mesh = shape
		line.material_override = material
		line.rotation.y = angle
		marker.add_child(line)
	hint = PanelContainer.new()
	game.hud.root.add_child(hint)
	hint.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	hint.offset_left = -380
	hint.offset_right = 380
	hint.offset_top = -154
	hint.offset_bottom = -101
	hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var box := StyleBoxFlat.new()
	box.bg_color = Color(0.04, 0.07, 0.09, 0.94)
	box.set_content_margin_all(8)
	hint.add_theme_stylebox_override("panel", box)
	text = Label.new()
	text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint.add_child(text)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	update(game)

func update(game) -> void:
	if not active(): return
	var mouse: Vector2 = game.get_viewport().get_mouse_position()
	var origin: Vector3 = game.camera.project_ray_origin(mouse)
	var query := PhysicsRayQueryParameters3D.create(origin, origin + game.camera.project_ray_normal(mouse) * 150)
	query.exclude = _actors(game)
	var hit: Dictionary = game.get_world_3d().direct_space_state.intersect_ray(query)
	point = Vector3.INF if hit.is_empty() else hit.position
	valid = not hit.is_empty() and hit.normal.y > 0.7 and game.class_combat.valid_ground_target(game, slot, point)
	marker.visible = point.is_finite()
	if marker.visible: marker.global_position = point + Vector3.UP * 0.06
	material.albedo_color = Color("89e6bb") if valid else Color("ed716e")
	var definition: Dictionary = game.PlayerClasses.get_definition(game.player_class)
	var area: Dictionary = game.class_combat.ground_area(game.player_class, slot)
	text.text = "%s · Alcance %.0fm\n%s · Botão direito / Esc: cancelar" % [definition.skill_names[slot], area.range, "Clique no chão para lançar" if valid else "Escolha um ponto no chão, dentro do alcance e sem obstáculos"]

func _actors(game) -> Array[RID]:
	var actors: Array[RID] = [game.player.get_rid()]
	for foe in game.enemies: actors.append(foe.get_rid())
	return actors

func confirm(game) -> bool:
	if not active() or not valid or not game.class_combat.valid_ground_target(game, slot, point): return false
	var selected_slot := slot
	var destination := point
	cancel()
	return game._activate_skill(selected_slot, destination)

func cancel() -> void:
	if active(): Input.mouse_mode = previous_mouse_mode
	slot = -1
	point = Vector3.INF
	valid = false
	if is_instance_valid(marker): marker.queue_free()
	if is_instance_valid(hint): hint.queue_free()
	marker = null
	hint = null
