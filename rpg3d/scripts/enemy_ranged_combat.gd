extends RefCounted
## Projectile and ground attacks advance only with combat physics, never timers.
const Run := preload("res://scripts/instance_run.gd")
var shots: Array[Dictionary] = []
var areas: Array[Dictionary] = []

static func role_for(world: int, wave: int, index: int) -> String:
	if world == 1 and wave == 1: return "melee"
	if index == 1: return "archer"
	if index == 3 and (world >= 2 or wave >= 3): return "caster"
	if index == 4 and (world >= 5 or wave >= 5): return "archer" if wave % 2 else "caster"
	return "melee"

func _sight(game, foe) -> bool:
	var query := PhysicsRayQueryParameters3D.create(foe.global_position + Vector3.UP * 1.2, game.player.global_position + Vector3.UP)
	var excluded: Array[RID] = []
	for other in game.enemies: excluded.append(other.get_rid())
	query.exclude = excluded
	var hit: Dictionary = game.get_world_3d().direct_space_state.intersect_ray(query)
	return not hit.is_empty() and hit.collider == game.player

func step(game, foe: CharacterBody3D, delta: float) -> void:
	var visual = foe.get_node("GrelimVisual")
	var kind := str(foe.get_meta("role"))
	var offset: Vector3 = game.player.global_position - foe.global_position
	offset.y = 0
	var distance := offset.length()
	var sight := _sight(game, foe)
	var charge := float(foe.get_meta("charge", 0.0))
	var timer := maxf(0.0, float(foe.get_meta("attack")) - delta)
	foe.set_meta("attack", timer)
	var desired := Vector3.ZERO
	if not game.dead and charge <= 0:
		var speed := float(foe.get_meta("speed"))
		if distance > 12 or not sight: desired = offset.normalized() * speed
		elif distance < 6: desired = -offset.normalized() * speed * 0.75
	foe.velocity = Vector3(move_toward(foe.velocity.x, desired.x, delta * 8), -5, move_toward(foe.velocity.z, desired.z, delta * 8))
	foe.move_and_slide()
	if distance > 0.1: foe.rotation.y = lerp_angle(foe.rotation.y, atan2(-offset.x, -offset.z), 1.0 - exp(-8 * delta))
	if game.dead:
		visual.charging = false
		visual.sync(delta, false, false)
		return
	if charge > 0:
		if not sight or distance > 22:
			foe.set_meta("charge", 0.0)
			foe.set_meta("attack", 0.8)
			visual.charging = false
		else:
			charge = maxf(0.0, charge - delta)
			foe.set_meta("charge", charge)
			if charge <= 0:
				visual.charging = false
				var casts := int(foe.get_meta("casts", 0)) + 1
				foe.set_meta("casts", casts)
				if kind == "caster" and casts % 3 == 0: _ground_spell(game, foe)
				else: _launch(game, foe, kind)
				foe.set_meta("attack", 2.6 if kind == "archer" else 3.4)
	elif timer <= 0 and distance <= 18 and sight:
		foe.set_meta("charge", 0.75 if kind == "archer" else 1.0)
		visual.charging = true
	visual.sync(delta, desired.length() > 0.1, timer > (2.3 if kind == "archer" else 3.1))

func _mesh(parent: Node3D, mesh: Mesh, color: Color, position := Vector3.ZERO) -> MeshInstance3D:
	var visual := MeshInstance3D.new()
	visual.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.8
	visual.material_override = material
	visual.position = position
	parent.add_child(visual)
	return visual

func _launch(game, foe: CharacterBody3D, kind: String) -> void:
	var visual := Node3D.new()
	visual.name = "EnemyArrow" if kind == "archer" else "EnemyArcaneBolt"
	game.active_zone.add_child(visual)
	visual.global_position = foe.get_node("GrelimVisual").projectile_origin()
	var destination: Vector3 = game.player.global_position + Vector3.UP
	var direction := (destination - visual.global_position).normalized()
	visual.quaternion = Quaternion(Vector3.FORWARD, direction)
	if kind == "archer":
		var shaft := CylinderMesh.new()
		shaft.top_radius = 0.014
		shaft.bottom_radius = 0.014
		shaft.height = 0.9
		_mesh(visual, shaft, Color("d1a36c")).rotation.x = PI / 2
		var head := CylinderMesh.new()
		head.top_radius = 0
		head.bottom_radius = 0.065
		head.height = 0.18
		_mesh(visual, head, Color("e4ded2"), Vector3(0, 0, -0.5)).rotation.x = -PI / 2
		var fin := BoxMesh.new()
		fin.size = Vector3(0.16, 0.02, 0.18)
		_mesh(visual, fin, Color("9ab3a5"), Vector3(0, 0, 0.36))
	else:
		var sphere := SphereMesh.new()
		sphere.radius = 0.19
		sphere.height = 0.38
		var bolt := _mesh(visual, sphere, Color("ca71f5"))
		bolt.material_override.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	shots.append({"visual":visual, "source":weakref(foe), "direction":direction, "remaining":24.0, "damage":float(foe.get_meta("damage")), "magical":kind == "caster", "speed":20.0 if kind == "archer" else 12.0})

func _ground_spell(game, foe: CharacterBody3D) -> void:
	var ring := TorusMesh.new()
	ring.inner_radius = 1.75
	ring.outer_radius = 1.85
	ring.rings = 36
	var visual := _mesh(game.active_zone, ring, Color("d16adf"))
	visual.name = "ShamanDangerArea"
	visual.global_position = game.player.global_position
	visual.position.y = 0.06
	visual.material_override.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	areas.append({"visual":visual, "source":weakref(foe), "position":visual.global_position, "remaining":1.15, "damage":float(foe.get_meta("damage")) * 1.15})

func _valid(game, entry: Dictionary) -> bool:
	var source = entry.source.get_ref()
	return is_instance_valid(entry.visual) and is_instance_valid(source) and source in game.enemies

func tick(game, delta: float) -> void:
	if game.dead or game.current_world == 0 or game.arena_run == null or game.arena_run.phase not in [Run.Phase.COMBAT, Run.Phase.BOSS]:
		cancel()
		return
	for shot: Dictionary in shots.duplicate():
		if not _valid(game, shot):
			_remove(shots, shot)
			continue
		var visual: Node3D = shot.visual
		var from := visual.global_position
		var distance := minf(shot.remaining, shot.speed * delta)
		var to: Vector3 = from + shot.direction * distance
		var query := PhysicsRayQueryParameters3D.create(from, to)
		var excluded: Array[RID] = []
		for foe in game.enemies: excluded.append(foe.get_rid())
		query.exclude = excluded
		var hit: Dictionary = game.get_world_3d().direct_space_state.intersect_ray(query)
		visual.global_position = to
		shot.remaining -= distance
		if not hit.is_empty() or shot.remaining <= 0:
			_remove(shots, shot)
			if not hit.is_empty() and hit.collider == game.player:
				game._receive_damage(shot.damage, shot.magical)
				if game.dead: return
	for area: Dictionary in areas.duplicate():
		if not _valid(game, area):
			_remove(areas, area)
			continue
		area.remaining -= delta
		area.visual.scale = Vector3.ONE * (1.0 + sin(area.remaining * 14) * 0.04)
		if area.remaining <= 0:
			var offset: Vector3 = game.player.global_position - area.position
			offset.y = 0
			_remove(areas, area)
			if offset.length() <= 1.8:
				game._receive_damage(area.damage, true)
				if game.dead: return

func _remove(collection: Array[Dictionary], entry: Dictionary) -> void:
	collection.erase(entry)
	if is_instance_valid(entry.visual): entry.visual.queue_free()

func cancel() -> void:
	for entry: Dictionary in shots + areas:
		if is_instance_valid(entry.visual): entry.visual.queue_free()
	shots.clear()
	areas.clear()
