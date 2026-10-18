extends CanvasLayer
## Interface do RPG: vida, atalhos, inventário e barras projetadas dos inimigos.
const SkillSlot := preload("res://scripts/skill_slot.gd")
signal skill_requested(slot: int)
signal skill_automatic_changed(slot: int, enabled: bool)
signal inventory_requested
signal item_requested(item: String)
signal potion_settings_changed(enabled: bool, threshold: float)
var health: ProgressBar
var health_text: Label
var status: Label
var notice: Label
var slot_buttons: Array[Control] = []
var inventory_panel: PanelContainer
var inventory_info: Label
var item_buttons: Array[Button] = []
var enemy_layer: Control
var enemy_bars: Dictionary = {}
var root: Control
var potion_slot: Control
var potion_popup: PanelContainer
var auto_check: CheckButton
var threshold_slider: HSlider
var threshold_label: Label
var experience: ProgressBar
var focus_enemy: CharacterBody3D
var target_panel: PanelContainer
var target_health: ProgressBar
var target_name: Label
const SKILL_NAMES := ["Golpe potente", "Corte giratório", "Defesa", "Investida"]
const SKILL_HINTS := ["Golpe frontal reforçado. Recarga: 6s.", "Atinge inimigos ao redor. Recarga: 8s.", "Reduz dano recebido em 65% por 4s. Recarga: 12s.", "Avança na direção da câmera. Recarga: 7s."]

func _style(color: Color, border := Color("756644")) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(2)
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
	button.focus_mode = Control.FOCUS_NONE
	button.text = text
	button.add_theme_stylebox_override("normal", _style(Color("24231f")))
	button.add_theme_stylebox_override("disabled", _style(Color("17262b"), Color("394947")))
	button.add_theme_color_override("font_disabled_color", Color("93a19e"))
	button.add_theme_stylebox_override("hover", _style(Color("39352a"), Color("d9c18d")))
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
	player_panel.custom_minimum_size = Vector2(280, 83)
	var info := VBoxContainer.new()
	info.add_theme_constant_override("separation", 4)
	player_panel.add_child(info)
	status = _label("", 18)
	status.add_theme_color_override("font_color", Color("e7d8af"))
	info.add_child(status)
	health = _life_bar(230, 13, Color("ae3035"))
	info.add_child(health)
	health_text = _label("", 11)
	health_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	health.add_child(health_text)
	health_text.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	experience = _life_bar(230, 5, Color("bb9a50"))
	experience.max_value = 3
	info.add_child(experience)
	_target()
	notice = _label("Campo aberto · Explore e enfrente os Grelims", 16)
	notice.position = Vector2(24, 115)
	notice.add_theme_font_size_override("font_size", 14)
	notice.add_theme_color_override("font_color", Color("e1d6b7"))
	root.add_child(notice)
	var inventory_button := _button("Mochila [I / TAB]")
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
	bar.offset_left = -140
	bar.offset_right = 140
	bar.offset_top = -92
	bar.offset_bottom = -28
	bar.add_theme_constant_override("separation", 8)
	for i in range(4):
		var slot := SkillSlot.new()
		slot.slot = i
		slot.tooltip_text = "%d · %s\n%s\nSegure e arraste para baixo: automático. Para cima: manual." % [i + 1, SKILL_NAMES[i], SKILL_HINTS[i]]
		slot.activated.connect(func() -> void: skill_requested.emit(i))
		slot.automatic_changed.connect(func(enabled: bool) -> void: skill_automatic_changed.emit(i, enabled))
		bar.add_child(slot)
		slot_buttons.append(slot)
	var help := _label("WASD mover · Mouse câmera · Scroll zoom · Clique atacar · 1–4 habilidades · Q poção · I / TAB mochila · Esc cursor", 14)
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
	_potions()

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
		item.focus_mode = Control.FOCUS_NONE
		if i < 6:
			item.icon = load("res://assets/icons/%s.svg" % ["sword", "potion", "fang", "armor", "gloves", "boots"][i])
			item.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
			item.vertical_icon_alignment = VERTICAL_ALIGNMENT_TOP
			item.expand_icon = false
			item.add_theme_constant_override("icon_max_width", 32)
		grid.add_child(item)
		item_buttons.append(item)
	item_buttons[0].pressed.connect(func() -> void: item_requested.emit("sword"))
	item_buttons[1].pressed.connect(func() -> void: item_requested.emit("potion"))
	for pair in [[3, "armor"], [4, "gloves"], [5, "boots"]]:
		item_buttons[pair[0]].pressed.connect(func() -> void: item_requested.emit(pair[1]))
	column.add_child(_label("Equipamentos: clique para equipar ou retirar.\nPoção: clique para recuperar 40 de vida.\nO jogo fica pausado enquanto a mochila estiver aberta.", 14))
	var close := _button("Voltar ao campo [I / TAB / Esc]")
	close.pressed.connect(func() -> void: inventory_requested.emit())
	column.add_child(close)
	inventory_panel.hide()

func sync(hp: float, maximum: float, level: int, xp: int, cooldowns: Array, dead: bool, inventory: Dictionary, guard: float, potion_auto: bool, potion_threshold: float, potion_reuse: float, automatic_skills: Array[bool]) -> void:
	health.max_value = maximum
	health.value = hp
	health_text.text = "%d / %d" % [ceili(hp), int(maximum)]
	status.text = "Nv. %d  GUERREIRO%s" % [level, " · Defesa %.0fs" % guard if guard > 0 else ""]
	experience.value = xp
	experience.tooltip_text = "Experiência: %d / 3" % xp
	for i in range(4):
		var remaining := float(cooldowns[i])
		var enabled: bool = not (dead or inventory_panel.visible or remaining > 0 or (i < 2 and not inventory.equipped))
		slot_buttons[i].automatic = automatic_skills[i]
		slot_buttons[i].sync(remaining, [6.0, 8.0, 12.0, 7.0][i], enabled)
	potion_slot.automatic = potion_auto
	potion_slot.sync_potion(inventory.potions, not dead and not inventory_panel.visible and inventory.potions > 0 and hp < maximum, potion_reuse)
	auto_check.set_pressed_no_signal(potion_auto)
	threshold_slider.set_value_no_signal(potion_threshold)
	threshold_label.text = "Usar ao atingir %d%% de vida ou menos" % int(potion_threshold)
	inventory_info.text = "Ouro: %d · Espada %s" % [inventory.gold, "equipada" if inventory.equipped else "guardada"]
	item_buttons[0].text = "Long Sword\n%s" % ("Equipada" if inventory.equipped else "Equipar")
	item_buttons[0].disabled = dead
	item_buttons[1].text = "Poção ×%d\nUsar" % inventory.potions
	item_buttons[1].disabled = dead or inventory.potions == 0 or hp >= maximum
	item_buttons[2].text = "Presa Grelim\n×%d" % inventory.fangs
	for pair in [[3, "armor", "Traje inicial"], [4, "gloves", "Luvas"], [5, "boots", "Botas"]]:
		var button: Button = item_buttons[pair[0]]
		button.text = "%s\n%s" % [pair[2], "Equipado" if inventory[pair[1]] else "Equipar"]
		button.disabled = dead
		button.tooltip_text = "Peça original do conjunto M001, com textura do MFighter.utx. Troca visual, sem bônus de atributos nesta etapa."

func sync_enemies(enemies: Array[CharacterBody3D], camera: Camera3D) -> void:
	target_panel.visible = is_instance_valid(focus_enemy) and focus_enemy in enemies
	if target_panel.visible:
		target_name.text = "Grelim"
		target_health.value = float(focus_enemy.get_meta("hp"))
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
			var fill := _style(Color("ab3033"))
			for style in [back, fill]:
				style.content_margin_left = 0
				style.content_margin_right = 0
				style.content_margin_top = 0
				style.content_margin_bottom = 0
				style.set_corner_radius_all(0)
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

func _life_bar(width: float, height: float, color: Color) -> ProgressBar:
	var bar := ProgressBar.new()
	bar.custom_minimum_size = Vector2(width, height)
	bar.show_percentage = false
	var back := _style(Color("171717"), Color("756644"))
	var fill := _style(color, color.darkened(0.3))
	for style in [back, fill]:
		style.set_corner_radius_all(0)
		style.content_margin_left = 0
		style.content_margin_right = 0
		style.content_margin_top = 0
		style.content_margin_bottom = 0
	bar.add_theme_stylebox_override("background", back)
	bar.add_theme_stylebox_override("fill", fill)
	return bar

func _target() -> void:
	target_panel = PanelContainer.new()
	root.add_child(target_panel)
	target_panel.add_theme_stylebox_override("panel", StyleBoxEmpty.new())
	target_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	target_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	target_panel.offset_left = -120
	target_panel.offset_right = 120
	target_panel.offset_top = 20
	target_panel.offset_bottom = 55
	var column := VBoxContainer.new()
	column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	target_panel.add_child(column)
	target_name = _label("Grelim", 17)
	target_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	target_name.add_theme_color_override("font_color", Color("e5d7b6"))
	column.add_child(target_name)
	target_health = _life_bar(240, 9, Color("ad252d"))
	target_health.max_value = 60
	column.add_child(target_health)
	target_panel.hide()

func _potions() -> void:
	potion_slot = SkillSlot.new()
	potion_slot.slot = 4
	root.add_child(potion_slot)
	potion_slot.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	potion_slot.offset_left = -220
	potion_slot.offset_right = -156
	potion_slot.offset_top = -92
	potion_slot.offset_bottom = -28
	potion_slot.tooltip_text = "Poção de vida [Q]. Clique no ícone para configurar o uso automático. Q usa manualmente. Ative o automático somente na janela de configuração."
	potion_slot.activated.connect(func() -> void: potion_popup.visible = not potion_popup.visible)
	potion_popup = _panel(root)
	potion_popup.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	potion_popup.offset_left = -240
	potion_popup.offset_right = 120
	potion_popup.offset_top = -300
	potion_popup.offset_bottom = -130
	var settings := VBoxContainer.new()
	settings.add_theme_constant_override("separation", 10)
	potion_popup.add_child(settings)
	settings.add_child(_label("POÇÃO DE VIDA", 18))
	auto_check = CheckButton.new()
	auto_check.text = "Usar automaticamente"
	auto_check.toggled.connect(func(enabled: bool) -> void: potion_settings_changed.emit(enabled, threshold_slider.value))
	settings.add_child(auto_check)
	threshold_label = _label("")
	settings.add_child(threshold_label)
	threshold_slider = HSlider.new()
	threshold_slider.min_value = 10
	threshold_slider.max_value = 90
	threshold_slider.step = 5
	threshold_slider.value = 40
	threshold_slider.value_changed.connect(func(value: float) -> void: potion_settings_changed.emit(auto_check.button_pressed, value))
	settings.add_child(threshold_slider)
	var close := _button("Fechar")
	close.pressed.connect(potion_popup.hide)
	settings.add_child(close)
	potion_popup.hide()
