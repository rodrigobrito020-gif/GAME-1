extends RefCounted
## Ranged class actions. World owns movement, cooldown ticking, enemies and saves.
const PlayerClasses := preload("res://scripts/player_classes.gd")
const LootItems := preload("res://scripts/loot_items.gd")
const InstanceRun := preload("res://scripts/instance_run.gd")
const REUSE_KEYS := ["skill_cooldown", "spin_cooldown", "guard_cooldown", "dash_cooldown"]
const OFFENSIVE_SLOTS := {"arqueiro": [0, 1, 3], "mago": [0, 1], "healer": [0, 3]}
const GROUND_AREAS := {
	"arqueiro": {3:{"radius":3.7, "range":22.0}},
	"mago": {0:{"radius":2.6, "range":22.0}, 1:{"radius":5.0, "range":16.0}},
	"healer": {2:{"radius":4.0, "range":14.0}, 3:{"radius":6.0, "range":16.0}},
}
var _projectiles: Array[Dictionary] = []
var _fields: Array[Dictionary] = []

static func ground_area(class_id: String, slot: int) -> Dictionary:
	return GROUND_AREAS.get(class_id, {}).get(slot, {})

func valid_ground_target(game, slot: int, point: Vector3) -> bool:
	var area := ground_area(game.player_class, slot)
	if area.is_empty() or not point.is_finite(): return false
	var offset: Vector3 = point - game.player.global_position
	offset.y = 0
	if offset.length() > float(area.range) + 0.01 or absf(point.x) > game.OpenField.ARENA_BOUNDARY - 0.5 or absf(point.z) > game.OpenField.ARENA_BOUNDARY - 0.5: return false
	var excluded: Array[RID] = [game.player.get_rid()]
	for foe in game.enemies: excluded.append(foe.get_rid())
	var floor_query := PhysicsRayQueryParameters3D.create(point + Vector3.UP * 0.3, point - Vector3.UP * 0.3)
	floor_query.exclude = excluded
	var floor_hit: Dictionary = game.get_world_3d().direct_space_state.intersect_ray(floor_query)
	if floor_hit.is_empty() or floor_hit.normal.y < 0.7 or absf(point.y - floor_hit.position.y) > 0.15: return false
	var query := PhysicsRayQueryParameters3D.create(game.player.global_position + Vector3.UP * 1.1, point + Vector3.UP * 0.2)
	query.exclude = excluded
	return game.get_world_3d().direct_space_state.intersect_ray(query).is_empty()

func can_activate(game, slot: int) -> bool:
	if not _available(game) or slot < 0 or slot > 3 or game.attack_clock > 0 or float(game.get(REUSE_KEYS[slot])) > 0: return false
	return slot not in OFFENSIVE_SLOTS.get(game.player_class, []) or LootItems.is_equipped(game.inventory, "sword")

func basic_attack(game, powered: bool = false) -> bool:
	if powered:
		return activate_skill(game, 0)
	if not _available(game) or not LootItems.is_equipped(game.inventory, "sword") or game.cooldown > 0 or game.attack_clock > 0:
		return false
	var id: String = game.player_class
	if id == "tanque":
		return false
	var definition := PlayerClasses.get_definition(id)
	_begin_action(game, "attack", 0.95 if id == "arqueiro" else 1.1)
	_launch(game, _target(game, float(definition.range)), "arrow" if id == "arqueiro" else ("fire" if id == "mago" else "light"), _damage(game, 25), float(definition.range))
	game._refresh_hud()
	return true

func activate_skill(game, slot: int, ground_point := Vector3.INF) -> bool:
	if not can_activate(game, slot):
		return false
	var id: String = game.player_class
	if id == "tanque":
		return false
	if slot in OFFENSIVE_SLOTS.get(id, []) and not LootItems.is_equipped(game.inventory, "sword"):
		return false
	var definition := PlayerClasses.get_definition(id)
	var target = _target(game, float(definition.range))
	var point: Vector3 = _aim_point(game, target, 10.0)
	if ground_point != Vector3.INF:
		if not valid_ground_target(game, slot, ground_point): return false
		point = ground_point
	var displacement := Vector3.ZERO
	if (id == "arqueiro" and slot == 2) or (id == "mago" and slot == 3):
		displacement = _safe_displacement(game, _forward(game) * (-5.0 if id == "arqueiro" else 8.0))
		if displacement.length() < 0.2:
			return false
	if id == "healer" and (slot == 1 or (slot == 2 and ground_point == Vector3.INF)) and game.hp >= game._maximum_hp():
		return false
	game.set(REUSE_KEYS[slot], float(definition.cooldowns[slot]))
	_begin_action(game, "skill", 0.8)
	if ground_point != Vector3.INF:
		var facing: Vector3 = point - game.player.global_position
		if Vector2(facing.x, facing.z).length() > 0.1: game.facing.rotation.y = atan2(-facing.x, -facing.z)
	match id:
		"arqueiro":
			match slot:
				0: _launch(game, target, "arrow", _damage(game, 60), 22)
				1:
					for index in range(3):
						_launch(game, target, "arrow", _damage(game, 19), 22, 0, index * 0.14)
				2:
					_flash(game.active_zone, game.player.global_position + Vector3.UP * 0.15, Color("99d4b0"), 0.8)
					game.player.global_position += displacement
					game.guard_clock = maxf(game.guard_clock, 0.9)
				3:
					if ground_point == Vector3.INF: point.y = 0.0
					_field(game, point, Color("b7d69b"), 3.7, 6.0, 0, false, _damage(game, 16), 1.0, true)
		"mago":
			match slot:
				0: _launch(game, target if ground_point == Vector3.INF else null, "fire", _damage(game, 58), 22, 2.6, 0, Vector3.INF, Vector3.INF if ground_point == Vector3.INF else point + Vector3.UP * 0.2, 4.0)
				1:
					var center: Vector3 = game.player.global_position if ground_point == Vector3.INF else point
					_flash(game.active_zone, center + Vector3.UP * 0.3, Color("ad88ed"), 5)
					_area_damage(game, center + Vector3.UP * 0.8, 5, _damage(game, 42))
					_field(game, center, Color("ad88ed"), 5, 6, 0, false, _damage(game, 42) * 0.25)
				2:
					game.guard_clock = maxf(game.guard_clock, 4.0)
					_field(game, game.player.global_position, Color("86b8f5"), 1.0, 4.0, 0, true)
				3:
					_flash(game.active_zone, game.player.global_position + Vector3.UP, Color("a68ef5"), 1)
					game.player.global_position += displacement
					_flash(game.active_zone, game.player.global_position + Vector3.UP, Color("a68ef5"), 1)
		"healer":
			match slot:
				0: _launch(game, target, "light", _damage(game, 55), 18)
				1:
					game.hp = minf(game._maximum_hp(), game.hp + 40)
					_flash(game.active_zone, game.player.global_position + Vector3.UP * 0.5, Color("c5f1a0"), 1)
				2: _field(game, game.player.global_position if ground_point == Vector3.INF else point, Color("e6d58b"), 4.0, 6.0, 10, false)
				3:
					var center: Vector3 = game.player.global_position if ground_point == Vector3.INF else point
					_flash(game.active_zone, center + Vector3.UP * 0.3, Color("ffe8a4"), 6)
					_area_damage(game, center + Vector3.UP * 0.8, 6, _damage(game, 38))
					_field(game, center, Color("ffe8a4"), 6, 6, 0, false, _damage(game, 38) * 0.25)
	game._refresh_hud()
	return true

func auto_ready(game) -> Array[bool]:
	var ready: Array[bool] = [false, false, false, false]
	if not _available(game):
		return ready
	var id: String = game.player_class
	var target = _target(game, float(PlayerClasses.get_definition(id).range))
	var close := 0
	for foe in game.enemies:
		if is_instance_valid(foe) and game.player.global_position.distance_to(foe.global_position) <= 5.0:
			close += 1
	ready[0] = target != null
	match id:
		"arqueiro":
			ready[1] = target != null
			ready[2] = close > 0 and game.hp < game._maximum_hp() * 0.85
			ready[3] = target != null and game.enemies.size() > 1
		"mago":
			ready[1] = close > 0
			ready[2] = close > 0 and game.guard_clock <= 0
			ready[3] = close > 0
		"healer":
			ready[1] = game.hp <= game._maximum_hp() - 40
			ready[2] = game.hp < game._maximum_hp() * 0.7
			ready[3] = close > 0
	if not LootItems.is_equipped(game.inventory, "sword"):
		for slot in OFFENSIVE_SLOTS.get(id, []):
			ready[slot] = false
	return ready

func tick(game, delta: float) -> void:
	if not is_finite(delta) or delta <= 0:
		return
	# Fields created on projectile impact start their own duration on this tick.
	var field_count := _fields.size()
	for index in range(_projectiles.size() - 1, -1, -1):
		var shot := _projectiles[index]
		if not _context_valid(game, shot) or not is_instance_valid(shot.visual):
			_discard(_projectiles, index)
			continue
		var elapsed := delta
		if shot.delay > 0:
			var waiting := minf(elapsed, shot.delay)
			shot.delay -= waiting
			elapsed -= waiting
			if shot.delay > 0:
				continue
		shot.visual.show()
		var destination: Vector3 = shot.destination
		var target = shot.target.get_ref() if shot.target != null else null
		if is_instance_valid(target) and target in game.enemies:
			destination = target.global_position + Vector3.UP * 0.8
		var origin: Vector3 = shot.visual.global_position
		var offset := destination - origin
		var distance := minf(minf(shot.speed * elapsed, offset.length()), shot.remaining)
		var next := origin + offset.normalized() * distance
		if offset.length_squared() > 0.0001:
			shot.visual.look_at(destination, Vector3.FORWARD if absf(offset.normalized().y) > 0.98 else Vector3.UP)
		var query := PhysicsRayQueryParameters3D.create(origin, next)
		query.exclude = [game.player.get_rid()]
		var hit: Dictionary = game.get_world_3d().direct_space_state.intersect_ray(query)
		shot.remaining -= distance
		if not hit.is_empty():
			var impact: Vector3 = hit.position - offset.normalized() * 0.035
			if _can_damage(game) and not shot.cosmetic:
				if shot.radius > 0:
					_area_damage(game, impact, shot.radius, shot.damage)
				elif hit.collider in game.enemies:
					game._damage_enemy(hit.collider, shot.damage)
			_flash(game.active_zone, impact, shot.color, maxf(0.3, shot.radius))
			_lingering_impact(game, shot, impact)
			_discard(_projectiles, index)
		elif shot.remaining <= 0 or offset.length() <= distance + 0.001:
			if shot.radius > 0 and _can_damage(game) and not shot.cosmetic:
				_area_damage(game, next, shot.radius, shot.damage)
			_flash(game.active_zone, next, shot.color, maxf(0.2, shot.radius))
			_lingering_impact(game, shot, next)
			_discard(_projectiles, index)
		else:
			shot.visual.global_position = next
	for index in range(field_count - 1, -1, -1):
		var field := _fields[index]
		if not _context_valid(game, field) or not is_instance_valid(field.visual):
			_discard(_fields, index)
			continue
		if field.follow:
			field.visual.global_position = game.player.global_position + Vector3.UP * 0.06
		var elapsed := minf(delta, field.remaining)
		field.remaining -= elapsed
		field.pulse += elapsed
		if field.rain:
			field.rain_clock += elapsed
			while field.rain_clock >= 0.2:
				field.rain_clock -= 0.2
				var angle: float = field.rain_index * 2.4
				field.rain_index += 1
				var landing: Vector3 = field.visual.global_position + Vector3(cos(angle), 0, sin(angle)) * 2.5
				_launch(game, null, "arrow", 0, 10, 0, 0, landing + Vector3.UP * 7, landing, 0, true)
		while field.pulse >= field.interval - 0.000001:
			field.pulse = maxf(0, field.pulse - field.interval)
			if field.healing > 0 and game.player.global_position.distance_to(field.visual.global_position) <= field.radius:
				game.hp = minf(game._maximum_hp(), game.hp + field.healing)
				game._refresh_hud()
			if field.damage > 0 and _can_damage(game):
				_area_damage(game, field.visual.global_position + Vector3.UP * 0.8, field.radius, field.damage)
				_flash(game.active_zone, field.visual.global_position, field.color, field.radius)
		if field.remaining <= 0.000001:
			_discard(_fields, index)

func cancel(_game = null) -> void:
	for collection in [_projectiles, _fields]:
		for effect in collection:
			if is_instance_valid(effect.visual):
				effect.visual.queue_free()
		collection.clear()

func _discard(collection: Array[Dictionary], index: int) -> void:
	if is_instance_valid(collection[index].visual):
		collection[index].visual.queue_free()
	collection.remove_at(index)

func _available(game) -> bool:
	return is_instance_valid(game) and game.current_world > 0 and not game.dead and not game._modal_open() and game.arena_run != null and game.arena_run.phase in [InstanceRun.Phase.PREPARATION, InstanceRun.Phase.COMBAT, InstanceRun.Phase.BOSS]

func _can_damage(game) -> bool:
	return not game.dead and game.arena_run != null and game.arena_run.phase in [InstanceRun.Phase.COMBAT, InstanceRun.Phase.BOSS]

func _context_valid(game, effect: Dictionary) -> bool:
	return is_instance_valid(game) and not game.dead and is_instance_valid(effect.zone) and game.active_zone == effect.zone and game.arena_run == effect.run and game.current_world > 0 and game.arena_run != null and game.arena_run.phase in [InstanceRun.Phase.PREPARATION, InstanceRun.Phase.COMBAT, InstanceRun.Phase.BOSS]

func _begin_action(game, action: String, reuse: float) -> void:
	game.attack_pending = false
	game.facing.rotation.y = game.yaw
	# Archer skills use the native shot, rather than the four-second flourish.
	# Their own reuse timer remains independent from the short attack recovery.
	game.animation.stop()
	game._play("attack" if game.player_class == "arqueiro" else action)
	var length: float = game.animation.current_animation_length
	var recovery := (0.65 if action == "skill" else 0.9) if game.player_class == "arqueiro" else maxf(0.7, length)
	game.animation.speed_scale = length / recovery if game.player_class == "arqueiro" else 1.0
	game.attack_clock = recovery
	game.cooldown = maxf(game.cooldown, recovery if game.player_class == "arqueiro" else maxf(reuse, recovery))

func _forward(game) -> Vector3:
	return Vector3.FORWARD.rotated(Vector3.UP, game.yaw)

func _damage(game, base: float) -> float:
	return base * float(PlayerClasses.get_definition(game.player_class).attack_scale) + preload("res://scripts/combat_balance.gd").attack_growth(game.level) + LootItems.bonuses(game.inventory, game.player_class).attack

func _target(game, reach: float):
	var selected = null
	var nearest := reach + 1.0
	for foe in game.enemies:
		if not is_instance_valid(foe):
			continue
		var offset: Vector3 = foe.global_position - game.player.global_position
		offset.y = 0
		var distance := offset.length()
		if distance > reach or distance >= nearest or offset.normalized().dot(_forward(game)) < 0.7:
			continue
		if _line_of_sight(game, game.player.global_position + Vector3.UP * 1.1, foe):
			selected = foe
			nearest = distance
	return selected

func _line_of_sight(game, origin: Vector3, foe) -> bool:
	var endpoint: Vector3 = foe.global_position + Vector3.UP * 0.8
	if origin.distance_squared_to(endpoint) < 0.000001: endpoint += Vector3.UP * 0.1
	var query := PhysicsRayQueryParameters3D.create(origin, endpoint)
	# A ground area can be centered inside the target's collision volume.
	query.hit_from_inside = true
	var excluded: Array[RID] = [game.player.get_rid()]
	for other in game.enemies:
		if is_instance_valid(other) and other != foe:
			excluded.append(other.get_rid())
	query.exclude = excluded
	var hit: Dictionary = game.get_world_3d().direct_space_state.intersect_ray(query)
	return not hit.is_empty() and hit.collider == foe

func _aim_point(game, target, fallback_range: float) -> Vector3:
	if is_instance_valid(target):
		return target.global_position + Vector3.UP * 0.4
	var origin: Vector3 = game.player.global_position + Vector3.UP
	var destination := origin + _forward(game) * fallback_range
	var query := PhysicsRayQueryParameters3D.create(origin, destination)
	query.exclude = [game.player.get_rid()]
	var hit: Dictionary = game.get_world_3d().direct_space_state.intersect_ray(query)
	return hit.position - _forward(game) * 0.25 if not hit.is_empty() else destination

func _safe_displacement(game, desired: Vector3) -> Vector3:
	var transform: Transform3D = game.player.global_transform
	var accepted := Vector3.ZERO
	var step := desired.normalized() * 0.25
	for index in range(ceili(desired.length() / 0.25)):
		if game.player.test_move(transform, step):
			break
		transform.origin += step
		accepted += step
	return accepted

func _area_damage(game, origin: Vector3, radius: float, amount: float) -> void:
	if not _can_damage(game):
		return
	for foe in game.enemies.duplicate():
		if not is_instance_valid(foe): continue
		var offset: Vector3 = foe.global_position - origin
		offset.y = 0
		if offset.length() <= radius and _line_of_sight(game, origin, foe):
			game._damage_enemy(foe, amount)

func _launch(game, target, kind: String, amount: float, reach: float, radius: float = 0, delay: float = 0, source: Vector3 = Vector3.INF, landing: Vector3 = Vector3.INF, lingering: float = 0, cosmetic := false) -> void:
	var color := Color("e9d8a2") if kind == "arrow" else (Color("f78c3b") if kind == "fire" else Color("fff0ad"))
	var visual := Node3D.new()
	visual.name = "ClassProjectile"
	game.active_zone.add_child(visual)
	visual.global_position = game.player.global_position + Vector3.UP * 1.12 if source == Vector3.INF else source
	if kind == "arrow":
		var shaft := CylinderMesh.new()
		shaft.top_radius = 0.018
		shaft.bottom_radius = 0.018
		shaft.height = 0.65
		shaft.radial_segments = 6
		_mesh(visual, shaft, Color("82613a"), Vector3(0, 0, 0.13)).rotation.x = -PI / 2
		var head := CylinderMesh.new()
		head.top_radius = 0
		head.bottom_radius = 0.075
		head.height = 0.18
		head.radial_segments = 4
		_mesh(visual, head, Color("d8e2df"), Vector3(0, 0, -0.26)).rotation.x = -PI / 2
		for angle in [0.0, PI / 2]:
			var fin := BoxMesh.new()
			fin.size = Vector3(0.15, 0.018, 0.17)
			_mesh(visual, fin, Color("d8d2b9"), Vector3(0, 0, 0.39)).rotation.z = angle
	else:
		var sphere := SphereMesh.new()
		sphere.radius = 0.15 if kind == "fire" else 0.12
		sphere.height = sphere.radius * 2
		sphere.radial_segments = 12
		sphere.rings = 6
		_mesh(visual, sphere, color, Vector3.ZERO)
	var destination: Vector3 = _aim_point(game, target, reach) if landing == Vector3.INF else landing
	_projectiles.append({"visual": visual, "zone": game.active_zone, "run": game.arena_run, "target": weakref(target) if is_instance_valid(target) else null, "destination": destination, "damage": amount, "radius": radius, "delay": delay, "remaining": reach, "speed": 28.0 if kind == "arrow" else 19.0, "color": color, "lingering":lingering, "cosmetic":cosmetic})
	visual.visible = delay <= 0

func _lingering_impact(game, shot: Dictionary, at: Vector3) -> void:
	if shot.lingering <= 0 or not _can_damage(game): return
	var query := PhysicsRayQueryParameters3D.create(at + Vector3.UP * 0.3, at - Vector3.UP * 8)
	var excluded: Array[RID] = [game.player.get_rid()]
	for foe in game.enemies: excluded.append(foe.get_rid())
	query.exclude = excluded
	var hit: Dictionary = game.get_world_3d().direct_space_state.intersect_ray(query)
	var floor_point: Vector3 = hit.position if not hit.is_empty() else Vector3(at.x, 0, at.z)
	_field(game, floor_point, shot.color, shot.radius, shot.lingering, 0, false, shot.damage * 0.2)

func _field(game, position: Vector3, color: Color, radius: float, duration: float, healing: float, follow: bool, damage: float = 0, interval: float = 1.0, rain := false) -> void:
	var ring := TorusMesh.new()
	ring.inner_radius = maxf(0.1, radius - 0.045)
	ring.outer_radius = radius + 0.045
	ring.rings = 32
	ring.ring_segments = 6
	var visual := _mesh(game.active_zone, ring, color, Vector3.ZERO)
	visual.global_position = position + Vector3.UP * 0.06
	visual.name = "ClassAreaEffect"
	_fields.append({"visual": visual, "zone": game.active_zone, "run": game.arena_run, "radius": radius, "remaining": duration, "pulse": 0.0, "healing": healing, "follow": follow, "damage":damage, "interval":interval, "rain":rain, "rain_clock":0.0, "rain_index":0, "color":color})

func _flash(parent: Node3D, position: Vector3, color: Color, radius: float) -> void:
	if not is_instance_valid(parent):
		return
	var mesh := TorusMesh.new()
	mesh.inner_radius = maxf(0.05, radius * 0.9)
	mesh.outer_radius = maxf(0.08, radius)
	mesh.rings = 24
	mesh.ring_segments = 6
	var visual := _mesh(parent, mesh, color, Vector3.ZERO)
	visual.global_position = position
	visual.scale = Vector3.ONE * 0.25
	var tween := visual.create_tween()
	tween.tween_property(visual, "scale", Vector3.ONE, 0.3)
	tween.tween_callback(visual.queue_free)

func _mesh(parent: Node3D, shape: Mesh, color: Color, position: Vector3) -> MeshInstance3D:
	var visual := MeshInstance3D.new()
	visual.mesh = shape
	visual.position = position
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.emission_enabled = true
	material.emission = color
	material.emission_energy_multiplier = 0.65
	material.roughness = 0.7
	visual.material_override = material
	parent.add_child(visual)
	return visual
