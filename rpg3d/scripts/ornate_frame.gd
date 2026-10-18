extends Control
## Small brass corner ornaments, scaled with their panel.
func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	resized.connect(queue_redraw)

func _draw() -> void:
	var brass := Color("a68c5d")
	for corner in [Vector2(3, 3), Vector2(size.x - 3, 3), Vector2(3, size.y - 3), size - Vector2(3, 3)]:
		var direction := Vector2(1 if corner.x < size.x / 2 else -1, 1 if corner.y < size.y / 2 else -1)
		var points := PackedVector2Array()
		for point in [Vector2(0, 12), Vector2(0, 4), Vector2(4, 4), Vector2(4, 0), Vector2(12, 0)]:
			points.append(corner + point * direction)
		draw_polyline(points, brass, 1, true)
		var diamond := PackedVector2Array()
		for point in [Vector2(5, 2), Vector2(8, 5), Vector2(5, 8), Vector2(2, 5), Vector2(5, 2)]:
			diamond.append(corner + point * direction)
		draw_polyline(diamond, brass, 1, true)
