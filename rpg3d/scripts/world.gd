extends Node3D

const MAGE := preload("res://assets/human_mage.glb")
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
var cast_clock := 0.0
var cast_pending := false
var cast_direction := Vector3.FORWARD
var enemies: Array[CharacterBody3D] = []
var bolts: Array[Dictionary] = []
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

func _box(at: Vector3, size: Vector3, color: Color, solid := true) -> void:
	var mesh := MeshInstance3D.new()
	var cube := BoxMesh.new()
	cube.size = size
	mesh.mesh = cube
	mesh.material_override = _material(color)
	mesh.position = at
	add_child(mesh)
	if solid:
		var body := StaticBody3D.new()
		var collision := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = size
		collision.shape = shape
		body.position = at
		body.add_child(collision)
		add_child(body)

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
	_box(Vector3(0, -0.25, 0), Vector3(40, 0.5, 40), Color("61765b"))
	_box(Vector3(0, 0.006, -5), Vector3(6, 0.01, 28), Color("998c70"), false)
	for x in [-20, 20]:
		_box(Vector3(x, 1.5, 0), Vector3(0.5, 3, 40), Color("626c69"))
	for z in [-20, 20]:
		_box(Vector3(0, 1.5, z), Vector3(40, 3, 0.5), Color("626c69"))
	for x in [-7, 7]:
		for z in [-15, -6, 5]:
			_box(Vector3(x, 1.5, z), Vector3(1.2, 3, 1.2), Color("7c8277"))
			_box(Vector3(x, 3.1, z), Vector3(1.6, 0.3, 1.6), Color("a4a58c"))

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
	var model := MAGE.instantiate()
	model.rotation.y = PI
	facing.add_child(model)
	animation = model.find_child("AnimationPlayer", true, false) as AnimationPlayer
	for name in animation.get_animation_list():
		if name.ends_with("idle") or name.ends_with("run"):
			animation.get_animation(name).loop_mode = Animation.LOOP_LINEAR
	boom = SpringArm3D.new()
	boom.spring_length = 5.0
	boom.position.y = 1.5
	boom.add_excluded_object(player.get_rid())
	player.add_child(boom)
	camera = Camera3D.new()
	camera.current = true
	camera.fov = 65
	boom.add_child(camera)
	_restart()

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
	notice.text = "Pátio das ruínas · Derrote os guardiões de treino"
	layer.add_child(notice)
	var help := Label.new()
	help.position = Vector2(24, 650)
	help.text = "WASD  mover    Mouse  câmera    Shift  correr    Espaço  pular\nClique esquerdo / 1  magia    Esc  liberar mouse    R  reiniciar"
	layer.add_child(help)
	var aim := Label.new()
	aim.text = "+"
	aim.position = Vector2(633, 347)
	aim.add_theme_font_size_override("font_size", 24)
	layer.add_child(aim)

func _spawn_enemies() -> void:
	for point in [Vector3(-2, 0, -9), Vector3(3, 0, -13), Vector3(0, 0, -17)]:
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
		var visual := MeshInstance3D.new()
		var sphere := SphereMesh.new()
		sphere.radius = 0.65
		sphere.height = 1.3
		visual.mesh = sphere
		visual.position.y = 0.7
		visual.material_override = _material(Color("b96f43"))
		foe.add_child(visual)
		var label := Label3D.new()
		label.name = "Health"
		label.position.y = 1.7
		label.font_size = 40
		label.pixel_size = 0.009
		label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		label.text = "Guardião · 60"
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
			_cast()
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		else:
			_cast()
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		yaw -= event.relative.x * 0.003
		pitch = clampf(pitch - event.relative.y * 0.003, -1.0, 0.45)

func _physics_process(delta: float) -> void:
	boom.rotation = Vector3(pitch, yaw, 0)
	cooldown = maxf(0, cooldown - delta)
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
		if cast_clock > 0:
			cast_clock = maxf(0, cast_clock - delta)
			if cast_pending and cast_clock <= 0.35:
				cast_pending = false
				_launch()
		else:
			if direction.length() > 0.1:
				facing.rotation.y = lerp_angle(facing.rotation.y, atan2(-direction.x, -direction.z), delta * 12)
				_play("run")
			else:
				_play("idle")
	_enemies_step(delta)
	_bolts_step(delta)
	stats.text = "HUMANO MAGO   ·   Vida %d/%d   ·   Nível %d   ·   XP %d/3   ·   Magia %.1fs" % [ceili(hp), 100 + (level - 1) * 20, level, xp, cooldown]

func _cast() -> bool:
	if dead or cooldown > 0:
		return false
	cooldown = 1.0
	cast_clock = 0.83
	cast_pending = true
	var origin := player.global_position + Vector3.UP * 1.1
	var ray_origin := camera.global_position
	var ray_end := ray_origin - camera.global_basis.z * 40
	var query := PhysicsRayQueryParameters3D.create(ray_origin, ray_end)
	query.exclude = [player.get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	cast_direction = ((hit.position if not hit.is_empty() else ray_end) - origin).normalized()
	facing.rotation.y = atan2(-cast_direction.x, -cast_direction.z)
	_play("cast")
	return true

func _launch() -> void:
	var mesh := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 0.13
	sphere.height = 0.26
	mesh.mesh = sphere
	var mat := _material(Color("8ce2ff"))
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mesh.material_override = mat
	add_child(mesh)
	mesh.global_position = player.global_position + Vector3.UP * 1.1
	bolts.append({"mesh": mesh, "direction": cast_direction, "life": 2.5})

func _bolts_step(delta: float) -> void:
	for i in range(bolts.size() - 1, -1, -1):
		var bolt := bolts[i]
		var start: Vector3 = bolt.mesh.global_position
		var end: Vector3 = start + bolt.direction * delta * 19
		var query := PhysicsRayQueryParameters3D.create(start, end)
		query.exclude = [player.get_rid()]
		var hit := get_world_3d().direct_space_state.intersect_ray(query)
		bolt.mesh.global_position = end
		bolt.life -= delta
		if not hit.is_empty():
			if hit.collider in enemies:
				_damage_enemy(hit.collider, 25.0 + (level - 1) * 5)
			bolt.life = 0.0
		if bolt.life <= 0:
			bolt.mesh.queue_free()
			bolts.remove_at(i)

func _damage_enemy(foe: CharacterBody3D, amount: float) -> void:
	var health := float(foe.get_meta("hp")) - amount
	foe.set_meta("hp", health)
	foe.get_node("Health").text = "Guardião · %d" % maxi(0, ceili(health))
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
			notice.text = "Pátio concluído! Nível %d · R para jogar novamente" % level

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
				cast_pending = false
				player.velocity = Vector3.ZERO
				_play("death")
				notice.text = "Você caiu. Pressione R para tentar novamente."
		foe.set_meta("attack", timer)

func _restart() -> void:
	player.position = Vector3(0, 0.05, 5)
	player.velocity = Vector3.ZERO
	hp = 100
	level = 1
	xp = 0
	kills = 0
	dead = false
	cooldown = 0
	cast_clock = 0
	cast_pending = false
	for bolt in bolts:
		bolt.mesh.queue_free()
	bolts.clear()
	for foe in enemies:
		foe.queue_free()
	enemies.clear()
	if notice != null:
		_spawn_enemies()
		notice.text = "Pátio das ruínas · Derrote os guardiões de treino"
	_play("idle")

func _check(ok: bool, description: String) -> void:
	if not ok:
		failures += 1
		push_error(description)
	else:
		print("PASS: " + description)

func _test() -> void:
	_check(animation != null, "modelo 3D com esqueleto importado")
	for action in ["idle", "run", "cast", "death"]:
		_play(action)
		_check(animation.current_animation.ends_with(action), "animação disponível: " + action)
	await get_tree().physics_frame
	_check(_cast(), "jogador pode conjurar manualmente")
	_check(not _cast(), "recarga bloqueia disparo duplicado")
	_launch()
	_check(bolts.size() == 1, "magia cria projétil 3D")
	for bolt in bolts:
		bolt.mesh.queue_free()
	bolts.clear()
	cast_direction = (enemies[0].global_position + Vector3.UP * 0.7 - player.global_position - Vector3.UP * 1.1).normalized()
	_launch()
	for i in range(60):
		_bolts_step(1.0 / 60.0)
		await get_tree().physics_frame
	_check(float(enemies[0].get_meta("hp")) == 35.0, "projétil atinge alvo por colisão e aplica dano")
	for foe in enemies.duplicate():
		_damage_enemy(foe, 100)
	_check(enemies.is_empty() and level == 2 and kills == 3, "derrotas concedem XP e nível")
	_restart()
	_check(enemies.size() == 3 and hp == 100 and bolts.is_empty(), "reinício restaura combate")
	await get_tree().physics_frame
	hp = 1
	enemies[0].position = player.position + Vector3(0, 0, -1)
	_enemies_step(0.1)
	_check(dead and animation.current_animation.ends_with("death"), "ataque inimigo causa morte e animação")
	_check(not _cast(), "morte impede conjuração")
	_restart()
	var before := player.position
	Input.action_press("forward")
	for i in range(30):
		_physics_process(1.0 / 60.0)
		await get_tree().physics_frame
	Input.action_release("forward")
	_check(player.position.z < before.z - 1, "W movimenta o personagem pelo cenário")
	print("SMOKE COMPLETE: %d falhas" % failures)
	get_tree().quit(0 if failures == 0 else 1)
