extends SceneTree
## Identify shared baked backgrounds from native client textures, leaving the
## source PNGs untouched. Pass --weapon-references=/path/to/export-list.json
## with a list of additional native weapon PNG paths exported by UEViewer.
const Client := preload("res://scripts/client_item_icons.gd")

func _background_color(color: Color, weapon: bool) -> bool:
	if maxf(color.r, maxf(color.g, color.b)) < 0.06:
		return true
	if weapon:
		return color.r > color.g * 1.35 and color.r > color.b * 1.25 and color.r < 0.5
	return color.g > color.r * 1.2 and color.g >= color.b and color.g < 0.5

func _initialize() -> void:
	var references: Dictionary = {false: [], true: []}
	for ref: String in Client.ICONS:
		if ref.contains(".armor_"):
			references[false].append(Client.ICONS[ref].get_image())
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--weapon-references="):
			var paths: Array = JSON.parse_string(FileAccess.get_file_as_string(argument.trim_prefix("--weapon-references=")))
			for path: String in paths:
				references[true].append(Image.load_from_file(path))
	assert(references[true].size() >= 30, "Native weapon reference exports are required")
	var palettes := {}
	for weapon: bool in [false, true]:
		var pixels: Array = []
		for y in 32:
			for x in 32:
				var counts := {}
				for image: Image in references[weapon]:
					var color := image.get_pixel(x, y)
					if _background_color(color, weapon):
						var value := color.to_rgba32()
						counts[value] = counts.get(value, 0) + 1
				var candidates: Array[Color] = []
				for value: int in counts:
					if counts[value] >= 3:
						candidates.append(Color.hex(value))
				pixels.append(candidates)
		palettes[weapon] = pixels
	var output := "extends RefCounted\n## Border-connected background masks; original client PNGs remain unchanged.\nconst ROWS := {\n"
	for ref: String in Client.ICONS:
		var image: Image = Client.ICONS[ref].get_image()
		var weapon := not ref.contains(".armor_")
		var eligible := PackedByteArray()
		eligible.resize(1024)
		for y in 32:
			for x in 32:
				var color := image.get_pixel(x, y)
				for background: Color in palettes[weapon][y * 32 + x]:
					var delta := Vector3(color.r - background.r, color.g - background.g, color.b - background.b)
					if delta.length() <= 0.09:
						eligible[y * 32 + x] = 1
		var mask := PackedByteArray()
		mask.resize(1024)
		var queue: Array[int] = []
		for pixel in 1024:
			if eligible[pixel] and (pixel % 32 in [0, 31] or pixel / 32 in [0, 31]):
				mask[pixel] = 1
				queue.append(pixel)
		var cursor := 0
		while cursor < queue.size():
			var pixel: int = queue[cursor]
			cursor += 1
			for neighbor in [pixel - 32, pixel + 32, pixel - 1, pixel + 1]:
				if neighbor < 0 or neighbor >= 1024 or (absi(neighbor - pixel) == 1 and neighbor / 32 != pixel / 32):
					continue
				if eligible[neighbor] and not mask[neighbor]:
					mask[neighbor] = 1
					queue.append(neighbor)
		var rows: Array[String] = []
		for y in 32:
			var row := 0
			for x in 32:
				if mask[y * 32 + x]: row |= 1 << x
			rows.append(str(row))
		output += "\t\"%s\": [%s],\n" % [ref, ",".join(rows)]
		print("MASK: %s · %d / 1024 background pixels" % [ref, queue.size()])
	output += "}\n"
	var file := FileAccess.open("res://scripts/icon_background_masks.gd", FileAccess.WRITE)
	file.store_string(output)
	file.close()
	quit()
