extends Node2D
## Efeitos desenhados sobre os personagens, abaixo da interface.
var items: Array[Dictionary] = []

func _draw() -> void:
	for item in items:
		_draw_effect(item)

func _draw_effect(item: Dictionary) -> void:
	var age: float = item.age
	var duration: float = item.duration
	var alpha := clampf((duration - age) / minf(duration, 0.25), 0, 1)
	var color: Color = item.color
	color.a *= alpha
	var origin: Vector2 = item.from
	var target: Vector2 = item.to
	var progress := clampf(age / maxf(0.01, item.hit_time), 0, 1)
	var kind: String = item.kind
	if kind == "number":
		var text: String = item.text
		draw_string(ThemeDB.fallback_font, target + Vector2(-12, -12 - age * 38), text, HORIZONTAL_ALIGNMENT_LEFT, -1, 23, color)
		return
	if kind in ["arrow", "charged_arrow", "orb", "spark"]:
		if age <= item.hit_time:
			var pos := origin.lerp(target, progress)
			var direction := (target - origin).normalized()
			if kind in ["arrow", "charged_arrow"]:
				var tail := pos - direction * (47 if kind == "charged_arrow" else 30)
				draw_line(tail, pos, color, 4 if kind == "charged_arrow" else 2, true)
				draw_line(pos, pos - direction.rotated(0.55) * 12, color, 3, true)
				draw_line(pos, pos - direction.rotated(-0.55) * 12, color, 3, true)
				if kind == "charged_arrow":
					draw_circle(pos, 10, Color(1, 0.85, 0.4, 0.25))
			else:
				var radius := 10.0 if kind == "orb" else 6.0
				draw_circle(pos, radius * 2.0, Color(color, 0.15 * alpha))
				draw_circle(pos, radius, color)
				draw_circle(pos + Vector2(-2, -2), radius * 0.35, Color("fff6e5"))
				for i in range(4):
					draw_circle(pos - direction * (i * 10 + 12) + Vector2(0, sin(age * 22 + i) * 4), 3 - i * 0.5, Color(color, alpha * (0.6 - i * 0.1)))
		else:
			_draw_impact(target, (age - item.hit_time) / 0.25, color, 27 if kind == "charged_arrow" else 19)
	elif kind in ["axe", "cleave", "hammer", "claw"]:
		if age < item.hit_time - 0.12:
			return
		var local := clampf((age - item.hit_time + 0.12) / 0.32, 0, 1)
		if kind == "claw":
			for i in range(3):
				var offset := Vector2(i * 12 - 12, 0)
				draw_line(target + offset + Vector2(20, -30), target + offset + Vector2(-25, 32) * local, color, 3, true)
		else:
			var radius := 90.0 if kind == "cleave" else (64.0 if kind == "axe" else 40.0)
			draw_arc(target, radius, -2.3, -2.3 + local * 3.8, 32, color, 8 if kind == "cleave" else (7 if kind == "axe" else 5), true)
			if age >= item.hit_time:
				_draw_impact(target, (age - item.hit_time) / 0.3, color, radius * 0.6)
	elif kind == "storm":
		var radius := 15 + 36 * minf(progress, 1)
		for i in range(4):
			var center := target + Vector2(0, 32 - i * 18)
			var spin := age * 14 + i * 1.5
			draw_arc(center, radius - i * 5, spin, spin + PI * 1.5, 28, Color(color, alpha * (0.9 - i * 0.12)), 3, true)
		for i in range(10):
			var a := age * 9 + i * TAU / 10
			draw_circle(target + Vector2(cos(a) * radius, sin(a) * 24 - i * 3), 3, color)
	elif kind == "heal":
		var floor_pos := target + Vector2(0, 45)
		draw_set_transform(floor_pos, 0, Vector2(1, 0.32))
		draw_arc(Vector2.ZERO, 24 + progress * 30, 0, TAU, 48, color, 3, true)
		draw_set_transform(Vector2.ZERO)
		for i in range(6):
			var pos := target + Vector2(sin(i * 2.4) * 28, 35 - fmod(age * 75 + i * 14, 95))
			draw_line(pos - Vector2(4, 0), pos + Vector2(4, 0), color, 2)
			draw_line(pos - Vector2(0, 4), pos + Vector2(0, 4), color, 2)
	elif kind == "barrier":
		draw_arc(target, 35 + progress * 35, 0, TAU, 48, color, 4, true)
		for i in range(8):
			var a := i * TAU / 8 + age * 2
			var pos := target + Vector2(cos(a), sin(a)) * (35 + progress * 35)
			draw_circle(pos, 3, color)

func _draw_impact(pos: Vector2, progress: float, color: Color, radius: float) -> void:
	var fade := Color(color, color.a * (1.0 - clampf(progress, 0, 1)))
	for i in range(8):
		var direction := Vector2.from_angle(i * TAU / 8)
		draw_line(pos + direction * radius * progress * 0.5, pos + direction * radius * (0.3 + progress), fade, 3, true)
