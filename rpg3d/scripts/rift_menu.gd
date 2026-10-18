extends PanelContainer
## Seleção de instância. O mundo controla entrada, pausa e progressão.
signal world_requested(world_number: int)
signal closed

var world_buttons: Array[Button] = []
var close_button: Button
var progress_label: Label

func _style(background: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	style.content_margin_left = 20
	style.content_margin_right = 20
	style.content_margin_top = 18
	style.content_margin_bottom = 18
	return style

func _label(text: String, size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return label

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	offset_left = -510
	offset_right = 510
	offset_top = -258
	offset_bottom = 258
	mouse_filter = Control.MOUSE_FILTER_STOP
	add_theme_stylebox_override("panel", _style(Color("101b21"), Color("bb9a50")))
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 16)
	add_child(column)
	var heading := HBoxContainer.new()
	column.add_child(heading)
	var title := _label("FENDA DIMENSIONAL", 28, Color("ead29e"))
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	heading.add_child(title)
	close_button = Button.new()
	close_button.text = "Voltar à vila [Esc]"
	close_button.focus_mode = Control.FOCUS_NONE
	close_button.add_theme_stylebox_override("normal", _style(Color("252b2b"), Color("766b4f")))
	close_button.add_theme_stylebox_override("hover", _style(Color("39352a"), Color("dfc68d")))
	close_button.pressed.connect(func() -> void: closed.emit())
	heading.add_child(close_button)
	column.add_child(_label("30s para se preparar · 6 ondas de 5 monstros · 10 minutos de combate · Baú ao vencer", 16, Color("cfdbde")))
	progress_label = _label("", 15, Color("b8d5b5"))
	column.add_child(progress_label)
	var grid := GridContainer.new()
	grid.columns = 5
	grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	column.add_child(grid)
	for index in range(10):
		var number := index + 1
		var button := Button.new()
		button.custom_minimum_size = Vector2(185, 126)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.size_flags_vertical = Control.SIZE_EXPAND_FILL
		button.focus_mode = Control.FOCUS_NONE
		button.add_theme_font_size_override("font_size", 19)
		button.add_theme_stylebox_override("hover", _style(Color("454139"), Color("ffe2a4")))
		button.add_theme_stylebox_override("pressed", _style(Color("514426"), Color("ffe2a4")))
		button.add_theme_stylebox_override("disabled", _style(Color("1b2226"), Color("424b4e")))
		button.add_theme_color_override("font_disabled_color", Color("7c8a90"))
		button.add_theme_color_override("font_hover_color", Color("ffedc4"))
		button.pressed.connect(func() -> void:
			if not button.disabled:
				world_requested.emit(number)
		)
		grid.add_child(button)
		world_buttons.append(button)
	column.add_child(_label("Conclua o mundo anterior para liberar o próximo. Os concluídos podem ser revisitados.", 15, Color("d3cbb5")))
	hide()

func show_worlds(unlocked: int, completed: Array[int]) -> void:
	var last_unlocked := clampi(unlocked, 1, 10)
	var finished_count := 0
	for index in range(world_buttons.size()):
		var number := index + 1
		var button := world_buttons[index]
		var finished := number in completed
		button.disabled = number > last_unlocked
		if finished:
			finished_count += 1
			button.text = "MUNDO %02d\nCONCLUÍDO\nRevisitar" % number
			button.add_theme_stylebox_override("normal", _style(Color("20352f"), Color("6d9b78")))
			button.add_theme_color_override("font_color", Color("cce5c6"))
			button.tooltip_text = "Mundo concluído. Entre novamente quando quiser.\n30s de preparação · 6 ondas de 5 · 10 minutos para vencer e abrir o baú."
		elif button.disabled:
			button.text = "MUNDO %02d\nBLOQUEADO\n—" % number
			button.tooltip_text = "Conclua o Mundo %d para liberar." % (number - 1)
		else:
			button.text = "MUNDO %02d\nLIBERADO\nEntrar" % number
			button.add_theme_stylebox_override("normal", _style(Color("3b3428"), Color("c6a963")))
			button.add_theme_color_override("font_color", Color("f1dfb5"))
			button.tooltip_text = "30s de preparação · 6 ondas de 5 monstros · Limite de 10 minutos.\nVença as ondas para abrir o baú e liberar o próximo mundo."
	progress_label.text = "%d / 10 mundos concluídos · %d / 10 liberados" % [finished_count, last_unlocked]
	show()
