extends Control
## Indicador e alvo de clique circular; segue o herói no campo.
signal activated

const RADIUS := 17.0
const CENTER := Vector2(18, 18)
var kind := "tank"
var accent := Color.WHITE
var remaining := 0.0
var cooling := false
var available := false
var fallen := false

func _ready() -> void:
	size = Vector2(36, 36)
	mouse_filter = Control.MOUSE_FILTER_STOP
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

func _has_point(point: Vector2) -> bool:
	return point.distance_to(CENTER) <= RADIUS

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		accept_event()
		if available:
			activated.emit()

func _draw() -> void:
	var color := Color("ed9994") if cooling else accent
	if fallen:
		color = Color("647278")
	draw_circle(CENTER, RADIUS, Color("54282d") if cooling else Color("172e35"))
	draw_arc(CENTER, RADIUS - 1, 0, TAU, 48, color.darkened(0.45), 2, true)
	if cooling:
		draw_arc(CENTER, RADIUS - 1, -PI / 2, -PI / 2 + TAU * clampf(remaining / 9.0, 0, 1), 48, color, 2, true)
		var text := str(ceili(remaining))
		var width := ThemeDB.fallback_font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, 15).x
		draw_string(ThemeDB.fallback_font, CENTER + Vector2(-width / 2, 5), text, HORIZONTAL_ALIGNMENT_LEFT, -1, 15, color)
		return
	if not available:
		color = color.darkened(0.25)
	match kind:
		"healer":
			draw_rect(Rect2(15, 9, 6, 18), color)
			draw_rect(Rect2(9, 15, 18, 6), color)
		"tank":
			draw_colored_polygon(PackedVector2Array([Vector2(10, 10), Vector2(26, 10), Vector2(25, 21), Vector2(18, 28), Vector2(11, 21)]), color)
		"mage":
			draw_polyline(PackedVector2Array([Vector2(21, 8), Vector2(13, 19), Vector2(22, 17), Vector2(15, 28)]), color, 3, true)
		"archer":
			draw_line(Vector2(10, 26), Vector2(26, 10), color, 2, true)
			draw_polyline(PackedVector2Array([Vector2(17, 10), Vector2(26, 10), Vector2(26, 19)]), color, 2, true)
		_:
			draw_line(Vector2(11, 26), Vector2(25, 9), color, 4, true)
			draw_line(Vector2(10, 18), Vector2(19, 26), color, 2, true)
