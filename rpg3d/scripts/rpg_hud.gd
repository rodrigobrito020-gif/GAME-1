extends CanvasLayer
## Interface do RPG: vida, atalhos, inventário e barras projetadas dos inimigos.
const EquipmentInventory := preload("res://scripts/equipment_inventory.gd")
const LootItems := preload("res://scripts/loot_items.gd")
const SkillSlot := preload("res://scripts/skill_slot.gd")
const RiftMenu := preload("res://scripts/rift_menu.gd")
const ChestRewardsPanel := preload("res://scripts/chest_rewards_panel.gd")
signal skill_requested(slot: int)
signal skill_automatic_changed(slot: int, enabled: bool)
signal inventory_requested
signal item_requested(item: String)
signal potion_settings_changed(enabled: bool, threshold: float)
signal world_requested(world_number: int)
signal rift_closed
signal return_requested
signal next_world_requested
signal rewards_closed
signal chest_requested
var health: ProgressBar
var health_text: Label
var status: Label
var notice: Label
var slot_buttons: Array[Control] = []
var inventory_panel: PanelContainer
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
var location_label: Label
var objective_label: Label
var interaction_prompt: PanelContainer
var interaction_label: Label
var rift_panel: PanelContainer
var rift_backdrop: ColorRect
var instance_panel: PanelContainer
var instance_heading: Label
var instance_detail: Label
var instance_timer: Label
var reward_panel: PanelContainer
var reward_icon: TextureRect
var reward_name: Label
var reward_detail: Label
var run_result_panel: PanelContainer
var run_result_title: Label
var run_result_description: Label
var return_button: Button
var next_world_button: Button
var victory_banner: PanelContainer
var victory_banner_label: Label
var collect_button: Button
var chest_rewards_panel: PanelContainer
var run_backdrop: ColorRect
var _reward_tween: Tween
var _combat_allowed := true
var _class_name := "GUERREIRO"
var _class_id := "tanque"
var _class_cooldowns: Array = [6.0, 8.0, 12.0, 7.0]
var _class_skill_names: Array = SKILL_NAMES.duplicate()
var _class_skill_hints: Array = SKILL_HINTS.duplicate()
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
	location_label = _label("", 17)
	location_label.position = Vector2(24, 114)
	location_label.add_theme_color_override("font_color", Color("e7d8af"))
	root.add_child(location_label)
	objective_label = _label("", 14)
	objective_label.position = Vector2(24, 140)
	objective_label.add_theme_color_override("font_color", Color("d3ded6"))
	root.add_child(objective_label)
	notice = _label("", 16)
	notice.position = Vector2(24, 166)
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
		slot.set("class_id", _class_id)
		slot.tooltip_text = _skill_tooltip(i)
		slot.activated.connect(func() -> void:
			if _combat_allowed and not rift_panel.visible and not run_modal_open():
				skill_requested.emit(i)
		)
		slot.automatic_changed.connect(func(enabled: bool) -> void: skill_automatic_changed.emit(i, enabled))
		bar.add_child(slot)
		slot_buttons.append(slot)
	var help := _label("WASD mover · Mouse câmera · Scroll zoom · E interagir · Clique atacar · 1–4 habilidades · Q poção · I / TAB mochila · Esc cursor", 13)
	root.add_child(help)
	help.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	help.offset_left = -610
	help.offset_right = 610
	help.offset_top = -25
	help.offset_bottom = -4
	var aim := _label("+", 24)
	root.add_child(aim)
	aim.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	aim.offset_left = -7
	aim.offset_right = 17
	aim.offset_top = -17
	aim.offset_bottom = 17
	_instance()
	_reward()
	_inventory()
	_potions()
	_interaction()
	_rift()
	_run_results()

func _skill_tooltip(index: int) -> String:
	var hint := str(_class_skill_hints[index]).get_slice("Recarga:", 0).strip_edges()
	if not preload("res://scripts/class_combat.gd").ground_area(_class_id, index).is_empty():
		hint += "\nManual: escolha o ponto no chão e clique. Botão direito / Esc cancela."
	return "%d · %s\n%s\nRecarga: %ss.\nSegure e arraste para baixo: automático. Para cima: manual." % [index + 1, _class_skill_names[index], hint, str(_class_cooldowns[index])]

func set_player_class(definition: Dictionary) -> void:
	_class_name = str(definition.get("name", "Guerreiro")).to_upper()
	var class_id := str(definition.get("id", "tank"))
	_class_id = class_id
	chest_rewards_panel.player_class_id = class_id
	var names: Array = definition.get("skill_names", SKILL_NAMES)
	var hints: Array = definition.get("skill_hints", SKILL_HINTS)
	var cooldowns: Array = definition.get("cooldowns", [6.0, 8.0, 12.0, 7.0])
	for index in range(4):
		_class_skill_names[index] = str(names[index]) if index < names.size() else SKILL_NAMES[index]
		_class_skill_hints[index] = str(hints[index]) if index < hints.size() else SKILL_HINTS[index]
		_class_cooldowns[index] = maxf(0.01, float(cooldowns[index])) if index < cooldowns.size() else [6.0, 8.0, 12.0, 7.0][index]
		if index < slot_buttons.size():
			slot_buttons[index].set("class_id", _class_id)
			slot_buttons[index].tooltip_text = _skill_tooltip(index)
	if is_instance_valid(status):
		status.add_theme_color_override("font_color", definition.get("color", Color("e7d8af")))

func _instance() -> void:
	instance_panel = _panel(root)
	instance_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	instance_panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	instance_panel.offset_left = -344
	instance_panel.offset_right = -30
	instance_panel.offset_top = 84
	instance_panel.offset_bottom = 198
	var column := VBoxContainer.new()
	column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_theme_constant_override("separation", 6)
	instance_panel.add_child(column)
	instance_heading = _label("", 16)
	instance_heading.add_theme_color_override("font_color", Color("e7d8af"))
	instance_heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(instance_heading)
	instance_timer = _label("", 23)
	instance_timer.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(instance_timer)
	instance_detail = _label("", 14)
	instance_detail.add_theme_color_override("font_color", Color("d3ded6"))
	instance_detail.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(instance_detail)
	instance_panel.hide()

func _clock_text(seconds: float) -> String:
	var whole := maxi(0, ceili(seconds))
	return "%02d:%02d" % [whole / 60, whole % 60]

func sync_instance(phase: String, preparation_left: float, time_left: float, wave: int, kills: int, alive: int) -> void:
	instance_panel.visible = not phase.is_empty()
	instance_timer.add_theme_color_override("font_color", Color("eee4ce"))
	match phase:
		"preparation", "preparing":
			instance_heading.text = "PREPARAÇÃO"
			instance_timer.text = _clock_text(clampf(preparation_left, 0.0, 30.0))
			instance_detail.text = "Prepare suas habilidades e equipamentos"
		"combat", "battle":
			instance_heading.text = "ONDA %d/6 · VIVOS %d/5" % [clampi(wave, 0, 6), clampi(alive, 0, 5)]
			instance_timer.text = "TEMPO " + _clock_text(clampf(time_left, 0.0, 600.0))
			instance_timer.add_theme_color_override("font_color", Color("ee8c7f") if time_left <= 60 else Color("eee4ce"))
			instance_detail.text = "DERROTADOS %d/30" % clampi(kills, 0, 30)
		"boss":
			instance_heading.text = "CHEFE DA FENDA"
			instance_timer.text = "TEMPO " + _clock_text(clampf(time_left, 0.0, 600.0))
			instance_timer.add_theme_color_override("font_color", Color("ee8c7f") if time_left <= 60 else Color("eee4ce"))
			instance_detail.text = "Derrote o chefe e conquiste o baú"
		"victory", "completed":
			instance_heading.text = "CONCLUÍDO"
			instance_timer.text = "Abra o baú"
			instance_timer.add_theme_color_override("font_color", Color("d9c08a"))
			instance_detail.text = "Ondas e chefe derrotados"
		"failed", "defeat", "timeout":
			instance_heading.text = "TEMPO ENCERRADO" if time_left <= 0 or phase == "timeout" else "DERROTA"
			instance_timer.text = "R · Voltar à vila"
			instance_timer.add_theme_color_override("font_color", Color("ee8c7f"))
			instance_detail.text = "DERROTADOS %d/30" % clampi(kills, 0, 30)
		_:
			instance_panel.hide()

func _run_results() -> void:
	run_backdrop = ColorRect.new()
	root.add_child(run_backdrop)
	run_backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	run_backdrop.color = Color(0.01, 0.02, 0.03, 0.82)
	run_backdrop.mouse_filter = Control.MOUSE_FILTER_STOP
	run_backdrop.z_index = 20
	run_backdrop.hide()
	run_result_panel = _panel(root)
	run_result_panel.z_index = 24
	run_result_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	run_result_panel.offset_left = -320
	run_result_panel.offset_right = 320
	run_result_panel.offset_top = -180
	run_result_panel.offset_bottom = 180
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 22)
	run_result_panel.add_child(column)
	column.add_spacer(false)
	run_result_title = _label("", 30)
	run_result_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(run_result_title)
	run_result_description = _label("", 17)
	run_result_description.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	run_result_description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	run_result_description.add_theme_color_override("font_color", Color("ddd9c9"))
	column.add_child(run_result_description)
	column.add_spacer(false)
	next_world_button = _button("")
	next_world_button.custom_minimum_size.y = 48
	next_world_button.add_theme_font_size_override("font_size", 18)
	next_world_button.add_theme_stylebox_override("normal", _style(Color("594324"), Color("d9b568")))
	next_world_button.pressed.connect(func() -> void: next_world_requested.emit())
	column.add_child(next_world_button)
	return_button = _button("Voltar à vila")
	return_button.custom_minimum_size.y = 46
	return_button.add_theme_font_size_override("font_size", 18)
	return_button.pressed.connect(func() -> void: return_requested.emit())
	column.add_child(return_button)
	run_result_panel.visibility_changed.connect(_sync_run_backdrop)
	run_result_panel.hide()
	victory_banner = _panel(root)
	victory_banner.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	victory_banner.offset_left = -250
	victory_banner.offset_right = 250
	victory_banner.offset_top = 206
	victory_banner.offset_bottom = 308
	victory_banner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var banner_row := HBoxContainer.new()
	banner_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	banner_row.add_theme_constant_override("separation", 20)
	victory_banner.add_child(banner_row)
	victory_banner_label = _label("", 17)
	victory_banner_label.add_theme_color_override("font_color", Color("ecd28f"))
	victory_banner_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	victory_banner_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	banner_row.add_child(victory_banner_label)
	collect_button = _button("Coletar baú")
	collect_button.custom_minimum_size = Vector2(156, 48)
	collect_button.pressed.connect(func() -> void: chest_requested.emit())
	banner_row.add_child(collect_button)
	victory_banner.hide()
	chest_rewards_panel = ChestRewardsPanel.new()
	root.add_child(chest_rewards_panel)
	chest_rewards_panel.visibility_changed.connect(_sync_run_backdrop)
	chest_rewards_panel.closed.connect(func() -> void:
		hide_chest_rewards()
		rewards_closed.emit()
	)
	chest_rewards_panel.hide()

func run_modal_open() -> bool:
	return (is_instance_valid(run_result_panel) and run_result_panel.visible) or (is_instance_valid(chest_rewards_panel) and chest_rewards_panel.visible)

func _sync_run_backdrop() -> void:
	run_backdrop.visible = run_modal_open()
	interaction_prompt.visible = not run_modal_open() and not rift_panel.visible and not interaction_label.text.is_empty()

func show_run_result(victory: bool, world_number: int, reason: String = "", reward_pending: bool = true) -> void:
	hide_chest_rewards()
	rift_panel.hide()
	inventory_panel.hide()
	potion_popup.hide()
	reward_panel.hide()
	if victory and reward_pending:
		run_result_panel.hide()
		victory_banner_label.text = "MUNDO %d CONCLUÍDO\nChefe vencido · Baú liberado" % clampi(world_number, 1, 10)
		victory_banner.show()
		return
	victory_banner.hide()
	var world := clampi(world_number, 1, 10)
	if victory:
		run_result_title.text = "MUNDO %d CONCLUÍDO" % world
		run_result_title.add_theme_color_override("font_color", Color("ecd28f"))
		run_result_description.text = "Sua recompensa foi guardada na mochila.\nEscolha seu próximo destino." if world < 10 else "Você venceu os dez mundos da fenda.\nSua recompensa foi guardada na mochila."
	else:
		var timed_out := "tempo" in reason.to_lower() or "timeout" in reason.to_lower()
		run_result_title.text = "TEMPO ENCERRADO" if timed_out else "DERROTA"
		run_result_title.add_theme_color_override("font_color", Color("ee9a8b"))
		var description := reason
		if reason.to_lower() in ["death", "dead", "defeat"]:
			description = "Seu personagem foi derrotado."
		elif reason.to_lower() == "timeout":
			description = "O limite de dez minutos foi atingido."
		run_result_description.text = (description + "\n" if not description.is_empty() else "") + "Volte à vila para se preparar e tentar novamente."
	next_world_button.visible = victory and world < 10
	next_world_button.text = "Seguir para o mundo %d" % (world + 1)
	run_result_panel.show()

func hide_run_result() -> void:
	run_result_panel.hide()
	victory_banner.hide()

func show_chest_rewards(items: Array) -> void:
	hide_run_result()
	rift_panel.hide()
	inventory_panel.hide()
	potion_popup.hide()
	reward_panel.hide()
	chest_rewards_panel.show_items(items)

func hide_chest_rewards() -> void:
	if is_instance_valid(chest_rewards_panel):
		chest_rewards_panel.hide_panel()

func _reward() -> void:
	reward_panel = _panel(root)
	reward_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	reward_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	reward_panel.offset_left = -250
	reward_panel.offset_right = 250
	reward_panel.offset_top = -250
	reward_panel.offset_bottom = -174
	var row := HBoxContainer.new()
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 14)
	reward_panel.add_child(row)
	reward_icon = TextureRect.new()
	reward_icon.custom_minimum_size = Vector2(52, 52)
	reward_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	reward_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	reward_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(reward_icon)
	var column := VBoxContainer.new()
	column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(column)
	reward_name = _label("", 19)
	reward_name.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	column.add_child(reward_name)
	reward_detail = _label("", 14)
	column.add_child(reward_detail)
	reward_panel.hide()

func show_reward(item: Dictionary) -> void:
	if item.is_empty():
		return
	var rarity := str(item.get("rarity", item.get("raridade", "Comum")))
	var colors := {"comum": Color("b9bfc2"), "incomum": Color("80cf85"), "raro": Color("77b4f5"), "épico": Color("c692ee"), "epico": Color("c692ee"), "lendário": Color("f0c766"), "lendario": Color("f0c766")}
	var color: Color = colors.get(rarity.to_lower(), Color("b9bfc2"))
	reward_name.text = str(item.get("name", item.get("nome", "Equipamento obtido")))
	reward_name.add_theme_color_override("font_color", color)
	reward_detail.text = "%s · %s · Adicionado à mochila" % [rarity, LootItems.grade_text(item)]
	reward_detail.add_theme_color_override("font_color", color.lightened(0.2))
	reward_icon.texture = preload("res://scripts/item_icons.gd").for_display(item, _class_id)
	reward_panel.add_theme_stylebox_override("panel", _style(Color(0.04, 0.07, 0.08, 0.97), color))
	if is_instance_valid(_reward_tween):
		_reward_tween.kill()
	reward_panel.modulate.a = 1.0
	reward_panel.show()
	_reward_tween = create_tween()
	_reward_tween.tween_interval(4.2)
	_reward_tween.tween_property(reward_panel, "modulate:a", 0.0, 0.8)
	_reward_tween.tween_callback(reward_panel.hide)

func _interaction() -> void:
	interaction_prompt = _panel(root)
	interaction_prompt.mouse_filter = Control.MOUSE_FILTER_IGNORE
	interaction_prompt.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	interaction_prompt.offset_left = -290
	interaction_prompt.offset_right = 290
	interaction_prompt.offset_top = -156
	interaction_prompt.offset_bottom = -112
	interaction_label = _label("", 17)
	interaction_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	interaction_label.add_theme_color_override("font_color", Color("f0d99e"))
	interaction_prompt.add_child(interaction_label)
	interaction_prompt.hide()

func _rift() -> void:
	rift_backdrop = ColorRect.new()
	root.add_child(rift_backdrop)
	rift_backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	rift_backdrop.color = Color(0.01, 0.02, 0.03, 0.78)
	rift_backdrop.mouse_filter = Control.MOUSE_FILTER_STOP
	rift_backdrop.hide()
	rift_panel = RiftMenu.new()
	root.add_child(rift_panel)
	rift_panel.world_requested.connect(func(world_number: int) -> void: world_requested.emit(world_number))
	rift_panel.closed.connect(func() -> void:
		rift_panel.hide()
		rift_closed.emit()
	)
	rift_panel.visibility_changed.connect(func() -> void:
		rift_backdrop.visible = rift_panel.visible
		interaction_prompt.visible = not rift_panel.visible and not run_modal_open() and not interaction_label.text.is_empty()
	)
	rift_panel.hide()

func set_location(title: String, objective: String, safe: bool) -> void:
	location_label.text = title + (" · Área segura" if safe else "")
	location_label.add_theme_color_override("font_color", Color("b9dfb7") if safe else Color("e7d8af"))
	objective_label.text = objective

func set_interaction_prompt(text: String) -> void:
	interaction_label.text = text
	interaction_prompt.visible = not text.is_empty() and not rift_panel.visible and not run_modal_open()

func show_rift(unlocked: int, completed: Array[int]) -> void:
	hide_run_result()
	hide_chest_rewards()
	potion_popup.hide()
	rift_panel.show_worlds(unlocked, completed)

func _inventory() -> void:
	inventory_panel = EquipmentInventory.new()
	root.add_child(inventory_panel)
	item_buttons = inventory_panel.item_buttons
	inventory_panel.item_requested.connect(func(item: String) -> void: item_requested.emit(item))
	inventory_panel.closed.connect(func() -> void: inventory_requested.emit())

func sync(hp: float, maximum: float, level: int, xp: int, cooldowns: Array, dead: bool, inventory: Dictionary, guard: float, potion_auto: bool, potion_threshold: float, potion_reuse: float, automatic_skills: Array[bool], combat_allowed: bool = true) -> void:
	_combat_allowed = combat_allowed
	health.max_value = maximum
	health.value = hp
	health_text.text = "%d / %d" % [ceili(hp), int(maximum)]
	status.text = "Nv. %d  %s%s" % [level, _class_name, " · Defesa %.0fs" % guard if guard > 0 else ""]
	experience.max_value = preload("res://scripts/combat_balance.gd").xp_needed(level)
	experience.value = xp
	experience.tooltip_text = "Experiência: %d / %d · Crescimento de atributos reduzido após o nível 30." % [xp, int(experience.max_value)]
	for i in range(4):
		var remaining := float(cooldowns[i])
		var has_weapon: bool = bool(inventory.get("equipped", false)) or inventory.get("equipped_loot", {}).has("sword")
		var offensive_slots: Array = {"arqueiro": [0, 1, 3], "mago": [0, 1], "healer": [0, 3]}.get(_class_id, [0, 1])
		var enabled: bool = combat_allowed and not (dead or inventory_panel.visible or rift_panel.visible or run_modal_open() or remaining > 0 or (i in offensive_slots and not has_weapon))
		slot_buttons[i].automatic = automatic_skills[i]
		slot_buttons[i].sync(remaining, float(_class_cooldowns[i]), enabled)
	potion_slot.automatic = potion_auto
	potion_slot.sync_potion(inventory.potions, not dead and not inventory_panel.visible and inventory.potions > 0 and hp < maximum, potion_reuse)
	auto_check.set_pressed_no_signal(potion_auto)
	threshold_slider.set_value_no_signal(potion_threshold)
	threshold_label.text = "Usar ao atingir %d%% de vida ou menos" % int(potion_threshold)
	inventory_panel.sync_items(inventory, dead, level, hp, maximum)

func sync_enemies(enemies: Array[CharacterBody3D], camera: Camera3D) -> void:
	target_panel.visible = is_instance_valid(focus_enemy) and focus_enemy in enemies
	if target_panel.visible:
		var is_boss := bool(focus_enemy.get_meta("is_boss", false))
		target_name.text = str(focus_enemy.get_meta("display_name", "Guardião da Fenda" if is_boss else "Grelim"))
		target_health.max_value = float(focus_enemy.get_meta("maximum_hp", 60.0))
		target_health.value = float(focus_enemy.get_meta("hp"))
		_style_enemy_bar(target_health, is_boss, true)
		target_panel.offset_left = -140 if is_boss else -120
		target_panel.offset_right = 140 if is_boss else 120
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
			bar.max_value = float(foe.get_meta("maximum_hp", 60.0))
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
		var bar: ProgressBar = widget.get_node("Life")
		bar.max_value = float(foe.get_meta("maximum_hp", 60.0))
		var is_boss := bool(foe.get_meta("is_boss", false))
		_style_enemy_bar(bar, is_boss)
		var name_label: Label = widget.get_child(0)
		name_label.text = str(foe.get_meta("display_name", "Guardião da Fenda" if is_boss else "Grelim"))
		name_label.add_theme_color_override("font_color", Color("f4d28b") if is_boss else Color("eeeeee"))
		var at := foe.global_position + Vector3.UP * float(foe.get_meta("bar_height", 2.05))
		widget.visible = not camera.is_position_behind(at) and camera.global_position.distance_to(at) < 40
		if widget.visible:
			widget.position = camera.unproject_position(at) - Vector2(widget.get_combined_minimum_size().x * 0.5, 26)
			bar.value = maxf(0, float(foe.get_meta("hp")))

func _style_enemy_bar(bar: ProgressBar, is_boss: bool, target: bool = false) -> void:
	if bar.has_meta("boss_styled") and bool(bar.get_meta("boss_styled")) == is_boss:
		return
	bar.set_meta("boss_styled", is_boss)
	bar.custom_minimum_size = Vector2(280 if is_boss else 240, 11 if is_boss else 9) if target else Vector2(120 if is_boss else 80, 10 if is_boss else 7)
	var fill := _style(Color("c69a48") if is_boss else Color("ab3033"))
	fill.set_corner_radius_all(0)
	fill.content_margin_left = 0
	fill.content_margin_right = 0
	fill.content_margin_top = 0
	fill.content_margin_bottom = 0
	bar.add_theme_stylebox_override("fill", fill)

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
