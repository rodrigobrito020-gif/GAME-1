extends Node3D

const RPGHud := preload("res://scripts/rpg_hud.gd")
const SMALL_SHIELD := preload("res://assets/small_shield.glb")
const LONG_SWORD := preload("res://assets/long_sword.glb")
const FIGHTER := preload("res://assets/human_fighter.glb")
const GrelimVisual := preload("res://scripts/grelim_visual.gd")
const OpenField := preload("res://scripts/open_field.gd")
var player: CharacterBody3D
var character_model: Node3D
var facing: Node3D
var animation: AnimationPlayer
var boom: SpringArm3D
var camera: Camera3D
var hud: CanvasLayer
var notice: Label
var yaw := 0.0
var pitch := -0.10
var hp := 100.0
var level := 1
var xp := 0
var kills := 0
var cooldown := 0.0
var attack_clock := 0.0
var skill_cooldown := 0.0
var spin_cooldown := 0.0
var guard_cooldown := 0.0
var dash_cooldown := 0.0
var guard_clock := 0.0
var dash_clock := 0.0
var dash_direction := Vector3.FORWARD
var attack_kind := 0
var automatic_skills: Array[bool] = [false, false, false, false]
var auto_potion := false
var potion_threshold := 40.0
var potion_clock := 0.0
var zoom_distance := 5.0
var inventory := {"equipped": true, "armor": true, "gloves": true, "boots": true, "shield": true, "potions": 3, "fangs": 0, "gold": 0}
var powered_attack := false
var shield_attachment: BoneAttachment3D
var sword_attachment: BoneAttachment3D
var attack_pending := false
var attack_direction := Vector3.FORWARD
var enemies: Array[CharacterBody3D] = []
var dead := false
var smoke := false
var failures := 0

func _ready() -> void:
	smoke = "--smoke-test" in OS.get_cmdline_user_args()
	_actions()
	_world()
	_player()
	_ui()
	_spawn_enemies()
	if not smoke:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	else:
		set_physics_process(false)
		_test.call_deferred()

func _actions() -> void:
	for item in [["left", KEY_A], ["right", KEY_D], ["forward", KEY_W], ["back", KEY_S], ["jump", KEY_SPACE], ["sprint", KEY_SHIFT]]:
		if not InputMap.has_action(item[0]):
			InputMap.add_action(item[0])
			var event := InputEventKey.new()
			event.physical_keycode = item[1]
			InputMap.action_add_event(item[0], event)

func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.85
	return material

func _world() -> void:
	var environment := WorldEnvironment.new()
	environment.environment = Environment.new()
	environment.environment.background_mode = Environment.BG_COLOR
	environment.environment.background_color = Color("8eabb8")
	environment.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.environment.ambient_light_color = Color("c0d3dd")
	environment.environment.ambient_light_energy = 0.65
	add_child(environment)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -28, 0)
	sun.light_color = Color("ffe9c1")
	sun.light_energy = 0.8
	sun.shadow_enabled = true
	add_child(sun)
	var sky := Sky.new()
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color("598cbe")
	sky_material.sky_horizon_color = Color("c6d8d5")
	sky_material.ground_horizon_color = Color("c6d8d5")
	sky_material.ground_bottom_color = Color("617550")
	sky.sky_material = sky_material
	environment.environment.sky = sky
	environment.environment.background_mode = Environment.BG_SKY
	var field := OpenField.new()
	field.name = "OpenField"
	add_child(field)

func _player() -> void:
	player = CharacterBody3D.new()
	player.name = "Player"
	add_child(player)
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.32
	capsule.height = 1.8
	collision.shape = capsule
	collision.position.y = 0.9
	player.add_child(collision)
	facing = Node3D.new()
	player.add_child(facing)
	var model := FIGHTER.instantiate()
	character_model = model
	model.rotation.y = PI
	facing.add_child(model)
	animation = model.find_child("AnimationPlayer", true, false) as AnimationPlayer
	for name in animation.get_animation_list():
		if name.ends_with("idle") or name.ends_with("run") or name.ends_with("walk"):
			animation.get_animation(name).loop_mode = Animation.LOOP_LINEAR
	boom = SpringArm3D.new()
	boom.spring_length = 5.0
	boom.position.y = 1.5
	boom.add_excluded_object(player.get_rid())
	player.add_child(boom)
	camera = Camera3D.new()
	camera.current = true
	camera.fov = 65
	camera.far = 1800
	boom.add_child(camera)
	_equip_sword(model)
	_restart()

func _equip_sword(model: Node3D) -> void:
	var skeleton: Skeleton3D = model.find_children("*", "Skeleton3D", true, false)[0]
	sword_attachment = BoneAttachment3D.new()
	sword_attachment.bone_name = "Weapon_R_Bone"
	skeleton.add_child(sword_attachment)
	var sword := Node3D.new()
	sword.name = "Sword"
	sword.scale = Vector3.ONE / 0.038
	sword_attachment.add_child(sword)
	var blade := LONG_SWORD.instantiate()
	blade.name = "OriginalLongSword"
	# A malha está em eixos glTF; o socket conserva os eixos locais originais.
	# Cancelar a conversão (x,y,z) -> (x,z,-y), sem mudar a direção nativa da lâmina.
	blade.basis = Basis(Vector3.RIGHT, PI / 2)
	# Centro do cabo original em X=-1.85 unidades, convertido para metros.
	blade.position.x = 1.85 * 0.038
	sword.add_child(blade)
	shield_attachment = BoneAttachment3D.new()
	shield_attachment.name = "ShieldAttachment"
	shield_attachment.bone_name = "Shield_L_Bone"
	skeleton.add_child(shield_attachment)
	var shield := SMALL_SHIELD.instantiate()
	shield.name = "OriginalSmallShield"
	shield.basis = Basis(Vector3.UP, -PI / 2) * Basis(Vector3.RIGHT, PI / 2)
	# Compensar somente a escala do guerreiro; preservar o tamanho original do escudo.
	var holder := Node3D.new()
	holder.scale = Vector3.ONE / 0.038
	shield_attachment.add_child(holder)
	holder.add_child(shield)

func _gear_nodes(slot: String, alternate: bool) -> Array[MeshInstance3D]:
	var results: Array[MeshInstance3D] = []
	var suffixes: Array = {"armor": ["_u", "_l"], "gloves": ["_g"], "boots": ["_b"]}[slot]
	var prefix := "mfighter_m001" if alternate else "mfighter_m000"
	for node in character_model.find_children("*", "MeshInstance3D", true, false):
		for suffix in suffixes:
			if str(node.name).to_lower().begins_with(prefix + suffix):
				results.append(node)
	return results

func _apply_equipment() -> void:
	for slot in ["armor", "gloves", "boots"]:
		for mesh in _gear_nodes(slot, false):
			mesh.visible = not bool(inventory[slot])
		for mesh in _gear_nodes(slot, true):
			mesh.visible = bool(inventory[slot])

func _play(action: String) -> void:
	for name in animation.get_animation_list():
		if name.ends_with(action):
			if animation.current_animation != name or not animation.is_playing():
				animation.play(name, 0.12)
			return

func _ui() -> void:
	hud = RPGHud.new()
	add_child(hud)
	hud.inventory_panel.set_character_source(character_model)
	notice = hud.notice
	hud.skill_requested.connect(_activate_skill)
	hud.skill_automatic_changed.connect(_set_skill_automatic)
	hud.inventory_requested.connect(_toggle_inventory)
	hud.item_requested.connect(_use_item)
	hud.potion_settings_changed.connect(_configure_potions)
	_refresh_hud()

func _maximum_hp() -> float:
	return 100.0 + (level - 1) * 20.0

func _refresh_hud() -> void:
	hud.sync(hp, _maximum_hp(), level, xp, [skill_cooldown, spin_cooldown, guard_cooldown, dash_cooldown], dead, inventory, guard_clock, auto_potion, potion_threshold, potion_clock, automatic_skills)
	hud.sync_enemies(enemies, camera)

func _toggle_inventory() -> void:
	hud.inventory_panel.visible = not hud.inventory_panel.visible
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if hud.inventory_panel.visible else Input.MOUSE_MODE_CAPTURED
	animation.speed_scale = 0.0 if hud.inventory_panel.visible else 1.0
	_refresh_hud()

func _use_item(item: String) -> bool:
	if dead:
		return false
	if item == "sword":
		if attack_clock > 0:
			return false
		inventory.equipped = not inventory.equipped
		sword_attachment.visible = inventory.equipped
	elif item == "shield":
		if attack_clock > 0:
			return false
		inventory.shield = not inventory.shield
		shield_attachment.visible = inventory.shield
	elif item in ["armor", "gloves", "boots"]:
		if attack_clock > 0:
			return false
		inventory[item] = not bool(inventory[item])
		_apply_equipment()
	elif item == "potion":
		if inventory.potions <= 0 or hp >= _maximum_hp() or potion_clock > 0:
			return false
		potion_clock = 2.0
		inventory.potions -= 1
		hp = minf(_maximum_hp(), hp + 40.0)
	else:
		return false
	_refresh_hud()
	return true

func _configure_potions(enabled: bool, threshold: float) -> void:
	auto_potion = enabled
	potion_threshold = clampf(threshold, 10, 90)
	_refresh_hud()

func _auto_potion_step(delta: float) -> void:
	potion_clock = maxf(0, potion_clock - delta)
	if auto_potion and not dead and hp > 0 and hp / _maximum_hp() * 100.0 <= potion_threshold:
		_use_item("potion")

func _activate_skill(slot: int) -> bool:
	if dead or hud.inventory_panel.visible:
		return false
	match slot:
		0:
			return _attack(true)
		1:
			if spin_cooldown > 0 or not _attack():
				return false
			attack_kind = 2
			spin_cooldown = 8.0
			_play("skill")
		2:
			if guard_cooldown > 0:
				return false
			guard_cooldown = 12.0
			guard_clock = 4.0
		3:
			if dash_cooldown > 0:
				return false
			dash_cooldown = 7.0
			dash_clock = 0.32
			dash_direction = Vector3.FORWARD.rotated(Vector3.UP, yaw)
		_:
			return false
	_refresh_hud()
	return true

func _set_skill_automatic(slot: int, enabled: bool) -> void:
	if slot >= 0 and slot < automatic_skills.size():
		automatic_skills[slot] = enabled
		_refresh_hud()

func _automatic_skills_step() -> void:
	if dead or attack_clock > 0 or hud.inventory_panel.visible:
		return
	var ready: Array[bool] = [false, false, false, false]
	for foe in enemies:
		var offset := foe.global_position - player.global_position
		offset.y = 0
		var distance := offset.length()
		var in_front := offset.normalized().dot(Vector3.FORWARD.rotated(Vector3.UP, yaw)) > 0.35
		ready[0] = ready[0] or (distance <= 3.6 and in_front)
		ready[1] = ready[1] or distance <= 3.2
		ready[2] = ready[2] or distance <= 2.5
		ready[3] = ready[3] or (distance >= 4.5 and distance <= 8.0 and in_front)
	for slot in range(automatic_skills.size()):
		if automatic_skills[slot] and ready[slot] and _activate_skill(slot):
			break

func _spawn_enemies() -> void:
	for point in [Vector3(-4, 0, -16), Vector3(5, 0, -22), Vector3(0, 0, -30)]:
		var foe := CharacterBody3D.new()
		foe.position = point
		foe.set_meta("hp", 60.0)
		foe.set_meta("attack", 0.0)
		var collision := CollisionShape3D.new()
		var shape := SphereShape3D.new()
		shape.radius = 0.65
		collision.shape = shape
		collision.position.y = 0.7
		foe.add_child(collision)
		var visual := GrelimVisual.new()
		visual.name = "GrelimVisual"
		foe.add_child(visual)
		add_child(foe)
		enemies.append(foe)

func _input(event: InputEvent) -> void:
	# TAB também funciona quando um controle da interface está com foco.
	if event is InputEventKey and event.keycode == KEY_TAB and event.pressed and not event.echo:
		_toggle_inventory()
		get_viewport().set_input_as_handled()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_I:
			_toggle_inventory()
			return
		if event.keycode == KEY_ESCAPE:
			if hud.potion_popup.visible:
				hud.potion_popup.hide()
			elif hud.inventory_panel.visible:
				_toggle_inventory()
			else:
				Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
			return
		if hud.inventory_panel.visible:
			return
		if event.keycode == KEY_R:
			_restart()
		elif event.keycode == KEY_Q:
			_use_item("potion")
		elif event.keycode >= KEY_1 and event.keycode <= KEY_4:
			_activate_skill(event.keycode - KEY_1)
	if hud.inventory_panel.visible:
		return
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			zoom_distance = clampf(zoom_distance - 0.8, 2.0, 14.0)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			zoom_distance = clampf(zoom_distance + 0.8, 2.0, 14.0)
		elif event.button_index == MOUSE_BUTTON_LEFT:
			if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
				Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
			else:
				_attack()
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		yaw -= event.relative.x * 0.003
		pitch = clampf(pitch - event.relative.y * 0.003, -1.0, 0.45)

func _physics_process(delta: float) -> void:
	if hud.inventory_panel.visible:
		_refresh_hud()
		return
	boom.rotation = Vector3(pitch, yaw, 0)
	boom.spring_length = lerpf(boom.spring_length, zoom_distance, 1.0 - exp(-10.0 * delta))
	spin_cooldown = maxf(0, spin_cooldown - delta)
	guard_cooldown = maxf(0, guard_cooldown - delta)
	dash_cooldown = maxf(0, dash_cooldown - delta)
	guard_clock = maxf(0, guard_clock - delta)
	dash_clock = maxf(0, dash_clock - delta)
	cooldown = maxf(0, cooldown - delta)
	skill_cooldown = maxf(0, skill_cooldown - delta)
	if not dead:
		var input := Input.get_vector("left", "right", "forward", "back")
		var direction := Vector3(input.x, 0, input.y).rotated(Vector3.UP, yaw)
		var speed := 6.5 if Input.is_action_pressed("sprint") else 4.0
		if dash_clock > 0:
			direction = dash_direction
			speed = 14.0
		player.velocity.x = direction.x * speed
		player.velocity.z = direction.z * speed
		if not player.is_on_floor():
			player.velocity.y -= 20 * delta
		elif Input.is_action_just_pressed("jump"):
			player.velocity.y = 7
		player.move_and_slide()
		player.position.x = clampf(player.position.x, -490.0, 490.0)
		player.position.z = clampf(player.position.z, -490.0, 490.0)
		if attack_clock > 0:
			attack_clock = maxf(0, attack_clock - delta)
			if attack_pending and attack_clock <= 0.75:
				attack_pending = false
				_melee_hit()
		else:
			if direction.length() > 0.1:
				facing.rotation.y = lerp_angle(facing.rotation.y, atan2(-direction.x, -direction.z), delta * 12)
				_play("run" if Input.is_action_pressed("sprint") or dash_clock > 0 else "walk")
			else:
				_play("idle")
	else:
		player.velocity.y -= 20 * delta
		player.move_and_slide()
	_enemies_step(delta)
	_auto_potion_step(delta)
	_automatic_skills_step()
	_refresh_hud()

func _attack(powered := false) -> bool:
	if dead or hud.inventory_panel.visible or not inventory.equipped or cooldown > 0 or (powered and skill_cooldown > 0):
		return false
	powered_attack = powered
	attack_kind = 1 if powered else 0
	if powered:
		skill_cooldown = 6.0
	cooldown = 1.57 if powered else 1.54
	attack_clock = cooldown
	attack_pending = true
	attack_direction = Vector3.FORWARD.rotated(Vector3.UP, yaw)
	facing.rotation.y = yaw
	_play("skill" if powered else "attack")
	return true

func _melee_hit() -> void:
	# Um golpe por ação; só acerta inimigos próximos, à frente e sem parede entre eles.
	if attack_kind > 0:
		_skill_arc()
	var reach := 3.2 if attack_kind == 2 else (3.6 if powered_attack else 2.6)
	for foe in enemies.duplicate():
		var offset: Vector3 = foe.global_position - player.global_position
		offset.y = 0
		if offset.length() > reach or (attack_kind != 2 and offset.normalized().dot(attack_direction) < 0.35):
			continue
		var query := PhysicsRayQueryParameters3D.create(player.global_position + Vector3.UP, foe.global_position + Vector3.UP * 0.7)
		query.exclude = [player.get_rid()]
		var hit := get_world_3d().direct_space_state.intersect_ray(query)
		if not hit.is_empty() and hit.collider == foe:
			_damage_enemy(foe, (40.0 if attack_kind == 2 else (60.0 if powered_attack else 25.0)) + (level - 1) * 5)

func _skill_arc() -> void:
	var visual := MeshInstance3D.new()
	var mesh := ImmediateMesh.new()
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = Color("8ce9ff")
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	mesh.surface_begin(Mesh.PRIMITIVE_TRIANGLE_STRIP, material)
	for i in range(33):
		var sweep := PI if attack_kind == 2 else 1.15
		var angle := lerpf(-sweep, sweep, i / 32.0)
		for radius in [2.1, 2.45]:
			mesh.surface_add_vertex(Vector3(sin(angle) * radius, 0.8, -cos(angle) * radius))
	mesh.surface_end()
	visual.mesh = mesh
	add_child(visual)
	visual.position = player.position
	visual.rotation.y = facing.rotation.y
	var tween := create_tween()
	tween.tween_property(visual, "scale", Vector3.ONE * 1.35, 0.3)
	tween.parallel().tween_property(material, "albedo_color:a", 0.0, 0.3)
	tween.tween_callback(visual.queue_free)

func _damage_enemy(foe: CharacterBody3D, amount: float) -> void:
	hud.focus_enemy = foe
	var health := float(foe.get_meta("hp")) - amount
	foe.set_meta("hp", health)
	foe.get_node("GrelimVisual").hurt()
	if health <= 0:
		enemies.erase(foe)
		foe.collision_layer = 0
		foe.collision_mask = 0
		foe.get_node("GrelimVisual").fall()
		get_tree().create_timer(2.0).timeout.connect(foe.queue_free)
		inventory.fangs += 1
		inventory.gold += 5
		xp += 1
		kills += 1
		if xp >= 3:
			xp = 0
			level += 1
			hp = 100 + (level - 1) * 20
		if enemies.is_empty():
			notice.text = "Treino concluído! Nível %d · R para jogar novamente" % level

func _enemies_step(delta: float) -> void:
	for foe in enemies:
		var direction := player.position - foe.position
		direction.y = 0
		var distance := direction.length()
		var desired := direction.normalized() * 1.8 if distance < 11 and distance > 1.3 and not dead else Vector3.ZERO
		foe.velocity.x = move_toward(foe.velocity.x, desired.x, delta * 5.0)
		foe.velocity.z = move_toward(foe.velocity.z, desired.z, delta * 5.0)
		foe.velocity.y = -5
		foe.move_and_slide()
		var timer := maxf(0, float(foe.get_meta("attack")) - delta)
		if distance < 1.6 and timer <= 0 and not dead:
			hp = maxf(0, hp - (4.2 if guard_clock > 0 else 12.0))
			timer = 1.2
			if hp <= 0:
				dead = true
				attack_pending = false
				player.velocity = Vector3.ZERO
				_play("death")
				notice.text = "Você caiu. Pressione R para tentar novamente."
		foe.set_meta("attack", timer)
		if direction.length() > 0.1:
			foe.rotation.y = lerp_angle(foe.rotation.y, atan2(-direction.x, -direction.z), 1.0 - exp(-7.0 * delta))
		foe.get_node("GrelimVisual").sync(delta, Vector2(foe.velocity.x, foe.velocity.z).length() > 0.2, timer > 1.0)

func _restart() -> void:
	player.position = Vector3(0, 0.05, 5)
	player.velocity = Vector3.ZERO
	hp = 100
	potion_clock = 0
	level = 1
	xp = 0
	kills = 0
	dead = false
	cooldown = 0
	attack_clock = 0
	skill_cooldown = 0
	spin_cooldown = 0
	guard_cooldown = 0
	dash_cooldown = 0
	guard_clock = 0
	dash_clock = 0
	inventory = {"equipped": true, "armor": true, "gloves": true, "boots": true, "shield": true, "potions": 3, "fangs": 0, "gold": 0}
	sword_attachment.visible = true
	shield_attachment.visible = true
	_apply_equipment()
	powered_attack = false
	attack_pending = false
	for foe in enemies:
		foe.queue_free()
	enemies.clear()
	if notice != null:
		_spawn_enemies()
		notice.text = "Campo aberto · Explore livremente e teste os golpes perto dos Grelims"
	_play("idle")

func _check(ok: bool, description: String) -> void:
	if not ok:
		failures += 1
		push_error(description)
	else:
		print("PASS: " + description)

func _test() -> void:
	_check(animation != null, "Fighter 3D com esqueleto importado")
	for action in ["idle", "walk", "run", "attack", "skill", "death"]:
		_play(action)
		_check(animation.current_animation.ends_with(action), "animação Fighter: " + action)
	_check(enemies[0].get_node("GrelimVisual").limbs.size() == 4, "Grelims têm corpo e membros 3D no lugar das esferas")
	_check(shield_attachment.bone_name == "Shield_L_Bone", "escudo vinculado ao braço esquerdo")
	_check(_use_item("shield") and not shield_attachment.visible, "escudo pode ser guardado no inventário")
	_check(_use_item("shield") and shield_attachment.visible, "escudo pode ser equipado novamente")
	_check(sword_attachment.bone_name == "Weapon_R_Bone", "espada vinculada à mão pelo osso da arma")
	_check(sword_attachment.has_node("Sword/OriginalLongSword"), "espada usa modelo original do cliente")
	var blade: Node3D = sword_attachment.get_node("Sword/OriginalLongSword")
	_check(blade.basis.x.normalized().dot(Vector3.RIGHT) > 0.99, "lâmina preserva eixo nativo do socket")
	var rig: Skeleton3D = character_model.find_children("*", "Skeleton3D", true, false)[0]
	_check(rig.find_bone("neutral_bone") == -1, "equipamentos não contêm influência sem osso que deforma a luva")
	_check(OpenField.SIZE == 1000.0 and has_node("OpenField/FieldCollision"), "campo aberto de 1000 por 1000 metros com chão físico")
	await _test_weapon_alignment()
	await get_tree().physics_frame
	enemies[0].position = player.position + Vector3(0, 0, -2)
	enemies[1].position = player.position + Vector3(0, 0, 2)
	await get_tree().physics_frame
	_check(_attack(), "ataque manual inicia golpe")
	_check(not _attack(), "recarga impede golpe duplicado")
	_check(float(enemies[0].get_meta("hp")) == 60.0, "dano aguarda o momento do golpe")
	_melee_hit()
	_check(float(enemies[0].get_meta("hp")) == 35.0, "golpe atinge inimigo próximo à frente")
	_check(float(enemies[1].get_meta("hp")) == 60.0 and float(enemies[2].get_meta("hp")) == 60.0, "golpe não atinge inimigo atrás ou distante")
	cooldown = 0.0
	_check(_attack(true) and skill_cooldown == 6.0, "habilidade manual inicia ataque forte e recarga")
	_melee_hit()
	_check(enemies.size() == 2, "skill causa dano reforçado no inimigo à frente")
	cooldown = 0.0
	_check(not _attack(true), "recarga da skill bloqueia repetição")
	for foe in enemies.duplicate():
		_damage_enemy(foe, 100)
	_check(enemies.is_empty() and level == 2 and kills == 3, "combate concede experiência e nível")
	_restart()
	_check(enemies.size() == 3 and hp == 100, "reinício restaura combate")
	await get_tree().physics_frame
	hp = 1
	enemies[0].position = player.position + Vector3(0, 0, -1)
	_enemies_step(0.1)
	_check(dead and animation.current_animation.ends_with("death"), "derrota reproduz morte do Fighter")
	_check(not _attack(), "morte impede ataque")
	_restart()
	player.position = Vector3(150, 0.05, 150)
	var before := player.position
	Input.action_press("forward")
	for i in range(30):
		_physics_process(1.0 / 60.0)
		await get_tree().physics_frame
	Input.action_release("forward")
	_check(player.position.z < before.z - 1 and player.position.y > -0.1, "campo permite caminhar longe do centro sem cair")
	await _test_interface()
	_test_potion_settings()
	_test_equipment()
	_test_inventory_transfers()
	_test_slot_gestures()
	print("SMOKE COMPLETE: %d falhas" % failures)
	get_tree().quit(0 if failures == 0 else 1)

func _test_weapon_alignment() -> void:
	var blade: Node3D = sword_attachment.get_node("Sword/OriginalLongSword")
	var shield: Node3D = shield_attachment.find_child("OriginalSmallShield", true, false)
	var rig: Skeleton3D = character_model.find_children("*", "Skeleton3D", true, false)[0]
	# Measured center of the original narrow handle, expressed in static GLB coordinates.
	var native_grip := Vector3(-1.85 * 0.038, 0, 0)
	for action in ["idle", "walk", "run", "attack", "skill", "death"]:
		for animation_name in animation.get_animation_list():
			if animation_name.ends_with(action):
				animation.play(animation_name, 0)
		animation.advance(0.4)
		animation.pause()
		await get_tree().process_frame
		var hand := rig.global_transform * rig.get_bone_global_pose(rig.find_bone("Bip01_R_Hand"))
		_check(blade.to_global(native_grip).distance_to(sword_attachment.global_position) < 0.001, "cabo centrado no socket: " + action)
		_check(blade.global_basis.x.normalized().dot(hand.basis.z.normalized()) > 0.98, "lâmina alinhada ao eixo da empunhadura: " + action)
		var shield_front := (shield.global_basis * Vector3.FORWARD).normalized()
		_check(shield_front.dot(shield_attachment.global_basis.y.normalized()) > 0.99 and shield.global_position.distance_to(shield_attachment.global_position) < 0.001, "face do escudo para fora do braço: " + action)
	_play("idle")

func _test_interface() -> void:
	_restart()
	await get_tree().physics_frame
	_check(hud.slot_buttons.size() == 4 and hud.item_buttons.size() == 20, "HUD tem quatro habilidades e inventário de 20 slots")
	hp = 50
	_refresh_hud()
	_check(hud.health.value == 50 and hud.health.max_value == 100, "barra de vida acompanha HP do jogador")
	_check(_use_item("potion") and hp == 90 and inventory.potions == 2, "poção recupera vida e consome uma unidade")
	potion_clock = 0
	_check(_use_item("potion") and hp == 100 and not _use_item("potion"), "cura respeita vida máxima e não desperdiça poção")
	_use_item("sword")
	_check(not sword_attachment.visible and not _attack(), "guardar espada remove arma e bloqueia golpes")
	_use_item("sword")
	_check(sword_attachment.visible, "equipar espada restaura arma")
	_toggle_inventory()
	var start := player.position
	_physics_process(0.2)
	_check(player.position == start and not _activate_skill(0), "inventário aberto pausa combate e habilidades")
	_toggle_inventory()
	_check(_activate_skill(2) and guard_clock == 4.0, "Defesa ativa proteção temporária")
	enemies[0].position = player.position + Vector3(0, 0, -1)
	_enemies_step(0.01)
	_check(is_equal_approx(hp, 95.8), "Defesa reduz dano recebido em 65 por cento")
	_check(not _activate_skill(2), "Defesa respeita recarga")
	_restart()
	await get_tree().physics_frame
	start = player.position
	_check(_activate_skill(3), "Investida é ativada pelo quarto slot")
	for i in range(10):
		_physics_process(1.0 / 60.0)
		await get_tree().physics_frame
	_check(player.position.distance_to(start) > 1 and dash_cooldown > 0, "Investida move jogador com colisão e recarga")
	_restart()
	enemies[0].position = player.position + Vector3(0, 0, -2)
	enemies[1].position = player.position + Vector3(0, 0, 2)
	await get_tree().physics_frame
	_check(_activate_skill(1), "segundo slot inicia Corte giratório")
	_melee_hit()
	_check(float(enemies[0].get_meta("hp")) == 20.0 and float(enemies[1].get_meta("hp")) == 20.0, "Corte giratório atinge inimigos na frente e atrás")
	_refresh_hud()
	_check(hud.enemy_bars[enemies[0]].get_node("Life").value == 20, "barra do monstro acompanha o dano")
	_damage_enemy(enemies[0], 100)
	_check(inventory.fangs == 1 and inventory.gold == 5, "derrotar monstro adiciona saque à mochila")
	_refresh_hud()
	_check(hud.enemy_bars.size() == enemies.size(), "barra de monstro derrotado é removida")
	var wheel := InputEventMouseButton.new()
	wheel.pressed = true
	wheel.button_index = MOUSE_BUTTON_WHEEL_UP
	for i in range(30):
		_unhandled_input(wheel)
	_check(zoom_distance == 2.0, "scroll aproxima até limite de dois metros")
	_physics_process(0.1)
	_check(boom.spring_length > 2.0 and boom.spring_length < 5.0, "zoom aproxima gradualmente")
	wheel.button_index = MOUSE_BUTTON_WHEEL_DOWN
	for i in range(30):
		_unhandled_input(wheel)
	_check(zoom_distance == 14.0, "scroll afasta até limite de 14 metros")
	var visual = enemies[0].get_node("GrelimVisual")
	var angle: float = visual.limbs[0].rotation.x
	visual.sync(1.0 / 60.0, true, true)
	_check(absf(visual.limbs[0].rotation.x - angle) < 0.2, "ataque do Grelim entra por transição suave")

func _test_potion_settings() -> void:
	_restart()
	_check(not auto_potion, "poção automática começa desativada")
	_configure_potions(true, 40)
	hp = 41
	_auto_potion_step(0.1)
	_check(hp == 41 and inventory.potions == 3, "poção automática não gasta acima do limite configurado")
	hp = 40
	_auto_potion_step(0.1)
	_check(hp == 80 and inventory.potions == 2, "poção automática cura ao atingir 40 por cento")
	hp = 20
	_auto_potion_step(0.1)
	_check(hp == 20 and inventory.potions == 2, "intervalo impede consumir várias poções seguidas")
	_auto_potion_step(2.0)
	_check(hp == 60 and inventory.potions == 1, "poção volta a funcionar após dois segundos")
	_configure_potions(false, 80)
	hp = 20
	_auto_potion_step(3.0)
	_check(hp == 20 and inventory.potions == 1, "desativar AUTO interrompe uso automático")
	_configure_potions(true, 50)
	hp = 30
	_toggle_inventory()
	_physics_process(3.0)
	_check(hp == 30 and inventory.potions == 1, "mochila pausada não consome poções")
	_toggle_inventory()
	dead = true
	hp = 0
	_auto_potion_step(3.0)
	_check(hp == 0 and inventory.potions == 1, "poção automática não revive personagem morto")
	dead = false
	hp = 10
	inventory.potions = 0
	_auto_potion_step(3.0)
	_check(hp == 10 and inventory.potions == 0, "poção automática respeita estoque vazio")
	_refresh_hud()
	_check(hud.potion_slot.slot == 4 and hud.slot_buttons.size() == 4, "poção fica separada dos quatro slots de habilidade")

func _test_equipment() -> void:
	_restart()
	for slot in ["armor", "gloves", "boots"]:
		var base := _gear_nodes(slot, false)
		var equipped := _gear_nodes(slot, true)
		_check(not base.is_empty() and not equipped.is_empty(), "malhas originais carregadas: " + slot)
		var textured := true
		for mesh in base + equipped:
			var material := mesh.get_active_material(0) as StandardMaterial3D
			textured = textured and material != null and material.albedo_texture != null
		_check(textured, "texturas originais aplicadas às duas versões: " + slot)
		var correct := true
		for mesh in base:
			correct = correct and not mesh.visible
		for mesh in equipped:
			correct = correct and mesh.visible
		_check(correct, "peça equipada substitui malha base sem sobreposição: " + slot)
		_check(_use_item(slot), "inventário permite retirar: " + slot)
		correct = true
		for mesh in base:
			correct = correct and mesh.visible
		for mesh in equipped:
			correct = correct and not mesh.visible
		_check(correct, "retirar equipamento restaura malha base: " + slot)
		_use_item(slot)
	for mesh in character_model.find_children("*", "MeshInstance3D", true, false):
		if "_m000_f" in str(mesh.name).to_lower():
			var face := mesh.get_active_material(0) as StandardMaterial3D
			_check(face != null and face.albedo_texture != null, "rosto usa textura original do LineageFaceTex")
		if "_m00_ah" in str(mesh.name).to_lower() or "_m00_bh" in str(mesh.name).to_lower():
			var hair := mesh.get_active_material(0) as StandardMaterial3D
			_check(hair.albedo_texture != null and hair.transparency == BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR, "cabelo usa textura e recorte alpha")
	var hair_parts := 0
	for mesh in character_model.find_children("*", "MeshInstance3D", true, false):
		if "_m00_ah" in str(mesh.name).to_lower() or "_m00_bh" in str(mesh.name).to_lower():
			hair_parts += 1
	_check(hair_parts == 2, "cabeça inclui as duas partes de cabelo")
	hud.inventory_panel.equipped_buttons[3].pressed.emit()
	_check(inventory.armor, "selecionar traje exibe detalhes sem alterar equipamento")
	hud.inventory_panel.action_button.pressed.emit()
	_check(not inventory.armor and inventory.gloves and inventory.boots, "slot do traje altera somente o traje selecionado")
	hud.inventory_panel.action_button.pressed.emit()
	hud.inventory_panel.set_category("Poções")
	_check(hud.item_buttons[1].visible and not hud.item_buttons[0].visible, "filtro de poções oculta armas")
	hud.inventory_panel.set_category("Todos")
	_attack()
	_check(not _use_item("armor"), "troca de roupa é bloqueada durante golpe")

func _test_inventory_transfers() -> void:
	_restart()
	if hud.inventory_panel.visible:
		_toggle_inventory()
	hud.inventory_panel.set_category("Todos")
	_toggle_inventory()
	_check(hud.inventory_panel.capacity_label.text == "MOCHILA  1 / 20", "somente poções ocupam a mochila quando todas as peças estão equipadas")
	for index in [0, 3, 4, 5, 6]:
		var key: String = hud.inventory_panel.KEYS[index]
		var item_name: String = hud.inventory_panel.NAMES[index]
		var bag_button: Button = hud.item_buttons[index]
		var equipment_button: Button = hud.inventory_panel.equipped_buttons[index]
		_check(not bag_button.visible and equipment_button.icon != null, "peça equipada aparece somente no slot correto: " + item_name)
		equipment_button.pressed.emit()
		_check(hud.inventory_panel.selected == index and hud.inventory_panel.action_button.text == "Retirar", "clique no slot inspeciona equipamento para retirar: " + item_name)
		hud.inventory_panel.action_button.pressed.emit()
		_check(not inventory[key] and equipment_button.icon == null, "Retirar esvazia o slot do personagem: " + item_name)
		_check(bag_button.visible and not bag_button.disabled and bag_button.icon != null and hud.inventory_panel.capacity_label.text == "MOCHILA  2 / 20", "Retirar devolve a peça e ocupa um espaço da mochila: " + item_name)
		bag_button.pressed.emit()
		_check(hud.inventory_panel.action_button.text == "Equipar", "peça guardada oferece Equipar: " + item_name)
		hud.inventory_panel.action_button.pressed.emit()
		_check(inventory[key] and equipment_button.icon != null and not bag_button.visible, "Equipar move a peça da mochila ao slot correto: " + item_name)
		_check(hud.inventory_panel.capacity_label.text == "MOCHILA  1 / 20", "Equipar libera o espaço da mochila: " + item_name)
	for filter_name in ["Todos", "Armas", "Trajes", "Poções", "Materiais"]:
		hud.inventory_panel.set_category(filter_name)
		var visible_cells := 0
		for child in hud.item_buttons[0].get_parent().get_children():
			if child.visible:
				visible_cells += 1
		_check(visible_cells == 20, "grade compacta mantém vinte espaços no filtro: " + filter_name)
	hud.inventory_panel.set_category("Todos")
	inventory.fangs = 6
	_refresh_hud()
	_check(hud.item_buttons[2].visible and hud.inventory_panel.capacity_label.text == "MOCHILA  2 / 20", "pilha de presas ocupa somente um espaço da mochila")
	inventory.potions = 0
	_refresh_hud()
	_check(not hud.item_buttons[1].visible and hud.inventory_panel.capacity_label.text == "MOCHILA  1 / 20", "consumir a última poção libera seu espaço da mochila")
	_toggle_inventory()
	_restart()
	_refresh_hud()

func _slot_gesture(control: Control, travel: Vector2) -> void:
	var origin := control.get_global_rect().get_center()
	var press := InputEventMouseButton.new()
	press.button_index = MOUSE_BUTTON_LEFT
	press.pressed = true
	press.global_position = origin
	control._gui_input(press)
	var motion := InputEventMouseMotion.new()
	motion.global_position = origin + travel
	control._input(motion)
	var release := InputEventMouseButton.new()
	release.button_index = MOUSE_BUTTON_LEFT
	release.global_position = origin + travel
	control._input(release)

func _test_slot_gestures() -> void:
	_configure_potions(false, 40)
	_restart()
	automatic_skills.fill(false)
	for i in range(4):
		_slot_gesture(hud.slot_buttons[i], Vector2(0, 28))
		_check(automatic_skills[i] and cooldown == 0, "arrastar para baixo ativa automático sem disparar skill: " + str(i + 1))
		_slot_gesture(hud.slot_buttons[i], Vector2(0, -28))
		_check(not automatic_skills[i], "arrastar para cima desativa automático: " + str(i + 1))
	_slot_gesture(hud.slot_buttons[0], Vector2.ZERO)
	_check(skill_cooldown == 6.0, "clique curto continua ativando habilidade manual")
	_refresh_hud()
	_slot_gesture(hud.slot_buttons[0], Vector2(0, 28))
	_check(automatic_skills[0], "recarga não impede alterar modo automático")
	_slot_gesture(hud.slot_buttons[0], Vector2(0, -28))
	_check(is_equal_approx(hud.potion_slot.global_position.y, hud.slot_buttons[0].global_position.y), "poção alinhada na mesma altura das habilidades")
	_slot_gesture(hud.potion_slot, Vector2(0, 28))
	_check(not auto_potion and not hud.potion_popup.visible, "arrastar poção não ativa automático nem abre janela")
	_slot_gesture(hud.potion_slot, Vector2(0, -28))
	_check(not auto_potion, "arrastar poção para cima não altera automático")
	var count: int = inventory.potions
	_slot_gesture(hud.potion_slot, Vector2.ZERO)
	_check(hud.potion_popup.visible and inventory.potions == count, "clicar na poção abre configuração mesmo com vida cheia")
	hud.auto_check.button_pressed = true
	_check(auto_potion, "botão da configuração ativa poção automática")
	_slot_gesture(hud.potion_slot, Vector2(0, -28))
	_check(auto_potion, "arrastar poção não desliga automático")
	hud.auto_check.button_pressed = false
	_check(not auto_potion, "botão da configuração desativa poção automática")
	hud.potion_popup.hide()
	var tab := InputEventKey.new()
	tab.keycode = KEY_TAB
	tab.pressed = true
	_input(tab)
	_check(hud.inventory_panel.visible, "TAB abre inventário")
	_check(hud.inventory_panel.preview != null and hud.inventory_panel.preview != character_model, "inventário mostra uma prévia 3D independente do personagem")
	_input(tab)
	_check(not hud.inventory_panel.visible, "TAB fecha inventário")
	for i in range(7):
		if i in [0, 3, 4, 5, 6]:
			_check(not hud.item_buttons[i].visible and hud.inventory_panel.equipped_buttons[i].icon != null, "equipamento possui ícone somente no slot do personagem: " + str(i))
		elif i == 2 and inventory.fangs == 0:
			_check(not hud.item_buttons[i].visible and hud.item_buttons[i].icon == null and hud.item_buttons[i].disabled, "material sem estoque não ocupa espaço da mochila")
		else:
			_check(hud.item_buttons[i].icon != null, "item possui ícone: " + str(i))
	_restart()
	enemies[0].position = player.position + Vector3(0, 0, -2.5)
	_set_skill_automatic(0, true)
	_toggle_inventory()
	_automatic_skills_step()
	_check(skill_cooldown == 0, "inventário pausado impede habilidades automáticas")
	_toggle_inventory()
	_automatic_skills_step()
	_check(skill_cooldown == 6.0, "skill automática dispara com inimigo próximo à frente")
	_set_skill_automatic(0, false)
	_restart()
	_automatic_skills_step()
	_check(skill_cooldown == 0, "desativar automático interrompe novos disparos")
