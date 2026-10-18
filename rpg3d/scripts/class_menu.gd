extends PanelContainer
## Class master conversation. The game controller applies the chosen class.
signal class_requested(class_id: String)
signal closed

const PlayerClasses := preload("res://scripts/player_classes.gd")
const OrnateFrame := preload("res://scripts/ornate_frame.gd")
const GOLD := Color("d1b680")
const PAPER := Color("eee4ce")

var class_buttons: Dictionary = {}
var close_button: Button
var current_label: Label
var class_panels: Dictionary = {}

func _style(background: Color, border: Color, border_width := 1) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = background
	box.border_color = border
	box.set_border_width_all(border_width)
	box.set_corner_radius_all(4)
	box.content_margin_left = 16
	box.content_margin_right = 16
	box.content_margin_top = 14
	box.content_margin_bottom = 14
	return box

func _label(text: String, font_size: int, color := PAPER, wrap := false) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if wrap:
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return label

func _button(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_font_size_override("font_size", 16)
	button.add_theme_stylebox_override("normal", _style(Color("302b22"), GOLD))
	button.add_theme_stylebox_override("hover", _style(Color("52432d"), Color("f4d99e")))
	button.add_theme_stylebox_override("pressed", _style(Color("6c512d"), Color("f4d99e"), 2))
	button.add_theme_stylebox_override("disabled", _style(Color("233a32"), Color("729e80")))
	button.add_theme_color_override("font_color", PAPER)
	button.add_theme_color_override("font_disabled_color", Color("bde0c2"))
	return button

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	offset_left = -590
	offset_right = 590
	offset_top = -325
	offset_bottom = 325
	mouse_filter = Control.MOUSE_FILTER_STOP
	add_theme_stylebox_override("panel", _style(Color("10191f"), GOLD))
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 12)
	add_child(column)
	var header := HBoxContainer.new()
	column.add_child(header)
	var title := _label("MESTRE DE CLASSES", 27, GOLD)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)
	close_button = _button("Voltar à vila [Esc]")
	close_button.pressed.connect(func() -> void: closed.emit())
	header.add_child(close_button)
	column.add_child(_label("A classe muda suas habilidades. Armas e roupas são obtidas de monstros e baús; itens incompatíveis voltam à mochila.", 15))
	current_label = _label("", 15, Color("b9d2ca"))
	column.add_child(current_label)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(scroll)
	var cards := HBoxContainer.new()
	cards.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cards.size_flags_vertical = Control.SIZE_EXPAND_FILL
	cards.add_theme_constant_override("separation", 12)
	scroll.add_child(cards)
	for id in PlayerClasses.IDS:
		_add_class_card(cards, PlayerClasses.get_definition(id))
	add_child(OrnateFrame.new())
	hide()

func _add_class_card(parent: Node, definition: Dictionary) -> void:
	var panel := PanelContainer.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.add_theme_stylebox_override("panel", _style(Color("17232b"), Color("5f625b")))
	parent.add_child(panel)
	class_panels[definition.id] = panel
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 6)
	panel.add_child(column)
	var title := _label(str(definition.name).trim_suffix(" humano").to_upper(), 20, definition.color)
	column.add_child(title)
	column.add_child(_label(definition.role, 14, Color("c4d0d2"), true))
	column.add_child(_label("Vida %d  ·  Dano %d%%\nAlcance %s m" % [definition.max_hp, roundi(definition.attack_scale * 100), str(definition.range)], 15, GOLD))
	column.add_child(_label(definition.description, 14, PAPER, true))
	column.add_child(HSeparator.new())
	for index in range(4):
		column.add_child(_label("%d · %s  [%ds]" % [index + 1, definition.skill_names[index], roundi(definition.cooldowns[index])], 14, definition.color, true))
		column.add_child(_label(definition.skill_hints[index], 12, Color("bac6ca"), true))
	var spacer := Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(spacer)
	var button := _button("Escolher classe")
	button.custom_minimum_size.y = 44
	button.pressed.connect(func() -> void:
		if not button.disabled:
			class_requested.emit(str(definition.id))
	)
	column.add_child(button)
	class_buttons[definition.id] = button
	panel.add_child(OrnateFrame.new())

func show_classes(current_id: String) -> void:
	var active := PlayerClasses.normalize(current_id)
	current_label.text = "Classe atual: %s" % PlayerClasses.get_definition(active).name
	for id in PlayerClasses.IDS:
		var current := id == active
		class_buttons[id].disabled = current
		class_buttons[id].text = "Classe atual" if current else "Escolher classe"
		class_panels[id].add_theme_stylebox_override("panel", _style(Color("203027") if current else Color("17232b"), GOLD if current else Color("5f625b"), 2 if current else 1))
	show()
