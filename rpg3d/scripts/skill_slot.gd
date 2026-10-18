extends Control
## Ícones vetoriais e recarga sobre o próprio slot, sem imagens externas.
signal activated
signal automatic_changed(enabled: bool)
var automatic := false
var held := false
var press_origin := Vector2.ZERO
var drag_offset := 0.0
var maximum_drag := 0.0
var slot := 0
var class_id := "tanque":
	set(value):
		class_id = value
		queue_redraw()
var remaining := 0.0
var total := 1.0
var usable := true
var potion_count := 0
const COLORS := [Color("c5e9ca"), Color("baa7eb"), Color("9ccfe4"), Color("f1d89a"), Color("ee6c67")]

func _ready() -> void:
	custom_minimum_size = Vector2(64, 64)
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	mouse_filter = Control.MOUSE_FILTER_STOP
	mouse_entered.connect(queue_redraw)
	mouse_exited.connect(queue_redraw)

func sync(value: float, maximum: float, enabled: bool) -> void:
	remaining = value
	total = maximum
	usable = enabled
	queue_redraw()

func sync_potion(count: int, enabled: bool, reuse: float) -> void:
	potion_count = count
	sync(reuse, 2.0, enabled and reuse <= 0)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		held = true
		press_origin = event.global_position
		drag_offset = 0.0
		maximum_drag = 0.0
		accept_event()

func _input(event: InputEvent) -> void:
	if not held:
		return
	if event is InputEventMouseMotion:
		drag_offset = event.global_position.y - press_origin.y
		maximum_drag = maxf(maximum_drag, event.global_position.distance_to(press_origin))
		queue_redraw()
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
		var distance: float = event.global_position.y - press_origin.y
		maximum_drag = maxf(maximum_drag, event.global_position.distance_to(press_origin))
		held = false
		if slot != 4 and absf(distance) >= 18:
			automatic_changed.emit(distance > 0)
		elif maximum_drag < 8 and absf(distance) < 8:
			activated.emit()
		drag_offset = 0
		queue_redraw()
		get_viewport().set_input_as_handled()

func _line(a: Vector2, b: Vector2, color: Color, width := 2.0) -> void:
	draw_line(a, b, color, width, true)

func _sword(origin: Vector2, angle: float, color: Color) -> void:
	var points := PackedVector2Array([Vector2(-3, 10), Vector2(-3, -17), Vector2(0, -25), Vector2(3, -17), Vector2(3, 10)])
	for i in range(points.size()):
		points[i] = origin + points[i].rotated(angle)
	draw_colored_polygon(points, color)
	_line(origin + Vector2(-10, 10).rotated(angle), origin + Vector2(10, 10).rotated(angle), Color("bc9d62"), 3)
	_line(origin + Vector2(0, 12).rotated(angle), origin + Vector2(0, 22).rotated(angle), Color("d6c49b"), 4)

func _has_point(point: Vector2) -> bool:
	return point.distance_to(size * 0.5) <= 32 if slot == 4 else Rect2(Vector2.ZERO, size).has_point(point)

func _class_key() -> String:
	match class_id.to_lower():
		"arqueiro", "archer":
			return "arqueiro"
		"mago", "mage":
			return "mago"
		"healer", "curandeiro", "curandeira":
			return "healer"
	return "tanque"

func _skill_color() -> Color:
	match _class_key():
		"arqueiro":
			return [Color("d4e8a1"), Color("f0d493"), Color("97d7bb"), Color("b9dce4")][slot]
		"mago":
			return [Color("f4b074"), Color("d1b2ef"), Color("9edce7"), Color("b5b9f5")][slot]
		"healer":
			return [Color("f5dda0"), Color("aee5b7"), Color("a8dedc"), Color("e8e8b7")][slot]
	return COLORS[slot]

func _arrow(origin: Vector2, angle: float, length: float, color: Color, width := 2.5) -> void:
	var direction := Vector2.from_angle(angle)
	var side := direction.orthogonal()
	var tip := origin + direction * length
	_line(origin, tip - direction * 3, color, width)
	draw_colored_polygon(PackedVector2Array([tip, tip - direction * 10 + side * 5, tip - direction * 10 - side * 5]), color)
	_line(origin + direction * 4 - side * 4, origin + direction * 8, color.darkened(0.12), 1.5)
	_line(origin + direction * 4 + side * 4, origin + direction * 8, color.darkened(0.12), 1.5)

func _cross(center: Vector2, radius: float, color: Color, width := 4.0) -> void:
	_line(center - Vector2(radius, 0), center + Vector2(radius, 0), color, width)
	_line(center - Vector2(0, radius), center + Vector2(0, radius), color, width)

func _diamond(center: Vector2, radius: float, color: Color) -> void:
	draw_colored_polygon(PackedVector2Array([center + Vector2(0, -radius), center + Vector2(radius * 0.6, 0), center + Vector2(0, radius), center + Vector2(-radius * 0.6, 0)]), color)

func _draw_skill_icon(center: Vector2, color: Color) -> void:
	match _class_key():
		"arqueiro":
			_draw_archer_icon(center, color)
		"mago":
			_draw_mage_icon(center, color)
		"healer":
			_draw_healer_icon(center, color)
		_:
			_draw_tank_icon(center, color)

func _draw_archer_icon(center: Vector2, color: Color) -> void:
	match slot:
		0:
			# Arco, corda tensionada e flecha apontando para a direita.
			draw_arc(center + Vector2(-17, 0), 23, -1.4, 1.4, 24, color, 3, true)
			var string_path := PackedVector2Array([center + Vector2(-13, -23), center + Vector2(-19, 0), center + Vector2(-13, 23)])
			draw_polyline(string_path, color.lightened(0.2), 1.2, true)
			_arrow(center + Vector2(-19, 0), 0, 43, color.lightened(0.12))
		1:
			# Três trajetórias abertas, com pontas bem separadas.
			for angle in [-0.52, 0.0, 0.52]:
				_arrow(center + Vector2(-18, 0), angle, 42, color, 2)
		2:
			# Bota e rastro de um passo lateral.
			var boot := PackedVector2Array([center + Vector2(-1, -18), center + Vector2(10, -16), center + Vector2(7, 6), center + Vector2(18, 13), center + Vector2(17, 20), center + Vector2(-4, 20), center + Vector2(-7, 11)])
			draw_colored_polygon(boot, color.darkened(0.55))
			draw_polyline(boot + PackedVector2Array([boot[0]]), color, 2, true)
			for y in [-10, 0, 10]:
				_line(center + Vector2(-23, y), center + Vector2(-12, y), color, 2)
			draw_arc(center + Vector2(0, 2), 25, -2.8, -1.0, 18, color.lightened(0.15), 1.5, true)
		3:
			# Chuva de flechas descendentes.
			draw_arc(center + Vector2(0, -8), 19, PI, TAU, 20, color.darkened(0.2), 2, true)
			for x in [-16, 0, 16]:
				_arrow(center + Vector2(x, -17 if x == 0 else -10), PI / 2, 35 if x == 0 else 28, color, 2)

func _draw_mage_icon(center: Vector2, color: Color) -> void:
	match slot:
		0:
			# Chama com núcleo de orbe luminoso.
			var flame := PackedVector2Array([center + Vector2(-5, 23), center + Vector2(-19, 11), center + Vector2(-20, -2), center + Vector2(-9, -18), center + Vector2(-5, -5), center + Vector2(7, -25), center + Vector2(10, -9), center + Vector2(20, 5), center + Vector2(16, 16), center + Vector2(6, 23)])
			draw_colored_polygon(flame, color.darkened(0.22))
			draw_circle(center + Vector2(0, 9), 10, color)
			draw_circle(center + Vector2(1, 8), 5, Color("fff0c4"))
		1:
			# Explosão arcana de oito raios.
			var star := PackedVector2Array()
			for i in range(16):
				star.append(center + Vector2.from_angle(i * TAU / 16 - PI / 2) * (24 if i % 2 == 0 else 9))
			draw_colored_polygon(star, color)
			draw_circle(center, 6, Color("f6edff"))
		2:
			# Barreira curva em torno de um cristal.
			draw_arc(center, 24, -PI * 0.95, -PI * 0.05, 30, color, 3, true)
			_line(center + Vector2(-24, -3), center + Vector2(-17, 19), color, 2)
			_line(center + Vector2(24, -3), center + Vector2(17, 19), color, 2)
			_line(center + Vector2(-18, 20), center + Vector2(18, 20), color, 2)
			_diamond(center, 14, color.lightened(0.1))
		3:
			# Dois portais unidos pela trajetória de teleporte.
			for x in [-17, 17]:
				var ring := PackedVector2Array()
				for i in range(33):
					var angle := i * TAU / 32
					ring.append(center + Vector2(x + cos(angle) * 6, sin(angle) * 21))
				draw_polyline(ring, color.darkened(0.12 if x < 0 else 0.0), 2, true)
			_arrow(center + Vector2(-15, 0), 0, 33, color.lightened(0.2), 2)
			_diamond(center + Vector2(-5, 0), 9, Color("e8ddff"))

func _draw_healer_icon(center: Vector2, color: Color) -> void:
	match slot:
		0:
			# Luz sagrada: cristal e raios solares.
			for i in range(8):
				var direction := Vector2.from_angle(i * TAU / 8)
				_line(center + direction * 17, center + direction * 24, color, 2)
			_diamond(center, 15, color.lightened(0.2))
			_line(center + Vector2(-5, 0), center + Vector2(5, 0), Color("fff8df"), 2)
		1:
			# Cura direta, distinta da luz ofensiva.
			draw_circle(center, 22, color.darkened(0.73))
			draw_arc(center, 22, 0, TAU, 40, color, 2, true)
			_cross(center, 13, color.lightened(0.12), 7)
		2:
			# Santuário: cúpula, cruz e círculo de proteção no chão.
			draw_arc(center + Vector2(0, 8), 22, PI, TAU, 30, color, 2.5, true)
			_line(center + Vector2(-22, 8), center + Vector2(-22, 15), color, 2)
			_line(center + Vector2(22, 8), center + Vector2(22, 15), color, 2)
			var ground := PackedVector2Array()
			for i in range(33):
				var angle := i * TAU / 32
				ground.append(center + Vector2(cos(angle) * 23, 15 + sin(angle) * 6))
			draw_polyline(ground, color.darkened(0.1), 2, true)
			_cross(center + Vector2(0, -1), 8, color.lightened(0.2), 3)
		3:
			# Onda sagrada: pulsos ascendentes em torno de uma luz.
			for radius in [13, 20, 27]:
				draw_arc(center + Vector2(0, 17), radius, -PI * 0.9, -PI * 0.1, 24, color, 2.5, true)
			_cross(center + Vector2(0, -17), 5, color.lightened(0.2), 2.5)
			draw_circle(center + Vector2(0, 17), 3, color.lightened(0.2))

func _draw_tank_icon(center: Vector2, color: Color) -> void:
	match slot:
		0:
			_sword(center, 0.6, color)
			draw_arc(center, 24, -2.6, -0.4, 24, color.lightened(0.15), 2, true)
		1:
			_sword(center + Vector2(-3, 0), -0.65, color)
			_sword(center + Vector2(3, 0), 0.65, color.lightened(0.15))
			draw_arc(center, 25, 0.1, 2.8, 24, color, 2, true)
		2:
			var shield := PackedVector2Array([center + Vector2(-18, -19), center + Vector2(18, -19), center + Vector2(16, 5), center + Vector2(0, 23), center + Vector2(-16, 5), center + Vector2(-18, -19)])
			draw_colored_polygon(shield, color.darkened(0.62))
			draw_polyline(shield, color, 2, true)
			_line(center + Vector2(0, -14), center + Vector2(0, 15), color, 3)
			_line(center + Vector2(-10, -3), center + Vector2(10, -3), color, 3)
		3:
			for x in [-12, 4]:
				var path := PackedVector2Array([center + Vector2(x - 8, 17), center + Vector2(x + 8, 0), center + Vector2(x - 8, -17)])
				draw_polyline(path, color, 5, true)
		4:
			draw_circle(center + Vector2(0, 5), 17, Color("4b2027"))
			draw_circle(center + Vector2(0, 7), 13, color.darkened(0.3))
			draw_arc(center + Vector2(0, 5), 17, 0, TAU, 32, Color("d6c4a3"), 2, true)
			draw_rect(Rect2(center + Vector2(-7, -20), Vector2(14, 13)), Color("a1aaa0"))
			draw_rect(Rect2(center + Vector2(-9, -23), Vector2(18, 5)), Color("aa8c54"))
			_line(center + Vector2(-5, 5), center + Vector2(5, 5), Color("ffdbcc"), 2)
			_line(center + Vector2(0, 0), center + Vector2(0, 10), Color("ffdbcc"), 2)
			draw_string(ThemeDB.fallback_font, Vector2(7, size.y - 6), str(potion_count), HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color.WHITE)

func _draw() -> void:
	if slot == 4:
		_draw_potion()
		return
	draw_set_transform(Vector2(0, clampf(drag_offset, -14, 14)) if held else Vector2.ZERO)
	var gold := Color("a68d58")
	var color := _skill_color()
	draw_rect(Rect2(Vector2.ZERO, size), Color("14191b"))
	for i in range(24):
		var glow: Color = color.darkened(0.82 + i * 0.005)
		draw_circle(size * 0.5, 29 - i, glow)
	var center := size * 0.5
	_draw_skill_icon(center, color)
	if not usable:
		draw_rect(Rect2(Vector2(3, 3), size - Vector2(6, 6)), Color(0, 0, 0, 0.28))
	if remaining > 0:
		var polygon := PackedVector2Array([center])
		var progress := clampf(remaining / total, 0, 1)
		for i in range(49):
			var angle := -PI / 2 + TAU * progress * i / 48.0
			var ray := Vector2(cos(angle), sin(angle))
			polygon.append(center + ray * (29.0 / maxf(absf(ray.x), absf(ray.y))))
		if progress >= 0.999:
			draw_rect(Rect2(Vector2(3, 3), size - Vector2(6, 6)), Color(0.02, 0.02, 0.04, 0.72))
		else:
			draw_colored_polygon(polygon, Color(0.02, 0.02, 0.04, 0.72))
		var font := ThemeDB.fallback_font
		var number := str(ceili(remaining))
		draw_string(font, center + Vector2(-6, 7), number, HORIZONTAL_ALIGNMENT_LEFT, -1, 21, Color.WHITE)
	# Moldura com cantos metálicos.
	draw_rect(Rect2(Vector2(1, 1), size - Vector2(2, 2)), gold, false, 1)
	draw_rect(Rect2(Vector2(4, 4), size - Vector2(8, 8)), Color("4a4336"), false, 1)
	for corner in [Vector2(1, 1), Vector2(size.x - 1, 1), Vector2(1, size.y - 1), size - Vector2.ONE]:
		var sign_x := 1.0 if corner.x < center.x else -1.0
		var sign_y := 1.0 if corner.y < center.y else -1.0
		_line(corner, corner + Vector2(sign_x * 12, 0), Color("d1bd86"), 2)
		_line(corner, corner + Vector2(0, sign_y * 12), Color("d1bd86"), 2)
	if get_global_rect().has_point(get_global_mouse_position()) and usable:
		draw_rect(Rect2(Vector2(1, 1), size - Vector2(2, 2)), Color("f7e7b6"), false, 2)
	draw_rect(Rect2(size - Vector2(18, 19), Vector2(16, 17)), Color("131719"))
	draw_string(ThemeDB.fallback_font, size - Vector2(14, 5), "Q" if slot == 4 else str(slot + 1), HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("f1e5c7"))

	if automatic:
		draw_line(Vector2(6, 5), Vector2(size.x - 6, 5), Color("98e3ab"), 3, true)
		draw_string(ThemeDB.fallback_font, Vector2(6, 17), "AUTO", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color("c8ffcf"))

func _draw_potion() -> void:
	var center := size * 0.5
	draw_circle(center, 31, Color("14191b"))
	draw_circle(center, 27, Color("39242b"))
	draw_arc(center, 31, 0, TAU, 64, Color("cbb780"), 2, true)
	draw_arc(center, 27, 0, TAU, 64, Color("756644"), 1, true)
	draw_circle(center + Vector2(0, 4), 16, Color("a43f49"))
	draw_arc(center + Vector2(0, 4), 16, 0, TAU, 40, Color("e0c7a4"), 2, true)
	draw_rect(Rect2(center + Vector2(-6, -20), Vector2(12, 12)), Color("aaa99c"))
	draw_rect(Rect2(center + Vector2(-8, -23), Vector2(16, 5)), Color("aa8c54"))
	_line(center + Vector2(-6, 4), center + Vector2(6, 4), Color("ffdbcc"), 3)
	_line(center + Vector2(0, -2), center + Vector2(0, 10), Color("ffdbcc"), 3)
	var progress := clampf(remaining / total, 0, 1)
	if progress >= 0.999:
		draw_circle(center, 26, Color(0, 0, 0, 0.65))
	elif progress > 0.001:
		var sector := PackedVector2Array([center])
		for i in range(49):
			sector.append(center + Vector2.from_angle(-PI / 2 + TAU * progress * i / 48.0) * 26)
		draw_colored_polygon(sector, Color(0, 0, 0, 0.65))
	if automatic:
		draw_arc(center, 29, -PI, 0, 32, Color("98e3ab"), 3, true)
	if _has_point(get_local_mouse_position()):
		draw_arc(center, 31, 0, TAU, 64, Color("f7e7b6"), 2, true)
	draw_string(ThemeDB.fallback_font, Vector2(12, 54), str(potion_count), HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color.WHITE)
	draw_string(ThemeDB.fallback_font, Vector2(44, 54), "Q", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("f1e5c7"))
