extends CanvasLayer
## Interface do RPG: vida, atalhos, inventário e barras projetadas dos inimigos.
signal skill_requested(slot: int)
signal inventory_requested
signal item_requested(item: String)
var health: ProgressBar
var health_text: Label
var status: Label
var notice: Label
var slot_buttons: Array[Button] = []
var inventory_panel: PanelContainer
var inventory_info: Label
var item_buttons: Array[Button] = []
var enemy_layer: Control
var enemy_bars: Dictionary = {}
var root: Control
const SKILL_NAMES := ["Golpe potente", "Corte giratório", "Defesa", "Investida"]
const SKILL_HINTS := ["Golpe frontal reforçado. Recarga: 6s.", "Atinge inimigos ao redor. Recarga: 8s.", "Reduz dano recebido em 65% por 4s. Recarga: 12s.", "Avança na direção da câmera. Recarga: 7s."]

func _style(color: Color, border := Color("50615e")) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(7)
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	return style

func _label(text: String, size := 16) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return label

func _panel(parent: Node) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _style(Color(0.04, 0.07, 0.08, 0.94)))
	parent.add_child(panel)
	return panel

func _button(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.add_theme_stylebox_override("normal", _style(Color("1e363b")))
	button.add_theme_stylebox_override("disabled", _style(Color("17262b"), Color("394947")))
	button.add_theme_color_override("font_disabled_color", Color("93a19e"))
	button.add_theme_stylebox_override("hover", _style(Color("335251"), Color("d9c18d")))
	return button

func _ready() -> void:
	root = Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	enemy_layer = Control.new()
	enemy_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	enemy_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(enemy_layer)
	var player_panel := _panel(root)
	player_panel.position = Vector2(20, 18)
	player_panel.custom_minimum_size = Vector2(340, 105)
	var info := VBoxContainer.new()
	player_panel.add_child(info)
	info.add_child(_label("HUMANO GUERREIRO", 19))
	health = ProgressBar.new()
	health.custom_minimum_size = Vector2(310, 24)
	health.show_percentage = false
	health.add_theme_stylebox_override("background", _style(Color("192328")))
	health.add_theme_stylebox_override("fill", _style(Color("b4434c")))
	info.add_child(health)
	health_text = _label("", 14)
	health_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	health.add_child(health_text)
	health_text.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	status = _label("")
	info.add_child(status)
	notice = _label("Campo aberto · Explore e enfrente os Grelims", 16)
	notice.position = Vector2(24, 139)
	root.add_child(notice)
	var inventory_button := _button("Mochila [I]")
	inventory_button.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	inventory_button.offset_left = -180
	inventory_button.offset_right = -30
	inventory_button.offset_top = 24
	inventory_button.offset_bottom = 66
	inventory_button.pressed.connect(func() -> void: inventory_requested.emit())
	root.add_child(inventory_button)
	var bar := HBoxContainer.new()
	root.add_child(bar)
	bar.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	bar.offset_left = -276
	bar.offset_right = 276
	bar.offset_top = -103
	bar.offset_bottom = -31
	bar.add_theme_constant_override("separation", 8)
	for i in range(4):
		var slot := _button("%d\n%s" % [i + 1, SKILL_NAMES[i]])
		slot.custom_minimum_size = Vector2(132, 72)
		slot.tooltip_text = SKILL_HINTS[i]
		slot.pressed.connect(func() -> void: skill_requested.emit(i))
		bar.add_child(slot)
		slot_buttons.append(slot)
	var help := _label("WASD mover · Mouse câmera · Scroll zoom · Clique: espada · Shift correr · Espaço pular · I mochila · Esc cursor · R reiniciar", 14)
	root.add_child(help)
	help.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	help.offset_left = -530
	help.offset_right = 600
	help.offset_top = -25
	help.offset_bottom = -4
	var aim := _label("+", 24)
	root.add_child(aim)
	aim.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	aim.offset_left = -7
	aim.offset_right = 17
	aim.offset_top = -17
	aim.offset_bottom = 17
	_inventory()

func _inventory() -> void:
	inventory_panel = _panel(root)
	inventory_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	inventory_panel.offset_left = -270
	inventory_panel.offset_right = 270
	inventory_panel.offset_top = -215
	inventory_panel.offset_bottom = 215
	inventory_panel.custom_minimum_size = Vector2(540, 420)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 12)
	inventory_panel.add_child(column)
	column.add_child(_label("INVENTÁRIO", 23))
	inventory_info = _label("")
	column.add_child(inventory_info)
	var grid := GridContainer.new()
	grid.columns = 4
	column.add_child(grid)
	for i in range(12):
		var item := _button("—")
		item.custom_minimum_size = Vector2(122, 66)
		item.disabled = true
		grid.add_child(item)
		item_buttons.append(item)
	item_buttons[0].pressed.connect(func() -> void: item_requested.emit("sword"))
	item_buttons[1].pressed.connect(func() -> void: item_requested.emit("potion"))
	column.add_child(_label("Espada: clique para equipar ou guardar.\nPoção: clique para recuperar 40 de vida.\nO jogo fica pausado enquanto a mochila estiver aberta.", 14))
	var close := _button("Voltar ao campo [I / Esc]")
	close.pressed.connect(func() -> void: inventory_requested.emit())
	column.add_child(close)
	inventory_panel.hide()

func sync(hp: float, maximum: float, level: int, xp: int, cooldowns: Array, dead: bool, inventory: Dictionary, guard: float) -> void:
	health.max_value = maximum
	health.value = hp
	health_text.text = "%d / %d" % [ceili(hp), int(maximum)]
	status.text = "Nível %d · XP %d/3%s" % [level, xp, " · Defesa %.1fs" % guard if guard > 0 else ""]
	for i in range(4):
		var remaining := float(cooldowns[i])
		slot_buttons[i].text = "%d · %s\n%s" % [i + 1, SKILL_NAMES[i], "%.1fs" % remaining if remaining > 0 else "Pronta"]
		slot_buttons[i].disabled = dead or inventory_panel.visible or remaining > 0 or (i < 2 and not inventory.equipped)
	inventory_info.text = "Ouro: %d · Espada %s" % [inventory.gold, "equipada" if inventory.equipped else "guardada"]
	item_buttons[0].text = "Espada\n%s" % ("Equipada" if inventory.equipped else "Equipar")
	item_buttons[0].disabled = dead
	item_buttons[1].text = "Poção ×%d\nUsar" % inventory.potions
	item_buttons[1].disabled = dead or inventory.potions == 0 or hp >= maximum
	item_buttons[2].text = "Presa Grelim\n×%d" % inventory.fangs

func sync_enemies(enemies: Array[CharacterBody3D], camera: Camera3D) -> void:
	for foe in enemy_bars.keys():
		if not is_instance_valid(foe) or not foe in enemies:
			enemy_bars[foe].queue_free()
			enemy_bars.erase(foe)
	for foe in enemies:
		if not enemy_bars.has(foe):
			var column := VBoxContainer.new()
			column.mouse_filter = Control.MOUSE_FILTER_IGNORE
			enemy_layer.add_child(column)
			var name_label := _label("Grelim", 13)
			name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			column.add_child(name_label)
			var bar := ProgressBar.new()
			bar.name = "Life"
			bar.custom_minimum_size = Vector2(80, 7)
			bar.max_value = 60
			bar.show_percentage = false
			bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
			var back := _style(Color("182023"))
			var fill := _style(Color("b74b48"))
			for style in [back, fill]:
				style.content_margin_left = 0
				style.content_margin_right = 0
				style.content_margin_top = 0
				style.content_margin_bottom = 0
				style.set_corner_radius_all(3)
			bar.add_theme_stylebox_override("background", back)
			bar.add_theme_stylebox_override("fill", fill)
			column.add_child(bar)
			enemy_bars[foe] = column
		var widget: Control = enemy_bars[foe]
		var at := foe.global_position + Vector3.UP * 2.05
		widget.visible = not camera.is_position_behind(at) and camera.global_position.distance_to(at) < 40
		if widget.visible:
			widget.position = camera.unproject_position(at) - Vector2(40, 26)
			widget.get_node("Life").value = maxf(0, float(foe.get_meta("hp")))
