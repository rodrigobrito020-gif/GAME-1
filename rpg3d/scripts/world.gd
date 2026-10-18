extends Node3D

const FIGHTER := preload("res://assets/human_fighter.glb")
const GrelimVisual := preload("res://scripts/grelim_visual.gd")
const OpenField := preload("res://scripts/open_field.gd")
var player: CharacterBody3D
var facing: Node3D
var animation: AnimationPlayer
var boom: SpringArm3D
var camera: Camera3D
var stats: Label
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
var powered_attack := false
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
	for part in [[Vector3(0, 0.63, 0), Vector3(0.09, 0.95, 0.035), Color("bdccd4")], [Vector3(0, 0.13, 0), Vector3(0.32, 0.06, 0.08), Color("a78845")], [Vector3(0, 0.01, 0), Vector3(0.07, 0.2, 0.07), Color("493d31")]]:
		var mesh := MeshInstance3D.new()
		var box := BoxMesh.new()
		box.size = part[1]
		mesh.mesh = box
		mesh.position = part[0]
		mesh.material_override = _material(part[2])
		sword.add_child(mesh)

func _play(action: String) -> void:
	for name in animation.get_animation_list():
		if name.ends_with(action):
			if animation.current_animation != name or not animation.is_playing():
				animation.play(name, 0.12)
			return

func _ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	stats = Label.new()
	stats.position = Vector2(24, 20)
	stats.add_theme_font_size_override("font_size", 24)
	layer.add_child(stats)
	notice = Label.new()
	notice.position = Vector2(24, 60)
	notice.text = "Campo aberto · Explore livremente e teste os golpes perto dos Grelims"
	layer.add_child(notice)
	var help := Label.new()
	help.position = Vector2(24, 650)
	help.text = "WASD  mover    Mouse  câmera    Shift  correr    Espaço  pular\nClique esquerdo  espada    1  Golpe potente    Esc  liberar mouse    R  reiniciar"
	layer.add_child(help)
	var aim := Label.new()
	aim.text = "+"
	aim.position = Vector2(633, 347)
	aim.add_theme_font_size_override("font_size", 24)
	layer.add_child(aim)

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
		var label := Label3D.new()
		label.name = "Health"
		label.position.y = 2.0
		label.font_size = 40
		label.pixel_size = 0.009
		label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		label.text = "Grelim · 60"
		foe.add_child(label)
		add_child(foe)
		enemies.append(foe)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		elif event.keycode == KEY_R:
			_restart()
		elif event.keycode == KEY_1:
			_attack(true)
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		else:
			_attack()
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		yaw -= event.relative.x * 0.003
		pitch = clampf(pitch - event.relative.y * 0.003, -1.0, 0.45)

func _physics_process(delta: float) -> void:
	boom.rotation = Vector3(pitch, yaw, 0)
	cooldown = maxf(0, cooldown - delta)
	skill_cooldown = maxf(0, skill_cooldown - delta)
	if not dead:
		var input := Input.get_vector("left", "right", "forward", "back")
		var direction := Vector3(input.x, 0, input.y).rotated(Vector3.UP, yaw)
		var speed := 6.5 if Input.is_action_pressed("sprint") else 4.0
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
				_play("run" if Input.is_action_pressed("sprint") else "walk")
			else:
				_play("idle")
	else:
		player.velocity.y -= 20 * delta
		player.move_and_slide()
	_enemies_step(delta)
	stats.text = "HUMANO GUERREIRO   ·   Vida %d/%d   ·   Nível %d   ·   XP %d/3   ·   Golpe %.1fs   ·   Skill [1] %.1fs" % [ceili(hp), 100 + (level - 1) * 20, level, xp, cooldown, skill_cooldown]

func _attack(powered := false) -> bool:
	if dead or cooldown > 0 or (powered and skill_cooldown > 0):
		return false
	powered_attack = powered
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
	if powered_attack:
		_skill_arc()
	var reach := 3.6 if powered_attack else 2.6
	for foe in enemies.duplicate():
		var offset: Vector3 = foe.global_position - player.global_position
		offset.y = 0
		if offset.length() > reach or offset.normalized().dot(attack_direction) < 0.35:
			continue
		var query := PhysicsRayQueryParameters3D.create(player.global_position + Vector3.UP, foe.global_position + Vector3.UP * 0.7)
		query.exclude = [player.get_rid()]
		var hit := get_world_3d().direct_space_state.intersect_ray(query)
		if not hit.is_empty() and hit.collider == foe:
			_damage_enemy(foe, (60.0 if powered_attack else 25.0) + (level - 1) * 5)

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
		var angle := lerpf(-1.15, 1.15, i / 32.0)
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
	var health := float(foe.get_meta("hp")) - amount
	foe.set_meta("hp", health)
	foe.get_node("Health").text = "Grelim · %d" % maxi(0, ceili(health))
	if health <= 0:
		enemies.erase(foe)
		foe.queue_free()
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
		foe.velocity = direction.normalized() * 1.8 if distance < 11 and distance > 1.3 and not dead else Vector3.ZERO
		foe.velocity.y = -5
		foe.move_and_slide()
		var timer := maxf(0, float(foe.get_meta("attack")) - delta)
		if distance < 1.6 and timer <= 0 and not dead:
			hp = maxf(0, hp - 12)
			timer = 1.2
			if hp <= 0:
				dead = true
				attack_pending = false
				player.velocity = Vector3.ZERO
				_play("death")
				notice.text = "Você caiu. Pressione R para tentar novamente."
		foe.set_meta("attack", timer)
		if direction.length() > 0.1:
			foe.rotation.y = atan2(-direction.x, -direction.z)
		foe.get_node("GrelimVisual").sync(delta, foe.velocity.length() > 5.05, timer > 1.0)

func _restart() -> void:
	player.position = Vector3(0, 0.05, 5)
	player.velocity = Vector3.ZERO
	hp = 100
	level = 1
	xp = 0
	kills = 0
	dead = false
	cooldown = 0
	attack_clock = 0
	skill_cooldown = 0
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
	_check(sword_attachment.bone_name == "Weapon_R_Bone", "espada vinculada à mão pelo osso da arma")
	_check(OpenField.SIZE == 1000.0 and has_node("OpenField/FieldCollision"), "campo aberto de 1000 por 1000 metros com chão físico")
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
	print("SMOKE COMPLETE: %d falhas" % failures)
	get_tree().quit(0 if failures == 0 else 1)
