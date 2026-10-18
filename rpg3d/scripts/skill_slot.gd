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
		if absf(distance) >= 18:
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

func _draw() -> void:
	draw_set_transform(Vector2(0, clampf(drag_offset, -14, 14)) if held else Vector2.ZERO)
	var gold := Color("a68d58")
	var color: Color = COLORS[slot]
	draw_rect(Rect2(Vector2.ZERO, size), Color("14191b"))
	for i in range(24):
		var glow: Color = color.darkened(0.82 + i * 0.005)
		draw_circle(size * 0.5, 29 - i, glow)
	var center := size * 0.5
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
